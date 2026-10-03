import type { FastifyInstance, FastifyRequest } from "fastify";

import { parseInput } from "../../lib/validation.js";
import { auditRequestInfo, requireAuth } from "../../plugins/auth.js";
import { listUsersQuerySchema, updateUserBodySchema, userIdParamsSchema } from "./users.schemas.js";
import { createUsersService } from "./users.service.js";

/** Rotas de usuários da oficina. Rota → validação Zod → serviço (regras) → client com escopo da oficina. */
export async function usersRoutes(app: FastifyInstance) {
  const usersServiceFor = (request: FastifyRequest) => {
    const auth = requireAuth(request);
    return createUsersService({
      db: auth.db,
      actorUserId: auth.userId,
      tenantId: auth.tenantId,
      request: auditRequestInfo(request),
      sessionService: app.sessionService,
    });
  };

  app.get(
    "/users",
    { preHandler: [app.authenticate, app.requirePermission("users.read")] },
    async (request) => usersServiceFor(request).list(parseInput(listUsersQuerySchema, request.query)),
  );

  app.get(
    "/users/:id",
    { preHandler: [app.authenticate, app.requirePermission("users.read")] },
    async (request) => {
      const { id } = parseInput(userIdParamsSchema, request.params);
      return { data: await usersServiceFor(request).get(id) };
    },
  );

  app.patch(
    "/users/:id",
    { preHandler: [app.authenticate, app.requirePermission("users.manage")] },
    async (request) => {
      const { id } = parseInput(userIdParamsSchema, request.params);
      const body = parseInput(updateUserBodySchema, request.body ?? {});
      return { data: await usersServiceFor(request).update(id, body) };
    },
  );

  app.delete(
    "/users/:id",
    { preHandler: [app.authenticate, app.requirePermission("users.manage")] },
    async (request, reply) => {
      const { id } = parseInput(userIdParamsSchema, request.params);
      await usersServiceFor(request).remove(id);
      return reply.status(204).send();
    },
  );
}
