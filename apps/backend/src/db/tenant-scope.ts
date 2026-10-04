import type { PrismaClient } from "./client.js";

/**
 * Isolamento multi-tenant na camada de dados (docs/architecture/multi-tenant.md §3).
 *
 * `scopeToTenant(prisma, tenantId)` devolve um client que:
 * - acrescenta `tenantId` ao `where` de toda leitura/alteração/exclusão de modelo da oficina;
 * - grava `tenantId` em toda criação;
 * - REJEITA (não corrige silenciosamente) `tenantId` divergente em where/data, `tenantId`
 *   em dados de alteração e conexões via relação `tenant`;
 * - restringe o modelo Tenant à própria oficina (somente leitura/alteração);
 * - permite apenas leitura dos catálogos globais (papéis/permissões);
 * - bloqueia PlatformUser (equipe ZTech nunca é acessada por código de oficina).
 *
 * O `tenantId` vem SEMPRE da sessão autenticada — nunca de input do cliente.
 * Código de domínio recebe somente este client; o PrismaClient sem escopo fica restrito
 * à infraestrutura (autenticação, seed, jobs da plataforma).
 *
 * Relações aninhadas (include/select/where/orderBy/data) não recebem `tenantId`: entre
 * modelos da oficina, as FKs compostas (tenant_id, …) garantem que pai e filho sejam da
 * mesma oficina. O que o escopo verifica é a saída pelos catálogos globais (sem tenant_id):
 * a partir deles, nenhuma relação pode voltar a dados de oficina (ex.: Role.userRoles), e
 * escrita aninhada em catálogo só pode vincular (`connect`) — ver `assertSafeRelations`.
 * Transações: abrir sempre a partir deste client (`db.$transaction(...)`); o escopo vale
 * dentro delas. SQL bruto ($queryRaw/$executeRaw) não passa por aqui e é proibido em
 * código de domínio.
 */

/** Modelos que pertencem a uma oficina (possuem coluna tenant_id). */
const TENANT_OWNED_MODELS = new Set([
  "User",
  "Session",
  "UserRole",
  "AuditLog",
  "PasswordResetToken",
  "TenantSettings",
  "TenantSequence",
]);
/** Catálogos globais: leitura permitida, escrita apenas pela infraestrutura. */
const GLOBAL_READONLY_MODELS = new Set(["Role", "Permission", "RolePermission"]);
/** Modelos inacessíveis para código de oficina. */
const FORBIDDEN_MODELS = new Set(["PlatformUser"]);

/**
 * Campos de relação de cada modelo → modelo de destino (espelho do schema.prisma).
 * Usado para seguir relações aninhadas. Um teste compara este mapa com o schema:
 * modelo ou relação nova exige atualizar aqui.
 */
export const MODEL_RELATIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  Tenant: {
    users: "User",
    sessions: "Session",
    userRoles: "UserRole",
    auditLogs: "AuditLog",
    passwordResetTokens: "PasswordResetToken",
    settings: "TenantSettings",
    sequences: "TenantSequence",
  },
  TenantSettings: { tenant: "Tenant" },
  TenantSequence: { tenant: "Tenant" },
  User: { tenant: "Tenant", roles: "UserRole", sessions: "Session", passwordResetTokens: "PasswordResetToken" },
  Session: { tenant: "Tenant", user: "User" },
  PasswordResetToken: { tenant: "Tenant", user: "User" },
  Role: { permissions: "RolePermission", userRoles: "UserRole" },
  Permission: { roles: "RolePermission" },
  RolePermission: { role: "Role", permission: "Permission" },
  UserRole: { tenant: "Tenant", user: "User", role: "Role" },
  PlatformUser: {},
  AuditLog: { tenant: "Tenant" },
};

const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);
const WHERE_WRITE_OPERATIONS = new Set(["update", "updateMany", "updateManyAndReturn", "delete", "deleteMany"]);
const CREATE_OPERATIONS = new Set(["create", "createMany", "createManyAndReturn"]);

export class TenantScopeViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantScopeViolationError";
  }
}

type Args = Record<string, unknown>;
type Data = Record<string, unknown>;

