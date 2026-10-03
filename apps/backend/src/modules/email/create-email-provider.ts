import path from "node:path";

import type { Env } from "../../config/env.js";
import type { EmailProvider } from "./email-provider.js";
import { MockEmailProvider } from "./mock-email-provider.js";

/** Escolhe o provedor de e-mail pela configuração. Novos provedores entram aqui. */
export function createEmailProvider(env: Env): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case "mock":
      return new MockEmailProvider({
        outboxDir: env.NODE_ENV === "development" ? path.resolve(env.DEV_MAIL_DIR) : undefined,
      });
  }
}
