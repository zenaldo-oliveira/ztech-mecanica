"use client";

import { useState } from "react";

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
import { contactPreferenceOptions, personTypeOptions } from "@/lib/customer-options";
import { customerStatusOptions } from "@/lib/customer-status";
import { isDocumentLengthValid, onlyDigits } from "@/lib/format-document";
import type {
  Customer,
  CustomerAddress,
  ContactPreference,
  CustomerStatus,
  PersonType,
} from "@/lib/mock/customers";

interface CustomerFormState {
  personType: PersonType;
  name: string;
  tradeName: string;
  document: string;
  status: CustomerStatus;
  phone: string;
  whatsapp: string;
  email: string;
  secondaryPhone: string;
  secondaryEmail: string;
  contactPreference: ContactPreference | "";
  address: Required<CustomerAddress>;
}

const emptyForm: CustomerFormState = {
  personType: "INDIVIDUAL",
  name: "",
  tradeName: "",
  document: "",
  status: "ACTIVE",
  phone: "",
  whatsapp: "",
  email: "",
  secondaryPhone: "",
  secondaryEmail: "",
  contactPreference: "",
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
};

function customerToFormState(customer: Customer): CustomerFormState {
  return {
    personType: customer.personType,
    name: customer.name,
    tradeName: customer.tradeName ?? "",
    document: customer.document,
    status: customer.status,
    phone: customer.phone,
    whatsapp: customer.whatsapp ?? "",
    email: customer.email ?? "",
    secondaryPhone: customer.secondaryPhone ?? "",
    secondaryEmail: customer.secondaryEmail ?? "",
    contactPreference: customer.contactPreference,
    address: {
      zipCode: customer.address?.zipCode ?? "",
      street: customer.address?.street ?? "",
      number: customer.address?.number ?? "",
      complement: customer.address?.complement ?? "",
      neighborhood: customer.address?.neighborhood ?? "",
      city: customer.address?.city ?? "",
      state: customer.address?.state ?? "",
    },
  };
}

function formStateToCustomer(id: string, form: CustomerFormState): Customer {
  const hasAddress = Object.values(form.address).some((value) => value.trim() !== "");

  return {
    id,
    personType: form.personType,
    name: form.name.trim(),
    tradeName: form.personType === "BUSINESS" && form.tradeName.trim() ? form.tradeName.trim() : undefined,
    document: onlyDigits(form.document),
    status: form.status,
    phone: onlyDigits(form.phone),
    whatsapp: form.whatsapp.trim() ? onlyDigits(form.whatsapp) : undefined,
    email: form.email.trim() || undefined,
    secondaryPhone: form.secondaryPhone.trim() ? onlyDigits(form.secondaryPhone) : undefined,
    secondaryEmail: form.secondaryEmail.trim() || undefined,
    contactPreference: form.contactPreference || "NONE",
    address: hasAddress
      ? {
          zipCode: form.address.zipCode.trim() || undefined,
          street: form.address.street.trim() || undefined,
          number: form.address.number.trim() || undefined,
          complement: form.address.complement.trim() || undefined,
          neighborhood: form.address.neighborhood.trim() || undefined,
          city: form.address.city.trim() || undefined,
          state: form.address.state.trim() || undefined,
        }
      : undefined,
  };
}

type FormErrors = Partial<Record<"name" | "document" | "phone" | "contactPreference", string>>;

function validate(form: CustomerFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Campo obrigatório.";
  }

  if (!form.document.trim()) {
    errors.document = "Campo obrigatório.";
  } else if (!isDocumentLengthValid(form.document, form.personType)) {
    errors.document =
      form.personType === "INDIVIDUAL" ? "CPF deve ter 11 dígitos." : "CNPJ deve ter 14 dígitos.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Campo obrigatório.";
  }

  if (!form.contactPreference) {
    errors.contactPreference = "Selecione uma preferência de contato.";
  }

  return errors;
}

interface CustomerFormBodyProps {
  customer?: Customer;
  onCancel: () => void;
  onSubmit: (customer: Customer) => void;
}

