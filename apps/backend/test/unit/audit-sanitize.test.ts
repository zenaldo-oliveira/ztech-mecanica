import { describe, expect, it } from "vitest";

import { sanitizeMetadata } from "../../src/modules/audit/audit-service.js";

describe("sanitizeMetadata", () => {
  it("mascara chaves sensíveis em qualquer nível", () => {
    const result = sanitizeMetadata({
      email: "a@b.test",
      password: "segredo",
      nested: { apiKey: "k", accessToken: "t", passwordHash: "h", certificatePfx: "x", ok: 1 },
      list: [{ secret: "s", name: "n" }],
    });

    expect(result).toEqual({
      email: "a@b.test",
      password: "[REDACTED]",
      nested: { apiKey: "[REDACTED]", accessToken: "[REDACTED]", passwordHash: "[REDACTED]", certificatePfx: "[REDACTED]", ok: 1 },
      list: [{ secret: "[REDACTED]", name: "n" }],
    });
  });

  it("trunca textos longos e estruturas profundas", () => {
    const long = "x".repeat(2000);
    const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };

    expect((sanitizeMetadata({ long }) as { long: string }).long.length).toBeLessThanOrEqual(1001);
    expect(JSON.stringify(sanitizeMetadata(deep))).toContain("[TRUNCATED]");
  });
});
