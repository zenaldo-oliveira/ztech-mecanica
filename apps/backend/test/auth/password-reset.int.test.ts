import { Writable } from "node:stream";

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { PrismaClient } from "../../src/db/client.js";
import { hashResetToken, RESET_TOKEN_TTL_MS } from "../../src/modules/auth/password-reset.service.js";
import { MockEmailProvider } from "../../src/modules/email/mock-email-provider.js";
import { syncRbacCatalog } from "../../src/modules/rbac/catalog-sync.js";
import { createTestPrisma, resetDatabase } from "../helpers/db.js";
import { createTenant, createUserWithPassword, sessionCookieFrom, testEnv } from "../helpers/fixtures.js";

const EMAIL = "dono@oficina-a.test";
const OLD_PASSWORD = "senha-antiga-123";
const NEW_PASSWORD = "senha-nova-456789";
const TOKEN_IN_LINK = /\/reset-password#token=([A-Za-z0-9_-]{43})$/m;

let prisma: PrismaClient;
let app: FastifyInstance;
let mailbox: MockEmailProvider;
let clockOffsetMs = 0;
const logLines: string[] = [];

beforeAll(async () => {
  prisma = createTestPrisma();
  mailbox = new MockEmailProvider();
  const logStream = new Writable({
    write(chunk, _encoding, callback) {
      logLines.push(chunk.toString());
      callback();
    },
  });
  app = buildApp({
    env: { ...testEnv, LOG_LEVEL: "trace" },
    prisma,
    emailProvider: mailbox,
    logStream,
    now: () => new Date(Date.now() + clockOffsetMs),
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  clockOffsetMs = 0;
  mailbox.clear();
  logLines.length = 0;
  await resetDatabase(prisma);
  await syncRbacCatalog(prisma);
  const tenant = await createTenant(prisma, "11222333000181", "Oficina A");
  await createUserWithPassword(prisma, tenant.id, { email: EMAIL, password: OLD_PASSWORD });
});

const forgot = (email: string) => app.inject({ method: "POST", url: "/api/v1/auth/password/forgot", payload: { email } });
const reset = (token: string, password: string) =>
  app.inject({ method: "POST", url: "/api/v1/auth/password/reset", payload: { token, password } });
const login = (password: string) =>
  app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: EMAIL, password } });

async function requestTokenFor(email = EMAIL): Promise<string> {
  await forgot(email);
  const message = mailbox.sent.at(-1);
  const match = message?.text.match(TOKEN_IN_LINK);
  if (!match) throw new Error("e-mail de redefinição não encontrado");
  return match[1];
}

describe("POST /api/v1/auth/password/forgot", () => {
  it("e-mail cadastrado: 202, envia link com token no fragmento e audita", async () => {
    const response = await forgot("  DONO@oficina-a.test ");

    expect(response.statusCode).toBe(202);
    expect(mailbox.sent).toHaveLength(1);
    const [message] = mailbox.sent;
    expect(message.to).toBe(EMAIL);
    expect(message.text).toMatch(TOKEN_IN_LINK);
    expect(message.text).toContain("http://localhost:3000/reset-password#token=");
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "PASSWORD_RESET_REQUESTED" } });
    expect(audit.entity).toBe("User");
  });

  it("e-mail inexistente: mesma resposta, nenhum e-mail e nenhum token", async () => {
    const known = await forgot(EMAIL);
    mailbox.clear();
    const unknown = await forgot("ninguem@oficina.test");

    expect(unknown.statusCode).toBe(known.statusCode);
    expect(unknown.json()).toEqual(known.json());
    expect(mailbox.sent).toHaveLength(0);
    expect(await prisma.passwordResetToken.count({ where: { user: { email: "ninguem@oficina.test" } } })).toBe(0);
  });

  it("usuário bloqueado: mesma resposta e nenhum e-mail", async () => {
    await prisma.user.update({ where: { email: EMAIL }, data: { status: "BLOCKED" } });

    const response = await forgot(EMAIL);

    expect(response.statusCode).toBe(202);
    expect(mailbox.sent).toHaveLength(0);
  });

  it("guarda somente o hash do token no banco", async () => {
    const token = await requestTokenFor();

    const rows = await prisma.$queryRawUnsafe<{ token_hash: string }[]>("SELECT token_hash FROM password_reset_tokens");
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).toBe(hashResetToken(token));
    const leaked = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT count(*) FROM password_reset_tokens WHERE position($1 in row_to_json(password_reset_tokens.*)::text) > 0",
      token,
    );
    expect(Number(leaked[0].count)).toBe(0);
  });
});

