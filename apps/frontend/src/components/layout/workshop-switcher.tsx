"use client";

import Link from "next/link";
import { Building2, Check, ChevronsUpDown, CreditCard, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockSession } from "@/lib/mock/session";

/**
 * Current workshop (tenant). Each user belongs to a single workshop for now
 * (docs/database/proposta-modelo-nucleo.md §3.1), so the list has one entry;
 * the menu is ready to list more units if multi-unit access is approved.
 */
export function WorkshopSwitcher() {
  const { tenant } = mockSession;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 max-w-44 gap-2 px-2 xl:max-w-56"
          aria-label={`Oficina atual: ${tenant.name}`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Store className="size-3.5" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-medium">{tenant.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Oficina</DropdownMenuLabel>
        <DropdownMenuItem className="items-start gap-2.5 py-2" aria-current="true">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Store className="size-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{tenant.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {tenant.document} · {tenant.city}
            </span>
            <Badge variant="secondary" className="mt-1.5 w-fit">
              Plano {tenant.plan}
            </Badge>
          </span>
          <Check className="mt-1 size-4 text-primary" aria-hidden="true" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/workshop">
            <Building2 aria-hidden="true" />
            Dados da oficina
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <CreditCard aria-hidden="true" />
            Assinatura e plano
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
