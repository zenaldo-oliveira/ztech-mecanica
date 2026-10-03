import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";

export { PrismaClient };

/**
 * Cria um PrismaClient para a URL informada. Sem singleton global: quem cria
 * (servidor, seed, testes) é responsável por chamar `$disconnect()`.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
