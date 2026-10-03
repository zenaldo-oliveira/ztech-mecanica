import { Writable } from "node:stream";

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { hashSessionToken } from "../../src/modules/auth/session-service.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTenant, createUserWithPassword, sessionCookieFrom, testEnv } from "../helpers/fixtures.js";

const PASSWORD = "senha-de-teste-123";
const EMAIL = "dono@oficina-a.test";

let prisma: PrismaClient;
let app: FastifyInstance;
let tenantA: { id: string };
let tenantB: { id: string };

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
  await syncRbacCatalog(prisma);
  tenantA = await createTenant(prisma, "11222333000181", "Oficina A");
  tenantB = await createTenant(prisma, "44555666000181", "Oficina B");
  await createUserWithPassword(prisma, tenantA.id, { email: EMAIL, password: PASSWORD });
});

const login = (email: string, password: string, cookie?: string) =>
  app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password }, headers: cookie ? { cookie } : {} });

describe("POST /api/v1/auth/login", () => {
  it("credenciais válidas: 200, dados públicos e cookie de sessão seguro", async () => {
    const response = await login(EMAIL, PASSWORD);

    expect(response.statusCode).toBe(200);
    const { data } = response.json();
    expect(data.user.email).toBe(EMAIL);
    expect(data.tenant.id).toBe(tenantA.id);
    expect(data.roles).toEqual(["OWNER"]);

    const cookie = response.cookies.find((item) => item.name === "ztech_session");
    expect(cookie).toBeDefined();
    expect(cookie!.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
    expect(cookie!.secure).toBeFalsy(); // ambiente de teste/desenvolvimento usa http

    // O token não está no corpo; nada de senha ou hash na resposta.
    expect(response.body).not.toContain(cookie!.value);
    expect(response.body).not.toContain("passwordHash");
    expect(response.body).not.toContain(PASSWORD);
  });

  it("cria sessão no banco guardando somente o hash do token e registra auditoria", async () => {
    const response = await login(EMAIL, PASSWORD);
    const token = response.cookies.find((item) => item.name === "ztech_session")!.value;

    const session = await prisma.session.findUniqueOrThrow({ where: { tokenHash: hashSessionToken(token) } });
    expect(session.tenantId).toBe(tenantA.id);
    expect(await prisma.session.count({ where: { tokenHash: token } })).toBe(0);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.lastLoginAt).toBeInstanceOf(Date);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "LOGIN_SUCCEEDED" } });
    expect(audit).toMatchObject({ tenantId: tenantA.id, userId: user.id, entityId: session.id });
  });

  it("normaliza o e-mail (maiúsculas e espaços)", async () => {
    const response = await login("  DONO@Oficina-A.test ", PASSWORD);
    expect(response.statusCode).toBe(200);
  });

  it("senha errada: 401 genérico, sem cookie, auditoria LOGIN_FAILED", async () => {
    const response = await login(EMAIL, "senha-errada-999");

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toMatchObject({ code: "INVALID_CREDENTIALS", message: "E-mail ou senha inválidos." });
    expect(sessionCookieFrom(response)).toBeUndefined();
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "LOGIN_FAILED" } });
    expect(audit.tenantId).toBe(tenantA.id);
    expect(audit.metadata).toEqual({ reason: "WRONG_PASSWORD" });
  });

  it("e-mail inexistente: resposta idêntica à de senha errada (não revela existência)", async () => {
    const wrongPassword = await login(EMAIL, "senha-errada-999");
    const unknownEmail = await login("ninguem@oficina.test", PASSWORD);

    expect(unknownEmail.statusCode).toBe(wrongPassword.statusCode);
    const { requestId: _a, ...wrongBody } = wrongPassword.json().error;
    const { requestId: _b, ...unknownBody } = unknownEmail.json().error;
    expect(unknownBody).toEqual(wrongBody);

    // Auditado como evento da plataforma, sem o e-mail digitado em texto.
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "LOGIN_FAILED", tenantId: null } });
    expect(audit.actorType).toBe("SYSTEM");
    expect(JSON.stringify(audit.metadata)).not.toContain("ninguem");
  });

  it("usuário bloqueado ou com convite pendente: 401 genérico mesmo com a senha correta", async () => {
    await createUserWithPassword(prisma, tenantA.id, { email: "bloqueado@oficina-a.test", password: PASSWORD, status: "BLOCKED" });
    await createUserWithPassword(prisma, tenantA.id, { email: "convidado@oficina-a.test", password: PASSWORD, status: "INVITED" });

    for (const email of ["bloqueado@oficina-a.test", "convidado@oficina-a.test"]) {
      const response = await login(email, PASSWORD);
      expect(response.statusCode, email).toBe(401);
      expect(response.json().error.code).toBe("INVALID_CREDENTIALS");
      expect(sessionCookieFrom(response)).toBeUndefined();
    }
  });

  it("oficina suspensa: 401 genérico", async () => {
    await prisma.tenant.update({ where: { id: tenantA.id }, data: { status: "SUSPENDED" } });

    const response = await login(EMAIL, PASSWORD);

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejeita campos extras como tenantId (400)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: EMAIL, password: PASSWORD, tenantId: tenantB.id },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("novo login revoga a sessão anterior enviada no cookie (anti fixação de sessão)", async () => {
    const first = sessionCookieFrom(await login(EMAIL, PASSWORD))!;
    const second = await login(EMAIL, PASSWORD, first);

    expect(second.statusCode).toBe(200);
    const meWithOld = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: first } });
    expect(meWithOld.statusCode).toBe(401);
  });

  it("em produção o cookie é Secure", async () => {
    const productionApp = buildApp({ env: { ...testEnv, NODE_ENV: "production" }, prisma });
    await productionApp.ready();
    const response = await productionApp.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: EMAIL, password: PASSWORD },
    });
    await productionApp.close();

    const cookie = response.cookies.find((item) => item.name === "ztech_session");
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  });
});

