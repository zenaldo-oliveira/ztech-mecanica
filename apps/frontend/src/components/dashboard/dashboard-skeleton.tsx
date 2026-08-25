import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Resumo Operacional */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border/60 px-5 py-3 sm:px-6">
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-2 divide-y divide-border/60 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5 px-5 py-4 sm:px-6 sm:py-5">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Ordens de Serviço + Status */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="flex flex-col gap-2 p-5 sm:p-6 lg:col-span-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
          <div className="flex flex-col items-center gap-3 p-5 sm:p-6">
            <Skeleton className="h-56 w-56 rounded-full" />
          </div>
        </div>
      </div>

      {/* Estoque + Serviços */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Financeiro discreto */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
