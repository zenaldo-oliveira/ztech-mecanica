import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/db/client.js";
import { scopeToTenant, TenantScopeViolationError } from "../../src/db/tenant-scope.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario } from "../helpers/fixtures.js";

// Transações e escritas aninhadas com o client restrito à oficina (riscos R1/R2 da
// especificação do núcleo). Código de domínio abre transações sempre a partir do client
// com escopo: `scopeToTenant(prisma, tenantId).$transaction(async (tx) => …)`.

let prisma: PrismaClient;
let scenario: Awaited<ReturnType<typeof createTwoTenantsScenario>>;
let emailSequence = 0;

const uniqueEmail = (prefix: string) => `${prefix}-${++emailSequence}-${Date.now()}@oficina.test`;

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

describe("transações com o client da oficina", () => {
  it("aplica o escopo dentro de uma transação interativa (leitura e criação)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const { users, log } = await dbA.$transaction(async (tx) => {
      const log = await tx.auditLog.create({ data: { actorType: "SYSTEM", action: "TX_TEST" } });
      const users = await tx.user.findMany();
      return { users, log };
    });

    expect(log.tenantId).toBe(scenario.tenantA.id);
    expect(users.length).toBe(2);
    expect(users.every((user) => user.tenantId === scenario.tenantA.id)).toBe(true);
  });

  it("aplica o escopo em transações em lote (array de operações)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const [users, log] = await dbA.$transaction([
      dbA.user.findMany(),
      dbA.auditLog.create({ data: { actorType: "SYSTEM", action: "BATCH_TEST" } }),
    ]);

    expect(users.every((user) => user.tenantId === scenario.tenantA.id)).toBe(true);
    expect(log.tenantId).toBe(scenario.tenantA.id);
  });

  it("não lê, altera nem exclui dados de outra oficina dentro da transação", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await dbA.$transaction(async (tx) => {
      expect(await tx.user.findUnique({ where: { id: scenario.ownerB.id } })).toBeNull();
      expect((await tx.session.findMany()).every((session) => session.tenantId === scenario.tenantA.id)).toBe(true);
      expect((await tx.user.updateMany({ where: { id: scenario.ownerB.id }, data: { name: "Invadido" } })).count).toBe(0);
      expect((await tx.session.deleteMany({ where: { userId: scenario.ownerB.id } })).count).toBe(0);
    });

    const ownerB = await prisma.user.findUniqueOrThrow({ where: { id: scenario.ownerB.id } });
    expect(ownerB.name).toBe("Dono B");
    expect(await prisma.session.count({ where: { userId: scenario.ownerB.id } })).toBe(1);
  });

  it("rejeita tenantId de outra oficina dentro da transação e desfaz o que já foi gravado", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(
      dbA.$transaction(async (tx) => {
        await tx.auditLog.create({ data: { actorType: "SYSTEM", action: "BEFORE_VIOLATION" } });
        await tx.user.findMany({ where: { tenantId: scenario.tenantB.id } });
      }),
    ).rejects.toThrow(TenantScopeViolationError);

    expect(await prisma.auditLog.count({ where: { action: "BEFORE_VIOLATION" } })).toBe(0);
  });

  it("rollback: falha no meio da transação não deixa registro parcial", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const email = uniqueEmail("rollback");

    await expect(
      dbA.$transaction(async (tx) => {
        await tx.user.create({ data: { tenantId: scenario.tenantA.id, name: "Parcial", email } });
        await tx.auditLog.create({ data: { actorType: "SYSTEM", action: "PARTIAL" } });
        throw new Error("falha de regra de negócio");
      }),
    ).rejects.toThrow("falha de regra de negócio");

    expect(await prisma.user.count({ where: { email } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "PARTIAL" } })).toBe(0);
  });

  it("rollback: violação de constraint do banco desfaz as escritas anteriores", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const email = uniqueEmail("constraint");

    await expect(
      dbA.$transaction(async (tx) => {
        await tx.user.create({ data: { tenantId: scenario.tenantA.id, name: "Primeiro", email } });
        await tx.user.create({ data: { tenantId: scenario.tenantA.id, name: "Duplicado", email } }); // e-mail único → P2002
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    expect(await prisma.user.count({ where: { email } })).toBe(0);
  });

  it("transações concorrentes de oficinas diferentes não misturam dados", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const dbB = scopeToTenant(prisma, scenario.tenantB.id);
    const ROUNDS = 8;

    const run = (db: typeof dbA, tenantId: string, label: string, round: number) =>
      db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { tenantId, name: `${label}-${round}`, email: uniqueEmail(label.toLowerCase()) },
        });
        const visible = await tx.user.findMany({ select: { tenantId: true } });
        return { created, visibleTenants: new Set(visible.map((user) => user.tenantId)) };
      });

    const results = await Promise.all(
      Array.from({ length: ROUNDS }, (_, round) => [
        run(dbA, scenario.tenantA.id, "A", round),
        run(dbB, scenario.tenantB.id, "B", round),
      ]).flat(),
    );

    for (const [index, result] of results.entries()) {
      const expectedTenant = index % 2 === 0 ? scenario.tenantA.id : scenario.tenantB.id;
      expect(result.created.tenantId).toBe(expectedTenant);
      expect([...result.visibleTenants]).toEqual([expectedTenant]);
    }
    expect(await prisma.user.count({ where: { tenantId: scenario.tenantA.id, name: { startsWith: "B-" } } })).toBe(0);
    expect(await prisma.user.count({ where: { tenantId: scenario.tenantB.id, name: { startsWith: "A-" } } })).toBe(0);
  });
});

