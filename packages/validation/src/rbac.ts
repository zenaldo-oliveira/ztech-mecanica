// Catálogo de papéis e permissões do ZTECH OFICINA — fonte única de verdade.
// O banco é sincronizado a partir daqui (apps/backend/src/modules/rbac/catalog-sync.ts).
// A autorização sempre verifica PERMISSÕES (recurso.ação), nunca o nome do papel.

export const PERMISSIONS = {
  "customers.read": "Ver clientes",
  "customers.create": "Cadastrar clientes",
  "customers.update": "Editar clientes",
  "customers.delete": "Excluir clientes",
  "customers.view_history": "Ver histórico do cliente",
  "customers.manage_contacts": "Gerenciar contatos do cliente",
  "vehicles.read": "Ver veículos",
  "vehicles.create": "Cadastrar veículos",
  "vehicles.update": "Editar veículos",
  "vehicles.delete": "Excluir veículos",
  "services.read": "Ver serviços",
  "services.create": "Cadastrar serviços",
  "services.update": "Editar serviços",
  "services.deactivate": "Inativar serviços",
  "services.manage_prices": "Alterar preços de serviços",
  "services.manage_fiscal": "Alterar dados fiscais de serviços",
  "products.read": "Ver produtos",
  "products.create": "Cadastrar produtos",
  "products.update": "Editar produtos",
  "products.deactivate": "Inativar produtos",
  "products.view_cost": "Ver custo de produtos",
  "products.manage_prices": "Alterar preços de produtos",
  "products.manage_fiscal": "Alterar dados fiscais de produtos",
  "quotes.read": "Ver orçamentos",
  "quotes.create": "Criar orçamentos",
  "quotes.update": "Editar orçamentos",
  "quotes.send": "Enviar orçamentos",
  "quotes.approve": "Registrar aprovação de orçamentos",
  "quotes.reject": "Registrar rejeição de orçamentos",
  "quotes.cancel": "Cancelar orçamentos",
  "quotes.convert": "Converter orçamento em OS",
  "quotes.edit_prices": "Alterar preços em orçamentos",
  "quotes.apply_discount": "Aplicar desconto em orçamentos",
  "quotes.view_cost": "Ver custos em orçamentos",
  "quotes.print": "Imprimir orçamentos",
  "work_orders.read": "Ver ordens de serviço",
  "work_orders.create": "Abrir ordens de serviço",
  "work_orders.update": "Editar ordens de serviço",
  "work_orders.change_status": "Alterar status de OS",
  "work_orders.register_approval": "Registrar aprovação do cliente na OS",
  "work_orders.complete": "Concluir OS",
  "work_orders.reopen": "Reabrir OS",
  "work_orders.close": "Finalizar OS",
  "work_orders.cancel": "Cancelar OS",
  "work_orders.assign": "Atribuir responsável da OS",
  "work_orders.edit_prices": "Alterar preços na OS",
  "work_orders.apply_discount": "Aplicar desconto na OS",
  "work_orders.view_cost": "Ver custos na OS",
  "work_orders.print": "Imprimir OS",
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
 * Matriz papel × permissão aprovada (Prompt 04B, opção A) — registrada em
 * docs/architecture/autorizacao.md §5. Alterar aqui e sincronizar o catálogo atualiza
 * todas as oficinas.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MANAGER: [
    "customers.read", "customers.create", "customers.update", "customers.delete",
    "customers.view_history", "customers.manage_contacts",
    "vehicles.read", "vehicles.create", "vehicles.update", "vehicles.delete",
    "services.read", "services.create", "services.update", "services.deactivate",
    "services.manage_prices", "services.manage_fiscal",
    "products.read", "products.create", "products.update", "products.deactivate",
    "products.view_cost", "products.manage_prices", "products.manage_fiscal",
    "quotes.read", "quotes.create", "quotes.update", "quotes.send", "quotes.approve", "quotes.reject",
    "quotes.cancel", "quotes.convert", "quotes.edit_prices", "quotes.apply_discount", "quotes.view_cost",
    "quotes.print",
    "work_orders.read", "work_orders.create", "work_orders.update", "work_orders.change_status",
    "work_orders.register_approval", "work_orders.complete", "work_orders.reopen", "work_orders.cancel",
    "work_orders.assign", "work_orders.edit_prices", "work_orders.apply_discount", "work_orders.view_cost",
    "work_orders.print",
    "financial.read", "financial.create", "financial.update",
    "fiscal.read", "fiscal.issue",
    "users.read", "audit.read",
  ],
  ATTENDANT: [
    "customers.read", "customers.create", "customers.update", "customers.view_history", "customers.manage_contacts",
    "vehicles.read", "vehicles.create", "vehicles.update",
    "services.read",
    "products.read",
    "quotes.read", "quotes.create", "quotes.update", "quotes.send", "quotes.approve", "quotes.reject",
    "quotes.convert", "quotes.print",
    "work_orders.read", "work_orders.create", "work_orders.update", "work_orders.change_status",
    "work_orders.register_approval", "work_orders.assign", "work_orders.print",
  ],
  MECHANIC: [
    "customers.read", "vehicles.read", "services.read", "products.read",
    "work_orders.read", "work_orders.update", "work_orders.change_status", "work_orders.complete",
  ],
  FINANCIAL: [
    "customers.read", "services.read", "products.read", "products.view_cost", "quotes.read",
    "work_orders.read", "work_orders.close", "work_orders.print",
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
