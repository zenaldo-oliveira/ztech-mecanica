import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "../../db/client.js";

// docs/architecture/autenticacao.md §4.5: 12h de inatividade, teto absoluto de 7 dias.
export const SESSION_IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
/** Evita uma escrita no banco a cada requisição: renova no máximo a cada 5 minutos. */
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreateSessionInput {
  tenantId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreatedSession {
  /** Token opaco para o cookie. Só existe em memória: o banco guarda apenas o hash. */
  token: string;
  sessionId: string;
  expiresAt: Date;
}

export interface ResolvedSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  expiresAt: Date;
}

export type RevokeReason = "LOGOUT" | "USER_BLOCKED" | "USER_DELETED" | "PASSWORD_CHANGED" | "ADMIN";

export function createSessionService(prisma: PrismaClient, now: () => Date = () => new Date()) {
  async function create(input: CreateSessionInput): Promise<CreatedSession> {
    const token = randomBytes(TOKEN_BYTES).toString("base64url");
    const createdAt = now();
    const expiresAt = new Date(createdAt.getTime() + SESSION_IDLE_TIMEOUT_MS);
    const session = await prisma.session.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        tokenHash: hashSessionToken(token),
        createdAt,
        lastSeenAt: createdAt,
        expiresAt,
        absoluteExpiresAt: new Date(createdAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS),
        ipAddress: input.ipAddress?.slice(0, 45),
        userAgent: input.userAgent?.slice(0, 512),
      },
      select: { id: true },
    });
    return { token, sessionId: session.id, expiresAt };
  }

  /** Devolve a sessão válida do token, ou null. Renova a expiração deslizante. */
  async function resolve(token: string | undefined): Promise<ResolvedSession | null> {
    if (!token || !TOKEN_PATTERN.test(token)) return null;

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        lastSeenAt: true,
        expiresAt: true,
        absoluteExpiresAt: true,
        revokedAt: true,
        user: { select: { status: true } },
        tenant: { select: { status: true } },
      },
    });
    if (!session) return null;

    const current = now();
    const isActive =
      session.revokedAt === null &&
      current < session.expiresAt &&
      current < session.absoluteExpiresAt &&
      session.user.status === "ACTIVE" &&
      (session.tenant.status === "ACTIVE" || session.tenant.status === "TRIAL");
    if (!isActive) return null;

    let expiresAt = session.expiresAt;
    if (current.getTime() - session.lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
      expiresAt = new Date(Math.min(current.getTime() + SESSION_IDLE_TIMEOUT_MS, session.absoluteExpiresAt.getTime()));
      await prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { lastSeenAt: current, expiresAt },
      });
    }

    return { sessionId: session.id, tenantId: session.tenantId, userId: session.userId, expiresAt };
  }

  async function revoke(sessionId: string, reason: RevokeReason): Promise<void> {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: now(), revokedReason: reason },
    });
  }

  async function revokeAllForUser(tenantId: string, userId: string, reason: RevokeReason): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { tenantId, userId, revokedAt: null },
      data: { revokedAt: now(), revokedReason: reason },
    });
    return result.count;
  }

  return { create, resolve, revoke, revokeAllForUser };
}

export type SessionService = ReturnType<typeof createSessionService>;
