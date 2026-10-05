"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { VehicleCustomerPicker } from "@/components/vehicles/vehicle-customer-picker";
import { errorMessage, fieldErrorsFrom, isApiError } from "@/lib/api/errors";
import {
  createVehicle,
  updateVehicle,
  type Vehicle,
  type VehicleCustomerSummary,
  type VehicleInput,
  type VehicleType,
} from "@/lib/api/vehicles";

interface VehicleFormState {
  type: VehicleType;
  customer: VehicleCustomerSummary | null;
  brand: string;
  model: string;
  version: string;
  manufactureYear: string;
  modelYear: string;
  plate: string;
  chassisNumber: string;
  renavam: string;
  lastMileage: string;
}

const emptyForm: VehicleFormState = {
  type: "CAR",
  customer: null,
  brand: "",
  model: "",
  version: "",
  manufactureYear: "",
  modelYear: "",
  plate: "",
  chassisNumber: "",
  renavam: "",
  lastMileage: "",
};

const toText = (value: number | string | null) => (value === null ? "" : String(value));

function vehicleToFormState(vehicle: Vehicle): VehicleFormState {
  return {
    type: vehicle.type,
    customer: vehicle.customer,
    brand: vehicle.brand,
    model: vehicle.model,
    version: toText(vehicle.version),
    manufactureYear: toText(vehicle.manufactureYear),
    modelYear: toText(vehicle.modelYear),
    plate: vehicle.plate,
    chassisNumber: toText(vehicle.chassisNumber),
    renavam: toText(vehicle.renavam),
    lastMileage: toText(vehicle.lastMileage),
  };
}

type FormErrors = Record<string, string>;

/** Campo numérico opcional: vazio → null; inteiro → número; qualquer outra coisa → NaN (erro). */
function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** Validação mínima no navegador; as regras completas (placa, anos, chassi…) são do backend. */
function validate(form: VehicleFormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.customer) errors.customerId = "Selecione o cliente proprietário.";
  if (!form.brand.trim()) errors.brand = "Campo obrigatório.";
  if (!form.model.trim()) errors.model = "Campo obrigatório.";
  if (!form.plate.trim()) errors.plate = "Campo obrigatório.";
  for (const field of ["manufactureYear", "modelYear", "lastMileage"] as const) {
    if (Number.isNaN(parseOptionalInteger(form[field]))) errors[field] = "Use somente números inteiros.";
  }
  return errors;
}

function formStateToInput(form: VehicleFormState, customerId: string): VehicleInput {
  return {
    customerId,
    type: form.type,
    brand: form.brand,
    model: form.model,
    version: form.version,
    manufactureYear: parseOptionalInteger(form.manufactureYear),
    modelYear: parseOptionalInteger(form.modelYear),
    plate: form.plate,
    chassisNumber: form.chassisNumber,
    renavam: form.renavam,
    lastMileage: parseOptionalInteger(form.lastMileage),
  };
}

/** Converte um erro da API em erros de campo e/ou uma mensagem geral do formulário. */
function errorsFromApi(error: unknown): { fields: FormErrors; general: string | null } {
  if (isApiError(error)) {
    if (error.status === 400) {
      const fields = fieldErrorsFrom(error.details);
      return Object.keys(fields).length > 0
        ? { fields, general: "Revise os campos destacados." }
        : { fields: {}, general: error.message };
    }
    // 404/409 do proprietário (inexistente, de outra oficina ou inativo) e placa duplicada.
    if (error.status === 404 || error.status === 409) {
      if (/cliente/i.test(error.message)) return { fields: { customerId: error.message }, general: error.message };
      if (/placa/i.test(error.message)) return { fields: { plate: error.message }, general: error.message };
      return { fields: {}, general: error.message };
    }
    if (error.status === 401) return { fields: {}, general: "Sua sessão expirou. Entre novamente para continuar." };
    if (error.status === 403) return { fields: {}, general: "Você não tem permissão para salvar este veículo." };
  }
  return { fields: {}, general: errorMessage(error) };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

interface VehicleFormBodyProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSaved: (vehicle: Vehicle) => void;
  onSavingChange: (isSaving: boolean) => void;
}

