import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_KEYS, ROLE_KEYS, type Permission, type Role } from "@ztech/validation";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { loadUserAuthorization } from "../../src/modules/auth/authorization.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTenant, createUserWithSession, testEnv } from "../helpers/fixtures.js";

// Matriz aprovada (docs/architecture/autorizacao.md §5) aplicada pela engine real:
// sincronização do catálogo + requirePermission. As rotas /__rbac/* existem só neste teste.

const PROBE_PREFIX = "/__rbac";

let prisma: PrismaClient;
let app: FastifyInstance;
let tenantA: { id: string };
let tenantB: { id: string };

beforeAll(async () => {
  prisma = createTestPrisma();
  app = buildApp({ env: testEnv, prisma });
  app.register(async (instance) => {
    for (const permission of PERMISSION_KEYS) {
      instance.get(
        `${PROBE_PREFIX}/${permission}`,
        { preHandler: [instance.authenticate, instance.requirePermission(permission)] },
        async () => ({ data: { allowed: permission } }),
      );
    }
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  await syncRbacCatalog(prisma);
  tenantA = await createTenant(prisma, "11222333000181", "Oficina A");
  tenantB = await createTenant(prisma, "44555666000181", "Oficina B");
});

async function probe(cookie: string, permission: Permission) {
  return app.inject({ method: "GET", url: `${PROBE_PREFIX}/${permission}`, headers: { cookie } });
}

async function roleLinks() {
  const rows = await prisma.rolePermission.findMany({
    select: { role: { select: { key: true } }, permission: { select: { key: true } } },
  });
  return rows.map((row) => `${row.role.key}:${row.permission.key}`).sort();
}

describe("sincronização do catálogo", () => {
  it("grava todas as permissões aprovadas e a matriz exata de cada papel", async () => {
    const permissions = await prisma.permission.findMany({ select: { key: true } });
    expect(permissions.map((row) => row.key).sort()).toEqual([...PERMISSION_KEYS].sort());

    const expected = ROLE_KEYS.flatMap((role) => DEFAULT_ROLE_PERMISSIONS[role].map((key) => `${role}:${key}`)).sort();
    expect(await roleLinks()).toEqual(expected);
  });

  it("é idempotente e não duplica permissões nem vínculos", async () => {
    const before = await roleLinks();
    await syncRbacCatalog(prisma);
    await syncRbacCatalog(prisma);

    expect(await roleLinks()).toEqual(before);
    expect(await prisma.permission.count()).toBe(PERMISSION_KEYS.length);
    expect(await prisma.role.count()).toBe(ROLE_KEYS.length);
  });

  it("permissão retirada do catálogo deixa de ser concedida a qualquer papel", async () => {
    // Simula um banco anterior ao 04B: quotes.delete ainda vinculada ao OWNER.
    const legacy = await prisma.permission.create({ data: { key: "quotes.delete", description: "legado" } });
    const owner = await prisma.role.findUniqueOrThrow({ where: { key: "OWNER" } });
    await prisma.rolePermission.create({ data: { roleId: owner.id, permissionId: legacy.id } });
    const user = await createUserWithSession(prisma, tenantA.id, ["OWNER"]);

    await syncRbacCatalog(prisma);

    expect(await prisma.rolePermission.count({ where: { permissionId: legacy.id } })).toBe(0);
    const { permissions } = await loadUserAuthorization(prisma, tenantA.id, user.id);
    expect([...permissions]).not.toContain("quotes.delete");
    expect(permissions.size).toBe(PERMISSION_KEYS.length);
  });
});

describe("permitido / negado por papel (engine real)", () => {
  const cases: { role: Role; allowed: Permission; denied?: Permission }[] = [
    { role: "OWNER", allowed: "settings.manage" },
    { role: "ADMIN", allowed: "users.manage" },
    { role: "MANAGER", allowed: "work_orders.view_cost", denied: "users.manage" },
    { role: "ATTENDANT", allowed: "customers.create", denied: "work_orders.apply_discount" },
    { role: "MECHANIC", allowed: "work_orders.complete", denied: "work_orders.edit_prices" },
    { role: "FINANCIAL", allowed: "fiscal.issue", denied: "vehicles.read" },
    { role: "VIEWER", allowed: "financial.read", denied: "customers.create" },
  ];

  for (const { role, allowed, denied } of cases) {
    it(`${role}: permite ${allowed}${denied ? ` e nega ${denied}` : ""}`, async () => {
      const user = await createUserWithSession(prisma, tenantA.id, [role]);

      expect((await probe(user.cookie, allowed)).statusCode).toBe(200);
      if (denied) {
        const response = await probe(user.cookie, denied);
        expect(response.statusCode).toBe(403);
        expect(response.json().error.code).toBe("FORBIDDEN");
      }
    });
  }

  it("OWNER e ADMIN passam em todas as permissões do catálogo", async () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      const user = await createUserWithSession(prisma, tenantA.id, [role]);
      for (const permission of PERMISSION_KEYS) {
        expect((await probe(user.cookie, permission)).statusCode, `${role} ${permission}`).toBe(200);
      }
    }
  });

  it("VIEWER é negado em toda permissão que não seja de leitura, e em users.read/audit.read", async () => {
    const viewer = await createUserWithSession(prisma, tenantA.id, ["VIEWER"]);
    const denied = PERMISSION_KEYS.filter((key) => !DEFAULT_ROLE_PERMISSIONS.VIEWER.includes(key));

    expect(denied).toContain("users.read");
    expect(denied).toContain("audit.read");
    for (const permission of denied) {
      expect((await probe(viewer.cookie, permission)).statusCode, permission).toBe(403);
    }
  });

  it("sem papel nenhum: toda permissão é negada", async () => {
    const user = await createUserWithSession(prisma, tenantA.id, []);
    expect((await probe(user.cookie, "customers.read")).statusCode).toBe(403);
  });
});

describe("RBAC não atravessa oficinas", () => {
  it("papel atribuído só vale na oficina do usuário; vínculo com outra oficina é recusado pelo banco", async () => {
    const userA = await createUserWithSession(prisma, tenantA.id, ["VIEWER"]);
    const owner = await prisma.role.findUniqueOrThrow({ where: { key: "OWNER" } });

    await expect(
      prisma.userRole.create({ data: { tenantId: tenantB.id, userId: userA.id, roleId: owner.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    const link = await prisma.userRole.findFirstOrThrow({ where: { userId: userA.id } });
    await expect(prisma.userRole.update({ where: { id: link.id }, data: { tenantId: tenantB.id } })).rejects.toThrow();

    // Mesmo consultando com o tenantId de outra oficina, o usuário não ganha papéis.
    const { roles } = await loadUserAuthorization(prisma, tenantB.id, userA.id);
    expect(roles).toEqual([]);
    expect((await probe(userA.cookie, "customers.create")).statusCode).toBe(403);
  });
});
