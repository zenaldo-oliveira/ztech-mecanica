import { randomUUID } from "node:crypto";

import Fastify, { LogController, type FastifyInstance } from "fastify";

import type { Env } from "./config/env.js";
import type { PrismaClient } from "./db/client.js";
import { createSessionService } from "./modules/auth/session-service.js";
import { authPlugin } from "./plugins/auth.js";
import { registerErrorHandling } from "./plugins/error-handler.js";
import { apiV1Routes } from "./routes/api-v1.js";
import { healthRoutes } from "./routes/health.js";

export const REQUEST_ID_HEADER = "x-request-id";

export interface BuildAppOptions {
  env: Env;
  /**
   * Client Prisma (sem escopo) da infraestrutura. Quem cria é responsável por encerrá-lo.
   * Sem ele, só as rotas públicas (health) são registradas — útil em testes sem banco.
   */
  prisma?: PrismaClient;
  // Destino alternativo dos logs (usado em testes). Padrão: stdout.
  logStream?: NodeJS.WritableStream;
  /** Relógio injetável (testes de expiração de sessão). */
  now?: () => Date;
}

export function buildApp({ env, prisma, logStream, now }: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(logStream ? { stream: logStream } : {}),
      // Nunca registrar cookies/credenciais nos logs de requisição.
      redact: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
    },
    // Request ID sempre gerado pelo servidor: ainda não há proxy confiável
    // definido para propagar um ID externo (docs/architecture/observabilidade.md §3).
    requestIdHeader: false,
    logController: new LogController({ requestIdLogLabel: "requestId" }),
    genReqId: () => randomUUID(),
  });

  app.addHook("onSend", async (request, reply) => {
    reply.header(REQUEST_ID_HEADER, request.id);
  });

  registerErrorHandling(app);
  app.register(healthRoutes);

  if (prisma) {
    app.register(authPlugin, {
      prisma,
      sessionService: createSessionService(prisma, now),
      secureCookies: env.NODE_ENV === "production",
    });
    app.register(apiV1Routes, { prefix: "/api/v1" });
  }

  return app;
}
