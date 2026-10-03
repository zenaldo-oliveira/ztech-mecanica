/**
 * Abstração de envio de e-mail. O domínio depende só desta interface; provedores
 * reais (Resend, Amazon SES…) entram como novas implementações, com credenciais
 * vindas exclusivamente de variáveis de ambiente.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}
