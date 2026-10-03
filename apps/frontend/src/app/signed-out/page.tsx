import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sessão encerrada",
};

// Mock logout destination. Real authentication (server-side session) arrives in P0;
// until then "Sair" only lands here and nothing is revoked.
export default function SignedOutPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Você saiu do ZTech Mecânica</h1>
          <p className="text-sm text-muted-foreground">
            Ambiente de demonstração: o login real será habilitado junto com a autenticação.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard">
            <LogOut className="rotate-180" aria-hidden="true" />
            Entrar novamente
          </Link>
        </Button>
      </div>
    </main>
  );
}
