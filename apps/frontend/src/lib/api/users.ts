import { apiRequest } from "./client";
import type { DataResponse, Paginated, PublicUser } from "./types";

// Usuários da oficina da sessão. A oficina nunca é enviada: o backend a deriva da sessão.

export function listUsers(params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<Paginated<PublicUser>>(`/users${suffix}`, { signal });
}

export async function getUser(id: string, signal?: AbortSignal): Promise<PublicUser> {
  const response = await apiRequest<DataResponse<PublicUser>>(`/users/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function updateUser(
  id: string,
  body: { name?: string; status?: "ACTIVE" | "BLOCKED" },
): Promise<PublicUser> {
  const response = await apiRequest<DataResponse<PublicUser>>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}
