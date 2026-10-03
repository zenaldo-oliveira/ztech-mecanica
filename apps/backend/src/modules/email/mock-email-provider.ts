import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EmailMessage, EmailProvider } from "./email-provider.js";

/**
 * Provedor de e-mail para desenvolvimento e testes. Não envia nada.
 * - Guarda as mensagens em memória (`sent`), para os testes inspecionarem.
 * - Opcionalmente grava cada mensagem em `outboxDir` (desenvolvimento), para o
 *   desenvolvedor abrir o link sem que o conteúdo apareça em logs.
 * Bloqueado em produção pela validação de ambiente (src/config/env.ts).
 */
export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  private readonly messages: EmailMessage[] = [];

  constructor(private readonly options: { outboxDir?: string } = {}) {}

  get sent(): readonly EmailMessage[] {
    return this.messages;
  }

  async send(message: EmailMessage): Promise<void> {
    this.messages.push({ ...message });
    if (!this.options.outboxDir) return;

    await mkdir(this.options.outboxDir, { recursive: true });
    const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.json`;
    await writeFile(path.join(this.options.outboxDir, fileName), JSON.stringify(message, null, 2), "utf8");
  }

  clear(): void {
    this.messages.length = 0;
  }
}
