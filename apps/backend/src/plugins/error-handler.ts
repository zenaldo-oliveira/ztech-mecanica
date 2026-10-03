import type { FastifyError, FastifyInstance } from "fastify";

import { TenantScopeViolationError } from "../db/tenant-scope.js";
import { AppError, type ErrorBody } from "../lib/errors.js";

const CLIENT_ERROR_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "TOO_MANY_REQUESTS",
};

function isPrismaNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2025";
}

/**
 * Tratamento centralizado de erros (docs/architecture/seguranca.md, decisão 14).
 * Respostas sempre no formato { error: { code, message, requestId } }; detalhes internos
 * (stack, SQL, mensagens do Prisma) ficam apenas no log.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = String(request.id);
    const send = (statusCode: number, code: string, message: string, details?: unknown) => {
      const body: ErrorBody = { error: { code, message, requestId, ...(details === undefined ? {} : { details }) } };
      return reply.status(statusCode).send(body);
    };

    if (error instanceof AppError) {
      if (error.statusCode >= 500) request.log.error({ err: error }, "erro de aplicação");
      return send(error.statusCode, error.code, error.message, error.details);
    }

    if (error instanceof TenantScopeViolationError) {
      // Bug de programação: nunca deveria ocorrer em produção. Registrado com destaque.
      request.log.error({ err: error }, "violação do escopo de tenant bloqueada");
      return send(500, "INTERNAL_ERROR", "Erro interno.");
    }

    if (isPrismaNotFound(error)) return send(404, "NOT_FOUND", "Recurso não encontrado.");

    const statusCode = error.statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return send(statusCode, CLIENT_ERROR_CODES[statusCode] ?? "BAD_REQUEST", "Requisição inválida.");
    }

    request.log.error({ err: error }, "erro não tratado");
    return send(500, "INTERNAL_ERROR", "Erro interno.");
  });

  app.setNotFoundHandler((request, reply) => {
    const body: ErrorBody = {
      error: { code: "ROUTE_NOT_FOUND", message: "Rota não encontrada.", requestId: String(request.id) },
    };
    return reply.status(404).send(body);
  });
}
