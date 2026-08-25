import { PackageCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { criticalStockItems } from "@/lib/mock/dashboard";

export function CriticalStockCard() {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Estoque crítico</CardTitle>
        <CardDescription className="text-xs">Produtos próximos do estoque mínimo</CardDescription>
      </CardHeader>
      <CardContent>
        {criticalStockItems.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Estoque sob controle"
            description="Nenhum produto está próximo do estoque mínimo no momento."
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {criticalStockItems.map((item) => {
              const ratio = item.quantity / item.minStock;
              const isCritical = item.quantity <= 1;

              return (
                <li key={item.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums",
                        isCritical ? "text-destructive" : "text-warning",
                      )}
                    >
                      {item.quantity} {item.quantity === 1 ? "un." : "un."}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(ratio * 100, 100)}
                    className={cn(
                      "h-1.5",
                      isCritical
                        ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                        : "[&>[data-slot=progress-indicator]]:bg-warning",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium tracking-wide uppercase",
                      isCritical ? "text-destructive" : "text-warning",
                    )}
                  >
                    {isCritical ? "Crítico" : "Estoque baixo"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
