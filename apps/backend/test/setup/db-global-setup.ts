import { execFileSync } from "node:child_process";

import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

function loadDotEnv() {
  try {
    process.loadEnvFile();
  } catch {
    // Sem .env (ex.: CI): variáveis vêm do ambiente.
  }
}

function databaseName(url: string) {
  return new URL(url).pathname.replace(/^\//, "");
}

/**
 * Prepara o banco de testes de integração: valida que é um banco descartável
 * e aplica as migrations. Falha de forma explícita — os testes de banco nunca
 * são pulados silenciosamente.
 */
export default function setup(project: TestProject) {
  loadDotEnv();
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL não definida. Suba o banco com `docker compose up -d` na raiz e configure apps/backend/.env (ver .env.example).",
    );
  }
  if (testDatabaseUrl === process.env.DATABASE_URL || !databaseName(testDatabaseUrl).endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL deve apontar para um banco próprio de testes (nome terminado em _test).");
  }

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "pipe",
    shell: process.platform === "win32",
  });

  project.provide("testDatabaseUrl", testDatabaseUrl);
}
