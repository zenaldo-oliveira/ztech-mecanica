import type { FastifyInstance, FastifyRequest } from "fastify";

import { parseInput } from "../../lib/validation.js";
import { auditRequestInfo, requireAuth } from "../../plugins/auth.js";
import {
  createVehicleBodySchema,
  listVehiclesQuerySchema,
  updateVehicleBodySchema,
  vehicleIdParamsSchema,
} from "./vehicles.schemas.js";
import { createVehiclesService } from "./vehicles.service.js";

/** Rotas de veículos. Rota → validação Zod → serviço (regras) → client com escopo da oficina. */
export async function vehiclesRoutes(app: FastifyInstance) {
  const vehiclesServiceFor = (request: FastifyRequest) => {
    const auth = requireAuth(request);
    return createVehiclesService({
      db: auth.db,
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      request: auditRequestInfo(request),
    });
  };

  app.get(
    "/vehicles",
    { preHandler: [app.authenticate, app.requirePermission("vehicles.read")] },
    async (request) => vehiclesServiceFor(request).list(parseInput(listVehiclesQuerySchema, request.query)),
  );

  app.get(
    "/vehicles/:id",
    { preHandler: [app.authenticate, app.requirePermission("vehicles.read")] },
    async (request) => {
      const { id } = parseInput(vehicleIdParamsSchema, request.params);
      return { data: await vehiclesServiceFor(request).get(id) };
    },
  );

  app.post(
    "/vehicles",
    { preHandler: [app.authenticate, app.requirePermission("vehicles.create")] },
    async (request, reply) => {
      const body = parseInput(createVehicleBodySchema, request.body ?? {});
      const vehicle = await vehiclesServiceFor(request).create(body);
      return reply.status(201).send({ data: vehicle });
    },
  );

  app.patch(
    "/vehicles/:id",
    { preHandler: [app.authenticate, app.requirePermission("vehicles.update")] },
    async (request) => {
      const { id } = parseInput(vehicleIdParamsSchema, request.params);
      const body = parseInput(updateVehicleBodySchema, request.body ?? {});
      return { data: await vehiclesServiceFor(request).update(id, body) };
    },
  );

  // Exclusão física (decisão V1) — docs/modules/veiculos.md.
  app.delete(
    "/vehicles/:id",
    { preHandler: [app.authenticate, app.requirePermission("vehicles.delete")] },
    async (request, reply) => {
      const { id } = parseInput(vehicleIdParamsSchema, request.params);
      await vehiclesServiceFor(request).remove(id);
      return reply.status(204).send();
    },
  );
}
