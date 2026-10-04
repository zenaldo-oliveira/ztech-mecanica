import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/db/client.js";
import { scopeToTenant, TenantScopeViolationError } from "../../src/db/tenant-scope.js";
import { AppError } from "../../src/lib/errors.js";
import { nextSequenceValue } from "../../src/modules/tenant-sequence/tenant-sequence.service.js";
import { getTenantSettings, updateTenantSettings } from "../../src/modules/tenant-settings/tenant-settings.service.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTenant } from "../helpers/fixtures.js";

let prisma: PrismaClient;
let tenantA: { id: string };
let tenantB: { id: string };

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  tenantA = await createTenant(prisma, "11222333000181", "Oficina A");
  tenantB = await createTenant(prisma, "44555666000181", "Oficina B");
});

describe("TenantSettings", () => {
  it("é criado com os padrões no primeiro acesso e pertence à oficina da sessão", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    const settings = await getTenantSettings(dbA, tenantA.id);
    const again = await getTenantSettings(dbA, tenantA.id);

    expect(settings).toMatchObject({
      tenantId: tenantA.id,
      defaultHourlyRate: null,
      quoteValidityDays: 7,
      allowNegativeStock: false,
      timezone: "America/Sao_Paulo",
    });
    expect(again.createdAt).toEqual(settings.createdAt);
    expect(await prisma.tenantSettings.count()).toBe(1);
  });

  it("acessos simultâneos ao primeiro uso criam uma única linha, sem erro", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    const results = await Promise.all(Array.from({ length: 10 }, () => getTenantSettings(dbA, tenantA.id)));

    expect(results.every((settings) => settings.tenantId === tenantA.id)).toBe(true);
    expect(await prisma.tenantSettings.count({ where: { tenantId: tenantA.id } })).toBe(1);
  });

  it("atualiza os campos permitidos, com valor monetário em Decimal(12,2)", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    const updated = await updateTenantSettings(dbA, tenantA.id, {
      defaultHourlyRate: "150.5",
      quoteValidityDays: 15,
      allowNegativeStock: true,
      timezone: "America/Manaus",
    });

    expect(updated.defaultHourlyRate?.toFixed(2)).toBe("150.50");
    expect(updated).toMatchObject({ quoteValidityDays: 15, allowNegativeStock: true, timezone: "America/Manaus" });
    expect((await updateTenantSettings(dbA, tenantA.id, { defaultHourlyRate: null })).defaultHourlyRate).toBeNull();
  });

  it("rejeita entrada inválida ou campos fora da whitelist (400)", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const invalidInputs: unknown[] = [
      {},
      { defaultHourlyRate: -1 },
      { defaultHourlyRate: "10.999" },
      { defaultHourlyRate: "10000000" },
      { quoteValidityDays: 366 },
      { quoteValidityDays: 1.5 },
      { timezone: "Marte/Olympus" },
      { tenantId: tenantB.id },
    ];

    for (const input of invalidInputs) {
      await expect(updateTenantSettings(dbA, tenantA.id, input as never)).rejects.toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }
    await expect(updateTenantSettings(dbA, tenantA.id, {})).rejects.toBeInstanceOf(AppError);
  });

  it("oficina A não lê nem altera as configurações da oficina B", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const dbB = scopeToTenant(prisma, tenantB.id);
    await updateTenantSettings(dbB, tenantB.id, { quoteValidityDays: 30 });
    await getTenantSettings(dbA, tenantA.id);

    await expect(getTenantSettings(dbA, tenantB.id)).rejects.toThrow(TenantScopeViolationError);
    await expect(updateTenantSettings(dbA, tenantB.id, { quoteValidityDays: 1 })).rejects.toThrow(
      TenantScopeViolationError,
    );
    await expect(dbA.tenantSettings.findUnique({ where: { tenantId: tenantB.id } })).rejects.toThrow(
      TenantScopeViolationError,
    );
    expect((await dbA.tenantSettings.findMany()).map((row) => row.tenantId)).toEqual([tenantA.id]);
    expect((await dbA.tenantSettings.updateMany({ data: { quoteValidityDays: 2 } })).count).toBe(1);

    const settingsB = await prisma.tenantSettings.findUniqueOrThrow({ where: { tenantId: tenantB.id } });
    expect(settingsB.quoteValidityDays).toBe(30);
  });

  it("o banco recusa valores fora dos limites e troca de oficina", async () => {
    await getTenantSettings(scopeToTenant(prisma, tenantA.id), tenantA.id);

    await expect(
      prisma.tenantSettings.update({ where: { tenantId: tenantA.id }, data: { quoteValidityDays: 999 } }),
    ).rejects.toThrow();
    await expect(
      prisma.tenantSettings.update({ where: { tenantId: tenantA.id }, data: { defaultHourlyRate: "-5" } }),
    ).rejects.toThrow();
    await expect(
      prisma.tenantSettings.update({ where: { tenantId: tenantA.id }, data: { tenantId: tenantB.id } }),
    ).rejects.toThrow();
  });
});

