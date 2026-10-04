import { Skeleton } from "@/components/ui/skeleton";

// Feedback imediato na navegação entre telas da área logada: as rotas são dinâmicas
// (sessão validada no layout), então o conteúdo novo depende do servidor. O app shell
// (sidebar/topbar) continua visível; só a área de conteúdo mostra este esqueleto.
export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">Carregando…</span>

      <div className="flex flex-col gap-2 border-b border-border pb-5" aria-hidden="true">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
