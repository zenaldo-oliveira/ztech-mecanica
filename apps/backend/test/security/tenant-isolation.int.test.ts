import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario, createUserWithSession, testEnv } from "../helpers/fixtures.js";

// TESTE OBRIGATÓRIO (Fase 1B): a Oficina A não consegue ler, alterar nem excluir dados da
// Oficina B por HTTP, e tenantId enviado pelo cliente nunca é usado.

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

const asUser = (cookie: string) => ({ cookie });

describe("isolamento entre oficinas via HTTP", () => {
  it("lista apenas usuários da própria oficina e nunca expõe passwordHash", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/users", headers: asUser(scenario.ownerA.cookie) });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const ids = body.data.map((user: { id: string }) => user.id).sort();
    expect(ids).toEqual([scenario.ownerA.id, scenario.viewerA.id].sort());
    expect(body.meta.total).toBe(2);
    expect(response.body).not.toContain("passwordHash");
    expect(response.body).not.toContain(scenario.ownerB.id);
  });

  it("Oficina A NÃO consegue LER usuário da Oficina B (404, indistinguível de inexistente)", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/users/${scenario.ownerB.id}`,
      headers: asUser(scenario.ownerA.cookie),
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("NOT_FOUND");
    expect(response.body).not.toContain("Dono B");
  });

  it("Oficina A NÃO consegue ALTERAR usuário da Oficina B", async () => {
    const rename = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.ownerB.id}`,
      headers: asUser(scenario.ownerA.cookie),
      payload: { name: "Invadido" },
    });
    const block = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.ownerB.id}`,
      headers: asUser(scenario.ownerA.cookie),
      payload: { status: "BLOCKED" },
    });

    expect(rename.statusCode).toBe(404);
    expect(block.statusCode).toBe(404);
    const ownerB = await prisma.user.findUniqueOrThrow({ where: { id: scenario.ownerB.id } });
    expect(ownerB.name).toBe("Dono B");
    expect(ownerB.status).toBe("ACTIVE");
    // A sessão de B continua válida: nada foi revogado por A.
    const meB = await app.inject({ method: "GET", url: "/api/v1/me", headers: asUser(scenario.ownerB.cookie) });
    expect(meB.statusCode).toBe(200);
  });

  it("Oficina A NÃO consegue EXCLUIR usuário da Oficina B", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${scenario.ownerB.id}`,
      headers: asUser(scenario.ownerA.cookie),
    });

    expect(response.statusCode).toBe(404);
    expect(await prisma.user.count({ where: { id: scenario.ownerB.id } })).toBe(1);
    expect(await prisma.session.count({ where: { userId: scenario.ownerB.id, revokedAt: null } })).toBe(1);
  });

  it("ações de A nunca geram auditoria na Oficina B", async () => {
    await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.ownerB.id}`,
      headers: asUser(scenario.ownerA.cookie),
      payload: { name: "Invadido" },
    });

    expect(await prisma.auditLog.count({ where: { tenantId: scenario.tenantB.id } })).toBe(0);
  });
});

describe("tenantId malicioso enviado pelo cliente", () => {
  it("rejeita tenantId na URL (query) com 400", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/users?tenantId=${scenario.tenantB.id}`,
      headers: asUser(scenario.ownerA.cookie),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
    expect(response.body).not.toContain(scenario.ownerB.id);
  });

  it("ignora tenantId em header: continua vendo somente a própria oficina", async () => {
    const headers = { ...asUser(scenario.ownerA.cookie), "x-tenant-id": scenario.tenantB.id, "tenant-id": scenario.tenantB.id };

    const users = await app.inject({ method: "GET", url: "/api/v1/users", headers });
    const me = await app.inject({ method: "GET", url: "/api/v1/me", headers });

    expect(users.statusCode).toBe(200);
    expect(users.body).not.toContain(scenario.ownerB.id);
    expect(me.json().data.tenant.id).toBe(scenario.tenantA.id);
  });

  it("rejeita tenantId no corpo com 400 e não altera nada", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.viewerA.id}`,
      headers: asUser(scenario.ownerA.cookie),
      payload: { name: "Novo nome", tenantId: scenario.tenantB.id },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: scenario.viewerA.id } });
    expect(viewer.tenantId).toBe(scenario.tenantA.id);
    expect(viewer.name).toBe("Leitor A");
  });

  it("/me sempre devolve a oficina da sessão, mesmo com tenantId na query", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/me?tenantId=${scenario.tenantB.id}`,
      headers: asUser(scenario.ownerB.cookie),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.tenant.id).toBe(scenario.tenantB.id);
    expect(response.json().data.user.id).toBe(scenario.ownerB.id);
  });
});

describe("operações legítimas na própria oficina", () => {
  it("OWNER altera usuário da própria oficina e a ação é auditada na oficina correta", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${scenario.viewerA.id}`,
      headers: asUser(scenario.ownerA.cookie),
      payload: { name: "Leitor Renomeado" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.name).toBe("Leitor Renomeado");
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "USER_UPDATED" } });
    expect(log).toMatchObject({ tenantId: scenario.tenantA.id, userId: scenario.ownerA.id, entityId: scenario.viewerA.id });
  });

  it("OWNER exclui usuário da própria oficina, removendo sessões e papéis", async () => {
    const attendant = await createUserWithSession(prisma, scenario.tenantA.id, ["ATTENDANT"]);

    const response = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/${attendant.id}`,
      headers: asUser(scenario.ownerA.cookie),
    });

    expect(response.statusCode).toBe(204);
    expect(await prisma.user.count({ where: { id: attendant.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: attendant.id } })).toBe(0);
    expect(await prisma.userRole.count({ where: { userId: attendant.id } })).toBe(0);
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "USER_DELETED" } });
    expect(log.tenantId).toBe(scenario.tenantA.id);
    const me = await app.inject({ method: "GET", url: "/api/v1/me", headers: asUser(attendant.cookie) });
    expect(me.statusCode).toBe(401);
  });
});
