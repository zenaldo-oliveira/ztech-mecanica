import { z } from "zod";

// Contrato da API de veículos (docs/modules/veiculos.md, decisões V2–V5). Schemas estritos:
// campo não documentado (ex.: tenantId) é rejeitado com 400. A oficina vem só da sessão.

const MIN_YEAR = 1900;
/**
 * Quilometragem: a regra de negócio é "qualquer inteiro ≥ 0". O único teto é técnico — o
 * maior valor da coluna INTEGER do PostgreSQL —, para responder 400 em vez de erro interno.
 */
const MAX_MILEAGE_STORAGE = 2_147_483_647;

/** Ano corrente avaliado a cada validação (o limite "ano atual + 1" muda com o tempo). */
const currentYear = () => new Date().getFullYear();

/** "" ou só espaços → null, para limpar campos opcionais vindos de formulários. */
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const optionalNullable = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(blankToNull, schema.nullable()).optional();

const textSchema = (max: number) => z.string().trim().min(1).max(max);

/** Placa: maiúsculas, sem hífen; padrão antigo AAA9999 ou Mercosul AAA9A99 (V2). */
export const plateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((value) => value.replace(/-/g, ""))
  .pipe(z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida: use AAA9999 ou AAA9A99."));

/** Ano de fabricação: 1900 até o ano atual + 1 (V3). */
const manufactureYearSchema = z
  .number()
  .int()
  .min(MIN_YEAR)
  .refine((year) => year <= currentYear() + 1, { message: "Ano de fabricação acima do permitido." });

/** Ano do modelo: exige ano de fabricação e fica entre ele e o seguinte (validado no registro final). */
const modelYearSchema = z.number().int().min(MIN_YEAR);

/** Chassi (VIN): 17 caracteres alfanuméricos, sem I, O ou Q (V4). */
const chassisSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Chassi inválido: 17 caracteres, sem I, O ou Q.");

/** RENAVAM: 11 dígitos, sem cálculo de dígito verificador (V4). */
const renavamSchema = z.string().trim().regex(/^\d{11}$/, "RENAVAM deve ter 11 dígitos.");

const mileageSchema = z.number().int().min(0).max(MAX_MILEAGE_STORAGE);

export const vehicleTypeSchema = z.enum(["CAR", "MOTORCYCLE"]);

/** Regra entre anos (V3): ano do modelo exige ano de fabricação e fica entre ele e o seguinte. */
export interface VehicleYears {
  manufactureYear?: number | null;
  modelYear?: number | null;
}

export function yearIssues(years: VehicleYears): { path: string; message: string }[] {
  const { manufactureYear, modelYear } = years;
  if (modelYear == null) return [];
  if (manufactureYear == null) {
    return [{ path: "manufactureYear", message: "Informe o ano de fabricação para informar o ano do modelo." }];
  }
  if (modelYear < manufactureYear || modelYear > manufactureYear + 1) {
    return [{ path: "modelYear", message: "Ano do modelo deve ser o ano de fabricação ou o seguinte." }];
  }
  return [];
}

const vehicleFields = {
  customerId: z.uuid({ message: "Cliente inválido." }),
  type: vehicleTypeSchema,
  brand: textSchema(80),
  model: textSchema(80),
  version: optionalNullable(textSchema(80)),
  manufactureYear: optionalNullable(manufactureYearSchema),
  modelYear: optionalNullable(modelYearSchema),
  plate: plateSchema,
  chassisNumber: optionalNullable(chassisSchema),
  renavam: optionalNullable(renavamSchema),
  lastMileage: optionalNullable(mileageSchema),
};

export const createVehicleBodySchema = z.strictObject(vehicleFields).superRefine((vehicle, ctx) => {
  for (const issue of yearIssues(vehicle)) {
    ctx.addIssue({ code: "custom", path: [issue.path], message: issue.message });
  }
});

/** Atualização parcial. A regra dos anos é revalidada no serviço contra o registro final. */
export const updateVehicleBodySchema = z
  .strictObject({
    customerId: vehicleFields.customerId.optional(),
    type: vehicleFields.type.optional(),
    brand: vehicleFields.brand.optional(),
    model: vehicleFields.model.optional(),
    version: vehicleFields.version,
    manufactureYear: vehicleFields.manufactureYear,
    modelYear: vehicleFields.modelYear,
    plate: vehicleFields.plate.optional(),
    chassisNumber: vehicleFields.chassisNumber,
    renavam: vehicleFields.renavam,
    lastMileage: vehicleFields.lastMileage,
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para alterar.",
  });

export const vehicleIdParamsSchema = z.strictObject({
  id: z.uuid({ message: "Identificador inválido." }),
});

/** Filtros aprovados na decisão V5: busca por placa/marca/modelo, cliente e tipo. */
export const listVehiclesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(80).optional(),
  customerId: z.uuid({ message: "Cliente inválido." }).optional(),
  type: vehicleTypeSchema.optional(),
});

export type CreateVehicleBody = z.infer<typeof createVehicleBodySchema>;
export type UpdateVehicleBody = z.infer<typeof updateVehicleBodySchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
