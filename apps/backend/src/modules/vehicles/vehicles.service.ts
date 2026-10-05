import type { TenantDb } from "../../db/tenant-scope.js";
import { conflict, notFound, validationError } from "../../lib/errors.js";
import { recordUserAudit, type AuditRequestInfo } from "../audit/audit-service.js";
import {
  yearIssues,
  type CreateVehicleBody,
  type ListVehiclesQuery,
  type UpdateVehicleBody,
} from "./vehicles.schemas.js";

/** Resumo do proprietário devolvido junto com o veículo. */
const customerSummarySelect = { select: { id: true, number: true, name: true } } as const;

type VehicleRow = NonNullable<
  Awaited<ReturnType<TenantDb["vehicle"]["findUnique"]>>
> & { customer: { id: string; number: number; name: string } };

export interface PublicVehicle {
  id: string;
  type: VehicleRow["type"];
  brand: string;
  model: string;
  version: string | null;
  manufactureYear: number | null;
  modelYear: number | null;
  plate: string;
  chassisNumber: string | null;
  renavam: string | null;
  lastMileage: number | null;
  customer: { id: string; number: number; name: string };
  createdAt: Date;
  updatedAt: Date;
}

function toPublicVehicle(row: VehicleRow): PublicVehicle {
  return {
    id: row.id,
    type: row.type,
    brand: row.brand,
    model: row.model,
    version: row.version,
    manufactureYear: row.manufactureYear,
    modelYear: row.modelYear,
    plate: row.plate,
    chassisNumber: row.chassisNumber,
    renavam: row.renavam,
    lastMileage: row.lastMileage,
    customer: row.customer,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === code;
}

const duplicatePlate = () => conflict("Já existe um veículo com esta placa nesta oficina.");

export interface VehiclesServiceContext {
  /** Client restrito à oficina da sessão. */
  db: TenantDb;
  tenantId: string;
  actorUserId: string;
  request: AuditRequestInfo;
}

export function createVehiclesService({ db, tenantId, actorUserId, request }: VehiclesServiceContext) {
  const audit = (action: string, entityId: string, metadata?: Record<string, unknown>) =>
    recordUserAudit(db, { userId: actorUserId }, request, { action, entity: "Vehicle", entityId, metadata });

  /**
   * Proprietário válido: cliente da oficina da sessão (outra oficina = inexistente = 404) e
   * não inativado (exclusão lógica = 409). Cliente BLOCKED pode receber veículo (decisão V7).
   */
  async function assertOwner(customerId: string): Promise<void> {
    const customer = await db.customer.findUnique({ where: { id: customerId }, select: { status: true } });
    if (!customer) throw notFound("Cliente não encontrado.");
    if (customer.status === "INACTIVE") throw conflict("Cliente inativo não pode ser proprietário de veículo.");
  }

  async function list(query: ListVehiclesQuery) {
    const plateSearch = query.search?.toUpperCase().replace(/-/g, "") ?? "";
    const where = {
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              ...(plateSearch ? [{ plate: { contains: plateSearch } }] : []),
              { brand: { contains: query.search, mode: "insensitive" as const } },
              { model: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: { customer: customerSummarySelect },
        orderBy: [{ plate: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.vehicle.count({ where }),
    ]);
    return { data: rows.map(toPublicVehicle), meta: { page: query.page, pageSize: query.pageSize, total } };
  }

  /** Veículo de outra oficina é indistinguível de inexistente: sempre 404. */
  async function findRow(id: string): Promise<VehicleRow> {
    const row = await db.vehicle.findUnique({ where: { id }, include: { customer: customerSummarySelect } });
    if (!row) throw notFound("Veículo não encontrado.");
    return row;
  }

  async function get(id: string): Promise<PublicVehicle> {
    return toPublicVehicle(await findRow(id));
  }

  async function create(body: CreateVehicleBody): Promise<PublicVehicle> {
    await assertOwner(body.customerId);

    let row: VehicleRow;
    try {
      row = await db.vehicle.create({ data: { ...body, tenantId }, include: { customer: customerSummarySelect } });
    } catch (error) {
      if (hasPrismaCode(error, "P2002")) throw duplicatePlate();
      throw error;
    }

    await audit("VEHICLE_CREATED", row.id, { customerId: row.customerId, type: row.type });
    return toPublicVehicle(row);
  }

  async function update(id: string, body: UpdateVehicleBody): Promise<PublicVehicle> {
    const before = await findRow(id);

    const issues = yearIssues({
      manufactureYear: body.manufactureYear === undefined ? before.manufactureYear : body.manufactureYear,
      modelYear: body.modelYear === undefined ? before.modelYear : body.modelYear,
    });
    if (issues.length > 0) throw validationError(issues);

    const ownerChanged = body.customerId !== undefined && body.customerId !== before.customerId;
    if (ownerChanged) await assertOwner(body.customerId as string);

    let row: VehicleRow;
    try {
      row = await db.vehicle.update({ where: { id }, data: body, include: { customer: customerSummarySelect } });
    } catch (error) {
      if (hasPrismaCode(error, "P2002")) throw duplicatePlate();
      throw error;
    }

    // Apenas os nomes dos campos alterados (o proprietário tem evento próprio).
    const changedFields = (
      [
        "type", "brand", "model", "version", "manufactureYear", "modelYear",
        "plate", "chassisNumber", "renavam", "lastMileage",
      ] as const
    ).filter((key) => row[key] !== before[key]);
    if (changedFields.length > 0) await audit("VEHICLE_UPDATED", id, { changedFields });
    if (row.customerId !== before.customerId) {
      await audit("VEHICLE_OWNER_CHANGED", id, { fromCustomerId: before.customerId, toCustomerId: row.customerId });
    }

    return toPublicVehicle(row);
  }

  /**
   * Exclusão física (decisão V1). Registros que referenciarem o veículo (orçamentos, OS)
   * terão FK com RESTRICT: nesse caso a exclusão é recusada com 409.
   */
  async function remove(id: string): Promise<void> {
    const before = await findRow(id);
    try {
      await db.vehicle.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, "P2003")) throw conflict("Veículo possui histórico e não pode ser excluído.");
      throw error;
    }
    await audit("VEHICLE_DELETED", id, { customerId: before.customerId });
  }

  return { list, get, create, update, remove };
}
