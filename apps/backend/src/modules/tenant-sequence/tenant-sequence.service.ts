import type { TenantDb } from "../../db/tenant-scope.js";

/**
 * Numeração sequencial por oficina (docs/database/proposta-modelo-nucleo.md §3.1).
 * API interna: recebe o client com escopo da oficina (`auth.db` ou o `tx` de uma
 * transação aberta a partir dele). Para o número acompanhar o registro criado (ex.: OS),
 * chamar dentro da mesma transação: se ela for desfeita, o incremento também é.
 */
export type TenantSequenceDb = Pick<TenantDb, "tenantSequence">;

/** Mesmo formato do CHECK da migration: MAIÚSCULAS_COM_SUBLINHADO, até 40 caracteres. */
const SEQUENCE_KEY_PATTERN = /^[A-Z][A-Z0-9_]{0,39}$/;

/**
 * Incremento atômico: um único `UPDATE … SET next_value = next_value + 1 … RETURNING`
 * (updateManyAndReturn). A linha fica travada até o fim da transação, então chamadas
 * concorrentes recebem números distintos. Retorna o número emitido, ou undefined se a
 * sequência ainda não existe.
 */
async function incrementSequence(db: TenantSequenceDb, key: string): Promise<number | undefined> {
  const [row] = await db.tenantSequence.updateManyAndReturn({
    where: { key },
    data: { nextValue: { increment: 1 } },
    select: { nextValue: true },
  });
  return row ? row.nextValue - 1 : undefined;
}

/**
 * Emite o próximo número da sequência `key` da oficina da sessão (1, 2, 3…).
 * Cria a sequência no primeiro uso. Números não são reaproveitados após commit; uma
 * transação desfeita devolve o número (lacunas são aceitas — docs/modules/ordens-servico.md §4).
 */
export async function nextSequenceValue(db: TenantSequenceDb, tenantId: string, key: string): Promise<number> {
  if (!SEQUENCE_KEY_PATTERN.test(key)) {
    throw new TypeError(`Chave de sequência inválida: ${key}`);
  }

  const issued = await incrementSequence(db, key);
  if (issued !== undefined) return issued;

  // Primeiro uso: INSERT … ON CONFLICT DO NOTHING (corrida entre criadores não gera erro).
  await db.tenantSequence.createMany({ data: [{ tenantId, key }], skipDuplicates: true });
  const created = await incrementSequence(db, key);
  if (created === undefined) {
    throw new Error(`Sequência ${key} não encontrada após criação.`);
  }
  return created;
}
