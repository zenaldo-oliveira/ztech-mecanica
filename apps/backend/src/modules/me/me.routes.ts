import type { FastifyInstance } from "fastify";

import { unauthorized } from "../../lib/errors.js";
import { requireAuth } from "../../plugins/auth.js";
import { loadMeView } from "./me.service.js";

/** Dados do usuário autenticado, da oficina da sessão e das permissões efetivas. */
export async function meRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const auth = requireAuth(request);
    const me = await loadMeView(auth.db, auth.userId, auth.roles, auth.permissions);
    // A sessão acabou de ser validada; ausência aqui significa remoção concorrente.
    if (!me) throw unauthorized();
    return { data: me };
  });
}
