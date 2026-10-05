import type { Role } from "@ztech/validation";

import type { Env } from "../../src/config/env.js";
import type { PrismaClient } from "../../src/db/client.js";
import { hashPassword } from "../../src/lib/password.js";
import { createSessionService } from "../../src/modules/auth/session-service.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { SESSION_COOKIE_NAME } from "../../src/plugins/auth.js";

export const testEnv: Env = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3333,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://unused@127.0.0.1:1/unused",
  APP_URL: "http://localhost:3000",
  EMAIL_PROVIDER: "mock",
  DEV_MAIL_DIR: ".dev-mail",
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

/** Usuário com senha real (Argon2id), sem sessão — para testar o login. */
export async function createUserWithPassword(
  prisma: PrismaClient,
  tenantId: string,
  options: { email: string; password: string; roles?: Role[]; status?: "ACTIVE" | "BLOCKED" | "INVITED" },
) {
  const user = await prisma.user.create({
    data: {
      tenantId,
      name: "Usuário com senha",
      email: options.email,
      passwordHash: options.status === "INVITED" ? null : await hashPassword(options.password),
      status: options.status ?? "ACTIVE",
    },
  });
  const roles = options.roles ?? ["OWNER"];
  const roleRows = await prisma.role.findMany({ where: { key: { in: roles } }, select: { id: true } });
  await prisma.userRole.createMany({ data: roleRows.map((role) => ({ tenantId, userId: user.id, roleId: role.id })) });
  return user;
}

/** CPF válido (dígitos verificadores corretos) gerado a partir de um número; somente dígitos. */
export function validCpf(seed: number): string {
  const base = String(100_000_000 + (seed % 800_000_000)).padStart(9, "0");
  const digit = (digits: string, startWeight: number) => {
    const sum = [...digits].reduce((total, char, index) => total + Number(char) * (startWeight - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(base, 10);
  return `${base}${first}${digit(`${base}${first}`, 11)}`;
}

/** Extrai o cookie de sessão de uma resposta do app.inject. */
export function sessionCookieFrom(response: { cookies: { name: string; value: string }[] }): string | undefined {
  const cookie = response.cookies.find((item) => item.name === SESSION_COOKIE_NAME);
  return cookie ? `${SESSION_COOKIE_NAME}=${cookie.value}` : undefined;
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
