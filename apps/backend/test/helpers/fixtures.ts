import type { Role } from "@ztech/validation";

import type { Env } from "../../src/config/env.js";
import type { PrismaClient } from "../../src/db/client.js";
import { createSessionService } from "../../src/modules/auth/session-service.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { SESSION_COOKIE_NAME } from "../../src/plugins/auth.js";

export const testEnv: Env = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3333,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://unused@127.0.0.1:1/unused",
};

export interface TestUser {
  id: string;
  tenantId: string;
  email: string;
  /** Cookie pronto para `app.inject({ headers: { cookie } })`. */
  cookie: string;
  token: string;
}

let sequence = 0;

export async function createTenant(prisma: PrismaClient, document: string, name = `Oficina ${document}`) {
  return prisma.tenant.create({ data: { legalName: name, document, status: "ACTIVE" } });
}

/** Cria usuário ativo com papéis e uma sessão válida. Requer o catálogo RBAC sincronizado. */
export async function createUserWithSession(
  prisma: PrismaClient,
  tenantId: string,
  roles: Role[],
  options: { name?: string; now?: () => Date } = {},
): Promise<TestUser> {
  sequence += 1;
  const email = `usuario${sequence}-${Date.now()}@oficina.test`;
  const user = await prisma.user.create({
    data: { tenantId, name: options.name ?? `Usuário ${sequence}`, email, status: "ACTIVE" },
  });
  if (roles.length > 0) {
    const roleRows = await prisma.role.findMany({ where: { key: { in: roles } }, select: { id: true } });
    await prisma.userRole.createMany({ data: roleRows.map((role) => ({ tenantId, userId: user.id, roleId: role.id })) });
  }
  const { token } = await createSessionService(prisma, options.now).create({ tenantId, userId: user.id });
  return { id: user.id, tenantId, email, token, cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

/** Duas oficinas (A e B) com um OWNER cada e um VIEWER em A. */
export async function createTwoTenantsScenario(prisma: PrismaClient) {
  await syncRbacCatalog(prisma);
  const tenantA = await createTenant(prisma, "11222333000181", "Oficina A");
  const tenantB = await createTenant(prisma, "44555666000181", "Oficina B");
  const ownerA = await createUserWithSession(prisma, tenantA.id, ["OWNER"], { name: "Dono A" });
  const viewerA = await createUserWithSession(prisma, tenantA.id, ["VIEWER"], { name: "Leitor A" });
  const ownerB = await createUserWithSession(prisma, tenantB.id, ["OWNER"], { name: "Dono B" });
  return { tenantA, tenantB, ownerA, viewerA, ownerB };
}
