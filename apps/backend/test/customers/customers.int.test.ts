import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario, createUserWithSession, testEnv } from "../helpers/fixtures.js";

let prisma: PrismaClient;
let app: FastifyInstance;
let scenario: Awaited<ReturnType<typeof createTwoTenantsScenario>>;

beforeAll(async () => {
  prisma = createTestPrisma();
  app = buildApp({ env: testEnv, prisma });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
  scenario = await createTwoTenantsScenario(prisma);
});

const validIndividual = {
  personType: "INDIVIDUAL",
  name: "  João da Silva  ",
  document: "529.982.247-25",
  phone: "(11) 98765-4321",
  email: "Joao.Silva@Email.COM",
  address: { zipCode: "01310-100", street: "Av. Paulista", number: "1000", city: "São Paulo", state: "sp" },
  contactPreference: "WHATSAPP",
  notes: "Prefere atendimento pela manhã.",
};

const validBusiness = {
  personType: "BUSINESS",
  name: "Auto Peças Bandeirantes Ltda",
  tradeName: "Bandeirantes",
  document: "11.222.333/0001-81",
  phone: "1133334444",
  contactPreference: "EMAIL",
};

function request(cookie: string, method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: object) {
  return app.inject({ method, url: `/api/v1${url}`, headers: { cookie }, ...(payload === undefined ? {} : { payload }) });
}

async function createCustomer(cookie: string, payload: object = validIndividual) {
  const response = await request(cookie, "POST", "/customers", payload);
  expect(response.statusCode, response.body).toBe(201);
  return response.json().data as { id: string; number: number; status: string };
}

