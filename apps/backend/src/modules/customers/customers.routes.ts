import type { FastifyInstance, FastifyRequest } from "fastify";

import { parseInput } from "../../lib/validation.js";
import { auditRequestInfo, requireAuth } from "../../plugins/auth.js";
import {
  createCustomerBodySchema,
  customerIdParamsSchema,
  listCustomersQuerySchema,
  updateCustomerBodySchema,
} from "./customers.schemas.js";
import { createCustomersService } from "./customers.service.js";

/** Rotas de clientes. Rota → validação Zod → serviço (regras) → client com escopo da oficina. */
export async function customersRoutes(app: FastifyInstance) {
  const customersServiceFor = (request: FastifyRequest) => {
    const auth = requireAuth(request);
    return createCustomersService({
      db: auth.db,
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      request: auditRequestInfo(request),
    });
  };

  app.get(
    "/customers",
    { preHandler: [app.authenticate, app.requirePermission("customers.read")] },
    async (request) => customersServiceFor(request).list(parseInput(listCustomersQuerySchema, request.query)),
  );

  app.get(
    "/customers/:id",
    { preHandler: [app.authenticate, app.requirePermission("customers.read")] },
    async (request) => {
      const { id } = parseInput(customerIdParamsSchema, request.params);
      return { data: await customersServiceFor(request).get(id) };
    },
  );

  app.post(
    "/customers",
    { preHandler: [app.authenticate, app.requirePermission("customers.create")] },
    async (request, reply) => {
      const body = parseInput(createCustomerBodySchema, request.body ?? {});
      const customer = await customersServiceFor(request).create(body);
      return reply.status(201).send({ data: customer });
    },
  );

  app.patch(
    "/customers/:id",
    { preHandler: [app.authenticate, app.requirePermission("customers.update")] },
    async (request) => {
      const { id } = parseInput(customerIdParamsSchema, request.params);
      const body = parseInput(updateCustomerBodySchema, request.body ?? {});
      return { data: await customersServiceFor(request).update(id, body) };
    },
  );

  // Exclusão lógica (status INACTIVE) — docs/modules/clientes.md §14.
  app.delete(
    "/customers/:id",
    { preHandler: [app.authenticate, app.requirePermission("customers.delete")] },
    async (request, reply) => {
      const { id } = parseInput(customerIdParamsSchema, request.params);
      await customersServiceFor(request).remove(id);
      return reply.status(204).send();
    },
  );
}
