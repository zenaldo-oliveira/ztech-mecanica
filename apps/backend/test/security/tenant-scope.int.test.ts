import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/db/client.js";
import { scopeToTenant, TenantScopeViolationError } from "../../src/db/tenant-scope.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario } from "../helpers/fixtures.js";

let prisma: PrismaClient;
let scenario: Awaited<ReturnType<typeof createTwoTenantsScenario>>;

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  scenario = await createTwoTenantsScenario(prisma);
});

describe("escopo da oficina no Prisma (scopeToTenant)", () => {
  it("leituras retornam apenas registros da própria oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const users = await dbA.user.findMany();

    expect(users.length).toBe(2);
    expect(users.every((user) => user.tenantId === scenario.tenantA.id)).toBe(true);
    expect(await dbA.user.count()).toBe(2);
  });

  it("não encontra registro de outra oficina pelo id", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    expect(await dbA.user.findUnique({ where: { id: scenario.ownerB.id } })).toBeNull();
    expect(await dbA.user.findFirst({ where: { id: scenario.ownerB.id } })).toBeNull();
  });

  it("não altera nem exclui registro de outra oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(dbA.user.update({ where: { id: scenario.ownerB.id }, data: { name: "Invadido" } })).rejects.toMatchObject({
      code: "P2025",
    });
    await expect(dbA.user.delete({ where: { id: scenario.ownerB.id } })).rejects.toMatchObject({ code: "P2025" });
    expect((await dbA.user.updateMany({ where: { id: scenario.ownerB.id }, data: { name: "Invadido" } })).count).toBe(0);
    expect((await dbA.user.deleteMany({ where: { id: scenario.ownerB.id } })).count).toBe(0);

    const ownerB = await prisma.user.findUniqueOrThrow({ where: { id: scenario.ownerB.id } });
    expect(ownerB.name).toBe("Dono B");
  });

  it("updateMany/deleteMany sem filtro afetam somente a própria oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await dbA.session.updateMany({ data: { revokedReason: "ADMIN" } });

    const sessionsB = await prisma.session.findMany({ where: { tenantId: scenario.tenantB.id } });
    expect(sessionsB.every((session) => session.revokedReason === null)).toBe(true);
  });

  it("grava tenantId da sessão em criações", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const log = await dbA.auditLog.create({ data: { actorType: "SYSTEM", action: "TEST" } });

    expect(log.tenantId).toBe(scenario.tenantA.id);
  });

  it("rejeita tenantId de outra oficina em filtros, criações e alterações", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const otherTenantId = scenario.tenantB.id;

    await expect(dbA.user.findMany({ where: { tenantId: otherTenantId } })).rejects.toThrow(TenantScopeViolationError);
    await expect(
      dbA.auditLog.create({ data: { tenantId: otherTenantId, actorType: "SYSTEM", action: "TEST" } }),
    ).rejects.toThrow(TenantScopeViolationError);
    await expect(
      dbA.user.update({ where: { id: scenario.ownerA.id }, data: { tenantId: otherTenantId } }),
    ).rejects.toThrow(TenantScopeViolationError);
  });

  it("restringe o modelo Tenant à própria oficina e impede criar/excluir oficinas", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const tenants = await dbA.tenant.findMany();
    expect(tenants.map((tenant) => tenant.id)).toEqual([scenario.tenantA.id]);
    await expect(dbA.tenant.findUnique({ where: { id: scenario.tenantB.id } })).rejects.toThrow(
      TenantScopeViolationError,
    );
    await expect(dbA.tenant.delete({ where: { id: scenario.tenantA.id } })).rejects.toThrow(TenantScopeViolationError);
  });

  it("bloqueia usuários da plataforma e escrita nos catálogos globais", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(dbA.platformUser.findMany()).rejects.toThrow(TenantScopeViolationError);
    expect((await dbA.role.findMany()).length).toBeGreaterThan(0);
    await expect(dbA.role.create({ data: { key: "HACKER", name: "Hacker" } })).rejects.toThrow(
      TenantScopeViolationError,
    );
  });
});
