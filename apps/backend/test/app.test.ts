import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { buildApp, REQUEST_ID_HEADER } from "../src/app.js";
import { EnvValidationError, loadEnv, type Env } from "../src/config/env.js";

const testEnv: Env = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3333,
  LOG_LEVEL: "info",
};

function createLogCollector() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim()) lines.push(JSON.parse(line));
      }
      callback();
    },
  });
  return { lines, stream };
}

describe("GET /health", () => {
  it("responde 200 com status ok", async () => {
    const app = buildApp({ env: { ...testEnv, LOG_LEVEL: "silent" } });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });
});

describe("request ID", () => {
  it("registra logs JSON estruturados contendo requestId", async () => {
    const { lines, stream } = createLogCollector();
    const app = buildApp({ env: testEnv, logStream: stream });

    const response = await app.inject({ method: "GET", url: "/health" });
    await app.close();

    const requestId = response.headers[REQUEST_ID_HEADER];
    const requestLogs = lines.filter((line) => "requestId" in line);

    expect(requestId).toEqual(expect.any(String));
    expect(requestLogs.length).toBeGreaterThan(0);
    expect(requestLogs.every((line) => line.requestId === requestId)).toBe(true);
  });

  it("ignora request ID enviado pelo cliente", async () => {
    const app = buildApp({ env: { ...testEnv, LOG_LEVEL: "silent" } });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { [REQUEST_ID_HEADER]: "forjado-pelo-cliente" },
    });
    await app.close();

    expect(response.headers[REQUEST_ID_HEADER]).not.toBe("forjado-pelo-cliente");
  });
});

describe("loadEnv", () => {
  it("falha rapidamente quando variável obrigatória está ausente", () => {
    const { PORT: _omitted, ...withoutPort } = {
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: "3333",
      LOG_LEVEL: "info",
    };

    expect(() => loadEnv(withoutPort)).toThrow(EnvValidationError);
    expect(() => loadEnv(withoutPort)).toThrow(/PORT/);
  });

  it("não inclui valores das variáveis na mensagem de erro", () => {
    const secretLooking = "valor-que-nao-pode-vazar";

    try {
      loadEnv({ NODE_ENV: secretLooking, HOST: "h", PORT: "1", LOG_LEVEL: "info" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect((error as Error).message).not.toContain(secretLooking);
      expect((error as EnvValidationError).variables).toEqual(["NODE_ENV"]);
    }
  });

  it("converte PORT para número", () => {
    const env = loadEnv({ NODE_ENV: "test", HOST: "h", PORT: "8080", LOG_LEVEL: "info" });
    expect(env.PORT).toBe(8080);
  });
});
