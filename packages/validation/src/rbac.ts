// Catálogo de papéis e permissões do ZTECH OFICINA — fonte única de verdade.
// O banco é sincronizado a partir daqui (apps/backend/src/modules/rbac/catalog-sync.ts).
// A autorização sempre verifica PERMISSÕES (recurso.ação), nunca o nome do papel.

export const PERMISSIONS = {
  "customers.read": "Ver clientes",
  "customers.create": "Cadastrar clientes",
  "customers.update": "Editar clientes",
  "customers.delete": "Excluir clientes",
  "vehicles.read": "Ver veículos",
  "vehicles.create": "Cadastrar veículos",
  "vehicles.update": "Editar veículos",
  "vehicles.delete": "Excluir veículos",
  "quotes.read": "Ver orçamentos",
  "quotes.create": "Criar orçamentos",
  "quotes.update": "Editar orçamentos",
  "quotes.delete": "Excluir orçamentos",
  "work_orders.read": "Ver ordens de serviço",
  "work_orders.create": "Abrir ordens de serviço",
  "work_orders.update": "Editar ordens de serviço",
  "work_orders.delete": "Excluir ordens de serviço",
  "financial.read": "Ver financeiro",
  "financial.create": "Lançar no financeiro",
  "financial.update": "Editar lançamentos financeiros",
  "fiscal.read": "Ver documentos fiscais",
  "fiscal.issue": "Emitir documentos fiscais",
  "users.read": "Ver usuários da oficina",
  "users.manage": "Gerenciar usuários e papéis",
  "settings.manage": "Gerenciar configurações da oficina",
  "audit.read": "Ver registros de auditoria",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as Permission[];

export const ROLES = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  ATTENDANT: "Atendente",
  MECHANIC: "Mecânico",
  FINANCIAL: "Financeiro",
  VIEWER: "Somente leitura",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_KEYS = Object.keys(ROLES) as Role[];

const ALL = PERMISSION_KEYS;
const READ_ONLY = PERMISSION_KEYS.filter((key) => key.endsWith(".read") && key !== "audit.read" && key !== "users.read");

/**
 * Matriz padrão papel × permissão (proposta aprovada na auditoria da Fase 0).
 * Pode evoluir: alterar aqui e sincronizar o catálogo atualiza todas as oficinas.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MANAGER: [
    "customers.read", "customers.create", "customers.update", "customers.delete",
    "vehicles.read", "vehicles.create", "vehicles.update", "vehicles.delete",
    "quotes.read", "quotes.create", "quotes.update", "quotes.delete",
    "work_orders.read", "work_orders.create", "work_orders.update", "work_orders.delete",
    "financial.read", "fiscal.read", "users.read", "audit.read",
  ],
  ATTENDANT: [
    "customers.read", "customers.create", "customers.update",
    "vehicles.read", "vehicles.create", "vehicles.update",
    "quotes.read", "quotes.create", "quotes.update",
    "work_orders.read", "work_orders.create", "work_orders.update",
  ],
  MECHANIC: ["customers.read", "vehicles.read", "work_orders.read", "work_orders.update"],
  FINANCIAL: [
    "customers.read", "quotes.read", "work_orders.read",
    "financial.read", "financial.create", "financial.update",
    "fiscal.read", "fiscal.issue",
  ],
  VIEWER: READ_ONLY,
};

export function isPermission(value: string): value is Permission {
  return Object.hasOwn(PERMISSIONS, value);
}

export function isRole(value: string): value is Role {
  return Object.hasOwn(ROLES, value);
}
