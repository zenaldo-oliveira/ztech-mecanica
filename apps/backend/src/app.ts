import { randomUUID } from "node:crypto";

import Fastify, { LogController, type FastifyInstance } from "fastify";

import type { Env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";

export const REQUEST_ID_HEADER = "x-request-id";

export interface BuildAppOptions {
  env: Env;
  // Destino alternativo dos logs (usado em testes). Padrão: stdout.
  logStream?: NodeJS.WritableStream;
}

export function buildApp({ env, logStream }: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(logStream ? { stream: logStream } : {}),
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

  app.register(healthRoutes);

  return app;
}
