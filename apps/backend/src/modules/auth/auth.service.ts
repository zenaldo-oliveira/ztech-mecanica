import { createHash, randomBytes } from "node:crypto";

import type { LoginInput } from "@ztech/validation";

import type { PrismaClient } from "../../db/client.js";
import { scopeToTenant } from "../../db/tenant-scope.js";
import { AppError, unauthorized } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { recordUserAudit, type AuditRequestInfo } from "../audit/audit-service.js";
import { loadMeView, type MeView } from "../me/me.service.js";
import { loadUserAuthorization } from "./authorization.js";
import type { SessionService } from "./session-service.js";

/** Mesma resposta para e-mail inexistente, senha errada, usuário bloqueado ou oficina suspensa. */
export const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");

// Hash fictício verificado quando o e-mail não existe: o tempo de resposta não revela
// se a conta existe. Calculado uma vez, sob demanda.
let dummyHashPromise: Promise<string> | undefined;
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyHashPromise;
}

/** Identifica tentativas com e-mail desconhecido na auditoria sem gravar o texto digitado. */
function emailFingerprint(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

type FailureReason = "WRONG_PASSWORD" | "USER_NOT_ACTIVE" | "TENANT_NOT_ACTIVE";

export interface AuthServiceDeps {
  prisma: PrismaClient;
  sessionService: SessionService;
  now?: () => Date;
}

export interface LoginResult {
  token: string;
  me: MeView;
}

export function createAuthService({ prisma, sessionService, now = () => new Date() }: AuthServiceDeps) {
  async function recordFailure(
    user: { id: string; tenantId: string } | null,
    email: string,
    reason: FailureReason | "UNKNOWN_EMAIL",
    request: AuditRequestInfo,
  ) {
    if (user) {
      await recordUserAudit(scopeToTenant(prisma, user.tenantId), { userId: user.id }, request, {
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        metadata: { reason },
      });
      return;
    }
    // Sem oficina conhecida: evento da plataforma, sem o e-mail em texto.
    await prisma.auditLog.create({
      data: {
        actorType: "SYSTEM",
        action: "LOGIN_FAILED",
        metadata: { reason, emailFingerprint: emailFingerprint(email) },
        requestId: request.requestId,
        ipAddress: request.ipAddress?.slice(0, 45),
        userAgent: request.userAgent?.slice(0, 512),
      },
    });
  }

  async function login(input: LoginInput, request: AuditRequestInfo, previousToken?: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, tenantId: true, status: true, passwordHash: true, tenant: { select: { status: true } } },
    });

    // Sempre executa uma verificação Argon2id (tempo constante entre existe/não existe).
    const passwordMatches = await verifyPassword(user?.passwordHash ?? (await dummyHash()), input.password);

    if (!user) {
      await recordFailure(null, input.email, "UNKNOWN_EMAIL", request);
      throw invalidCredentials();
    }
    const failure: FailureReason | null = !passwordMatches || !user.passwordHash
      ? "WRONG_PASSWORD"
      : user.status !== "ACTIVE"
        ? "USER_NOT_ACTIVE"
        : user.tenant.status !== "ACTIVE" && user.tenant.status !== "TRIAL"
          ? "TENANT_NOT_ACTIVE"
          : null;
    if (failure) {
      await recordFailure(user, input.email, failure, request);
      throw invalidCredentials();
    }

    // Evita fixação de sessão: a sessão que vier no cookie é encerrada.
    const previous = await sessionService.resolve(previousToken);
    if (previous) await sessionService.revoke(previous.sessionId, "LOGOUT");

    const session = await sessionService.create({
      tenantId: user.tenantId,
      userId: user.id,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });
    const db = scopeToTenant(prisma, user.tenantId);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: now() } });
    await recordUserAudit(db, { userId: user.id }, request, {
      action: "LOGIN_SUCCEEDED",
      entity: "Session",
      entityId: session.sessionId,
    });

    const { roles, permissions } = await loadUserAuthorization(prisma, user.tenantId, user.id);
    const me = await loadMeView(db, user.id, roles, permissions);
    if (!me) throw unauthorized();
    return { token: session.token, me };
  }

  /** Idempotente: sessão inexistente, expirada ou já revogada não é erro. */
  async function logout(token: string | undefined, request: AuditRequestInfo): Promise<void> {
    const session = await sessionService.resolve(token);
    if (!session) return;

    await sessionService.revoke(session.sessionId, "LOGOUT");
    await recordUserAudit(scopeToTenant(prisma, session.tenantId), { userId: session.userId }, request, {
      action: "LOGOUT",
      entity: "Session",
      entityId: session.sessionId,
    });
  }

  return { login, logout };
}

export type AuthService = ReturnType<typeof createAuthService>;
