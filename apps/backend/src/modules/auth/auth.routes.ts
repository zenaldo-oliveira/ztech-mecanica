import { loginInputSchema } from "@ztech/validation";
import type { FastifyInstance } from "fastify";

import { parseInput } from "../../lib/validation.js";
import { auditRequestInfo, SESSION_COOKIE_NAME } from "../../plugins/auth.js";
import { createAuthService } from "./auth.service.js";

/** Login e logout. Rotas públicas: a sessão é criada/encerrada aqui. */
export async function authRoutes(app: FastifyInstance) {
  const authService = createAuthService({ prisma: app.prisma, sessionService: app.sessionService, now: app.now });

  app.post("/auth/login", async (request, reply) => {
    const input = parseInput(loginInputSchema, request.body ?? {});
    const { token, me } = await authService.login(
      input,
      auditRequestInfo(request),
      request.cookies[SESSION_COOKIE_NAME],
    );
    // O token só existe no Set-Cookie (HttpOnly): nunca no corpo da resposta.
    reply.setCookie(SESSION_COOKIE_NAME, token, app.sessionCookieOptions);
    return { data: me };
  });

  app.post("/auth/logout", async (request, reply) => {
    await authService.logout(request.cookies[SESSION_COOKIE_NAME], auditRequestInfo(request));
    reply.clearCookie(SESSION_COOKIE_NAME, app.sessionCookieOptions);
    return reply.status(204).send();
  });
}