describe("TenantSequence", () => {
  it("emite 1, 2, 3… e grava a sequência na oficina da sessão", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    const values = [
      await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ"),
      await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ"),
      await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ"),
    ];

    expect(values).toEqual([1, 2, 3]);
    const row = await prisma.tenantSequence.findUniqueOrThrow({
      where: { tenantId_key: { tenantId: tenantA.id, key: "TEST_SEQ" } },
    });
    expect(row).toMatchObject({ tenantId: tenantA.id, nextValue: 4 });
  });

  it("cada oficina tem a própria sequência para a mesma chave", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const dbB = scopeToTenant(prisma, tenantB.id);

    expect(await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ")).toBe(1);
    expect(await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ")).toBe(2);
    expect(await nextSequenceValue(dbB, tenantB.id, "TEST_SEQ")).toBe(1);
    expect(await nextSequenceValue(dbA, tenantA.id, "OTHER_SEQ")).toBe(1);
  });

  it("oficina A não incrementa nem lê a sequência da oficina B", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const dbB = scopeToTenant(prisma, tenantB.id);
    await nextSequenceValue(dbB, tenantB.id, "TEST_SEQ");
    await nextSequenceValue(dbB, tenantB.id, "TEST_SEQ");

    await expect(nextSequenceValue(dbA, tenantB.id, "FRESH_SEQ")).rejects.toThrow(TenantScopeViolationError);
    // Chave composta com a oficina B: o escopo soma tenantId = A ao filtro → nada encontrado
    // (indistinguível de inexistente, como nas demais entidades).
    await expect(
      dbA.tenantSequence.update({
        where: { tenantId_key: { tenantId: tenantB.id, key: "TEST_SEQ" } },
        data: { nextValue: { increment: 1 } },
      }),
    ).rejects.toMatchObject({ code: "P2025" });
    expect((await dbA.tenantSequence.updateMany({ data: { nextValue: 100 } })).count).toBe(0);
    expect(await dbA.tenantSequence.findMany()).toEqual([]);

    // A mesma chave usada por A cria a sequência de A, sem tocar na de B.
    expect(await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ")).toBe(1);
    const rowB = await prisma.tenantSequence.findUniqueOrThrow({
      where: { tenantId_key: { tenantId: tenantB.id, key: "TEST_SEQ" } },
    });
    expect(rowB.nextValue).toBe(3);
  });

  it("chamadas concorrentes recebem números distintos e contínuos (inclusive no primeiro uso)", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const CALLS = 30;

    const values = await Promise.all(
      Array.from({ length: CALLS }, () => nextSequenceValue(dbA, tenantA.id, "CONCURRENT_SEQ")),
    );

    expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: CALLS }, (_, index) => index + 1));
  });

  it("transações concorrentes recebem números distintos", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);
    const CALLS = 10;

    const values = await Promise.all(
      Array.from({ length: CALLS }, () =>
        dbA.$transaction(async (tx) => {
          const value = await nextSequenceValue(tx, tenantA.id, "TX_SEQ");
          await tx.auditLog.create({ data: { actorType: "SYSTEM", action: "SEQ_USED", entityId: String(value) } });
          return value;
        }),
      ),
    );

    expect(new Set(values).size).toBe(CALLS);
    expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: CALLS }, (_, index) => index + 1));
  });

  it("rollback: transação desfeita não consome o número nem cria a sequência", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    await expect(
      dbA.$transaction(async (tx) => {
        await nextSequenceValue(tx, tenantA.id, "ROLLBACK_SEQ");
        throw new Error("falha depois de emitir o número");
      }),
    ).rejects.toThrow("falha depois de emitir o número");
    expect(await prisma.tenantSequence.count({ where: { key: "ROLLBACK_SEQ" } })).toBe(0);

    expect(await nextSequenceValue(dbA, tenantA.id, "ROLLBACK_SEQ")).toBe(1);
    await expect(
      dbA.$transaction(async (tx) => {
        await nextSequenceValue(tx, tenantA.id, "ROLLBACK_SEQ");
        throw new Error("falha");
      }),
    ).rejects.toThrow("falha");
    expect(await nextSequenceValue(dbA, tenantA.id, "ROLLBACK_SEQ")).toBe(2);
  });

  it("(tenantId, key) é único; a mesma chave pode existir em oficinas diferentes", async () => {
    await prisma.tenantSequence.create({ data: { tenantId: tenantA.id, key: "UNIQUE_SEQ" } });

    await expect(prisma.tenantSequence.create({ data: { tenantId: tenantA.id, key: "UNIQUE_SEQ" } })).rejects.toMatchObject(
      { code: "P2002" },
    );
    await expect(
      prisma.tenantSequence.create({ data: { tenantId: tenantB.id, key: "UNIQUE_SEQ" } }),
    ).resolves.toMatchObject({ tenantId: tenantB.id });
  });

  it("recusa chave fora do formato, número inválido e troca de oficina", async () => {
    const dbA = scopeToTenant(prisma, tenantA.id);

    await expect(nextSequenceValue(dbA, tenantA.id, "minusculas")).rejects.toThrow(TypeError);
    await expect(nextSequenceValue(dbA, tenantA.id, "")).rejects.toThrow(TypeError);
    await expect(prisma.tenantSequence.create({ data: { tenantId: tenantA.id, key: "minusculas" } })).rejects.toThrow();

    await nextSequenceValue(dbA, tenantA.id, "TEST_SEQ");
    const where = { tenantId_key: { tenantId: tenantA.id, key: "TEST_SEQ" } };
    await expect(prisma.tenantSequence.update({ where, data: { nextValue: 0 } })).rejects.toThrow();
    await expect(prisma.tenantSequence.update({ where, data: { tenantId: tenantB.id } })).rejects.toThrow();
  });
});