describe("escritas aninhadas com o client da oficina", () => {
  it("nested create herda o tenantId do pai pela FK composta (tenant_id, user_id)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const viewerRole = await prisma.role.findUniqueOrThrow({ where: { key: "VIEWER" } });

    const user = await dbA.user.create({
      data: {
        tenantId: scenario.tenantA.id,
        name: "Com filhos",
        email: uniqueEmail("nested"),
        roles: { create: [{ roleId: viewerRole.id }] },
        sessions: {
          create: [
            {
              tokenHash: "a".repeat(64),
              expiresAt: new Date(Date.now() + 60_000),
              absoluteExpiresAt: new Date(Date.now() + 120_000),
            },
          ],
        },
      },
      select: { id: true, tenantId: true },
    });

    expect(user.tenantId).toBe(scenario.tenantA.id);
    const userRoles = await prisma.userRole.findMany({ where: { userId: user.id } });
    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(userRoles.map((row) => row.tenantId)).toEqual([scenario.tenantA.id]);
    expect(sessions.map((row) => row.tenantId)).toEqual([scenario.tenantA.id]);
  });

  it("createMany de filhos dentro da transação grava o tenantId da sessão", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const viewerRole = await prisma.role.findUniqueOrThrow({ where: { key: "VIEWER" } });

    const userId = await dbA.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { tenantId: scenario.tenantA.id, name: "Pai", email: uniqueEmail("createmany") } });
      await tx.userRole.createMany({ data: [{ tenantId: scenario.tenantA.id, userId: user.id, roleId: viewerRole.id }] });
      return user.id;
    });

    const rows = await prisma.userRole.findMany({ where: { userId } });
    expect(rows.map((row) => row.tenantId)).toEqual([scenario.tenantA.id]);
  });

  it("filho apontando para pai de outra oficina é recusado (FK composta)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const viewerRole = await prisma.role.findUniqueOrThrow({ where: { key: "VIEWER" } });

    await expect(
      dbA.userRole.createMany({
        data: [{ tenantId: scenario.tenantA.id, userId: scenario.ownerB.id, roleId: viewerRole.id }],
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    expect(await prisma.userRole.count({ where: { userId: scenario.ownerB.id, roleId: viewerRole.id } })).toBe(0);
  });

  it("nested create ignora tentativa de apontar o filho para outra oficina (fica na oficina do pai)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    // Entrada propositalmente fora do tipo (simula input malicioso que chegasse ao client).
    const maliciousData = {
      tenantId: scenario.tenantA.id,
      name: "Tentativa",
      email: uniqueEmail("nested-tenant"),
      sessions: {
        create: [
          {
            tokenHash: "b".repeat(64),
            expiresAt: new Date(Date.now() + 60_000),
            absoluteExpiresAt: new Date(Date.now() + 120_000),
            tenant: { connect: { id: scenario.tenantB.id } },
          },
        ],
      },
    } as unknown as Parameters<typeof dbA.user.create>[0]["data"];
    const user = await dbA.user.create({ data: maliciousData });

    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions.map((session) => session.tenantId)).toEqual([scenario.tenantA.id]);
    expect(await prisma.session.count({ where: { tenantId: scenario.tenantB.id } })).toBe(1);
  });

  it("escrita aninhada não altera nem cria catálogos globais (só permite vincular)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const roleLinkA = await prisma.userRole.findFirstOrThrow({ where: { userId: scenario.ownerA.id } });
    const viewerRole = await prisma.role.findUniqueOrThrow({ where: { key: "VIEWER" } });

    await expect(
      dbA.userRole.update({ where: { id: roleLinkA.id }, data: { role: { update: { name: "Hackeado" } } } }),
    ).rejects.toThrow(TenantScopeViolationError);
    // Entrada propositalmente fora do tipo: cria um papel global por dentro de um vínculo.
    const createGlobalRole = {
      roles: { create: [{ role: { create: { key: "INTRUSO", name: "Intruso" } } }] },
    } as unknown as Parameters<typeof dbA.user.update>[0]["data"];
    await expect(
      dbA.user.update({ where: { id: scenario.ownerA.id }, data: createGlobalRole }),
    ).rejects.toThrow(TenantScopeViolationError);

    const roles = await prisma.role.findMany({ select: { key: true, name: true } });
    expect(roles.some((role) => role.name === "Hackeado" || role.key === "INTRUSO")).toBe(false);

    // Vincular um papel existente (connect) continua permitido.
    const relinked = await dbA.userRole.update({
      where: { id: roleLinkA.id },
      data: { role: { connect: { id: viewerRole.id } } },
    });
    expect(relinked).toMatchObject({ tenantId: scenario.tenantA.id, roleId: viewerRole.id });
  });

  it("nested connect/update não captura nem altera registro de outra oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);
    const roleLinkB = await prisma.userRole.findFirstOrThrow({ where: { userId: scenario.ownerB.id } });

    // connect moveria o vínculo de B para um usuário de A (troca de tenant_id): o banco recusa.
    await expect(
      dbA.user.update({ where: { id: scenario.ownerA.id }, data: { roles: { connect: { id: roleLinkB.id } } } }),
    ).rejects.toThrow();
    // update aninhado só enxerga filhos do pai (que é da oficina A).
    await expect(
      dbA.user.update({
        where: { id: scenario.ownerA.id },
        data: { roles: { update: { where: { id: roleLinkB.id }, data: { roleId: roleLinkB.roleId } } } },
      }),
    ).rejects.toThrow();
    // relação do filho apontando para usuário de outra oficina: o banco recusa.
    const roleLinkA = await prisma.userRole.findFirstOrThrow({ where: { userId: scenario.ownerA.id } });
    await expect(
      dbA.userRole.update({ where: { id: roleLinkA.id }, data: { user: { connect: { id: scenario.ownerB.id } } } }),
    ).rejects.toThrow();

    const unchangedB = await prisma.userRole.findUniqueOrThrow({ where: { id: roleLinkB.id } });
    expect(unchangedB).toMatchObject({ tenantId: scenario.tenantB.id, userId: scenario.ownerB.id });
    const unchangedA = await prisma.userRole.findUniqueOrThrow({ where: { id: roleLinkA.id } });
    expect(unchangedA).toMatchObject({ tenantId: scenario.tenantA.id, userId: scenario.ownerA.id });
  });
});

