import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_KEYS, ROLE_KEYS } from "@ztech/validation";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/db/client.js";
import { hashPassword, verifyPassword } from "../../src/lib/password.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

async function createTenantWithUser(document: string, email: string) {
  const tenant = await prisma.tenant.create({ data: { legalName: `Oficina ${document}`, document } });
  const user = await prisma.user.create({ data: { tenantId: tenant.id, name: "Usuário", email } });
  return { tenant, user };
}

describe("catálogo RBAC no banco", () => {
  it("sincroniza papéis, permissões e a matriz padrão de forma idempotente", async () => {
    await syncRbacCatalog(prisma);
    await syncRbacCatalog(prisma);

    expect(await prisma.permission.count()).toBe(PERMISSION_KEYS.length);
    expect(await prisma.role.count()).toBe(ROLE_KEYS.length);
    const expectedLinks = ROLE_KEYS.reduce((total, role) => total + DEFAULT_ROLE_PERMISSIONS[role].length, 0);
    expect(await prisma.rolePermission.count()).toBe(expectedLinks);
  });
});

describe("integridade entre oficinas no banco", () => {
  it("impede atribuir papel com tenant_id diferente do tenant do usuário (FK composta)", async () => {
    await syncRbacCatalog(prisma);
    const a = await createTenantWithUser("11222333000181", "a@oficina-a.test");
    const b = await createTenantWithUser("44555666000181", "b@oficina-b.test");
    const owner = await prisma.role.findUniqueOrThrow({ where: { key: "OWNER" } });

    await expect(
      prisma.userRole.create({ data: { tenantId: a.tenant.id, userId: b.user.id, roleId: owner.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("impede sessão com tenant_id diferente do tenant do usuário (FK composta)", async () => {
    const a = await createTenantWithUser("11222333000181", "a@oficina-a.test");
    const b = await createTenantWithUser("44555666000181", "b@oficina-b.test");
    const now = Date.now();

    await expect(
      prisma.session.create({
        data: {
          tenantId: a.tenant.id,
          userId: b.user.id,
          tokenHash: "f".repeat(64),
          expiresAt: new Date(now + 60_000),
          absoluteExpiresAt: new Date(now + 120_000),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("impede mover um usuário para outra oficina (tenant_id imutável)", async () => {
    const a = await createTenantWithUser("11222333000181", "a@oficina-a.test");
    const b = await createTenantWithUser("44555666000181", "b@oficina-b.test");

    await expect(
      prisma.user.update({ where: { id: a.user.id }, data: { tenantId: b.tenant.id } }),
    ).rejects.toThrow(/tenant_id is immutable/);
  });

  it("exige e-mail em minúsculas", async () => {
    const tenant = await prisma.tenant.create({ data: { legalName: "Oficina", document: "11222333000181" } });
    await expect(
      prisma.user.create({ data: { tenantId: tenant.id, name: "X", email: "Maiusculo@oficina.test" } }),
    ).rejects.toThrow(/users_email_lowercase_check/);
  });
});

describe("auditoria somente inserção", () => {
  it("rejeita UPDATE e DELETE em audit_logs", async () => {
    const log = await prisma.auditLog.create({ data: { actorType: "SYSTEM", action: "TEST_EVENT" } });

    await expect(prisma.auditLog.update({ where: { id: log.id }, data: { action: "TAMPERED" } })).rejects.toThrow(
      /append-only/,
    );
    await expect(prisma.auditLog.delete({ where: { id: log.id } })).rejects.toThrow(/append-only/);
    expect((await prisma.auditLog.findUniqueOrThrow({ where: { id: log.id } })).action).toBe("TEST_EVENT");
  });
});

describe("senhas", () => {
  it("usa Argon2id e verifica corretamente", async () => {
    const passwordHash = await hashPassword("senha-forte-123");

    expect(passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(passwordHash).not.toContain("senha-forte-123");
    expect(await verifyPassword(passwordHash, "senha-forte-123")).toBe(true);
    expect(await verifyPassword(passwordHash, "senha-errada")).toBe(false);
    expect(await verifyPassword("hash-invalido", "qualquer")).toBe(false);
  });
});
