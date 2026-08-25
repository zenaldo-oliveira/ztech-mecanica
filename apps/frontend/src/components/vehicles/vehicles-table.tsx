import Link from "next/link";
import { Car, Eye, MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VehicleTypeIcon } from "@/components/vehicles/vehicle-type-icon";
import type { Vehicle } from "@/lib/mock/vehicles";

interface VehiclesTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
}

function formatMileage(mileage?: number): string {
  if (mileage === undefined) return "—";
  return `${mileage.toLocaleString("pt-BR")} km`;
}

export function VehiclesTable({ vehicles, onEdit }: VehiclesTableProps) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Nenhum veículo cadastrado"
        description="Cadastre o primeiro veículo para começar a acompanhar o histórico da oficina."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/40 hover:bg-transparent">
          <TableHead className="px-4 text-xs font-medium text-muted-foreground">Veículo</TableHead>
          <TableHead className="px-4 text-xs font-medium text-muted-foreground">Placa</TableHead>
          <TableHead className="hidden px-4 text-xs font-medium text-muted-foreground md:table-cell">
            Cliente
          </TableHead>
          <TableHead className="hidden px-4 text-right text-xs font-medium text-muted-foreground md:table-cell">
            Quilometragem
          </TableHead>
          <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => {
          const secondaryLine = [vehicle.version, vehicle.modelYear ?? vehicle.manufactureYear]
            .filter(Boolean)
            .join(" · ");

          return (
            <TableRow
              key={vehicle.id}
              className="group border-border/40 transition-colors duration-150 hover:bg-muted/30"
            >
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <VehicleTypeIcon type={vehicle.type} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {vehicle.brand} {vehicle.model}
                    </span>
                    {secondaryLine ? (
                      <span className="text-xs text-muted-foreground/70">{secondaryLine}</span>
                    ) : null}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <span className="font-mono text-sm font-medium text-foreground">{vehicle.plate}</span>
              </TableCell>
              <TableCell className="hidden px-4 py-3 md:table-cell">
                <Link
                  href={`/customers/${vehicle.customer.id}`}
                  className="text-sm text-muted-foreground/80 hover:text-foreground hover:underline"
                >
                  {vehicle.customer.name}
                </Link>
              </TableCell>
              <TableCell className="hidden px-4 py-3 text-right text-xs text-muted-foreground/80 md:table-cell">
                {formatMileage(vehicle.mileage)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 hover:text-foreground"
                          aria-label={`Ações para ${vehicle.brand} ${vehicle.model}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">Mais ações</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <Eye />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(vehicle)}>
                      <Pencil />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
