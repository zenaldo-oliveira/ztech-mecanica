"use client";

import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { vehicleTypeLabels, type VehicleType } from "@/lib/api/vehicles";

export type VehicleTypeFilter = VehicleType | "ALL";

interface VehiclesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: VehicleTypeFilter;
  onTypeFilterChange: (value: VehicleTypeFilter) => void;
}

/** Filtros aprovados em docs/modules/veiculos.md §9: busca (placa, marca, modelo) e tipo. */
export function VehiclesToolbar({ search, onSearchChange, typeFilter, onTypeFilterChange }: VehiclesToolbarProps) {
  const typeLabel = typeFilter === "ALL" ? "Todos" : vehicleTypeLabels[typeFilter];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="vehicles-search" className="sr-only">
          Pesquisar veículos por placa, marca ou modelo
        </label>
        <Input
          id="vehicles-search"
          type="search"
          placeholder="Pesquisar placa, marca ou modelo..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-8"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit text-muted-foreground">
            Tipo: <span className="text-foreground">{typeLabel}</span>
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuRadioGroup
            value={typeFilter}
            onValueChange={(value) => onTypeFilterChange(value as VehicleTypeFilter)}
          >
            <DropdownMenuRadioItem value="ALL">Todos</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="CAR">{vehicleTypeLabels.CAR}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="MOTORCYCLE">{vehicleTypeLabels.MOTORCYCLE}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
