import { buildApp } from "./app.js";
import { EnvValidationError, loadEnv, type Env } from "./config/env.js";
import { createPrismaClient } from "./db/client.js";

function loadEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // Logger ainda não existe nesta etapa; a mensagem contém apenas nomes de variáveis.
      console.error(`[config] ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

async function main() {
  const env = loadEnvOrExit();
  const prisma = createPrismaClient(env.DATABASE_URL);
  const app = buildApp({ env, prisma });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "encerrando servidor");
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ host: env.HOST, port: env.PORT });

    app.log.info(
      `🚀 ZTech Oficina API rodando em http://${env.HOST}:${env.PORT}`,
    );
  } catch (error) {
    app.log.fatal({ err: error }, "falha ao iniciar o servidor");
    process.exit(1);
  }
}

void main();
