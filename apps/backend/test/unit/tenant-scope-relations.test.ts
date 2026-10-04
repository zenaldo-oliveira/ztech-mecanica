import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MODEL_RELATIONS } from "../../src/db/tenant-scope.js";

const SCHEMA_PATH = fileURLToPath(new URL("../../prisma/schema.prisma", import.meta.url));

/** Extrai do schema.prisma: modelo → { campo de relação → modelo de destino }. */
function relationsFromSchema(schema: string): Record<string, Record<string, string>> {
  const blocks = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(([, name, body]) => ({ name, body }));
  const modelNames = new Set(blocks.map((block) => block.name));

  return Object.fromEntries(
    blocks.map(({ name, body }) => {
      const relations: Record<string, string> = {};
      for (const line of body.split("\n")) {
        const match = /^\s+(\w+)\s+(\w+)(\[\])?\??(\s|$)/.exec(line);
        if (match && modelNames.has(match[2])) relations[match[1]] = match[2];
      }
      return [name, relations];
    }),
  );
}

describe("mapa de relações do escopo da oficina", () => {
  it("corresponde exatamente às relações do schema.prisma", () => {
    const schema = readFileSync(SCHEMA_PATH, "utf8");

    expect(MODEL_RELATIONS).toEqual(relationsFromSchema(schema));
  });
});
