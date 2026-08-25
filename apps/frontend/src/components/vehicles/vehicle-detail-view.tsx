"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  ClipboardList,
  FileText,
  History,
  Pencil,
  SearchX,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { VehicleFormSheet } from "@/components/vehicles/vehicle-form-sheet";
import { VehicleTypeIcon } from "@/components/vehicles/vehicle-type-icon";
import { vehicles as initialVehicles, type Vehicle } from "@/lib/mock/vehicles";

interface DetailFieldProps {
  label: string;
  value?: string;
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value && value.trim() ? value : "—"}</span>
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

function formatMileage(mileage?: number): string | undefined {
  if (mileage === undefined) return undefined;
  return `${mileage.toLocaleString("pt-BR")} km`;
}

export function VehicleDetailView({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(() =>
    initialVehicles.find((item) => item.id === vehicleId),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!vehicle) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/vehicles">
            <ArrowLeft />
            Voltar para veículos
          </Link>
        </Button>
        <EmptyState
          icon={SearchX}
          title="Veículo não encontrado"
          description={`Não existe nenhum veículo com o identificador "${vehicleId}".`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/vehicles">
            <ArrowLeft />
            Voltar para veículos
          </Link>
        </Button>

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
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Pencil />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Tipo" value={vehicle.type === "CAR" ? "Carro" : "Moto"} />
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
            <DetailField label="Quilometragem" value={formatMileage(vehicle.mileage)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/customers/${vehicle.customer.id}`}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {vehicle.customer.name}
            </Link>
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
        onSubmit={setVehicle}
      />
    </div>
  );
}
