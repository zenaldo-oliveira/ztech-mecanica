import { hash, verify } from "@node-rs/argon2";

// Argon2id com a linha de base do OWASP (19 MiB, 2 iterações, paralelismo 1) —
// docs/architecture/autenticacao.md §4.3. Calibrar conforme o servidor de produção.
// `algorithm: 2` = Argon2id (const enum do pacote não existe em runtime com esbuild/tsx).
const ARGON2ID_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2ID_OPTIONS);
}

/** Nunca lança por hash inválido: qualquer falha de verificação é `false`. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
