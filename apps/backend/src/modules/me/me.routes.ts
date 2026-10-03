import type { FastifyInstance } from "fastify";

import { unauthorized } from "../../lib/errors.js";
import { requireAuth } from "../../plugins/auth.js";

/** Dados do usuário autenticado, da oficina da sessão e das permissões efetivas. */
export async function meRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const auth = requireAuth(request);

    const [user, tenant] = await Promise.all([
      auth.db.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, name: true, email: true, status: true, lastLoginAt: true },
      }),
      auth.db.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { id: true, legalName: true, tradeName: true, status: true },
      }),
    ]);
    // A sessão acabou de ser validada; ausência aqui significa remoção concorrente.
    if (!user || !tenant) throw unauthorized();

    return {
      data: {
        user,
        tenant,
        roles: [...auth.roles],
        permissions: [...auth.permissions].sort(),
      },
    };
  });
}
