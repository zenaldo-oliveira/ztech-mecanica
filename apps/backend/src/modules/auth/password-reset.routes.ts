import { forgotPasswordInputSchema, resetPasswordInputSchema } from "@ztech/validation";
import type { FastifyInstance } from "fastify";

import { parseInput } from "../../lib/validation.js";
import { auditRequestInfo } from "../../plugins/auth.js";
import { createPasswordResetService } from "./password-reset.service.js";

const FORGOT_RESPONSE = {
  data: { message: "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha." },
};

/** Recuperação de senha. Rotas públicas. */
export async function passwordResetRoutes(app: FastifyInstance) {
  const service = createPasswordResetService({
    prisma: app.prisma,
    emailProvider: app.emailProvider,
    appUrl: app.appUrl,
    log: app.log,
    now: app.now,
  });

  // Resposta idêntica exista ou não a conta.
  app.post("/auth/password/forgot", async (request, reply) => {
    const { email } = parseInput(forgotPasswordInputSchema, request.body ?? {});
    await service.requestReset(email, auditRequestInfo(request));
    return reply.status(202).send(FORGOT_RESPONSE);
  });

  app.post("/auth/password/reset", async (request, reply) => {
    const { token, password } = parseInput(resetPasswordInputSchema, request.body ?? {});
    await service.resetPassword(token, password, auditRequestInfo(request));
    return reply.status(204).send();
  });
}
