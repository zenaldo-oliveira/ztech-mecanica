/** Erro de aplicação com status HTTP e código estável para o cliente. Mensagens nunca expõem detalhes internos. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const unauthorized = (message = "Autenticação necessária.") => new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Você não tem permissão para executar esta ação.") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Recurso não encontrado.") => new AppError(404, "NOT_FOUND", message);

export const conflict = (message: string) => new AppError(409, "CONFLICT", message);

export const validationError = (details: unknown) =>
  new AppError(400, "VALIDATION_ERROR", "Dados inválidos.", details);

export interface ErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}
