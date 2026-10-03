import { z } from "zod";

// Schemas de autenticação compartilhados: o MESMO schema valida o formulário no
// frontend e a entrada da API no backend. Objetos estritos rejeitam campos extras.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** E-mail normalizado (sem espaços nas pontas, minúsculo) — igual ao armazenado no banco. */
export const emailSchema = z
  .string({ message: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail.")
  .max(254, "E-mail muito longo.")
  .pipe(z.email({ message: "Informe um e-mail válido." }));

export const newPasswordSchema = z
  .string({ message: "Informe a nova senha." })
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`);

export const loginInputSchema = z.strictObject({
  email: emailSchema,
  // No login não se aplica a política de tamanho (evita revelar regras); só limite de abuso.
  password: z.string({ message: "Informe a senha." }).min(1, "Informe a senha.").max(PASSWORD_MAX_LENGTH),
});

export const forgotPasswordInputSchema = z.strictObject({
  email: emailSchema,
});

export const resetPasswordInputSchema = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Link de redefinição inválido."),
  password: newPasswordSchema,
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
