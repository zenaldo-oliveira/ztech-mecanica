import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTwoTenantsScenario, createUserWithSession, testEnv } from "../helpers/fixtures.js";

let prisma: PrismaClient;
let app: FastifyInstance;
let scenario: Awaited<ReturnType<typeof createTwoTenantsScenario>>;
let customerA: { id: string; number: number; name: string };
let customerA2: { id: string };
let customerB: { id: string };

beforeAll(async () => {
  prisma = createTestPrisma();
  app = buildApp({ env: testEnv, prisma });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

function request(cookie: string, method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: object) {
  return app.inject({ method, url: `/api/v1${url}`, headers: { cookie }, ...(payload === undefined ? {} : { payload }) });
}

let documentSequence = 0;
async function createCustomer(cookie: string, name: string) {
  documentSequence += 1;
  const response = await request(cookie, "POST", "/customers", {
    personType: "INDIVIDUAL",
    name,
    document: String(10_000_000_000 + documentSequence),
    phone: "11987654321",
    contactPreference: "PHONE",
  });
  expect(response.statusCode, response.body).toBe(201);
  return response.json().data as { id: string; number: number; name: string };
}

const vehiclePayload = (customerId: string, overrides: object = {}) => ({
  customerId,
  type: "CAR",
  brand: "Toyota",
  model: "Corolla",
  version: "XEi",
  manufactureYear: 2021,
  modelYear: 2022,
  plate: "abc-1d23",
  chassisNumber: "9bwzzz377vt004251",
  renavam: "12345678901",
  lastMileage: 45230,
  ...overrides,
});

async function createVehicle(cookie: string, payload: object) {
  const response = await request(cookie, "POST", "/vehicles", payload);
  expect(response.statusCode, response.body).toBe(201);
  return response.json().data as { id: string; plate: string; customer: { id: string } };
}

beforeEach(async () => {
  await resetDatabase(prisma);
  scenario = await createTwoTenantsScenario(prisma);
  customerA = await createCustomer(scenario.ownerA.cookie, "Maria Souza");
  customerA2 = await createCustomer(scenario.ownerA.cookie, "João Silva");
  customerB = await createCustomer(scenario.ownerB.cookie, "Cliente B");
});

describe("CRUD de veículos", () => {
  it("cria veículo normalizado na oficina da sessão, com resumo do cliente", async () => {
    const response = await request(scenario.ownerA.cookie, "POST", "/vehicles", vehiclePayload(customerA.id));

    expect(response.statusCode).toBe(201);
    const vehicle = response.json().data;
    expect(vehicle).toMatchObject({
      type: "CAR",
      brand: "Toyota",
      model: "Corolla",
      plate: "ABC1D23",
      chassisNumber: "9BWZZZ377VT004251",
      renavam: "12345678901",
      manufactureYear: 2021,
      modelYear: 2022,
      lastMileage: 45230,
      customer: { id: customerA.id, number: customerA.number, name: "Maria Souza" },
    });
    expect(vehicle).not.toHaveProperty("tenantId");
    const row = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(row).toMatchObject({ tenantId: scenario.tenantA.id, customerId: customerA.id, plate: "ABC1D23" });
  });

  it("aceita placa no padrão antigo e cadastro mínimo", async () => {
    const vehicle = await createVehicle(scenario.ownerA.cookie, {
      customerId: customerA.id,
      type: "MOTORCYCLE",
      brand: "Honda",
      model: "CG 160",
      plate: "bra-2019",
    });
    expect(vehicle).toMatchObject({ plate: "BRA2019", version: null, manufactureYear: null, lastMileage: null });
  });

  it("lista com paginação, busca (placa, marca, modelo) e filtros customerId e type", async () => {
    await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));
    const moto = await createVehicle(scenario.ownerA.cookie, {
      customerId: customerA2.id,
      type: "MOTORCYCLE",
      brand: "Honda",
      model: "CG 160",
      plate: "BRA2E19",
    });
    await createVehicle(scenario.ownerB.cookie, vehiclePayload(customerB.id));

    const all = (await request(scenario.ownerA.cookie, "GET", "/vehicles")).json();
    expect(all.meta).toEqual({ page: 1, pageSize: 20, total: 2 });
    expect(all.data.map((vehicle: { plate: string }) => vehicle.plate)).toEqual(["ABC1D23", "BRA2E19"]);
    expect(all.data[0].customer).toMatchObject({ id: customerA.id, name: "Maria Souza" });

    const byPlate = (await request(scenario.ownerA.cookie, "GET", "/vehicles?search=bra-2e")).json();
    expect(byPlate.data.map((vehicle: { id: string }) => vehicle.id)).toEqual([moto.id]);
    const byBrand = (await request(scenario.ownerA.cookie, "GET", "/vehicles?search=toyo")).json();
    expect(byBrand.meta.total).toBe(1);
    const byModel = (await request(scenario.ownerA.cookie, "GET", "/vehicles?search=cg 160")).json();
    expect(byModel.meta.total).toBe(1);
    const byCustomer = (await request(scenario.ownerA.cookie, "GET", `/vehicles?customerId=${customerA2.id}`)).json();
    expect(byCustomer.data.map((vehicle: { id: string }) => vehicle.id)).toEqual([moto.id]);
    const byType = (await request(scenario.ownerA.cookie, "GET", "/vehicles?type=CAR")).json();
    expect(byType.meta.total).toBe(1);
    const page2 = (await request(scenario.ownerA.cookie, "GET", "/vehicles?page=2&pageSize=1")).json();
    expect(page2.meta).toEqual({ page: 2, pageSize: 1, total: 2 });
    expect(page2.data).toHaveLength(1);
    expect((await request(scenario.ownerA.cookie, "GET", "/vehicles?pageSize=101")).statusCode).toBe(400);
  });

  it("busca por id e atualiza parcialmente, inclusive limpando campos", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    const get = await request(scenario.ownerA.cookie, "GET", `/vehicles/${created.id}`);
    expect(get.statusCode).toBe(200);
    expect(get.json().data.customer).toEqual({ id: customerA.id, number: customerA.number, name: "Maria Souza" });

    const patch = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, {
      lastMileage: 50000,
      version: "",
      plate: "xyz-9k87",
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().data).toMatchObject({ lastMileage: 50000, version: null, plate: "XYZ9K87" });

    const logs = await prisma.auditLog.findMany({
      where: { entity: "Vehicle", entityId: created.id },
      orderBy: { createdAt: "asc" },
      select: { action: true, metadata: true },
    });
    expect(logs.map((log) => log.action)).toEqual(["VEHICLE_CREATED", "VEHICLE_UPDATED"]);
    expect((logs[1].metadata as { changedFields: string[] }).changedFields.sort()).toEqual(
      ["lastMileage", "plate", "version"],
    );
  });

  it("troca de proprietário para cliente da mesma oficina, com auditoria própria", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    const response = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, {
      customerId: customerA2.id,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.customer.id).toBe(customerA2.id);
    const ownerLog = await prisma.auditLog.findFirstOrThrow({ where: { action: "VEHICLE_OWNER_CHANGED" } });
    expect(ownerLog.metadata).toEqual({ fromCustomerId: customerA.id, toCustomerId: customerA2.id });
    expect(await prisma.auditLog.count({ where: { action: "VEHICLE_UPDATED" } })).toBe(0);
  });

  it("DELETE é exclusão física, auditada; segunda tentativa é 404", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    const first = await request(scenario.ownerA.cookie, "DELETE", `/vehicles/${created.id}`);
    const second = await request(scenario.ownerA.cookie, "DELETE", `/vehicles/${created.id}`);

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(404);
    expect(await prisma.vehicle.count({ where: { id: created.id } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "VEHICLE_DELETED", entityId: created.id } })).toBe(1);
  });

  it("id inexistente retorna 404", async () => {
    const response = await request(scenario.ownerA.cookie, "GET", "/vehicles/01900000-0000-7000-8000-000000000000");
    expect(response.statusCode).toBe(404);
  });
});