function VehicleFormBody({ vehicle, onCancel, onSaved, onSavingChange }: VehicleFormBodyProps) {
  const isEditing = Boolean(vehicle);
  const [form, setForm] = useState<VehicleFormState>(() =>
    vehicle ? vehicleToFormState(vehicle) : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const errorId = (field: string) => `vehicle-error-${field}`;
  function fieldProps(field: string) {
    const message = errors[field];
    return { "aria-invalid": Boolean(message), "aria-describedby": message ? errorId(field) : undefined };
  }
  function setField<K extends keyof VehicleFormState>(field: K, value: VehicleFormState[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit() {
    if (isSaving) return;
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setGeneralError(null);
    if (Object.keys(validationErrors).length > 0 || !form.customer) return;

    const input = formStateToInput(form, form.customer.id);
    setIsSaving(true);
    onSavingChange(true);
    try {
      const saved = vehicle ? await updateVehicle(vehicle.id, input) : await createVehicle(input);
      onSaved(saved);
    } catch (error) {
      const { fields, general } = errorsFromApi(error);
      setErrors(fields);
      setGeneralError(general);
    } finally {
      setIsSaving(false);
      onSavingChange(false);
    }
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

      <fieldset disabled={isSaving} className="flex min-w-0 flex-col gap-6 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label>Tipo</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.type}
            onValueChange={(value) => {
              if (value) setField("type", value as VehicleType);
            }}
            aria-label="Tipo de veículo"
          >
            <ToggleGroupItem value="CAR">Carro</ToggleGroupItem>
            <ToggleGroupItem value="MOTORCYCLE">Moto</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle-customer">Cliente proprietário</Label>
          <VehicleCustomerPicker
            id="vehicle-customer"
            value={form.customer}
            onChange={(customer) => setField("customer", customer)}
            invalid={Boolean(errors.customerId)}
            describedBy={errors.customerId ? errorId("customerId") : undefined}
          />
          <FieldError id={errorId("customerId")} message={errors.customerId} />
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-brand">Marca</Label>
            <Input
              id="vehicle-brand"
              value={form.brand}
              onChange={(event) => setField("brand", event.target.value)}
              {...fieldProps("brand")}
            />
            <FieldError id={errorId("brand")} message={errors.brand} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-model">Modelo</Label>
            <Input
              id="vehicle-model"
              value={form.model}
              onChange={(event) => setField("model", event.target.value)}
              {...fieldProps("model")}
            />
            <FieldError id={errorId("model")} message={errors.model} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-version">Versão</Label>
            <Input
              id="vehicle-version"
              value={form.version}
              onChange={(event) => setField("version", event.target.value)}
              {...fieldProps("version")}
            />
            <FieldError id={errorId("version")} message={errors.version} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle-manufacture-year">Ano de fabricação</Label>
              <Input
                id="vehicle-manufacture-year"
                inputMode="numeric"
                value={form.manufactureYear}
                onChange={(event) => setField("manufactureYear", event.target.value)}
                {...fieldProps("manufactureYear")}
              />
              <FieldError id={errorId("manufactureYear")} message={errors.manufactureYear} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle-model-year">Ano do modelo</Label>
              <Input
                id="vehicle-model-year"
                inputMode="numeric"
                value={form.modelYear}
                onChange={(event) => setField("modelYear", event.target.value)}
                {...fieldProps("modelYear")}
              />
              <FieldError id={errorId("modelYear")} message={errors.modelYear} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Identificação</p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-plate">Placa</Label>
            <Input
              id="vehicle-plate"
              placeholder="AAA0A00"
              value={form.plate}
              onChange={(event) => setField("plate", event.target.value.toUpperCase())}
              {...fieldProps("plate")}
            />
            <FieldError id={errorId("plate")} message={errors.plate} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-chassis">Chassi</Label>
            <Input
              id="vehicle-chassis"
              value={form.chassisNumber}
              onChange={(event) => setField("chassisNumber", event.target.value.toUpperCase())}
              {...fieldProps("chassisNumber")}
            />
            <FieldError id={errorId("chassisNumber")} message={errors.chassisNumber} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle-renavam">RENAVAM</Label>
            <Input
              id="vehicle-renavam"
              inputMode="numeric"
              value={form.renavam}
              onChange={(event) => setField("renavam", event.target.value)}
              {...fieldProps("renavam")}
            />
            <FieldError id={errorId("renavam")} message={errors.renavam} />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Label htmlFor="vehicle-mileage">Quilometragem</Label>
          <Input
            id="vehicle-mileage"
            inputMode="numeric"
            value={form.lastMileage}
            onChange={(event) => setField("lastMileage", event.target.value)}
            {...fieldProps("lastMileage")}
          />
          <FieldError id={errorId("lastMileage")} message={errors.lastMileage} />
        </div>
      </fieldset>

      <SheetFooter className="gap-2 border-t">
        {generalError ? (
          <p role="alert" className="text-sm text-destructive">
            {generalError}
          </p>
        ) : null}
        <div className="flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

interface VehicleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
  /** Chamado com o veículo devolvido pela API, somente após salvar com sucesso. */
  onSaved: (vehicle: Vehicle) => void;
}

export function VehicleFormSheet({ open, onOpenChange, vehicle, onSaved }: VehicleFormSheetProps) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Não fecha durante o salvamento: o resultado da API precisa ser exibido.
        if (!isSaving) onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <VehicleFormBody
          key={open ? (vehicle?.id ?? "new") : "closed"}
          vehicle={vehicle}
          onCancel={() => onOpenChange(false)}
          onSavingChange={setIsSaving}
          onSaved={(saved) => {
            onSaved(saved);
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
