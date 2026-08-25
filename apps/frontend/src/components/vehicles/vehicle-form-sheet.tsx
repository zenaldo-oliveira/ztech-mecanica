"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { customers } from "@/lib/mock/customers";
import type { Vehicle, VehicleCustomer, VehicleType } from "@/lib/mock/vehicles";

interface VehicleFormState {
  type: VehicleType;
  brand: string;
  model: string;
  version: string;
  manufactureYear: string;
  modelYear: string;
  plate: string;
  chassisNumber: string;
  renavam: string;
  mileage: string;
  customer: VehicleCustomer | null;
}

const emptyForm: VehicleFormState = {
  type: "CAR",
  brand: "",
  model: "",
  version: "",
  manufactureYear: "",
  modelYear: "",
  plate: "",
  chassisNumber: "",
  renavam: "",
  mileage: "",
  customer: null,
};

function vehicleToFormState(vehicle: Vehicle): VehicleFormState {
  return {
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? "",
    manufactureYear: vehicle.manufactureYear ?? "",
    modelYear: vehicle.modelYear ?? "",
    plate: vehicle.plate,
    chassisNumber: vehicle.chassisNumber ?? "",
    renavam: vehicle.renavam ?? "",
    mileage: vehicle.mileage !== undefined ? String(vehicle.mileage) : "",
    customer: vehicle.customer,
  };
}

function formStateToVehicle(id: string, form: VehicleFormState): Vehicle {
  if (!form.customer) {
    throw new Error("Cliente é obrigatório.");
  }

  const mileage = form.mileage.trim() ? Number(form.mileage) : undefined;

  return {
    id,
    plate: form.plate.trim().toUpperCase(),
    type: form.type,
    brand: form.brand.trim(),
    model: form.model.trim(),
    version: form.version.trim() || undefined,
    manufactureYear: form.manufactureYear.trim() || undefined,
    modelYear: form.modelYear.trim() || undefined,
    chassisNumber: form.chassisNumber.trim() || undefined,
    renavam: form.renavam.trim() || undefined,
    mileage: mileage !== undefined && !Number.isNaN(mileage) ? mileage : undefined,
    customer: form.customer,
  };
}

type FormErrors = Partial<Record<"brand" | "model" | "plate" | "customer", string>>;

function validate(form: VehicleFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.brand.trim()) errors.brand = "Campo obrigatório.";
  if (!form.model.trim()) errors.model = "Campo obrigatório.";
  if (!form.plate.trim()) errors.plate = "Campo obrigatório.";
  if (!form.customer) errors.customer = "Selecione um cliente.";

  return errors;
}

interface VehicleFormBodyProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSubmit: (vehicle: Vehicle) => void;
}

function VehicleFormBody({ vehicle, onCancel, onSubmit }: VehicleFormBodyProps) {
  const isEditing = Boolean(vehicle);
  const [form, setForm] = useState<VehicleFormState>(() =>
    vehicle ? vehicleToFormState(vehicle) : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit() {
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const id = vehicle?.id ?? String(Date.now());
    onSubmit(formStateToVehicle(id, form));
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar veículo" : "Novo veículo"}</SheetTitle>
        <SheetDescription>
          {isEditing
            ? "Atualize os dados cadastrais do veículo."
            : "Preencha os dados para cadastrar um novo veículo."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label>Tipo</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.type}
            onValueChange={(value) => {
              if (value) setForm((previous) => ({ ...previous, type: value as VehicleType }));
            }}
            aria-label="Tipo de veículo"
          >
            <ToggleGroupItem value="CAR">Carro</ToggleGroupItem>
            <ToggleGroupItem value="MOTORCYCLE">Moto</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle-customer">Cliente</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="vehicle-customer"
                type="button"
                variant="outline"
                className="justify-between font-normal"
                aria-invalid={Boolean(errors.customer)}
              >
                {form.customer ? form.customer.name : "Selecionar cliente..."}
                <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto">
              {customers.map((customer) => (
                <DropdownMenuItem
                  key={customer.id}
                  onSelect={() =>
                    setForm((previous) => ({
                      ...previous,
                      customer: { id: customer.id, name: customer.name },
                    }))
                  }
                >
                  {customer.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {errors.customer ? <p className="text-xs text-destructive">{errors.customer}</p> : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-brand">Marca</Label>
            <Input
              id="vehicle-brand"
              value={form.brand}
              onChange={(event) => setForm((previous) => ({ ...previous, brand: event.target.value }))}
              aria-invalid={Boolean(errors.brand)}
            />
            {errors.brand ? <p className="text-xs text-destructive">{errors.brand}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-model">Modelo</Label>
            <Input
              id="vehicle-model"
              value={form.model}
              onChange={(event) => setForm((previous) => ({ ...previous, model: event.target.value }))}
              aria-invalid={Boolean(errors.model)}
            />
            {errors.model ? <p className="text-xs text-destructive">{errors.model}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-version">Versão</Label>
            <Input
              id="vehicle-version"
              value={form.version}
              onChange={(event) => setForm((previous) => ({ ...previous, version: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle-manufacture-year">Ano de fabricação</Label>
              <Input
                id="vehicle-manufacture-year"
                inputMode="numeric"
                value={form.manufactureYear}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, manufactureYear: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle-model-year">Ano do modelo</Label>
              <Input
                id="vehicle-model-year"
                inputMode="numeric"
                value={form.modelYear}
                onChange={(event) => setForm((previous) => ({ ...previous, modelYear: event.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Identificação</p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-plate">Placa</Label>
            <Input
              id="vehicle-plate"
              value={form.plate}
              onChange={(event) => setForm((previous) => ({ ...previous, plate: event.target.value }))}
              aria-invalid={Boolean(errors.plate)}
            />
            {errors.plate ? <p className="text-xs text-destructive">{errors.plate}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-chassis">Chassi</Label>
            <Input
              id="vehicle-chassis"
              value={form.chassisNumber}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, chassisNumber: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-renavam">RENAVAM</Label>
            <Input
              id="vehicle-renavam"
              value={form.renavam}
              onChange={(event) => setForm((previous) => ({ ...previous, renavam: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Label htmlFor="vehicle-mileage">Quilometragem</Label>
          <Input
            id="vehicle-mileage"
            inputMode="numeric"
            value={form.mileage}
            onChange={(event) => setForm((previous) => ({ ...previous, mileage: event.target.value }))}
          />
        </div>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>{isEditing ? "Salvar alterações" : "Cadastrar veículo"}</Button>
      </SheetFooter>
    </>
  );
}

interface VehicleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
  onSubmit: (vehicle: Vehicle) => void;
}

export function VehicleFormSheet({ open, onOpenChange, vehicle, onSubmit }: VehicleFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <VehicleFormBody
          key={open ? (vehicle?.id ?? "new") : "closed"}
          vehicle={vehicle}
          onCancel={() => onOpenChange(false)}
          onSubmit={(result) => {
            onSubmit(result);
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
