import type { FastifyInstance } from "fastify";

// Health check de liveness, para orquestração/monitoramento externo
// (docs/architecture/observabilidade.md §6). Não expõe detalhes internos.
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));
}
