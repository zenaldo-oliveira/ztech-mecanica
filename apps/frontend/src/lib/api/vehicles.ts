import { apiRequest } from "./client";
import type { DataResponse, Paginated } from "./types";

// Veículos da oficina da sessão (apps/backend/src/modules/vehicles). A oficina nunca é
// enviada: o backend a deriva da sessão. Contrato espelhado de vehicles.service.ts.

export type VehicleType = "CAR" | "MOTORCYCLE";

/** Resumo do proprietário devolvido junto com o veículo. */
export interface VehicleCustomerSummary {
  id: string;
  number: number;
  name: string;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  version: string | null;
  manufactureYear: number | null;
  modelYear: number | null;
  /** Maiúsculas, sem hífen (AAA9999 ou AAA9A99). */
  plate: string;
  chassisNumber: string | null;
  renavam: string | null;
  lastMileage: number | null;
  customer: VehicleCustomerSummary;
  createdAt: string;
  updatedAt: string;
}

/** Campos aceitos no cadastro. Textos vazios viram null no backend (limpeza de campo). */
export interface VehicleInput {
  customerId: string;
  type: VehicleType;
  brand: string;
  model: string;
  version?: string | null;
  manufactureYear?: number | null;
  modelYear?: number | null;
  plate: string;
  chassisNumber?: string | null;
  renavam?: string | null;
  lastMileage?: number | null;
}

/** Atualização parcial. Trocar `customerId` altera o proprietário (mesma oficina). */
export type VehicleUpdateInput = Partial<VehicleInput>;

export interface ListVehiclesParams {
  page?: number;
  pageSize?: number;
  /** Placa, marca ou modelo. */
  search?: string;
  customerId?: string;
  type?: VehicleType;
}

export function listVehicles(params: ListVehiclesParams = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.customerId) query.set("customerId", params.customerId);
  if (params.type) query.set("type", params.type);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<Paginated<Vehicle>>(`/vehicles${suffix}`, { signal });
}

export async function getVehicle(id: string, signal?: AbortSignal): Promise<Vehicle> {
  const response = await apiRequest<DataResponse<Vehicle>>(`/vehicles/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function createVehicle(body: VehicleInput): Promise<Vehicle> {
  const response = await apiRequest<DataResponse<Vehicle>>("/vehicles", { method: "POST", body });
  return response.data;
}

export async function updateVehicle(id: string, body: VehicleUpdateInput): Promise<Vehicle> {
  const response = await apiRequest<DataResponse<Vehicle>>(`/vehicles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  return response.data;
}

/** Exclusão FÍSICA. O backend recusa (409) veículo com histórico vinculado. */
export async function deleteVehicle(id: string): Promise<void> {
  await apiRequest<void>(`/vehicles/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export const vehicleTypeLabels: Record<VehicleType, string> = { CAR: "Carro", MOTORCYCLE: "Moto" };

export function formatMileage(mileage: number | null): string {
  return mileage === null ? "—" : `${mileage.toLocaleString("pt-BR")} km`;
}
