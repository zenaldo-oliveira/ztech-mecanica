import type { ApiErrorBody } from "./types";

/** Erro padronizado da API. `code` é estável; `message` já é segura para exibir. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, requestId?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false;
  const error = (value as { error?: unknown }).error;
  return Boolean(error) && typeof (error as { code?: unknown }).code === "string";
}

export function apiErrorFromResponse(status: number, body: unknown): ApiError {
  if (isErrorBody(body)) {
    const { code, message, requestId, details } = body.error;
    return new ApiError(status, code, message, requestId, details);
  }
  return new ApiError(status, "UNEXPECTED_RESPONSE", "Resposta inesperada do servidor.");
}

export const networkError = () =>
  new ApiError(0, "NETWORK_ERROR", "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");

/** Mensagem amigável para exibir ao usuário a partir de qualquer erro. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status >= 500) return "Ocorreu um erro no servidor. Tente novamente em instantes.";
    return error.message;
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}
