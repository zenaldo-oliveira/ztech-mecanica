import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { createPrismaClient, type PrismaClient } from "../../src/db/client.js";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createPrismaClient(inject("testDatabaseUrl"));
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tenants" CASCADE');
});

describe("Tenant (integração com PostgreSQL)", () => {
  it("gera id UUID v7 e preenche padrões e timestamps", async () => {
    const tenant = await prisma.tenant.create({
      data: { legalName: "Oficina Teste Ltda", document: "11222333000181" },
    });

    expect(tenant.id).toMatch(UUID_V7);
    expect(tenant.status).toBe("TRIAL");
    expect(tenant.createdAt).toBeInstanceOf(Date);
    expect(tenant.updatedAt).toBeInstanceOf(Date);
  });

  it("rejeita documento duplicado", async () => {
    await prisma.tenant.create({ data: { legalName: "Oficina A", document: "11222333000181" } });

    await expect(
      prisma.tenant.create({ data: { legalName: "Oficina B", document: "11222333000181" } }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejeita documento fora do formato CPF/CNPJ (CHECK no banco)", async () => {
    await expect(
      prisma.tenant.create({ data: { legalName: "Oficina C", document: "12.345" } }),
    ).rejects.toThrow(/tenants_document_format_check/);
  });

  it("aceita CPF com 11 dígitos", async () => {
    const tenant = await prisma.tenant.create({ data: { legalName: "Mecânico Autônomo", document: "12345678909" } });
    expect(tenant.document).toBe("12345678909");
  });
});