describe("GET /api/v1/me com sessão criada pelo login", () => {
  it("retorna o usuário e a oficina corretos", async () => {
    const cookie = sessionCookieFrom(await login(EMAIL, PASSWORD))!;

    const response = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie } });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.user.email).toBe(EMAIL);
    expect(response.json().data.tenant.id).toBe(tenantA.id);
  });

  it("sem sessão: 401", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/me" });
    expect(response.statusCode).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("revoga a sessão, limpa o cookie e registra auditoria", async () => {
    const cookie = sessionCookieFrom(await login(EMAIL, PASSWORD))!;

    const response = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });

    expect(response.statusCode).toBe(204);
    const cleared = response.cookies.find((item) => item.name === "ztech_session");
    expect(cleared?.value).toBe("");
    expect(cleared?.expires?.getTime()).toBeLessThan(Date.now());

    const session = await prisma.session.findFirstOrThrow();
    expect(session.revokedAt).not.toBeNull();
    expect(session.revokedReason).toBe("LOGOUT");
    expect(await prisma.auditLog.count({ where: { action: "LOGOUT", tenantId: tenantA.id } })).toBe(1);

    const me = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });

  it("é idempotente: repetir, sem cookie ou com cookie inválido sempre retorna 204", async () => {
    const cookie = sessionCookieFrom(await login(EMAIL, PASSWORD))!;

    const first = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });
    const again = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });
    const noCookie = await app.inject({ method: "POST", url: "/api/v1/auth/logout" });
    const garbage = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie: "ztech_session=lixo" } });

    expect([first.statusCode, again.statusCode, noCookie.statusCode, garbage.statusCode]).toEqual([204, 204, 204, 204]);
    expect(await prisma.auditLog.count({ where: { action: "LOGOUT" } })).toBe(1);
  });
});

describe("segurança dos logs", () => {
  it("token de sessão, cookie e senha nunca aparecem nos logs", async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const loggedApp = buildApp({ env: { ...testEnv, LOG_LEVEL: "trace" }, prisma, logStream: stream });
    await loggedApp.ready();

    const loginResponse = await loggedApp.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: EMAIL, password: PASSWORD },
    });
    const token = loginResponse.cookies.find((item) => item.name === "ztech_session")!.value;
    await loggedApp.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: `ztech_session=${token}` } });
    await loggedApp.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie: `ztech_session=${token}` } });
    await loggedApp.close();

    const logs = lines.join("\n");
    expect(logs.length).toBeGreaterThan(0);
    expect(logs).not.toContain(token);
    expect(logs).not.toContain(PASSWORD);
    expect(logs).not.toContain(hashSessionToken(token));
  });
});
