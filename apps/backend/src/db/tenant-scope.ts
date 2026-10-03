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
 * Limite conhecido: escritas/leitura aninhadas via relação não são reescritas; as FKs
 * compostas (tenant_id, …) no banco impedem vínculos entre oficinas nesses casos.
 * SQL bruto ($queryRaw/$executeRaw) não passa por aqui e é proibido em código de domínio.
 */

/** Modelos que pertencem a uma oficina (possuem coluna tenant_id). */
const TENANT_OWNED_MODELS = new Set(["User", "Session", "UserRole", "AuditLog"]);
/** Catálogos globais: leitura permitida, escrita apenas pela infraestrutura. */
const GLOBAL_READONLY_MODELS = new Set(["Role", "Permission", "RolePermission"]);
/** Modelos inacessíveis para código de oficina. */
const FORBIDDEN_MODELS = new Set(["PlatformUser"]);

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