describe("CRUD de clientes", () => {
  it("cria cliente normalizado, na oficina da sessão, com número sequencial", async () => {
    const response = await request(scenario.ownerA.cookie, "POST", "/customers", validIndividual);

    expect(response.statusCode).toBe(201);
    const customer = response.json().data;
    expect(customer).toMatchObject({
      number: 1,
      personType: "INDIVIDUAL",
      name: "João da Silva",
      tradeName: null,
      document: "52998224725",
      status: "ACTIVE",
      phone: "11987654321",
      email: "joao.silva@email.com",
      address: { zipCode: "01310100", street: "Av. Paulista", number: "1000", city: "São Paulo", state: "SP" },
      contactPreference: "WHATSAPP",
      notes: "Prefere atendimento pela manhã.",
    });
    expect(customer).not.toHaveProperty("tenantId");
    const row = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(row.tenantId).toBe(scenario.tenantA.id);

    const second = await createCustomer(scenario.ownerA.cookie, validBusiness);
    expect(second.number).toBe(2);
  });

  it("lista com paginação, busca por nome/documento e filtros de status e tipo", async () => {
    await createCustomer(scenario.ownerA.cookie, validIndividual);
    const business = await createCustomer(scenario.ownerA.cookie, validBusiness);
    await createCustomer(scenario.ownerB.cookie, validIndividual);
    await request(scenario.ownerA.cookie, "DELETE", `/customers/${business.id}`);

    const all = (await request(scenario.ownerA.cookie, "GET", "/customers")).json();
    expect(all.meta).toEqual({ page: 1, pageSize: 20, total: 2 });
    expect(all.data.map((customer: { name: string }) => customer.name)).toEqual([
      "Auto Peças Bandeirantes Ltda",
      "João da Silva",
    ]);

    const byName = (await request(scenario.ownerA.cookie, "GET", "/customers?search=joão")).json();
    expect(byName.data).toHaveLength(1);
    const byDocument = (await request(scenario.ownerA.cookie, "GET", "/customers?search=11.222.333")).json();
    expect(byDocument.data.map((customer: { id: string }) => customer.id)).toEqual([business.id]);
    const inactive = (await request(scenario.ownerA.cookie, "GET", "/customers?status=INACTIVE")).json();
    expect(inactive.meta.total).toBe(1);
    const individuals = (await request(scenario.ownerA.cookie, "GET", "/customers?personType=INDIVIDUAL")).json();
    expect(individuals.meta.total).toBe(1);
    const page2 = (await request(scenario.ownerA.cookie, "GET", "/customers?page=2&pageSize=1")).json();
    expect(page2.data).toHaveLength(1);
    expect(page2.meta).toEqual({ page: 2, pageSize: 1, total: 2 });
  });

  it("busca cliente por id", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    const response = await request(scenario.ownerA.cookie, "GET", `/customers/${created.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({ id: created.id, name: "João da Silva" });
  });

  it("atualiza parcialmente, inclusive endereço, limpeza de campo e status", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    const response = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {
      name: "João Silva Jr.",
      email: "",
      address: { number: "1001", complement: "Sala 2" },
      status: "BLOCKED",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      name: "João Silva Jr.",
      email: null,
      status: "BLOCKED",
      address: { street: "Av. Paulista", number: "1001", complement: "Sala 2", state: "SP" },
    });
    const actions = await prisma.auditLog.findMany({
      where: { entity: "Customer", entityId: created.id },
      orderBy: { createdAt: "asc" },
      select: { action: true, metadata: true },
    });
    expect(actions.map((log) => log.action)).toEqual(["CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_BLOCKED"]);
    expect(JSON.stringify(actions)).not.toContain("joao.silva@email.com");
  });

  it("excluir é exclusão lógica (INACTIVE), idempotente e auditada", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    const first = await request(scenario.ownerA.cookie, "DELETE", `/customers/${created.id}`);
    const second = await request(scenario.ownerA.cookie, "DELETE", `/customers/${created.id}`);

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(204);
    const row = await prisma.customer.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.status).toBe("INACTIVE");
    expect(await prisma.auditLog.count({ where: { action: "CUSTOMER_DEACTIVATED", entityId: created.id } })).toBe(1);
  });

  it("id inexistente retorna 404", async () => {
    const response = await request(scenario.ownerA.cookie, "GET", "/customers/01900000-0000-7000-8000-000000000000");
    expect(response.statusCode).toBe(404);
  });
});

describe("RBAC de clientes", () => {
  it("permissões presentes permitem (ATTENDANT cria, lê e atualiza; MANAGER exclui)", async () => {
    const attendant = await createUserWithSession(prisma, scenario.tenantA.id, ["ATTENDANT"]);
    const manager = await createUserWithSession(prisma, scenario.tenantA.id, ["MANAGER"]);

    const created = await createCustomer(attendant.cookie);
    expect((await request(attendant.cookie, "GET", "/customers")).statusCode).toBe(200);
    expect((await request(attendant.cookie, "GET", `/customers/${created.id}`)).statusCode).toBe(200);
    expect((await request(attendant.cookie, "PATCH", `/customers/${created.id}`, { name: "Novo" })).statusCode).toBe(200);
    expect((await request(manager.cookie, "DELETE", `/customers/${created.id}`)).statusCode).toBe(204);
  });

  it("permissões ausentes negam com 403 e nada muda", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);
    const noRole = await createUserWithSession(prisma, scenario.tenantA.id, []);
    const attendant = await createUserWithSession(prisma, scenario.tenantA.id, ["ATTENDANT"]);
    const mechanic = await createUserWithSession(prisma, scenario.tenantA.id, ["MECHANIC"]);

    expect((await request(noRole.cookie, "GET", "/customers")).statusCode).toBe(403);
    expect((await request(noRole.cookie, "GET", `/customers/${created.id}`)).statusCode).toBe(403);
    expect((await request(scenario.viewerA.cookie, "POST", "/customers", validBusiness)).statusCode).toBe(403);
    expect((await request(mechanic.cookie, "PATCH", `/customers/${created.id}`, { name: "X" })).statusCode).toBe(403);
    expect((await request(attendant.cookie, "DELETE", `/customers/${created.id}`)).statusCode).toBe(403);

    const row = await prisma.customer.findUniqueOrThrow({ where: { id: created.id } });
    expect(row).toMatchObject({ name: "João da Silva", status: "ACTIVE" });
    expect(await prisma.customer.count()).toBe(1);
    const denied = await prisma.auditLog.findMany({ where: { action: "ACCESS_DENIED" }, select: { metadata: true } });
    expect(denied.map((log) => (log.metadata as { permission: string }).permission).sort()).toEqual(
      ["customers.create", "customers.delete", "customers.read", "customers.read", "customers.update"].sort(),
    );
  });

  it("VIEWER lê, mas não cria, altera nem exclui", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    expect((await request(scenario.viewerA.cookie, "GET", `/customers/${created.id}`)).statusCode).toBe(200);
    expect((await request(scenario.viewerA.cookie, "PATCH", `/customers/${created.id}`, { name: "X" })).statusCode).toBe(403);
    expect((await request(scenario.viewerA.cookie, "DELETE", `/customers/${created.id}`)).statusCode).toBe(403);
  });

  it("sem sessão: 401", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/customers" });
    expect(response.statusCode).toBe(401);
  });
});

describe("isolamento entre oficinas", () => {
  it("oficina A não consulta, atualiza nem exclui cliente da oficina B (404, nada muda)", async () => {
    const customerB = await createCustomer(scenario.ownerB.cookie);

    const get = await request(scenario.ownerA.cookie, "GET", `/customers/${customerB.id}`);
    const patch = await request(scenario.ownerA.cookie, "PATCH", `/customers/${customerB.id}`, { name: "Invadido" });
    const remove = await request(scenario.ownerA.cookie, "DELETE", `/customers/${customerB.id}`);
    const list = (await request(scenario.ownerA.cookie, "GET", "/customers")).json();

    expect(get.statusCode).toBe(404);
    expect(patch.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);
    expect(list.meta.total).toBe(0);
    const row = await prisma.customer.findUniqueOrThrow({ where: { id: customerB.id } });
    expect(row).toMatchObject({ tenantId: scenario.tenantB.id, name: "João da Silva", status: "ACTIVE" });
  });

  it("tenantId no corpo é rejeitado (400) e a numeração é independente por oficina", async () => {
    const withTenant = await request(scenario.ownerA.cookie, "POST", "/customers", {
      ...validIndividual,
      tenantId: scenario.tenantB.id,
    });
    expect(withTenant.statusCode).toBe(400);

    expect((await createCustomer(scenario.ownerA.cookie)).number).toBe(1);
    expect((await createCustomer(scenario.ownerB.cookie)).number).toBe(1);
  });

  it("mesmo CPF pode existir em oficinas diferentes, mas não duas vezes na mesma (409)", async () => {
    await createCustomer(scenario.ownerA.cookie);
    await createCustomer(scenario.ownerB.cookie);

    const duplicate = await request(scenario.ownerA.cookie, "POST", "/customers", { ...validIndividual, name: "Outro" });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe("CONFLICT");

    const other = await createCustomer(scenario.ownerA.cookie, { ...validIndividual, document: "12345678909" });
    const update = await request(scenario.ownerA.cookie, "PATCH", `/customers/${other.id}`, {
      document: "52998224725",
    });
    expect(update.statusCode).toBe(409);
    // A tentativa duplicada não consumiu número: o próximo cliente recebe 3.
    expect((await createCustomer(scenario.ownerA.cookie, validBusiness)).number).toBe(3);
  });
});

describe("validação", () => {
  it("rejeita dados obrigatórios ausentes", async () => {
    for (const field of ["personType", "name", "document", "phone", "contactPreference"]) {
      const payload: Record<string, unknown> = { ...validIndividual };
      delete payload[field];
      const response = await request(scenario.ownerA.cookie, "POST", "/customers", payload);
      expect(response.statusCode, field).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejeita dados inválidos", async () => {
    const invalid: Record<string, unknown>[] = [
      { document: "123" },
      { personType: "BUSINESS", document: "52998224725" },
      { tradeName: "Fantasia" },
      { email: "nao-e-email" },
      { phone: "1234" },
      { whatsapp: "999" },
      { name: "J" },
      { name: "x".repeat(161) },
      { notes: "x".repeat(2001) },
      { contactPreference: "SMS" },
      { address: { zipCode: "123" } },
      { address: { state: "São Paulo" } },
      { address: { country: "BR" } },
      { status: "BLOCKED" },
      { number: 99 },
    ];
    for (const override of invalid) {
      const response = await request(scenario.ownerA.cookie, "POST", "/customers", { ...validIndividual, ...override });
      expect(response.statusCode, JSON.stringify(override)).toBe(400);
    }
    expect(await prisma.customer.count()).toBe(0);
  });

  it("na atualização, revalida as regras de tipo de pessoa contra o registro final", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    const toBusinessWithCpf = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {
      personType: "BUSINESS",
    });
    const tradeNameForIndividual = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {
      tradeName: "Fantasia",
    });
    const empty = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {});
    const valid = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {
      personType: "BUSINESS",
      document: "11222333000181",
      tradeName: "Fantasia",
    });

    expect(toBusinessWithCpf.statusCode).toBe(400);
    expect(tradeNameForIndividual.statusCode).toBe(400);
    expect(empty.statusCode).toBe(400);
    expect(valid.statusCode).toBe(200);
    expect(valid.json().data).toMatchObject({ personType: "BUSINESS", tradeName: "Fantasia" });
  });

  it("o banco recusa documento incompatível e troca de oficina mesmo sem a API", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    await expect(
      prisma.customer.update({ where: { id: created.id }, data: { personType: "BUSINESS" } }),
    ).rejects.toThrow();
    await expect(
      prisma.customer.update({ where: { id: created.id }, data: { tenantId: scenario.tenantB.id } }),
    ).rejects.toThrow();
  });
});

describe("CPF/CNPJ: dígitos verificadores", () => {
  it("cadastro aceita CPF e CNPJ válidos, com e sem pontuação, gravando somente dígitos", async () => {
    const individual = await createCustomer(scenario.ownerA.cookie, { ...validIndividual, document: "52998224725" });
    const business = await createCustomer(scenario.ownerA.cookie, { ...validBusiness, document: "11222333000181" });

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: individual.id } })).document).toBe("52998224725");
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: business.id } })).document).toBe("11222333000181");
  });

  it("cadastro recusa dígitos verificadores incorretos e sequências repetidas (400), sem repetir o número", async () => {
    const invalid: [object, string][] = [
      [{ ...validIndividual, document: "529.982.247-24" }, "CPF inválido: confira os dígitos."],
      [{ ...validIndividual, document: "111.111.111-11" }, "CPF inválido: confira os dígitos."],
      [{ ...validIndividual, document: "000.000.000-00" }, "CPF inválido: confira os dígitos."],
      [{ ...validBusiness, document: "11.222.333/0001-82" }, "CNPJ inválido: confira os dígitos."],
      [{ ...validBusiness, document: "00.000.000/0000-00" }, "CNPJ inválido: confira os dígitos."],
      [{ ...validIndividual, document: "529.982.247" }, "CPF deve ter 11 dígitos."],
      [{ ...validIndividual, document: "" }, "CPF deve ter 11 dígitos."],
    ];
    for (const [payload, message] of invalid) {
      const response = await request(scenario.ownerA.cookie, "POST", "/customers", payload);
      expect(response.statusCode, JSON.stringify(payload)).toBe(400);
      const details = response.json().error.details as { path: string; message: string }[];
      expect(details).toContainEqual({ path: "document", message });
      expect(response.body).not.toMatch(/52998224|11222333|11111111111|00000000000/);
    }
    expect(await prisma.customer.count()).toBe(0);
  });

  it("PATCH que envia documento inválido é recusado; o registro não muda", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);

    const response = await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, {
      document: "529.982.247-24",
    });

    expect(response.statusCode).toBe(400);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: created.id } })).document).toBe("52998224725");
  });

  it("cliente antigo com CPF inválido continua editável sem alterar o documento (dado preservado)", async () => {
    // Cadastro anterior à validação de dígitos: gravado direto no banco, só com o tamanho correto.
    const legacy = await prisma.customer.create({
      data: {
        tenantId: scenario.tenantA.id,
        number: 900,
        personType: "INDIVIDUAL",
        name: "Cliente Antigo",
        document: "45678912303",
        phone: "11987654321",
        contactPreference: "PHONE",
      },
    });

    const rename = await request(scenario.ownerA.cookie, "PATCH", `/customers/${legacy.id}`, { name: "Cliente Antigo 2" });
    expect(rename.statusCode).toBe(200);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: legacy.id } })).document).toBe("45678912303");

    const resend = await request(scenario.ownerA.cookie, "PATCH", `/customers/${legacy.id}`, { document: "45678912303" });
    expect(resend.statusCode).toBe(400);
    const fix = await request(scenario.ownerA.cookie, "PATCH", `/customers/${legacy.id}`, { document: "123.456.789-09" });
    expect(fix.statusCode).toBe(200);
  });

  it("documento não aparece na auditoria", async () => {
    const created = await createCustomer(scenario.ownerA.cookie);
    await request(scenario.ownerA.cookie, "PATCH", `/customers/${created.id}`, { document: "123.456.789-09" });

    const logs = await prisma.auditLog.findMany({ where: { entityId: created.id } });
    expect(logs.length).toBeGreaterThan(0);
    expect(JSON.stringify(logs)).not.toMatch(/52998224725|12345678909/);
  });
});
