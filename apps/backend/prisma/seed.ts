import { createPrismaClient } from "../src/db/client.js";
import { TenantStatus } from "../src/generated/prisma/enums.js";

// Seed de DESENVOLVIMENTO. Dados fictícios (CNPJs com dígito verificador válido,
// mas inventados). Idempotente: pode ser executado várias vezes.
const DEMO_TENANTS = [
  {
    document: "11222333000181",
    legalName: "Oficina Demo Alfa Ltda",
    tradeName: "Oficina Alfa",
    status: TenantStatus.ACTIVE,
  },
  {
    document: "44555666000181",
    legalName: "Oficina Demo Beta Ltda",
    tradeName: "Oficina Beta",
    status: TenantStatus.ACTIVE,
  },
] as const;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed de desenvolvimento não pode ser executado em produção.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não definida.");

  const prisma = createPrismaClient(databaseUrl);
  try {
    for (const tenant of DEMO_TENANTS) {
      await prisma.tenant.upsert({
        where: { document: tenant.document },
        update: { legalName: tenant.legalName, tradeName: tenant.tradeName, status: tenant.status },
        create: tenant,
      });
    }
    console.info(`[seed] ${DEMO_TENANTS.length} oficinas de demonstração prontas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("[seed] falhou:", error instanceof Error ? error.message : error);
  process.exit(1);
});
