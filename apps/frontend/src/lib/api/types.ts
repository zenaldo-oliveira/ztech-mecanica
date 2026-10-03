import type { Permission, Role } from "@ztech/validation";

// Contratos de resposta da API /api/v1 (espelham apps/backend). Dados públicos apenas.

export interface ApiErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}

export interface Me {
  user: { id: string; name: string; email: string; status: string; lastLoginAt: string | null };
  tenant: { id: string; legalName: string; tradeName: string | null; status: string };
  roles: Role[];
  permissions: Permission[];
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  status: "INVITED" | "ACTIVE" | "BLOCKED";
  roles: Role[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

export interface DataResponse<T> {
  data: T;
}
