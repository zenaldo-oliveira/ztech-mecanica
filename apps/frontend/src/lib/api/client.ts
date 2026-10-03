import { apiErrorFromResponse, networkError } from "./errors";

/**
 * Cliente HTTP do navegador para /api/v1 (mesma origem; o Next repassa ao backend).
 *
 * - A sessão viaja somente no cookie HttpOnly, enviado automaticamente pelo navegador.
 *   Nenhum token é lido, guardado (localStorage/sessionStorage) ou colocado em URL.
 * - Erros viram ApiError com código estável.
 * - 401 em rota protegida = sessão inválida/expirada: redireciona para /login.
 */
const API_BASE = "/api/v1";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Não redirecionar para /login em 401 (ex.: tela de login, logout). */
  skipAuthRedirect?: boolean;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname === "/login") return;
  const next = encodeURIComponent(`${pathname}${search}`);
  // Recarga completa de propósito: descarta todo o estado do cliente da sessão inválida.
  // replace() não deixa a página quebrada no histórico.
  window.location.replace(`/login?next=${next}`);
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, skipAuthRedirect = false } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw networkError();
  }

  const payload = await parseBody(response);
  if (response.ok) return payload as T;

  if (response.status === 401 && !skipAuthRedirect) redirectToLogin();
  throw apiErrorFromResponse(response.status, payload);
}
