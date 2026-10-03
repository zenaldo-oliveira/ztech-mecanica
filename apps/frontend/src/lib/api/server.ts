import { cookies } from "next/headers";

import { apiErrorFromResponse } from "./errors";
import type { DataResponse, Me } from "./types";

// SOMENTE para Server Components/layouts (usa cookies() do request). Não importar em
// componentes "use client".

export const SESSION_COOKIE_NAME = "ztech_session";
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3333";

/**
 * Valida a sessão do request atual no backend (autoridade final).
 * Retorna null quando não há sessão válida; lança em erro inesperado do backend.
 */
export async function getServerSession(): Promise<Me | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session?.value) return null;

  const response = await fetch(`${API_INTERNAL_URL}/api/v1/me`, {
    headers: { Accept: "application/json", Cookie: `${SESSION_COOKIE_NAME}=${session.value}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw apiErrorFromResponse(response.status, body);
  return (body as DataResponse<Me>).data;
}

/** Aceita apenas caminhos internos (evita open redirect em ?next=). */
export function safeNextPath(next: string | string[] | undefined, fallback = "/dashboard"): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/api")) return fallback;
  return value;
}