function CustomerFormBody({ customer, onCancel, onSubmit }: CustomerFormBodyProps) {
  const isEditing = Boolean(customer);
  const [form, setForm] = useState<CustomerFormState>(() =>
    customer ? customerToFormState(customer) : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function updateAddress<K extends keyof CustomerAddress>(field: K, value: string) {
    setForm((previous) => ({ ...previous, address: { ...previous.address, [field]: value } }));
  }

  function handleSubmit() {
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const id = customer?.id ?? `CLI-${String(Date.now()).slice(-6)}`;
    onSubmit(formStateToCustomer(id, form));
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</SheetTitle>
        <SheetDescription>
          {isEditing
            ? "Atualize os dados cadastrais do cliente."
            : "Preencha os dados para cadastrar um novo cliente."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label>Tipo de pessoa</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.personType}
            onValueChange={(value) => {
              if (value) setForm((previous) => ({ ...previous, personType: value as PersonType }));
            }}
            aria-label="Tipo de pessoa"
          >
            {personTypeOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-name">
            {form.personType === "INDIVIDUAL" ? "Nome completo" : "Razão social"}
          </Label>
          <Input
            id="customer-name"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>

        {form.personType === "BUSINESS" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-trade-name">Nome fantasia</Label>
            <Input
              id="customer-trade-name"
              value={form.tradeName}
              onChange={(event) => setForm((previous) => ({ ...previous, tradeName: event.target.value }))}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-document">{form.personType === "INDIVIDUAL" ? "CPF" : "CNPJ"}</Label>
          <Input
            id="customer-document"
            inputMode="numeric"
            placeholder={form.personType === "INDIVIDUAL" ? "000.000.000-00" : "00.000.000/0000-00"}
            value={form.document}
            onChange={(event) => setForm((previous) => ({ ...previous, document: event.target.value }))}
            aria-invalid={Boolean(errors.document)}
          />
          {errors.document ? <p className="text-xs text-destructive">{errors.document}</p> : null}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={form.status}
              onValueChange={(value) => {
                if (value) setForm((previous) => ({ ...previous, status: value as CustomerStatus }));
              }}
              aria-label="Status do cliente"
            >
              {customerStatusOptions.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contato principal
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-phone">Telefone</Label>
            <Input
              id="customer-phone"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-whatsapp">WhatsApp</Label>
            <Input
              id="customer-whatsapp"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(event) => setForm((previous) => ({ ...previous, whatsapp: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-email">E-mail</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contato secundário
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-secondary-phone">Telefone secundário</Label>
            <Input
              id="customer-secondary-phone"
              inputMode="tel"
              value={form.secondaryPhone}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, secondaryPhone: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-secondary-email">E-mail secundário</Label>
            <Input
              id="customer-secondary-email"
              type="email"
              value={form.secondaryEmail}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, secondaryEmail: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Endereço</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-zip">CEP</Label>
              <Input
                id="customer-zip"
                value={form.address.zipCode}
                onChange={(event) => updateAddress("zipCode", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-state">UF</Label>
              <Input
                id="customer-state"
                maxLength={2}
                value={form.address.state}
                onChange={(event) => updateAddress("state", event.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-street">Logradouro</Label>
            <Input
              id="customer-street"
              value={form.address.street}
              onChange={(event) => updateAddress("street", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-number">Número</Label>
              <Input
                id="customer-number"
                value={form.address.number}
                onChange={(event) => updateAddress("number", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-complement">Complemento</Label>
              <Input
                id="customer-complement"
                value={form.address.complement}
                onChange={(event) => updateAddress("complement", event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-neighborhood">Bairro</Label>
              <Input
                id="customer-neighborhood"
                value={form.address.neighborhood}
                onChange={(event) => updateAddress("neighborhood", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-city">Cidade</Label>
              <Input
                id="customer-city"
                value={form.address.city}
                onChange={(event) => updateAddress("city", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Label>Preferência de contato</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={form.contactPreference}
            onValueChange={(value) => {
              if (value)
                setForm((previous) => ({ ...previous, contactPreference: value as ContactPreference }));
            }}
            aria-label="Preferência de contato"
            className="flex-wrap"
          >
            {contactPreferenceOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {errors.contactPreference ? (
            <p className="text-xs text-destructive">{errors.contactPreference}</p>
          ) : null}
        </div>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>{isEditing ? "Salvar alterações" : "Cadastrar cliente"}</Button>
      </SheetFooter>
    </>
  );
}

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onSubmit: (customer: Customer) => void;
}

export function CustomerFormSheet({ open, onOpenChange, customer, onSubmit }: CustomerFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <CustomerFormBody
          key={open ? (customer?.id ?? "new") : "closed"}
          customer={customer}
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
