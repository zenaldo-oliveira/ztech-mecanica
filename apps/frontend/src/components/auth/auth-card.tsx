import { Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

export function AuthBrand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_30px_-8px_var(--sidebar-primary)]">
        <Wrench className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        ZTECH <span className="font-normal text-muted-foreground">OFICINA</span>
      </span>
    </div>
  );
}

interface AuthCardProps {
  children: React.ReactNode;
  /** Quando true, o cartão sai de cena (opacity + translateY + scale). */
  leaving?: boolean;
  className?: string;
}

/**
 * Cartão central das telas de autenticação. Entrada curta (opacity + translateY + scale);
 * herda os tokens do tema escuro pelo escopo `.dark` da moldura.
 */
export function AuthCard({
  children,
  leaving = false,
  className,
}: AuthCardProps) {
  return (
    <section
      className={cn(
        "relative w-full max-w-[25rem] rounded-2xl border border-white/10 bg-slate-950/40 p-7 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-2xl backdrop-saturate-150 sm:p-9",
        leaving ? "auth-card-leave" : "auth-card-enter",
        className,
      )}
    >
      {/* Filete de luz no topo do cartão */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-sidebar-primary/70 to-transparent"
      />
      <div className="flex flex-col gap-7">
        <AuthBrand />
        {children}
      </div>
    </section>
  );
}
