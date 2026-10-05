"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerCode, listCustomers, type Customer } from "@/lib/api/customers";
import { errorMessage } from "@/lib/api/errors";
import type { VehicleCustomerSummary } from "@/lib/api/vehicles";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const RESULT_LIMIT = 8;

interface VehicleCustomerPickerProps {
  id: string;
  value: VehicleCustomerSummary | null;
  onChange: (customer: VehicleCustomerSummary | null) => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Escolha do proprietário buscando os clientes reais da oficina (GET /customers?search=).
 * Clientes inativos aparecem desabilitados: o backend recusa vinculá-los (409).
 */
export function VehicleCustomerPicker({ id, value, onChange, invalid, describedBy }: VehicleCustomerPickerProps) {
  const listId = useId();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<{ key: string; customers: Customer[]; error?: string } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (value || !debounced) return;
    const controller = new AbortController();
    listCustomers({ search: debounced, pageSize: RESULT_LIMIT }, controller.signal)
      .then((response) => setResults({ key: debounced, customers: response.data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResults({ key: debounced, customers: [], error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [debounced, value]);

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
          invalid ? "border-destructive" : "border-input",
        )}
      >
        <span className="min-w-0 truncate text-sm">
          {value.name} <span className="text-muted-foreground">· {customerCode(value.number)}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(null);
            setSearch("");
          }}
        >
          <X aria-hidden="true" />
          Trocar
        </Button>
      </div>
    );
  }

  const isSearching = debounced !== "" && results?.key !== debounced;
  const current = results?.key === debounced ? results : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          placeholder="Buscar cliente por nome ou CPF/CNPJ…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-8"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-controls={listId}
          autoComplete="off"
        />
      </div>

      <div id={listId} aria-live="polite">
        {!debounced ? (
          <p className="text-xs text-muted-foreground">Digite para buscar entre os clientes cadastrados.</p>
        ) : isSearching ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Buscando clientes…
          </p>
        ) : current?.error ? (
          <p className="text-xs text-destructive">{current.error}</p>
        ) : current && current.customers.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : current ? (
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-1">
            {current.customers.map((customer) => {
              const inactive = customer.status === "INACTIVE";
              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    disabled={inactive}
                    onClick={() => onChange({ id: customer.id, number: customer.number, name: customer.name })}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0 truncate">{customer.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {inactive ? "Inativo" : customerCode(customer.number)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
