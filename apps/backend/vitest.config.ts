import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/setup/db-global-setup.ts"],
    // Testes de integração compartilham o mesmo banco: arquivos em série evitam interferência.
    fileParallelism: false,
  },
});
