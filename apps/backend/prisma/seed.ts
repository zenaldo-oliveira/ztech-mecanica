import type { Role } from "@ztech/validation";

import { createPrismaClient, type PrismaClient } from "../src/db/client.js";
import { TenantStatus, UserStatus } from "../src/generated/prisma/enums.js";
import { hashPassword } from "../src/lib/password.js";
import { syncRbacCatalog } from "../src/modules/rbac/catalog-sync.js";

// Seed de DESENVOLVIMENTO. Dados fictícios (CNPJs com dígito verificador válido,
// mas inventados; e-mails no domínio reservado .test). Idempotente.
interface DemoUser {
  name: string;
  email: string;
  roles: Role[];
}

interface DemoTenant {
  document: string;
  legalName: string;
  tradeName: string;
  users: DemoUser[];
}

const DEMO_TENANTS: DemoTenant[] = [
  {
    document: "11222333000181",
    legalName: "Oficina Demo Alfa Ltda",
    tradeName: "Oficina Alfa",
    users: [
      { name: "Ricardo Almeida", email: "dono@oficina-alfa.test", roles: ["OWNER"] },
      { name: "Paula Mendes", email: "atendimento@oficina-alfa.test", roles: ["ATTENDANT"] },
      { name: "Jorge Lima", email: "mecanico@oficina-alfa.test", roles: ["MECHANIC"] },
      { name: "Sandra Costa", email: "financeiro@oficina-alfa.test", roles: ["FINANCIAL", "VIEWER"] },
    ],
  },
  {
    document: "44555666000181",
    legalName: "Oficina Demo Beta Ltda",
    tradeName: "Oficina Beta",
    users: [{ name: "Marcos Ribeiro", email: "dono@oficina-beta.test", roles: ["OWNER"] }],
  },
];

async function seedTenant(prisma: PrismaClient, demo: DemoTenant, passwordHash: string) {
  const tenant = await prisma.tenant.upsert({
    where: { document: demo.document },
    update: { legalName: demo.legalName, tradeName: demo.tradeName, status: TenantStatus.ACTIVE },
    create: { document: demo.document, legalName: demo.legalName, tradeName: demo.tradeName, status: TenantStatus.ACTIVE },
  });

  const roles = await prisma.role.findMany({ select: { id: true, key: true } });
  const roleIdByKey = new Map(roles.map((role) => [role.key, role.id]));

  for (const demoUser of demo.users) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: { name: demoUser.name, status: UserStatus.ACTIVE },
      create: {
        tenantId: tenant.id,
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.userRole.createMany({
      data: demoUser.roles.map((key) => ({ tenantId: tenant.id, userId: user.id, roleId: roleIdByKey.get(key)! })),
      skipDuplicates: true,
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed de desenvolvimento não pode ser executado em produção.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não definida.");
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 10) {
    throw new Error("SEED_DEMO_PASSWORD não definida (mínimo 10 caracteres). Ver apps/backend/.env.example.");
  }

  const prisma = createPrismaClient(databaseUrl);
  try {
    await syncRbacCatalog(prisma);
    const passwordHash = await hashPassword(demoPassword);
    for (const demo of DEMO_TENANTS) await seedTenant(prisma, demo, passwordHash);

    const userCount = DEMO_TENANTS.reduce((total, demo) => total + demo.users.length, 0);
    console.info(`[seed] catálogo RBAC sincronizado; ${DEMO_TENANTS.length} oficinas e ${userCount} usuários de demonstração prontos.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("[seed] falhou:", error instanceof Error ? error.message : error);
  process.exit(1);
});
