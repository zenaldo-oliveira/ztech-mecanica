import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/db/client.js";
import {
  createSessionService,
  hashSessionToken,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from "../../src/modules/auth/session-service.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTenant } from "../helpers/fixtures.js";

let prisma: PrismaClient;
let tenantId: string;
let userId: string;

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  const tenant = await createTenant(prisma, "11222333000181");
  const user = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Usuário", email: "usuario@oficina.test", status: "ACTIVE" },
  });
  tenantId = tenant.id;
  userId = user.id;
});

/** Relógio controlável para testar expiração sem esperar. */
function fakeClock(start = new Date("2026-10-02T12:00:00Z")) {
  let current = start.getTime();
  return {
    now: () => new Date(current),
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("serviço de sessão", () => {
  it("guarda apenas o hash do token, nunca o token", async () => {
    const service = createSessionService(prisma);
    const { token, sessionId } = await service.create({ tenantId, userId });

    const stored = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(stored.tokenHash).toBe(hashSessionToken(token));
    expect(stored.tokenHash).not.toContain(token);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("resolve sessão válida com tenant e usuário vindos do banco", async () => {
    const service = createSessionService(prisma);
    const { token } = await service.create({ tenantId, userId });

    const session = await service.resolve(token);

    expect(session).toMatchObject({ tenantId, userId });
  });

  it("rejeita token ausente, malformado ou desconhecido", async () => {
    const service = createSessionService(prisma);

    expect(await service.resolve(undefined)).toBeNull();
    expect(await service.resolve("curto")).toBeNull();
    expect(await service.resolve("A".repeat(43))).toBeNull();
  });

  it("expira por inatividade (12h) e renova enquanto houver uso", async () => {
    const clock = fakeClock();
    const service = createSessionService(prisma, clock.now);
    const { token } = await service.create({ tenantId, userId });

    clock.advance(SESSION_IDLE_TIMEOUT_MS - 60_000);
    expect(await service.resolve(token)).not.toBeNull(); // uso renova a janela

    clock.advance(SESSION_IDLE_TIMEOUT_MS - 60_000);
    expect(await service.resolve(token)).not.toBeNull();

    clock.advance(SESSION_IDLE_TIMEOUT_MS + 1);
    expect(await service.resolve(token)).toBeNull();
  });

  it("expira no teto absoluto (7 dias) mesmo com uso contínuo", async () => {
    const clock = fakeClock();
    const service = createSessionService(prisma, clock.now);
    const { token } = await service.create({ tenantId, userId });

    let elapsed = 0;
    while (elapsed < SESSION_ABSOLUTE_TIMEOUT_MS - SESSION_IDLE_TIMEOUT_MS) {
      clock.advance(SESSION_IDLE_TIMEOUT_MS / 2);
      elapsed += SESSION_IDLE_TIMEOUT_MS / 2;
      expect(await service.resolve(token)).not.toBeNull();
    }
    clock.advance(SESSION_ABSOLUTE_TIMEOUT_MS - elapsed + SESSION_TOUCH_INTERVAL_MS);
    expect(await service.resolve(token)).toBeNull();
  });

  it("rejeita sessão revogada", async () => {
    const service = createSessionService(prisma);
    const { token, sessionId } = await service.create({ tenantId, userId });

    await service.revoke(sessionId, "LOGOUT");

    expect(await service.resolve(token)).toBeNull();
  });

  it("rejeita sessão de usuário bloqueado e de oficina suspensa", async () => {
    const service = createSessionService(prisma);
    const { token } = await service.create({ tenantId, userId });

    await prisma.user.update({ where: { id: userId }, data: { status: "BLOCKED" } });
    expect(await service.resolve(token)).toBeNull();

    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: "SUSPENDED" } });
    expect(await service.resolve(token)).toBeNull();
  });

  it("revoga todas as sessões de um usuário", async () => {
    const service = createSessionService(prisma);
    const first = await service.create({ tenantId, userId });
    const second = await service.create({ tenantId, userId });

    expect(await service.revokeAllForUser(tenantId, userId, "USER_BLOCKED")).toBe(2);
    expect(await service.resolve(first.token)).toBeNull();
    expect(await service.resolve(second.token)).toBeNull();
  });
});
