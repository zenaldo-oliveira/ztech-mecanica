"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCw, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useCan } from "@/components/auth/session-provider";
import { CustomerDeactivateDialog } from "@/components/customers/customer-deactivate-dialog";
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet";
import { CustomersPagination } from "@/components/customers/customers-pagination";
import { CustomersSkeleton } from "@/components/customers/customers-skeleton";
import { CustomersTable } from "@/components/customers/customers-table";
import {
  CustomersToolbar,
  type CustomerStatusFilter,
  type PersonTypeFilter,
} from "@/components/customers/customers-toolbar";
import { listCustomers, type Customer } from "@/lib/api/customers";
import { errorMessage } from "@/lib/api/errors";

const PAGE_SIZE = 20;
/** Espera após a digitação antes de consultar a API (evita uma requisição por tecla). */
const SEARCH_DEBOUNCE_MS = 300;

interface CustomersPage {
  customers: Customer[];
  total: number;
}

export function CustomersView() {
  const canCreate = useCan("customers.create");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("ALL");
  const [personTypeFilter, setPersonTypeFilter] = useState<PersonTypeFilter>("ALL");
  const [page, setPage] = useState(1);

  const [reloadToken, setReloadToken] = useState(0);
  /** Última resposta da API, com a chave da consulta que a originou. */
  const [response, setResponse] = useState<{ key: string; data?: CustomersPage; error?: string } | null>(null);
  /** Último resultado bem-sucedido: continua visível enquanto a próxima página carrega. */
  const [result, setResult] = useState<CustomersPage | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<Customer | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const queryKey = JSON.stringify([page, debouncedSearch, statusFilter, personTypeFilter, reloadToken]);
  const isLoading = response?.key !== queryKey;
  const loadError = response?.key === queryKey ? (response.error ?? null) : null;

  useEffect(() => {
    const controller = new AbortController();

    listCustomers(
      {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        personType: personTypeFilter === "ALL" ? undefined : personTypeFilter,
      },
      controller.signal,
    )
      .then((list) => {
        const totalPages = Math.max(1, Math.ceil(list.meta.total / PAGE_SIZE));
        // A página pode ter ficado vazia (ex.: após inativar o último item com filtro ativo).
        if (list.data.length === 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        const data = { customers: list.data, total: list.meta.total };
        setResult(data);
        setResponse({ key: queryKey, data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResponse({ key: queryKey, error: errorMessage(error) });
      });

    return () => controller.abort();
  }, [queryKey, page, debouncedSearch, statusFilter, personTypeFilter]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleNewCustomer() {
    setEditingCustomer(undefined);
    setIsFormOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }

  function handleSaved(saved: Customer) {
    setFeedback(editingCustomer ? `Cliente ${saved.name} atualizado.` : `Cliente ${saved.name} cadastrado.`);
    reload();
  }

  function handleDeactivated() {
    if (deactivating) setFeedback(`Cliente ${deactivating.name} inativado.`);
    reload();
  }

  const hasFilters = debouncedSearch.trim() !== "" || statusFilter !== "ALL" || personTypeFilter !== "ALL";
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  function renderContent() {
    if (loadError) {
      return (
        <ErrorState
          title="Não foi possível carregar os clientes"
          description={loadError}
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              <RotateCw aria-hidden="true" />
              Tentar novamente
            </Button>
          }
        />
      );
    }
    if (!result) return <CustomersSkeleton />;
    if (result.total === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente da oficina para começar."
          action={
            canCreate ? (
              <Button size="sm" onClick={handleNewCustomer}>
                <Plus />
                Novo cliente
              </Button>
            ) : undefined
          }
        />
      );
    }
    return (
      <div className="flex flex-col" aria-busy={isLoading}>
        <CustomersTable
          customers={result.customers}
          onEdit={handleEditCustomer}
          onDeactivate={setDeactivating}
        />
        <CustomersPagination
          page={page}
          totalPages={totalPages}
          totalItems={result.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Cadastro, consulta e histórico dos clientes da oficina."
        actions={
          canCreate ? (
            <Button size="sm" onClick={handleNewCustomer}>
              <Plus />
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      <p role="status" aria-live="polite" className={feedback ? "text-sm text-success" : "sr-only"}>
        {feedback}
      </p>

      <div className="flex flex-1 flex-col gap-5">
        <CustomersToolbar
          search={search}
          onSearchChange={changeFilter(setSearch)}
          statusFilter={statusFilter}
          onStatusFilterChange={changeFilter(setStatusFilter)}
          personTypeFilter={personTypeFilter}
          onPersonTypeFilterChange={changeFilter(setPersonTypeFilter)}
        />
        {renderContent()}
      </div>

      <CustomerFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
        onSaved={handleSaved}
      />
      <CustomerDeactivateDialog
        customer={deactivating}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        onDeactivated={handleDeactivated}
      />
    </div>
  );
}