describe("regras de proprietário", () => {
  it("cliente INACTIVE não recebe veículo nem vira proprietário (409); BLOCKED é permitido", async () => {
    const inactive = await createCustomer(scenario.ownerA.cookie, "Inativo");
    const blocked = await createCustomer(scenario.ownerA.cookie, "Bloqueado");
    await request(scenario.ownerA.cookie, "DELETE", `/customers/${inactive.id}`);
    await request(scenario.ownerA.cookie, "PATCH", `/customers/${blocked.id}`, { status: "BLOCKED" });

    const toInactive = await request(scenario.ownerA.cookie, "POST", "/vehicles", vehiclePayload(inactive.id));
    expect(toInactive.statusCode).toBe(409);

    const toBlocked = await request(scenario.ownerA.cookie, "POST", "/vehicles", vehiclePayload(blocked.id));
    expect(toBlocked.statusCode).toBe(201);

    const transfer = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${toBlocked.json().data.id}`, {
      customerId: inactive.id,
    });
    expect(transfer.statusCode).toBe(409);
    expect(await prisma.vehicle.count({ where: { customerId: inactive.id } })).toBe(0);
  });

  it("cliente inexistente: 404", async () => {
    const response = await request(
      scenario.ownerA.cookie,
      "POST",
      "/vehicles",
      vehiclePayload("01900000-0000-7000-8000-000000000000"),
    );
    expect(response.statusCode).toBe(404);
  });
});

describe("RBAC de veículos", () => {
  it("OWNER, ADMIN e MANAGER têm leitura, criação, alteração e exclusão", async () => {
    const admin = await createUserWithSession(prisma, scenario.tenantA.id, ["ADMIN"]);
    const manager = await createUserWithSession(prisma, scenario.tenantA.id, ["MANAGER"]);

    for (const [index, cookie] of [scenario.ownerA.cookie, admin.cookie, manager.cookie].entries()) {
      const created = await createVehicle(cookie, vehiclePayload(customerA.id, { plate: `AAA000${index}` }));
      expect((await request(cookie, "GET", `/vehicles/${created.id}`)).statusCode).toBe(200);
      expect((await request(cookie, "PATCH", `/vehicles/${created.id}`, { lastMileage: 1 })).statusCode).toBe(200);
      expect((await request(cookie, "DELETE", `/vehicles/${created.id}`)).statusCode).toBe(204);
    }
  });

  it("ATTENDANT cria, lê e altera, mas não exclui", async () => {
    const attendant = await createUserWithSession(prisma, scenario.tenantA.id, ["ATTENDANT"]);

    const created = await createVehicle(attendant.cookie, vehiclePayload(customerA.id));
    expect((await request(attendant.cookie, "GET", "/vehicles")).statusCode).toBe(200);
    expect((await request(attendant.cookie, "PATCH", `/vehicles/${created.id}`, { lastMileage: 1 })).statusCode).toBe(200);
    expect((await request(attendant.cookie, "DELETE", `/vehicles/${created.id}`)).statusCode).toBe(403);
    expect(await prisma.vehicle.count({ where: { id: created.id } })).toBe(1);
  });

  it("MECHANIC e VIEWER só leem", async () => {
    const mechanic = await createUserWithSession(prisma, scenario.tenantA.id, ["MECHANIC"]);
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    for (const cookie of [mechanic.cookie, scenario.viewerA.cookie]) {
      expect((await request(cookie, "GET", "/vehicles")).statusCode).toBe(200);
      expect((await request(cookie, "GET", `/vehicles/${created.id}`)).statusCode).toBe(200);
      expect(
        (await request(cookie, "POST", "/vehicles", vehiclePayload(customerA.id, { plate: "MEC1234" }))).statusCode,
      ).toBe(403);
      expect((await request(cookie, "PATCH", `/vehicles/${created.id}`, { lastMileage: 9 })).statusCode).toBe(403);
      expect((await request(cookie, "DELETE", `/vehicles/${created.id}`)).statusCode).toBe(403);
    }
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } })).lastMileage).toBe(45230);
  });

  it("FINANCIAL não tem acesso a veículos (403 auditado)", async () => {
    const financial = await createUserWithSession(prisma, scenario.tenantA.id, ["FINANCIAL"]);
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    expect((await request(financial.cookie, "GET", "/vehicles")).statusCode).toBe(403);
    expect((await request(financial.cookie, "GET", `/vehicles/${created.id}`)).statusCode).toBe(403);
    expect(
      (await request(financial.cookie, "POST", "/vehicles", vehiclePayload(customerA.id, { plate: "FIN1234" }))).statusCode,
    ).toBe(403);
    const denied = await prisma.auditLog.findMany({ where: { action: "ACCESS_DENIED", userId: financial.id } });
    expect(denied.map((log) => (log.metadata as { permission: string }).permission).sort()).toEqual(
      ["vehicles.create", "vehicles.read", "vehicles.read"],
    );
  });

  it("sem sessão: 401", async () => {
    expect((await app.inject({ method: "GET", url: "/api/v1/vehicles" })).statusCode).toBe(401);
  });
});

describe("isolamento entre oficinas", () => {
  it("oficina A não lê, não altera e não exclui veículo da oficina B (404, nada muda)", async () => {
    const vehicleB = await createVehicle(scenario.ownerB.cookie, vehiclePayload(customerB.id));

    expect((await request(scenario.ownerA.cookie, "GET", `/vehicles/${vehicleB.id}`)).statusCode).toBe(404);
    expect(
      (await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${vehicleB.id}`, { lastMileage: 1 })).statusCode,
    ).toBe(404);
    expect((await request(scenario.ownerA.cookie, "DELETE", `/vehicles/${vehicleB.id}`)).statusCode).toBe(404);
    expect((await request(scenario.ownerA.cookie, "GET", "/vehicles")).json().meta.total).toBe(0);
    expect(
      (await request(scenario.ownerA.cookie, "GET", `/vehicles?customerId=${customerB.id}`)).json().meta.total,
    ).toBe(0);

    const row = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleB.id } });
    expect(row).toMatchObject({ tenantId: scenario.tenantB.id, lastMileage: 45230 });
  });

  it("oficina A não vincula veículo a cliente da oficina B, nem na criação nem na troca (404)", async () => {
    const create = await request(scenario.ownerA.cookie, "POST", "/vehicles", vehiclePayload(customerB.id));
    expect(create.statusCode).toBe(404);

    const vehicleA = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));
    const transfer = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${vehicleA.id}`, {
      customerId: customerB.id,
    });
    expect(transfer.statusCode).toBe(404);
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleA.id } })).customerId).toBe(customerA.id);
  });

  it("mesma placa é aceita em oficinas diferentes e recusada (409) na mesma", async () => {
    await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));
    await createVehicle(scenario.ownerB.cookie, vehiclePayload(customerB.id));

    const duplicate = await request(scenario.ownerA.cookie, "POST", "/vehicles", vehiclePayload(customerA2.id));
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe("CONFLICT");

    const other = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA2.id, { plate: "QRS4F56" }));
    const update = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${other.id}`, { plate: "ABC-1D23" });
    expect(update.statusCode).toBe(409);
  });

  it("tenantId enviado pelo cliente é rejeitado (400)", async () => {
    const create = await request(scenario.ownerA.cookie, "POST", "/vehicles", {
      ...vehiclePayload(customerA.id),
      tenantId: scenario.tenantB.id,
    });
    expect(create.statusCode).toBe(400);

    const vehicleA = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));
    const patch = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${vehicleA.id}`, {
      tenantId: scenario.tenantB.id,
    });
    expect(patch.statusCode).toBe(400);
  });
});

describe("validação", () => {
  it("rejeita obrigatórios ausentes", async () => {
    for (const field of ["customerId", "type", "brand", "model", "plate"]) {
      const payload: Record<string, unknown> = vehiclePayload(customerA.id);
      delete payload[field];
      const response = await request(scenario.ownerA.cookie, "POST", "/vehicles", payload);
      expect(response.statusCode, field).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejeita placa, anos, chassi, RENAVAM, quilometragem e campos desconhecidos inválidos", async () => {
    const nextYear = new Date().getFullYear() + 1;
    const invalid: object[] = [
      { plate: "AB1234" },
      { plate: "ABCD123" },
      { plate: "1BC2D34" },
      { plate: "ABC12345" },
      { manufactureYear: 1899, modelYear: 1899 },
      { manufactureYear: nextYear + 1, modelYear: nextYear + 1 },
      { manufactureYear: 2020.5 },
      { manufactureYear: 2021, modelYear: 2020 },
      { manufactureYear: 2021, modelYear: 2023 },
      { chassisNumber: "9BWZZZ377VT00425" },
      { chassisNumber: "9BWZZZ377VT0042I1" },
      { chassisNumber: "9BWZZZ377VT004Q51" },
      { renavam: "1234567890" },
      { renavam: "1234567890A" },
      { lastMileage: -1 },
      { lastMileage: 10.5 },
      { type: "TRUCK" },
      { brand: "" },
      { model: "x".repeat(81) },
      { customerId: "nao-e-uuid" },
      { color: "Prata" },
    ];
    for (const override of invalid) {
      const response = await request(
        scenario.ownerA.cookie,
        "POST",
        "/vehicles",
        vehiclePayload(customerA.id, override),
      );
      expect(response.statusCode, JSON.stringify(override)).toBe(400);
    }
    expect(await prisma.vehicle.count()).toBe(0);
  });

  it("na atualização, revalida a regra dos anos contra o registro final", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    const invalid = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, { modelYear: 2025 });
    const empty = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, {});
    const valid = await request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, {
      manufactureYear: 2024,
      modelYear: 2025,
    });

    expect(invalid.statusCode).toBe(400);
    expect(empty.statusCode).toBe(400);
    expect(valid.statusCode).toBe(200);
  });
});

describe("regras finais do 06A (D1–D3)", () => {
  const year = new Date().getFullYear();

  it("D1: ano do modelo exige ano de fabricação; limites dos anos na criação", async () => {
    const cases: [object, number][] = [
      [{ manufactureYear: null, modelYear: 2022 }, 400],
      [{ manufactureYear: undefined, modelYear: 2022 }, 400],
      [{ manufactureYear: 1899, modelYear: null }, 400],
      [{ manufactureYear: year + 2, modelYear: null }, 400],
      [{ manufactureYear: 2020, modelYear: 2019 }, 400],
      [{ manufactureYear: 2020, modelYear: 2022 }, 400],
      [{ manufactureYear: 1900, modelYear: 1900, plate: "AAA1900" }, 201],
      [{ manufactureYear: 2020, modelYear: 2020, plate: "AAA2020" }, 201],
      [{ manufactureYear: 2020, modelYear: 2021, plate: "AAA2021" }, 201],
      [{ manufactureYear: year + 1, modelYear: year + 2, plate: "AAA9999" }, 201],
      [{ manufactureYear: 2020, modelYear: null, plate: "AAA0001" }, 201],
      [{ manufactureYear: null, modelYear: null, plate: "AAA0002" }, 201],
    ];
    for (const [override, expected] of cases) {
      const payload: Record<string, unknown> = { ...vehiclePayload(customerA.id), plate: "BBB0000", ...override };
      if ("manufactureYear" in override && override.manufactureYear === undefined) delete payload.manufactureYear;
      const response = await request(scenario.ownerA.cookie, "POST", "/vehicles", payload);
      expect(response.statusCode, JSON.stringify(override)).toBe(expected);
    }
  });

  it("D1: PATCH valida os anos finais combinados com o registro existente", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id)); // 2021/2022
    const patch = (body: object) => request(scenario.ownerA.cookie, "PATCH", `/vehicles/${created.id}`, body);

    expect((await patch({ manufactureYear: null })).statusCode).toBe(400); // modelo 2022 ficaria sem fabricação
    expect((await patch({ manufactureYear: 2023 })).statusCode).toBe(400); // modelo 2022 < fabricação 2023
    expect((await patch({ modelYear: 2023 })).statusCode).toBe(400); // fabricação 2021 + 2
    expect((await patch({ modelYear: 2021 })).statusCode).toBe(200);
    expect((await patch({ manufactureYear: null, modelYear: null })).statusCode).toBe(200);
    expect((await patch({ modelYear: 2021 })).statusCode).toBe(400); // agora sem fabricação
    expect((await patch({ manufactureYear: 2021, modelYear: 2022 })).statusCode).toBe(200);

    const row = await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } });
    expect(row).toMatchObject({ manufactureYear: 2021, modelYear: 2022 });
  });

  it("D1: o banco recusa ano do modelo sem ano de fabricação", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    await expect(
      prisma.vehicle.update({ where: { id: created.id }, data: { manufactureYear: null } }),
    ).rejects.toThrow();
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } })).manufactureYear).toBe(2021);
  });

  it("D2: quilometragem aceita qualquer inteiro ≥ 0 e recusa negativos, frações e não inteiros", async () => {
    const accepted = [0, 9_999_999, 50_000_000, 2_147_483_647];
    for (const [index, lastMileage] of accepted.entries()) {
      const response = await request(
        scenario.ownerA.cookie,
        "POST",
        "/vehicles",
        vehiclePayload(customerA.id, { lastMileage, plate: `KMA000${index}` }),
      );
      expect(response.statusCode, String(lastMileage)).toBe(201);
      expect(response.json().data.lastMileage).toBe(lastMileage);
    }

    // 2_147_483_648 excede a coluna INTEGER: 400 (não erro interno).
    for (const lastMileage of [-1, 10.5, "100", true, 2_147_483_648]) {
      const response = await request(
        scenario.ownerA.cookie,
        "POST",
        "/vehicles",
        vehiclePayload(customerA.id, { lastMileage, plate: "KMB0000" }),
      );
      expect(response.statusCode, JSON.stringify(lastMileage)).toBe(400);
    }
  });

  it("D3: marca, modelo e versão aceitam até 80 caracteres e recusam 81", async () => {
    for (const [index, field] of ["brand", "model", "version"].entries()) {
      const ok = await request(
        scenario.ownerA.cookie,
        "POST",
        "/vehicles",
        vehiclePayload(customerA.id, { [field]: "x".repeat(80), plate: `LEN${index}A00` }),
      );
      expect(ok.statusCode, `${field} 80`).toBe(201);
      const tooLong = await request(
        scenario.ownerA.cookie,
        "POST",
        "/vehicles",
        vehiclePayload(customerA.id, { [field]: "x".repeat(81), plate: "LEN9Z99" }),
      );
      expect(tooLong.statusCode, `${field} 81`).toBe(400);
    }
  });
});

describe("garantias do banco", () => {
  it("FK composta recusa veículo apontando para cliente de outra oficina", async () => {
    await expect(
      prisma.vehicle.create({
        data: {
          tenantId: scenario.tenantA.id,
          customerId: customerB.id,
          type: "CAR",
          brand: "X",
          model: "Y",
          plate: "FKA1234",
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("RESTRICT: cliente com veículo não pode ser excluído fisicamente", async () => {
    await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));

    await expect(prisma.customer.delete({ where: { id: customerA.id } })).rejects.toThrow();
    expect(await prisma.customer.count({ where: { id: customerA.id } })).toBe(1);
  });

  it("trigger impede trocar a oficina e CHECKs recusam dados fora do formato", async () => {
    const created = await createVehicle(scenario.ownerA.cookie, vehiclePayload(customerA.id));
    const where = { id: created.id };

    await expect(prisma.vehicle.update({ where, data: { tenantId: scenario.tenantB.id } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { plate: "abc1d23" } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { manufactureYear: 1800 } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { modelYear: 2030 } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { chassisNumber: "9BWZZZ377VT00I251" } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { renavam: "ABCDEFGHIJK" } })).rejects.toThrow();
    await expect(prisma.vehicle.update({ where, data: { lastMileage: -1 } })).rejects.toThrow();

    const row = await prisma.vehicle.findUniqueOrThrow({ where });
    expect(row).toMatchObject({ tenantId: scenario.tenantA.id, plate: "ABC1D23", lastMileage: 45230 });
  });
});
