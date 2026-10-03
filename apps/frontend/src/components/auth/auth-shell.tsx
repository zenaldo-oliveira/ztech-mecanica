import { Lock } from "lucide-react";

import { AuthBackground } from "@/components/auth/auth-background";
import { enterDelay } from "@/components/auth/motion";

/**
 * Moldura das telas públicas de autenticação: fundo tecnológico de tela cheia com o
 * conteúdo (cartão) centralizado. Cada tela renderiza o próprio <AuthCard>, o que
 * permite ao login retirar o cartão e exibir a transição após o sucesso real da API.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="dark relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <AuthBackground />

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">{children}</main>

      <footer
        className="auth-fade-in relative flex items-center justify-center gap-1.5 pb-6 text-xs text-sidebar-foreground/45"
        style={enterDelay(700)}
      >
        <Lock className="size-3" aria-hidden="true" />
        Conexão protegida · © {year} ZTECH OFICINA
      </footer>
    </div>
  );
}
