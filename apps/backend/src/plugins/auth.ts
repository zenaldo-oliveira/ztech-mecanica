import cookie from "@fastify/cookie";
import type { Permission, Role } from "@ztech/validation";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import type { PrismaClient } from "../db/client.js";
import { scopeToTenant, type TenantDb } from "../db/tenant-scope.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import { recordUserAudit, type AuditRequestInfo } from "../modules/audit/audit-service.js";
import { loadUserAuthorization } from "../modules/auth/authorization.js";
import type { SessionService } from "../modules/auth/session-service.js";
import type { EmailProvider } from "../modules/email/email-provider.js";

export const SESSION_COOKIE_NAME = "ztech_session";

/** Contexto autenticado da requisição. tenantId vem exclusivamente da sessão. */
export interface AuthContext {
  sessionId: string;
  tenantId: string;
  userId: string;
  roles: readonly Role[];
  permissions: ReadonlySet<Permission>;
  /** Client Prisma restrito à oficina da sessão — o único que código de domínio deve usar. */
  db: TenantDb;
}

type Hook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
  interface FastifyInstance {
    /** PrismaClient sem escopo — somente para infraestrutura (auth). Domínio usa request.auth.db. */
    prisma: PrismaClient;
    now: () => Date;
    sessionService: SessionService;
    /** Opções do cookie de sessão para o ambiente atual (fonte única). */
    sessionCookieOptions: ReturnType<typeof sessionCookieOptions>;
    emailProvider: EmailProvider;
    /** URL pública do frontend (links de e-mail). */
    appUrl: string;
    /** preHandler: exige sessão válida e monta o AuthContext. */
    authenticate: Hook;
    /** preHandler: exige a permissão (recurso.ação). Usar sempre depois de `authenticate`. */
    requirePermission: (permission: Permission) => Hook;
  }
}

export interface AuthPluginOptions {
  prisma: PrismaClient;
  sessionService: SessionService;
  secureCookies: boolean;
  emailProvider: EmailProvider;
  appUrl: string;
  now?: () => Date;
}

/**
 * Opções do cookie de sessão (docs/architecture/autenticacao.md §4).
 * HttpOnly sempre; Secure em produção; SameSite=Lax (frontend e API na mesma origem
 * via rewrite do Next). Sem Max-Age: a validade real é controlada no servidor.
 */
export function sessionCookieOptions(secure: boolean) {
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
}

export function requireAuth(request: FastifyRequest): AuthContext {
  if (!request.auth) throw unauthorized();
  return request.auth;
}

export function auditRequestInfo(request: FastifyRequest): AuditRequestInfo {
  return { requestId: String(request.id), ipAddress: request.ip, userAgent: request.headers["user-agent"] };
}

export const authPlugin = fp<AuthPluginOptions>(
  async (app, { prisma, sessionService, secureCookies, emailProvider, appUrl, now = () => new Date() }) => {
    await app.register(cookie);

    app.decorateRequest("auth", null);
    app.decorate("prisma", prisma);
    app.decorate("now", now);
    app.decorate("sessionService", sessionService);
    app.decorate("sessionCookieOptions", sessionCookieOptions(secureCookies));
    app.decorate("emailProvider", emailProvider);
    app.decorate("appUrl", appUrl);

    app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.cookies[SESSION_COOKIE_NAME];
      const session = await sessionService.resolve(token);
      if (!session) {
        if (token) reply.clearCookie(SESSION_COOKIE_NAME, app.sessionCookieOptions);
        throw unauthorized();
      }

      const { roles, permissions } = await loadUserAuthorization(prisma, session.tenantId, session.userId);
      request.auth = {
        sessionId: session.sessionId,
        tenantId: session.tenantId,
        userId: session.userId,
        roles,
        permissions,
        db: scopeToTenant(prisma, session.tenantId),
      };
    });

    app.decorate("requirePermission", (permission: Permission): Hook => {
      return async (request: FastifyRequest) => {
        const auth = requireAuth(request);
        if (auth.permissions.has(permission)) return;

        await recordUserAudit(auth.db, { userId: auth.userId }, auditRequestInfo(request), {
          action: "ACCESS_DENIED",
          metadata: { permission, method: request.method, route: request.routeOptions.url },
        });
        throw forbidden();
      };
    });
  },
  { name: "ztech-auth" },
);
