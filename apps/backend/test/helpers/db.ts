import { inject } from "vitest";

import { createPrismaClient, type PrismaClient } from "../../src/db/client.js";

export function createTestPrisma(): PrismaClient {
  return createPrismaClient(inject("testDatabaseUrl"));
}

/** Limpa todas as tabelas do banco de testes (TRUNCATE não dispara o trigger de auditoria). */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "audit_logs", "password_reset_tokens", "sessions", "user_roles", "users", "platform_users", "role_permissions", "roles", "permissions", "tenants" CASCADE',
  );
}
