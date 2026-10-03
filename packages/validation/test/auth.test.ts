import { describe, expect, it } from "vitest";

import { forgotPasswordInputSchema, loginInputSchema, resetPasswordInputSchema } from "../src/auth.js";

describe("schemas de autenticação", () => {
  it("normaliza o e-mail do login", () => {
    const parsed = loginInputSchema.parse({ email: "  Dono@Oficina.TEST ", password: "x" });
    expect(parsed.email).toBe("dono@oficina.test");
  });

  it("rejeita campos extras (ex.: tenantId)", () => {
    expect(loginInputSchema.safeParse({ email: "a@b.test", password: "x", tenantId: "t" }).success).toBe(false);
    expect(forgotPasswordInputSchema.safeParse({ email: "a@b.test", tenantId: "t" }).success).toBe(false);
  });

  it("exige senha nova com tamanho mínimo e token no formato esperado", () => {
    const token = "A".repeat(43);
    expect(resetPasswordInputSchema.safeParse({ token, password: "curta" }).success).toBe(false);
    expect(resetPasswordInputSchema.safeParse({ token: "invalido", password: "senha-bem-longa" }).success).toBe(false);
    expect(resetPasswordInputSchema.safeParse({ token, password: "senha-bem-longa" }).success).toBe(true);
  });
});