describe("leituras aninhadas a partir dos catálogos globais", () => {
  it("include a partir de um catálogo global não expõe dados de outra oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(dbA.role.findMany({ include: { userRoles: { include: { user: true } } } })).rejects.toThrow(
      TenantScopeViolationError,
    );
  });

  it("include que volta de um catálogo global para dados da oficina é recusado", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(
      dbA.user.findMany({
        include: { roles: { include: { role: { include: { userRoles: { include: { user: true } } } } } } },
      }),
    ).rejects.toThrow(TenantScopeViolationError);
    await expect(
      dbA.user.findMany({ select: { roles: { select: { role: { select: { _count: true } } } } } }),
    ).rejects.toThrow(TenantScopeViolationError);
  });

  it("filtro relacional a partir de um catálogo global não serve de oráculo sobre outra oficina", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    await expect(
      dbA.role.findMany({ where: { userRoles: { some: { user: { email: scenario.ownerB.email } } } } }),
    ).rejects.toThrow(TenantScopeViolationError);
    await expect(
      dbA.user.findMany({
        where: { roles: { some: { role: { userRoles: { some: { tenantId: scenario.tenantB.id } } } } } },
      }),
    ).rejects.toThrow(TenantScopeViolationError);
  });

  it("continua permitindo os usos legítimos de catálogo (campos do papel e permissões globais)", async () => {
    const dbA = scopeToTenant(prisma, scenario.tenantA.id);

    const roles = await dbA.role.findMany({ include: { permissions: { include: { permission: true } } } });
    expect(roles.length).toBeGreaterThan(0);

    const users = await dbA.user.findMany({
      where: { roles: { some: { role: { key: "OWNER" } } } },
      select: { id: true, roles: { select: { role: { select: { key: true } } } } },
    });
    expect(users.map((user) => user.id)).toEqual([scenario.ownerA.id]);
  });
});