describe("POST /api/v1/auth/password/reset", () => {
  it("redefine a senha, encerra sessões, consome o token e audita", async () => {
    const oldSession = sessionCookieFrom(await login(OLD_PASSWORD))!;
    const token = await requestTokenFor();

    const response = await reset(token, NEW_PASSWORD);

    expect(response.statusCode).toBe(204);
    expect((await login(OLD_PASSWORD)).statusCode).toBe(401);
    expect((await login(NEW_PASSWORD)).statusCode).toBe(200);
    const meOld = await app.inject({ method: "GET", url: "/api/v1/me", headers: { cookie: oldSession } });
    expect(meOld.statusCode).toBe(401);

    const stored = await prisma.passwordResetToken.findFirstOrThrow();
    expect(stored.usedAt).not.toBeNull();
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "PASSWORD_RESET_COMPLETED" } });
    expect(audit.metadata).toEqual({ revokedSessions: 1 });
  });

  it("token já utilizado: 400", async () => {
    const token = await requestTokenFor();
    await reset(token, NEW_PASSWORD);

    const again = await reset(token, "outra-senha-forte-1");

    expect(again.statusCode).toBe(400);
    expect(again.json().error.code).toBe("INVALID_RESET_TOKEN");
    expect((await login(NEW_PASSWORD)).statusCode).toBe(200);
  });

  it("token expirado (30 min): 400 e a senha não muda", async () => {
    const token = await requestTokenFor();
    clockOffsetMs = RESET_TOKEN_TTL_MS + 1000;

    const response = await reset(token, NEW_PASSWORD);

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_RESET_TOKEN");
    clockOffsetMs = 0;
    expect((await login(OLD_PASSWORD)).statusCode).toBe(200);
  });

  it("token inválido ou malformado: 400", async () => {
    const unknown = await reset("A".repeat(43), NEW_PASSWORD);
    const malformed = await reset("curto", NEW_PASSWORD);

    expect(unknown.statusCode).toBe(400);
    expect(unknown.json().error.code).toBe("INVALID_RESET_TOKEN");
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("novo pedido invalida o link anterior", async () => {
    const first = await requestTokenFor();
    const second = await requestTokenFor();

    expect((await reset(first, NEW_PASSWORD)).statusCode).toBe(400);
    expect((await reset(second, NEW_PASSWORD)).statusCode).toBe(204);
  });

  it("senha fraca: 400 de validação sem consumir o token", async () => {
    const token = await requestTokenFor();

    const weak = await reset(token, "curta");

    expect(weak.statusCode).toBe(400);
    expect(weak.json().error.code).toBe("VALIDATION_ERROR");
    expect((await reset(token, NEW_PASSWORD)).statusCode).toBe(204);
  });

  it("token de redefinição e senhas nunca aparecem nos logs nem na auditoria", async () => {
    const token = await requestTokenFor();
    await reset(token, NEW_PASSWORD);

    const logs = logLines.join("\n");
    expect(logs.length).toBeGreaterThan(0);
    expect(logs).not.toContain(token);
    expect(logs).not.toContain(NEW_PASSWORD);
    const audits = JSON.stringify(await prisma.auditLog.findMany());
    expect(audits).not.toContain(token);
    expect(audits).not.toContain(NEW_PASSWORD);
  });
});
