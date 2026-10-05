"use client";

import { useCallback, useEffect, useState } from "react";
import { Car, Plus, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useCan } from "@/components/auth/session-provider";
import { VehicleDeleteDialog } from "@/components/vehicles/vehicle-delete-dialog";
import { VehicleFormSheet } from "@/components/vehicles/vehicle-form-sheet";
import { VehiclesPagination } from "@/components/vehicles/vehicles-pagination";
import { VehiclesSkeleton } from "@/components/vehicles/vehicles-skeleton";
import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { VehiclesToolbar, type VehicleTypeFilter } from "@/components/vehicles/vehicles-toolbar";
import { errorMessage } from "@/lib/api/errors";
import { listVehicles, type Vehicle } from "@/lib/api/vehicles";

const PAGE_SIZE = 20;
/** Espera após a digitação antes de consultar a API (evita uma requisição por tecla). */
const SEARCH_DEBOUNCE_MS = 300;

interface VehiclesPage {
  vehicles: Vehicle[];
  total: number;
}

export function VehiclesView() {
  const canCreate = useCan("vehicles.create");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>("ALL");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  /** Última resposta da API, com a chave da consulta que a originou. */
  const [response, setResponse] = useState<{ key: string; data?: VehiclesPage; error?: string } | null>(null);
  /** Último resultado bem-sucedido: continua visível enquanto a próxima página carrega. */
  const [result, setResult] = useState<VehiclesPage | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const queryKey = JSON.stringify([page, debouncedSearch, typeFilter, reloadToken]);
  const isLoading = response?.key !== queryKey;
  const loadError = response?.key === queryKey ? (response.error ?? null) : null;

  useEffect(() => {
    const controller = new AbortController();

    listVehicles(
      {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      },
      controller.signal,
    )
      .then((list) => {
        const totalPages = Math.max(1, Math.ceil(list.meta.total / PAGE_SIZE));
        // A página pode ter ficado vazia (ex.: após excluir o último item dela).
        if (list.data.length === 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        const data = { vehicles: list.data, total: list.meta.total };
        setResult(data);
        setResponse({ key: queryKey, data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResponse({ key: queryKey, error: errorMessage(error) });
      });

    return () => controller.abort();
  }, [queryKey, page, debouncedSearch, typeFilter]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleNewVehicle() {
    setEditingVehicle(undefined);
    setIsFormOpen(true);
  }

  function handleEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  }

  function handleSaved(saved: Vehicle) {
    setFeedback(editingVehicle ? `Veículo ${saved.plate} atualizado.` : `Veículo ${saved.plate} cadastrado.`);
    reload();
  }

  function handleDeleted() {
    if (deleting) setFeedback(`Veículo ${deleting.plate} excluído.`);
    reload();
  }

  const hasFilters = debouncedSearch.trim() !== "" || typeFilter !== "ALL";
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  function renderContent() {
    if (loadError) {
      return (
        <ErrorState
          title="Não foi possível carregar os veículos"
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
    if (!result) return <VehiclesSkeleton />;
    if (result.total === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={Car}
          title="Nenhum veículo cadastrado"
          description="Cadastre o primeiro veículo para começar a acompanhar o histórico da oficina."
          action={
            canCreate ? (
              <Button size="sm" onClick={handleNewVehicle}>
                <Plus />
                Novo veículo
              </Button>
            ) : undefined
          }
        />
      );
    }
    return (
      <div className="flex flex-col" aria-busy={isLoading}>
        <VehiclesTable vehicles={result.vehicles} onEdit={handleEditVehicle} onDelete={setDeleting} />
        <VehiclesPagination
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
        title="Veículos"
        description="Cadastro, identificação e acompanhamento dos veículos atendidos."
        actions={
          canCreate ? (
            <Button size="sm" onClick={handleNewVehicle}>
              <Plus />
              Novo veículo
            </Button>
          ) : undefined
        }
      />

      <p role="status" aria-live="polite" className={feedback ? "text-sm text-success" : "sr-only"}>
        {feedback}
      </p>

      <div className="flex flex-1 flex-col gap-5">
        <VehiclesToolbar
          search={search}
          onSearchChange={changeFilter(setSearch)}
          typeFilter={typeFilter}
          onTypeFilterChange={changeFilter(setTypeFilter)}
        />
        {renderContent()}
      </div>

      <VehicleFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vehicle={editingVehicle}
        onSaved={handleSaved}
      />
      <VehicleDeleteDialog
        vehicle={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
