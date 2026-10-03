"use client";

import { Bike, Car, type LucideIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VehicleType } from "@/lib/mock/vehicles";

interface CheckupTypeSelectProps {
  onSelect: (type: VehicleType) => void;
}

interface TypeOption {
  type: VehicleType;
  label: string;
  description: string;
  icon: LucideIcon;
}

const OPTIONS: TypeOption[] = [
  {
    type: "CAR",
    label: "Carro",
    description: "Checklist completo de inspeção para carros.",
    icon: Car,
  },
  {
    type: "MOTORCYCLE",
    label: "Moto",
    description: "Checklist completo de inspeção para motos.",
    icon: Bike,
  },
];

export function CheckupTypeSelect({ onSelect }: CheckupTypeSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Selecione o tipo de veículo para iniciar o check-up.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
          >
            <Card className="h-full transition-colors hover:ring-primary/40">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{label}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
