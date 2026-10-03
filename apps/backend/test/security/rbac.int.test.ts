import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { createSessionService } from "../../src/modules/auth/session-service.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario, createUserWithSession, testEnv } from "../helpers/fixtures.js";

// TESTE OBRIGATÓRIO (Fase 1B): sem sessão → 401; sem permissão → 403 com ACCESS_DENIED auditado.

let prisma: PrismaClient;
let app: FastifyInstance;
let scenario: Awaited<ReturnType<typeof createTwoTenantsScenario>>;

beforeAll(async () => {
  prisma = createTestPrisma();
  app = buildApp({ env: testEnv, prisma });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  scenario = await createTwoTenantsScenario(prisma);
});

describe("autenticação (401)", () => {
  const protectedRequests = () => [
    { method: "GET" as const, url: "/api/v1/me" },
    { method: "GET" as const, url: "/api/v1/users" },
    { method: "GET" as const, url: `/api/v1/users/${scenario.ownerA.id}` },
    { method: "PATCH" as const, url: `/api/v1/users/${scenario.viewerA.id}`, payload: { name: "X" } },
    { method: "DELETE" as const, url: `/api/v1/users/${scenario.viewerA.id}` },
  ];

  it("sem sessão: todas as rotas protegidas retornam 401", async () => {
    for (const request of protectedRequests()) {
      const response = await app.inject(request);
      expect(response.statusCode, `${request.method} ${request.url}`).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHORIZED");
    }
    expect((await prisma.user.findUniqueOrThrow({ where: { id: scenario.viewerA.id } })).name).toBe("Leitor A");
  });

  it("token inválido: 401 e o cookie é removido", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: "ztech_session=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
    });

    expect(response.statusCode).toBe(401);
    expect(String(response.headers["set-cookie"])).toMatch(/ztech_session=;/);
  });

  it("sessão revogada: 401", async () => {
    const session = await prisma.session.findFirstOrThrow({ where: { userId: scenario.ownerA.id } });
    await createSessionService(prisma).revoke(session.id, "LOGOUT");

    const response = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: scenario.ownerA.cookie } });

    expect(response.statusCode).toBe(401);
  });
});

describe("autorização por permissão (403)", () => {
  it("VIEWER não lista usuários: 403 e ACCESS_DENIED registrado na auditoria", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/users", headers: { cookie: scenario.viewerA.cookie } });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("FORBIDDEN");
    const denied = await prisma.auditLog.findFirstOrThrow({ where: { action: "ACCESS_DENIED" } });
    expect(denied).toMatchObject({ tenantId: scenario.tenantA.id, userId: scenario.viewerA.id, actorType: "USER" });
    expect(denied.metadata).toMatchObject({ permission: "users.read", method: "GET", route: "/api/v1/users" });
    expect(denied.requestId).toBe(response.headers["x-request-id"]);
  });

  it("VIEWER não altera nem exclui usuários: 403, nada muda e cada tentativa é auditada", async () => {
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.ownerA.id}`,
      headers: { cookie: scenario.viewerA.cookie },
      payload: { status: "BLOCKED" },
    });
    const remove = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${scenario.ownerA.id}`,
      headers: { cookie: scenario.viewerA.cookie },
    });

    expect(patch.statusCode).toBe(403);
    expect(remove.statusCode).toBe(403);
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: scenario.ownerA.id } });
    expect(owner.status).toBe("ACTIVE");
    const denials = await prisma.auditLog.findMany({ where: { action: "ACCESS_DENIED", userId: scenario.viewerA.id } });
    expect(denials).toHaveLength(2);
    expect(denials.every((log) => (log.metadata as { permission: string }).permission === "users.manage")).toBe(true);
  });

  it("VIEWER acessa /me e vê apenas permissões de leitura", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: scenario.viewerA.cookie } });

    expect(response.statusCode).toBe(200);
    const { roles, permissions } = response.json().data;
    expect(roles).toEqual(["VIEWER"]);
    expect(permissions.every((permission: string) => permission.endsWith(".read"))).toBe(true);
    expect(permissions).not.toContain("users.manage");
  });

  it("decide por permissão, não pelo nome do papel: MANAGER lê usuários mas não os altera", async () => {
    const manager = await createUserWithSession(prisma, scenario.tenantA.id, ["MANAGER"]);

    const list = await app.inject({ method: "GET", url: "/api/v1/users", headers: { cookie: manager.cookie } });
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.viewerA.id}`,
      headers: { cookie: manager.cookie },
      payload: { name: "X" },
    });

    expect(list.statusCode).toBe(200);
    expect(patch.statusCode).toBe(403);
  });

  it("permissões de vários papéis se somam", async () => {
    const multi = await createUserWithSession(prisma, scenario.tenantA.id, ["MECHANIC", "FINANCIAL"]);

    const me = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: multi.cookie } });

    const { permissions } = me.json().data;
    expect(permissions).toContain("work_orders.update");
    expect(permissions).toContain("fiscal.issue");
  });
});

describe("regras de negócio de usuários", () => {
  it("bloquear um usuário revoga as sessões dele imediatamente", async () => {
    const block = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.viewerA.id}`,
      headers: { cookie: scenario.ownerA.cookie },
      payload: { status: "BLOCKED" },
    });
    const meViewer = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: scenario.viewerA.cookie } });

    expect(block.statusCode).toBe(200);
    expect(meViewer.statusCode).toBe(401);
  });

  it("não permite excluir nem bloquear o próprio usuário", async () => {
    const remove = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${scenario.ownerA.id}`,
      headers: { cookie: scenario.ownerA.cookie },
    });
    const block = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.ownerA.id}`,
      headers: { cookie: scenario.ownerA.cookie },
      payload: { status: "BLOCKED" },
    });

    expect(remove.statusCode).toBe(409);
    expect(block.statusCode).toBe(409);
  });

  it("não permite remover o último proprietário ativo", async () => {
    const admin = await createUserWithSession(prisma, scenario.tenantA.id, ["ADMIN"]);

    const response = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${scenario.ownerA.id}`,
      headers: { cookie: admin.cookie },
    });

    expect(response.statusCode).toBe(409);
    expect(await prisma.user.count({ where: { id: scenario.ownerA.id } })).toBe(1);
  });

  it("rota inexistente responde 404 padronizado com requestId", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/nao-existe", headers: { cookie: scenario.ownerA.cookie } });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toMatchObject({ code: "ROUTE_NOT_FOUND", requestId: response.headers["x-request-id"] });
  });
});