function asRecord(value: unknown): Args {
  return value && typeof value === "object" ? (value as Args) : {};
}

function scopedWhere(model: string, where: unknown, tenantId: string): Args {
  const current = asRecord(where);
  if ("tenantId" in current && current.tenantId !== tenantId) {
    throw new TenantScopeViolationError(`${model}: filtro por tenantId de outra oficina não é permitido.`);
  }
  return { ...current, tenantId };
}

function assertNoTenantChange(model: string, data: unknown): void {
  const current = asRecord(data);
  if ("tenantId" in current || "tenant" in current) {
    throw new TenantScopeViolationError(`${model}: a oficina de um registro não pode ser alterada.`);
  }
}

function withTenantData(model: string, data: unknown, tenantId: string): Data {
  const current = asRecord(data);
  if ("tenant" in current) {
    throw new TenantScopeViolationError(`${model}: use o escopo da oficina, não a relação tenant.`);
  }
  if ("tenantId" in current && current.tenantId !== tenantId) {
    throw new TenantScopeViolationError(`${model}: não é permitido criar registro em outra oficina.`);
  }
  return { ...current, tenantId };
}

function scopeTenantOwnedArgs(model: string, operation: string, args: Args, tenantId: string): Args {
  if (READ_OPERATIONS.has(operation)) {
    return { ...args, where: scopedWhere(model, args.where, tenantId) };
  }
  if (WHERE_WRITE_OPERATIONS.has(operation)) {
    if ("data" in args) assertNoTenantChange(model, args.data);
    return { ...args, where: scopedWhere(model, args.where, tenantId) };
  }
  if (CREATE_OPERATIONS.has(operation)) {
    const data = Array.isArray(args.data)
      ? args.data.map((item) => withTenantData(model, item, tenantId))
      : withTenantData(model, args.data, tenantId);
    return { ...args, data };
  }
  if (operation === "upsert") {
    assertNoTenantChange(model, args.update);
    return {
      ...args,
      where: scopedWhere(model, args.where, tenantId),
      create: withTenantData(model, args.create, tenantId),
    };
  }
  throw new TenantScopeViolationError(`${model}.${operation} não é suportado no escopo da oficina.`);
}

function scopeTenantModelArgs(operation: string, args: Args, tenantId: string): Args {
  const where = { ...asRecord(args.where), id: tenantId };
  if ("id" in asRecord(args.where) && asRecord(args.where).id !== tenantId) {
    throw new TenantScopeViolationError("Tenant: acesso a outra oficina não é permitido.");
  }
  if (READ_OPERATIONS.has(operation)) return { ...args, where };
  if (operation === "update") {
    assertNoTenantChange("Tenant", args.data);
    return { ...args, where };
  }
  throw new TenantScopeViolationError(`Tenant.${operation} não é permitido no escopo da oficina.`);
}

// ---------------------------------------------------------------------------
// Relações aninhadas: nenhuma passagem de catálogo global para dados de oficina
// ---------------------------------------------------------------------------

const LOGICAL_FILTER_KEYS = new Set(["AND", "OR", "NOT"]);
const RELATION_FILTER_KEYS = ["some", "every", "none", "is", "isNot"];

const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

/** Modelo de destino de `model.field`, ou undefined se não for relação. Bloqueia catálogo → oficina. */
function relationTarget(model: string, field: string): string | undefined {
  const target = MODEL_RELATIONS[model]?.[field];
  if (target && GLOBAL_READONLY_MODELS.has(model) && !GLOBAL_READONLY_MODELS.has(target)) {
    throw new TenantScopeViolationError(`${model}.${field}: catálogo global não pode levar a dados de oficina.`);
  }
  return target;
}

function checkWhere(model: string, where: unknown): void {
  for (const [key, value] of Object.entries(asRecord(where))) {
    if (LOGICAL_FILTER_KEYS.has(key)) {
      asList(value).forEach((item) => checkWhere(model, item));
      continue;
    }
    const target = relationTarget(model, key);
    if (!target) continue;
    const filter = asRecord(value);
    const operators = RELATION_FILTER_KEYS.filter((operator) => operator in filter);
    if (operators.length > 0) operators.forEach((operator) => checkWhere(target, filter[operator]));
    else checkWhere(target, filter); // filtro to-one abreviado
  }
}

