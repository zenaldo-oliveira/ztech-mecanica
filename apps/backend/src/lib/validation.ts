import type { z } from "zod";

import { validationError } from "./errors.js";

/** Valida input externo com Zod. Em falha, devolve apenas caminho e mensagem de cada problema. */
export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.infer<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw validationError(result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
  }
  return result.data;
}
