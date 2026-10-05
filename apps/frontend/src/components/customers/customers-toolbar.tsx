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
import { customerStatusConfig, customerStatusOptions } from "@/lib/customer-status";
import { personTypeLabels, personTypeOptions } from "@/lib/customer-options";
import type { CustomerStatus, PersonType } from "@/lib/api/customers";

export type CustomerStatusFilter = CustomerStatus | "ALL";
export type PersonTypeFilter = PersonType | "ALL";

interface CustomersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: CustomerStatusFilter;
  onStatusFilterChange: (value: CustomerStatusFilter) => void;
  personTypeFilter: PersonTypeFilter;
  onPersonTypeFilterChange: (value: PersonTypeFilter) => void;
}

export function CustomersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  personTypeFilter,
  onPersonTypeFilterChange,
}: CustomersToolbarProps) {
  const statusLabel = statusFilter === "ALL" ? "Todos" : customerStatusConfig[statusFilter].label;
  const personTypeLabel = personTypeFilter === "ALL" ? "Todos" : personTypeLabels[personTypeFilter];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="customers-search" className="sr-only">
          Pesquisar clientes por nome ou documento
        </label>
        <Input
          id="customers-search"
          type="search"
          placeholder="Pesquisar clientes..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              Status: <span className="text-foreground">{statusLabel}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as CustomerStatusFilter)}
            >
              <DropdownMenuRadioItem value="ALL">Todos</DropdownMenuRadioItem>
              {customerStatusOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              Tipo: <span className="text-foreground">{personTypeLabel}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup
              value={personTypeFilter}
              onValueChange={(value) => onPersonTypeFilterChange(value as PersonTypeFilter)}
            >
              <DropdownMenuRadioItem value="ALL">Todos</DropdownMenuRadioItem>
              {personTypeOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
