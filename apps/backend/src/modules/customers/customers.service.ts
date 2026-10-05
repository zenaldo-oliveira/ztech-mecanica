import type { TenantDb } from "../../db/tenant-scope.js";
import { conflict, notFound, validationError } from "../../lib/errors.js";
import { recordUserAudit, type AuditRequestInfo } from "../audit/audit-service.js";
import { nextSequenceValue } from "../tenant-sequence/tenant-sequence.service.js";
import {
  personTypeIssues,
  type CreateCustomerBody,
  type ListCustomersQuery,
  type UpdateCustomerBody,
} from "./customers.schemas.js";

/** Chave da numeração de clientes (CLI-000001) em TenantSequence. */
export const CUSTOMER_SEQUENCE_KEY = "CUSTOMER";

type CustomerRow = NonNullable<Awaited<ReturnType<TenantDb["customer"]["findUnique"]>>>;
type AddressInput = NonNullable<CreateCustomerBody["address"]>;

export interface CustomerAddress {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export interface PublicCustomer {
  id: string;
  number: number;
  personType: CustomerRow["personType"];
  name: string;
  tradeName: string | null;
  document: string;
  status: CustomerRow["status"];
  phone: string;
  whatsapp: string | null;
  email: string | null;
  secondaryPhone: string | null;
  secondaryEmail: string | null;
  address: CustomerAddress;
  contactPreference: CustomerRow["contactPreference"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicCustomer(row: CustomerRow): PublicCustomer {
  return {
    id: row.id,
    number: row.number,
    personType: row.personType,
    name: row.name,
    tradeName: row.tradeName,
    document: row.document,
    status: row.status,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    secondaryPhone: row.secondaryPhone,
    secondaryEmail: row.secondaryEmail,
    address: {
      zipCode: row.zipCode,
      street: row.street,
      number: row.addressNumber,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
    },
    contactPreference: row.contactPreference,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Endereço da API (objeto) → colunas. Somente as chaves enviadas são alteradas. */
function addressColumns(address: AddressInput | undefined) {
  if (!address) return {};
  return {
    zipCode: address.zipCode,
    street: address.street,
    addressNumber: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

const duplicateDocument = () => conflict("Já existe um cliente com este CPF/CNPJ nesta oficina.");

export interface CustomersServiceContext {
  /** Client restrito à oficina da sessão. */
  db: TenantDb;
  tenantId: string;
  actorUserId: string;
  request: AuditRequestInfo;
}

export function createCustomersService({ db, tenantId, actorUserId, request }: CustomersServiceContext) {
  const audit = (action: string, entityId: string, metadata?: Record<string, unknown>) =>
    recordUserAudit(db, { userId: actorUserId }, request, { action, entity: "Customer", entityId, metadata });

  async function list(query: ListCustomersQuery) {
    const digits = query.search?.replace(/\D/g, "") ?? "";
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.personType ? { personType: query.personType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { tradeName: { contains: query.search, mode: "insensitive" as const } },
              ...(digits ? [{ document: { contains: digits } }] : []),
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.customer.count({ where }),
    ]);
    return { data: rows.map(toPublicCustomer), meta: { page: query.page, pageSize: query.pageSize, total } };
  }

  /** Cliente de outra oficina é indistinguível de inexistente: sempre 404. */
  async function findRow(id: string): Promise<CustomerRow> {
    const row = await db.customer.findUnique({ where: { id } });
    if (!row) throw notFound("Cliente não encontrado.");
    return row;
  }

  async function get(id: string): Promise<PublicCustomer> {
    return toPublicCustomer(await findRow(id));
  }

  async function create(body: CreateCustomerBody): Promise<PublicCustomer> {
    const { address, ...fields } = body;
    let row: CustomerRow;
    try {
      // Número e cadastro na mesma transação: se o cadastro falhar, o número não é consumido.
      row = await db.$transaction(async (tx) => {
        const number = await nextSequenceValue(tx, tenantId, CUSTOMER_SEQUENCE_KEY);
        return tx.customer.create({ data: { ...fields, ...addressColumns(address), tenantId, number } });
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateDocument();
      throw error;
    }

    await audit("CUSTOMER_CREATED", row.id, { number: row.number, personType: row.personType });
    return toPublicCustomer(row);
  }

  async function update(id: string, body: UpdateCustomerBody): Promise<PublicCustomer> {
    const before = await findRow(id);
    const { address, ...fields } = body;

    const issues = personTypeIssues(
      {
        personType: fields.personType ?? before.personType,
        document: fields.document ?? before.document,
        tradeName: fields.tradeName === undefined ? before.tradeName : fields.tradeName,
      },
      { checkDigits: fields.document !== undefined },
    );
    if (issues.length > 0) throw validationError(issues);

    let row: CustomerRow;
    try {
      row = await db.customer.update({ where: { id }, data: { ...fields, ...addressColumns(address) } });
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateDocument();
      throw error;
    }

    // Apenas os nomes dos campos alterados: a auditoria não replica dados pessoais.
    const changedFields = (Object.keys(row) as (keyof CustomerRow)[]).filter(
      (key) => key !== "updatedAt" && String(row[key]) !== String(before[key]),
    );
    if (changedFields.length > 0) await audit("CUSTOMER_UPDATED", id, { changedFields });
    if (row.status !== before.status) await auditStatusChange(id, before.status, row.status);

    return toPublicCustomer(row);
  }

  /** Eventos de status de clientes.md §12. */
  async function auditStatusChange(id: string, from: CustomerRow["status"], to: CustomerRow["status"]) {
    const metadata = { from, to };
    if (to === "BLOCKED") await audit("CUSTOMER_BLOCKED", id, metadata);
    else if (from === "BLOCKED") await audit("CUSTOMER_UNBLOCKED", id, metadata);
    if (to === "INACTIVE") await audit("CUSTOMER_DEACTIVATED", id, metadata);
  }

  /**
   * "Excluir" é exclusão lógica: status INACTIVE (clientes.md §14). O registro e o histórico
   * permanecem. Idempotente: cliente já inativo não gera nova alteração.
   */
  async function remove(id: string): Promise<void> {
    const before = await findRow(id);
    if (before.status === "INACTIVE") return;

    await db.customer.update({ where: { id }, data: { status: "INACTIVE" } });
    await auditStatusChange(id, before.status, "INACTIVE");
  }

  return { list, get, create, update, remove };
}
