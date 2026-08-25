import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { recentWorkOrders } from "@/lib/mock/dashboard";

export function RecentWorkOrdersCard() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">Ordens de serviço recentes</h2>
        <p className="text-xs text-muted-foreground">Últimas OS abertas ou atualizadas</p>
      </div>

      {recentWorkOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma OS recente"
          description="As ordens de serviço aparecerão aqui assim que forem criadas."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium text-muted-foreground">Cliente</TableHead>
              <TableHead className="hidden px-4 text-xs font-medium text-muted-foreground md:table-cell">
                Veículo
              </TableHead>
              <TableHead className="hidden px-4 text-xs font-medium text-muted-foreground md:table-cell">
                Serviço
              </TableHead>
              <TableHead className="px-4 text-xs font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
                Valor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentWorkOrders.map((order) => (
              <TableRow
                key={order.id}
                className="border-border/40 transition-colors duration-150 hover:bg-muted/30"
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                      aria-hidden="true"
                    >
                      {order.customer.charAt(0)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-foreground">{order.customer}</span>
                      <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-muted-foreground/80 md:table-cell">
                  {order.vehicle}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-muted-foreground/80 md:table-cell">
                  {order.service}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                  {order.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
