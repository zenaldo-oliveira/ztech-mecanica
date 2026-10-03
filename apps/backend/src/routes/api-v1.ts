import type { FastifyInstance } from "fastify";

import { meRoutes } from "../modules/me/me.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";

/** API versionada (ADR-001 decisão 9). Registrada com prefixo /api/v1. */
export async function apiV1Routes(app: FastifyInstance) {
  await app.register(meRoutes);
  await app.register(usersRoutes);
}
