import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@ztech/validation";

import { apiRequest } from "./client";
import type { DataResponse, Me } from "./types";

// Rotas públicas: 401 aqui é resposta de negócio (credenciais), não sessão expirada.

export async function login(input: LoginInput): Promise<Me> {
  const response = await apiRequest<DataResponse<Me>>("/auth/login", { method: "POST", body: input, skipAuthRedirect: true });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout", { method: "POST", skipAuthRedirect: true });
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<string> {
  const response = await apiRequest<DataResponse<{ message: string }>>("/auth/password/forgot", {
    method: "POST",
    body: input,
    skipAuthRedirect: true,
  });
  return response.data.message;
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiRequest<void>("/auth/password/reset", { method: "POST", body: input, skipAuthRedirect: true });
}
