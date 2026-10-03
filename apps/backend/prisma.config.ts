import { defineConfig } from "prisma/config";

// O Prisma 7 não carrega .env automaticamente. Em desenvolvimento, lê apps/backend/.env
// quando existir; em CI/produção as variáveis vêm do ambiente.
try {
  process.loadEnvFile();
} catch {
  // Sem .env: segue com process.env.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
