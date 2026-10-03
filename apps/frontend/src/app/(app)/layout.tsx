import { redirect } from "next/navigation";

import { SessionProvider } from "@/components/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getServerSession } from "@/lib/api/server";

// Área privada: a sessão é validada no backend ANTES de renderizar qualquer conteúdo
// (sem flicker de conteúdo protegido). Sessão ausente, expirada ou revogada → /login.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerSession();
  if (!me) redirect("/login");

  return (
    <SessionProvider me={me}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
