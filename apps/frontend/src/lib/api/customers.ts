import { apiRequest } from "./client";
import type { DataResponse, Paginated } from "./types";

// Clientes da oficina da sessão (apps/backend/src/modules/customers). A oficina nunca é
// enviada: o backend a deriva da sessão. Contrato espelhado de customers.service.ts.

export type PersonType = "INDIVIDUAL" | "BUSINESS";
export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type ContactPreference = "WHATSAPP" | "EMAIL" | "PHONE" | "NONE";

export interface CustomerAddress {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export interface Customer {
  id: string;
  /** Número sequencial na oficina (exibido como CLI-000001). */
  number: number;
  personType: PersonType;
  name: string;
  tradeName: string | null;
  /** Somente dígitos (CPF ou CNPJ). */
  document: string;
  status: CustomerStatus;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  secondaryPhone: string | null;
  secondaryEmail: string | null;
  address: CustomerAddress;
  contactPreference: ContactPreference;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos aceitos no cadastro. Textos vazios viram null no backend (limpeza de campo). */
export interface CustomerInput {
  personType: PersonType;
  name: string;
  tradeName?: string | null;
  document: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  secondaryPhone?: string | null;
  secondaryEmail?: string | null;
  address?: Partial<Record<keyof CustomerAddress, string | null>>;
  contactPreference: ContactPreference;
  notes?: string | null;
}

/** Atualização parcial: só os campos enviados mudam. `status` só existe na edição. */
export type CustomerUpdateInput = Partial<CustomerInput> & { status?: CustomerStatus };

export interface ListCustomersParams {
  page?: number;
  pageSize?: number;
  /** Nome, nome fantasia ou documento. */
  search?: string;
  status?: CustomerStatus;
  personType?: PersonType;
}

export function listCustomers(params: ListCustomersParams = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status) query.set("status", params.status);
  if (params.personType) query.set("personType", params.personType);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<Paginated<Customer>>(`/customers${suffix}`, { signal });
}

export async function getCustomer(id: string, signal?: AbortSignal): Promise<Customer> {
  const response = await apiRequest<DataResponse<Customer>>(`/customers/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function createCustomer(body: CustomerInput): Promise<Customer> {
  const response = await apiRequest<DataResponse<Customer>>("/customers", { method: "POST", body });
  return response.data;
}

export async function updateCustomer(id: string, body: CustomerUpdateInput): Promise<Customer> {
  const response = await apiRequest<DataResponse<Customer>>(`/customers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  return response.data;
}

/** Inativação (exclusão LÓGICA): o cliente passa a INACTIVE e o histórico é preservado. */
export async function deactivateCustomer(id: string): Promise<void> {
  await apiRequest<void>(`/customers/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Código exibido ao usuário a partir do número sequencial (ex.: 7 → CLI-000007). */
export function customerCode(number: number): string {
  return `CLI-${String(number).padStart(6, "0")}`;
}
