"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  ClipboardList,
  FileText,
  History,
  Pencil,
  RotateCw,
  SearchX,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/components/auth/session-provider";
import { VehicleDeleteDialog } from "@/components/vehicles/vehicle-delete-dialog";
import { VehicleFormSheet } from "@/components/vehicles/vehicle-form-sheet";
import { VehicleTypeIcon } from "@/components/vehicles/vehicle-type-icon";
import { customerCode } from "@/lib/api/customers";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { formatMileage, getVehicle, vehicleTypeLabels, type Vehicle } from "@/lib/api/vehicles";

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
}

function DetailField({ label, value }: DetailFieldProps) {
  const text = value === null || value === undefined ? "" : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{text.trim() ? text : "—"}</span>
    </div>
  );
}

const relationshipSections = [
  { label: "Histórico", icon: History },
  { label: "Orçamentos", icon: FileText },
  { label: "Ordens de Serviço", icon: ClipboardList },
  { label: "Serviços", icon: Wrench },
  { label: "Peças", icon: Banknote },
  { label: "Manutenções", icon: Wrench },
];

type LoadState =
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; vehicle: Vehicle };

function BackToVehicles() {
  return (
    <Button variant="ghost" size="sm" className="w-fit" asChild>
      <Link href="/vehicles">
        <ArrowLeft />
        Voltar para veículos
      </Link>
    </Button>
  );
}

export function VehicleDetailView({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  // Somente para adaptar a interface: o backend sempre reaplica a autorização.
  const canUpdate = useCan("vehicles.update");
  const canDelete = useCan("vehicles.delete");
  const [reloadToken, setReloadToken] = useState(0);
  /** Resultado da última carga, com a chave (veículo + recarga) que o originou. */
  const [loaded, setLoaded] = useState<{ key: string; state: LoadState } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadKey = `${vehicleId}:${reloadToken}`;
  const state = loaded?.key === loadKey ? loaded.state : null;

  useEffect(() => {
    const controller = new AbortController();
    getVehicle(vehicleId, controller.signal)
      .then((vehicle) => setLoaded({ key: loadKey, state: { status: "ready", vehicle } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // 404: inexistente ou de outra oficina (indistinguíveis); 400: identificador inválido.
        if (isApiError(error) && (error.status === 404 || error.status === 400)) {
          setLoaded({ key: loadKey, state: { status: "not-found" } });
          return;
        }
        setLoaded({ key: loadKey, state: { status: "error", message: errorMessage(error) } });
      });
    return () => controller.abort();
  }, [vehicleId, loadKey]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  if (state === null) {
    return (
      <div className="flex flex-1 flex-col gap-6" aria-busy="true">
        <BackToVehicles />
        <span role="status" className="sr-only">
          Carregando veículo…
        </span>
        <div className="flex items-center gap-3" aria-hidden="true">
          <Skeleton className="size-10" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <BackToVehicles />
        <EmptyState
          icon={SearchX}
          title="Veículo não encontrado"
          description="O veículo não existe ou não pertence a esta oficina."
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <BackToVehicles />
        <ErrorState
          title="Não foi possível carregar o veículo"
          description={state.message}
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              <RotateCw aria-hidden="true" />
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const { vehicle } = state;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <BackToVehicles />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <VehicleTypeIcon type={vehicle.type} className="size-10" />
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="font-mono text-sm text-muted-foreground">{vehicle.plate}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDelete ? (
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 />
                Excluir
              </Button>
            ) : null}
            {canUpdate ? (
              <Button size="sm" onClick={() => setIsFormOpen(true)}>
                <Pencil />
                Editar
              </Button>
            ) : null}
          </div>
        </div>
        <p role="status" aria-live="polite" className={feedback ? "text-sm text-success" : "sr-only"}>
          {feedback}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Tipo" value={vehicleTypeLabels[vehicle.type]} />
            <DetailField label="Marca" value={vehicle.brand} />
            <DetailField label="Modelo" value={vehicle.model} />
            <DetailField label="Versão" value={vehicle.version} />
            <DetailField label="Ano de fabricação" value={vehicle.manufactureYear} />
            <DetailField label="Ano do modelo" value={vehicle.modelYear} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Placa" value={vehicle.plate} />
            <DetailField label="Chassi" value={vehicle.chassisNumber} />
            <DetailField label="RENAVAM" value={vehicle.renavam} />
            <DetailField label="Quilometragem" value={vehicle.lastMileage === null ? null : formatMileage(vehicle.lastMileage)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            <Link
              href={`/customers/${vehicle.customer.id}`}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {vehicle.customer.name}
            </Link>
            <span className="text-xs text-muted-foreground">{customerCode(vehicle.customer.number)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relacionamentos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {relationshipSections.map((section) => (
              <div
                key={section.label}
                className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5"
              >
                <section.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">{section.label}</span>
                  <span className="text-[11px] text-muted-foreground">Não disponível nesta fase</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <VehicleFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vehicle={vehicle}
        onSaved={(saved) => {
          setLoaded({ key: loadKey, state: { status: "ready", vehicle: saved } });
          setFeedback("Alterações salvas.");
        }}
      />
      <VehicleDeleteDialog
        vehicle={isDeleteOpen ? vehicle : null}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => router.replace("/vehicles")}
      />
    </div>
  );
}
