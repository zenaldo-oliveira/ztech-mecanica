import { z } from "zod";

import type { TenantDb } from "../../db/tenant-scope.js";
import { parseInput } from "../../lib/validation.js";

/**
 * Configurações operacionais da oficina (docs/database/proposta-modelo-nucleo.md §3.1).
 * API interna: recebe o client com escopo da oficina (`auth.db` ou o `tx` de uma
 * transação aberta a partir dele) e o `tenantId` da sessão.
 */
export type TenantSettingsDb = Pick<TenantDb, "tenantSettings">;

/** Até 9.999.999,99 com no máximo 2 casas (docs/modules/servicos.md §10). */
const MONEY_PATTERN = /^\d{1,7}(\.\d{1,2})?$/;
const MAX_QUOTE_VALIDITY_DAYS = 365;

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const moneySchema = z
  .union([z.number(), z.string().trim()])
  .transform(String)
  .refine((value) => MONEY_PATTERN.test(value), "Valor inválido: use até 9.999.999,99 com no máximo 2 casas.");

export const updateTenantSettingsSchema = z
  .strictObject({
    defaultHourlyRate: moneySchema.nullable().optional(),
    quoteValidityDays: z.number().int().min(0).max(MAX_QUOTE_VALIDITY_DAYS).optional(),
    allowNegativeStock: z.boolean().optional(),
    timezone: z.string().trim().min(1).max(64).refine(isValidTimeZone, "Fuso horário inválido.").optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para alterar.",
  });

export type UpdateTenantSettingsInput = z.input<typeof updateTenantSettingsSchema>;

/** Garante que a oficina tenha configurações (com os padrões do schema). Idempotente e seguro em concorrência. */
async function ensureTenantSettings(db: TenantSettingsDb, tenantId: string): Promise<void> {
  await db.tenantSettings.createMany({ data: [{ tenantId }], skipDuplicates: true });
}

/** Configurações da oficina da sessão; criadas com os padrões no primeiro acesso. */
export async function getTenantSettings(db: TenantSettingsDb, tenantId: string) {
  await ensureTenantSettings(db, tenantId);
  return db.tenantSettings.findUniqueOrThrow({ where: { tenantId } });
}

/** Atualiza as configurações da oficina da sessão. Entrada validada (whitelist de campos). */
export async function updateTenantSettings(db: TenantSettingsDb, tenantId: string, input: UpdateTenantSettingsInput) {
  const data = parseInput(updateTenantSettingsSchema, input);
  await ensureTenantSettings(db, tenantId);
  return db.tenantSettings.update({ where: { tenantId }, data });
}
