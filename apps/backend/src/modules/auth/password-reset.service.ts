import { createHash, randomBytes } from "node:crypto";

import type { FastifyBaseLogger } from "fastify";

import type { PrismaClient } from "../../db/client.js";
import { scopeToTenant } from "../../db/tenant-scope.js";
import { AppError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/password.js";
import { recordUserAudit, type AuditRequestInfo } from "../audit/audit-service.js";
import type { EmailProvider } from "../email/email-provider.js";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_TOKEN_BYTES = 32;

/** Mesma resposta para token inexistente, expirado, já usado ou revogado. */
export const invalidResetToken = () =>
  new AppError(400, "INVALID_RESET_TOKEN", "Link de redefinição inválido ou expirado. Solicite um novo.");

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PasswordResetDeps {
  prisma: PrismaClient;
  emailProvider: EmailProvider;
  appUrl: string;
  log: FastifyBaseLogger;
  now?: () => Date;
}

function buildResetEmail(name: string, link: string) {
  const text = [
    `Olá, ${name}.`,
    "",
    "Recebemos uma solicitação para redefinir a senha da sua conta no ZTECH OFICINA.",
    `Para criar uma nova senha, acesse o link abaixo (válido por ${RESET_TOKEN_TTL_MS / 60_000} minutos):`,
    "",
    link,
    "",
    "Se você não fez essa solicitação, ignore este e-mail: sua senha atual continua valendo.",
  ].join("\n");
  return { subject: "Redefinição de senha — ZTECH OFICINA", text };
}

export function createPasswordResetService({ prisma, emailProvider, appUrl, log, now = () => new Date() }: PasswordResetDeps) {
  /**
   * Sempre conclui sem erro, exista ou não a conta (não revela existência de e-mail).
   * O envio do e-mail não bloqueia a resposta, para o tempo não denunciar a conta.
   */
  async function requestReset(email: string, request: AuditRequestInfo): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, tenantId: true, name: true, email: true, status: true, tenant: { select: { status: true } } },
    });
    const canReset =
      user?.status === "ACTIVE" && (user.tenant.status === "ACTIVE" || user.tenant.status === "TRIAL");
    if (!user || !canReset) return;

    const token = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
    const createdAt = now();
    const db = scopeToTenant(prisma, user.tenantId);

    await prisma.$transaction(async (tx) => {
      // Apenas o link mais recente vale.
      await tx.passwordResetToken.updateMany({
        where: { tenantId: user.tenantId, userId: user.id, usedAt: null, revokedAt: null },
        data: { revokedAt: createdAt },
      });
      await tx.passwordResetToken.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(createdAt.getTime() + RESET_TOKEN_TTL_MS),
          requestedIp: request.ipAddress?.slice(0, 45),
          createdAt,
        },
      });
    });

    await recordUserAudit(db, { userId: user.id }, request, {
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user.id,
    });

    // Token no FRAGMENTO (#): não é enviado a servidores, logs de acesso nem Referer.
    const link = `${appUrl.replace(/\/$/, "")}/reset-password#token=${token}`;
    const message = buildResetEmail(user.name, link);
    void emailProvider.send({ to: user.email, ...message }).catch((error: unknown) => {
      log.error({ err: error, emailProvider: emailProvider.name }, "falha ao enviar e-mail de redefinição de senha");
    });
  }

  /** Redefine a senha com um token válido e encerra todas as sessões do usuário. */
  async function resetPassword(token: string, newPassword: string, request: AuditRequestInfo): Promise<void> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { id: true, tenantId: true, userId: true, user: { select: { status: true } } },
    });
    if (!record || record.user.status !== "ACTIVE") throw invalidResetToken();

    const passwordHash = await hashPassword(newPassword);
    const current = now();

    const revokedSessions = await prisma.$transaction(async (tx) => {
      // Consumo atômico: em requisições concorrentes, só uma consegue usar o token.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, revokedAt: null, expiresAt: { gt: current } },
        data: { usedAt: current },
      });
      if (claimed.count !== 1) throw invalidResetToken();

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({
        where: { tenantId: record.tenantId, userId: record.userId, usedAt: null, revokedAt: null },
        data: { revokedAt: current },
      });
      const sessions = await tx.session.updateMany({
        where: { tenantId: record.tenantId, userId: record.userId, revokedAt: null },
        data: { revokedAt: current, revokedReason: "PASSWORD_CHANGED" },
      });
      return sessions.count;
    });

    await recordUserAudit(scopeToTenant(prisma, record.tenantId), { userId: record.userId }, request, {
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: record.userId,
      metadata: { revokedSessions },
    });
  }

  return { requestReset, resetPassword };
}
