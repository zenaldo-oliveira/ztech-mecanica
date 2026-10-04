import { z } from "zod";

// Contrato da API de clientes (docs/modules/clientes.md). Schemas estritos: campo não
// documentado (ex.: tenantId, number) é rejeitado com 400. A oficina vem só da sessão.
// Normalização: documento, telefones e CEP somente dígitos; e-mails minúsculos; UF maiúscula.

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** "" ou só espaços → null, para limpar campos opcionais vindos de formulários. */
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const optionalNullable = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(blankToNull, schema.nullable()).optional();

const textSchema = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Telefone brasileiro com DDD: 10 ou 11 dígitos. */
const phoneSchema = z
  .string()
  .transform(onlyDigits)
  .pipe(z.string().regex(/^\d{10,11}$/, "Telefone deve ter DDD e número (10 ou 11 dígitos)."));

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("E-mail inválido."));

const documentSchema = z.string().transform(onlyDigits);

const addressSchema = z.strictObject({
  zipCode: optionalNullable(
    z.string().transform(onlyDigits).pipe(z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos.")),
  ),
  street: optionalNullable(textSchema(1, 160)),
  number: optionalNullable(textSchema(1, 20)),
  complement: optionalNullable(textSchema(1, 80)),
  neighborhood: optionalNullable(textSchema(1, 80)),
  city: optionalNullable(textSchema(1, 80)),
  state: optionalNullable(
    z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF deve ter 2 letras."),
  ),
});

export const personTypeSchema = z.enum(["INDIVIDUAL", "BUSINESS"]);
export const customerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);
export const contactPreferenceSchema = z.enum(["WHATSAPP", "EMAIL", "PHONE", "NONE"]);

const customerFields = {
  personType: personTypeSchema,
  name: textSchema(2, 160),
  tradeName: optionalNullable(textSchema(1, 160)),
  document: documentSchema,
  phone: phoneSchema,
  whatsapp: optionalNullable(phoneSchema),
  email: optionalNullable(emailSchema),
  secondaryPhone: optionalNullable(phoneSchema),
  secondaryEmail: optionalNullable(emailSchema),
  address: addressSchema.optional(),
  contactPreference: contactPreferenceSchema,
  notes: optionalNullable(textSchema(1, 2000)),
};

/** Regras que dependem do tipo de pessoa (clientes.md §4 e §5). */
export interface PersonTypeRules {
  personType: z.infer<typeof personTypeSchema>;
  document: string;
  tradeName?: string | null;
}

export function personTypeIssues(customer: PersonTypeRules): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  const expectedLength = customer.personType === "INDIVIDUAL" ? 11 : 14;
  if (customer.document.length !== expectedLength) {
    issues.push({
      path: "document",
      message: customer.personType === "INDIVIDUAL" ? "CPF deve ter 11 dígitos." : "CNPJ deve ter 14 dígitos.",
    });
  }
  if (customer.personType === "INDIVIDUAL" && customer.tradeName) {
    issues.push({ path: "tradeName", message: "Nome fantasia só se aplica a pessoa jurídica." });
  }
  return issues;
}

export const createCustomerBodySchema = z.strictObject(customerFields).superRefine((customer, ctx) => {
  for (const issue of personTypeIssues(customer)) {
    ctx.addIssue({ code: "custom", path: [issue.path], message: issue.message });
  }
});

/** Atualização parcial. As regras entre campos são revalidadas no serviço contra o registro final. */
export const updateCustomerBodySchema = z
  .strictObject({
    personType: customerFields.personType.optional(),
    name: customerFields.name.optional(),
    tradeName: customerFields.tradeName,
    document: customerFields.document.optional(),
    status: customerStatusSchema.optional(),
    phone: customerFields.phone.optional(),
    whatsapp: customerFields.whatsapp,
    email: customerFields.email,
    secondaryPhone: customerFields.secondaryPhone,
    secondaryEmail: customerFields.secondaryEmail,
    address: customerFields.address,
    contactPreference: customerFields.contactPreference.optional(),
    notes: customerFields.notes,
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para alterar.",
  });

export const customerIdParamsSchema = z.strictObject({
  id: z.uuid({ message: "Identificador inválido." }),
});

/** Filtros documentados em clientes.md §13: nome/documento, status e tipo de pessoa. */
export const listCustomersQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  status: customerStatusSchema.optional(),
  personType: personTypeSchema.optional(),
});

export type CreateCustomerBody = z.infer<typeof createCustomerBodySchema>;
export type UpdateCustomerBody = z.infer<typeof updateCustomerBodySchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
