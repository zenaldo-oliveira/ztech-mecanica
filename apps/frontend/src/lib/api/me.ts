import { apiRequest } from "./client";
import type { DataResponse, Me } from "./types";

/** Sessão atual vista pelo navegador. 401 redireciona para /login. */
export async function getMe(signal?: AbortSignal): Promise<Me> {
  const response = await apiRequest<DataResponse<Me>>("/me", { signal });
  return response.data;
}