function checkOrderBy(model: string, orderBy: unknown): void {
  for (const item of asList(orderBy)) {
    for (const [key, value] of Object.entries(asRecord(item))) {
      const target = relationTarget(model, key);
      if (target) checkOrderBy(target, value);
    }
  }
}

function checkCount(model: string, count: unknown): void {
  if (count === true) {
    Object.keys(MODEL_RELATIONS[model] ?? {}).forEach((field) => relationTarget(model, field));
    return;
  }
  for (const [key, value] of Object.entries(asRecord(asRecord(count).select))) {
    const target = relationTarget(model, key);
    if (target) checkWhere(target, asRecord(value).where);
  }
}

function checkSelection(model: string, selection: unknown): void {
  for (const [key, value] of Object.entries(asRecord(selection))) {
    if (key === "_count") {
      checkCount(model, value);
      continue;
    }
    const target = relationTarget(model, key);
    if (target) checkReadArgs(target, value);
  }
}

function checkReadArgs(model: string, args: unknown): void {
  const current = asRecord(args);
  checkSelection(model, current.include);
  checkSelection(model, current.select);
  checkWhere(model, current.where);
  checkOrderBy(model, current.orderBy);
}

/** Escrita aninhada: catálogo global só pode ser vinculado; dados da oficina são percorridos. */
function checkData(model: string, data: unknown): void {
  for (const item of asList(data)) {
    for (const [key, value] of Object.entries(asRecord(item))) {
      const target = relationTarget(model, key);
      if (!target) continue;
      const operations = asRecord(value);
      if (GLOBAL_READONLY_MODELS.has(target)) {
        if (Object.keys(operations).some((operation) => operation !== "connect")) {
          throw new TenantScopeViolationError(`${model}.${key}: catálogo global só pode ser vinculado (connect).`);
        }
        continue;
      }
      for (const [operation, payload] of Object.entries(operations)) {
        for (const entry of asList(payload)) {
          const nested = asRecord(entry);
          if (operation === "create") checkData(target, nested);
          else if (operation === "createMany" || operation === "updateMany") checkData(target, nested.data);
          else if (operation === "connectOrCreate") checkData(target, nested.create);
          else if (operation === "update") checkData(target, "data" in nested ? nested.data : nested);
          else if (operation === "upsert") {
            checkData(target, nested.create);
            checkData(target, nested.update);
          }
        }
      }
    }
  }
}

/** Valida as relações aninhadas de uma operação (leitura, filtros e escritas). */
function assertSafeRelations(model: string, args: Args): void {
  checkReadArgs(model, args);
  checkData(model, args.data);
  checkData(model, args.create);
  checkData(model, args.update);
}

export function scopeToTenant(prisma: PrismaClient, tenantId: string) {
  if (!tenantId) throw new TenantScopeViolationError("tenantId obrigatório para o escopo da oficina.");

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const currentArgs = asRecord(args);

          if (FORBIDDEN_MODELS.has(model)) {
            throw new TenantScopeViolationError(`${model} não é acessível no escopo da oficina.`);
          }
          assertSafeRelations(model, currentArgs);
          if (model === "Tenant") {
            return query(scopeTenantModelArgs(operation, currentArgs, tenantId) as typeof args);
          }
          if (GLOBAL_READONLY_MODELS.has(model)) {
            if (!READ_OPERATIONS.has(operation)) {
              throw new TenantScopeViolationError(`${model} é um catálogo global somente leitura.`);
            }
            return query(args);
          }
          if (TENANT_OWNED_MODELS.has(model)) {
            return query(scopeTenantOwnedArgs(model, operation, currentArgs, tenantId) as typeof args);
          }
          // Modelo novo sem classificação: falha fechada até ser classificado acima.
          throw new TenantScopeViolationError(`${model} não está classificado no escopo da oficina.`);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof scopeToTenant>;
