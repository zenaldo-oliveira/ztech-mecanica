import { z } from "zod";

// Variáveis de ambiente do backend. Toda variável obrigatória é validada na
// inicialização (fail-fast) — ver checklist/backend/01-configuracao.md.
const DEFAULT_APP_URL = "http://localhost:3000";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    HOST: z.string().min(1),
    PORT: z.coerce.number().int().min(1).max(65535),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "URL PostgreSQL inválida"),
    /** URL pública do frontend, usada nos links enviados por e-mail. */
    APP_URL: z.url().optional(),
    /** Provedor de e-mail. Somente "mock" nesta fase (Resend/SES entram depois). */
    EMAIL_PROVIDER: z.enum(["mock"]).default("mock"),
    /** Pasta onde o MockEmailProvider grava e-mails em desenvolvimento. */
    DEV_MAIL_DIR: z.string().min(1).default(".dev-mail"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (!env.APP_URL?.startsWith("https://")) {
      ctx.addIssue({ code: "custom", path: ["APP_URL"], message: "APP_URL https obrigatória em produção" });
    }
    if (env.EMAIL_PROVIDER === "mock") {
      ctx.addIssue({ code: "custom", path: ["EMAIL_PROVIDER"], message: "provedor mock não é permitido em produção" });
    }
  })
  .transform((env) => ({ ...env, APP_URL: env.APP_URL ?? DEFAULT_APP_URL }));

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  readonly variables: string[];

  constructor(variables: string[]) {
    // Somente os nomes das variáveis — nunca os valores, que podem ser segredos.
    super(`Variáveis de ambiente ausentes ou inválidas: ${variables.join(", ")}`);
    this.name = "EnvValidationError";
    this.variables = variables;
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const variables = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new EnvValidationError(variables);
  }

  return result.data;
}
