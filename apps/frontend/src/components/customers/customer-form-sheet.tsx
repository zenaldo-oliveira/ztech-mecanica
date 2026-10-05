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
import { contactPreferenceOptions, personTypeOptions } from "@/lib/customer-options";
import { customerStatusOptions } from "@/lib/customer-status";
import { isDocumentLengthValid } from "@/lib/format-document";
import {
  createCustomer,
  updateCustomer,
  type ContactPreference,
  type Customer,
  type CustomerAddress,
  type CustomerInput,
  type CustomerStatus,
  type PersonType,
} from "@/lib/api/customers";
import { errorMessage, fieldErrorsFrom, isApiError } from "@/lib/api/errors";

type AddressForm = Record<keyof CustomerAddress, string>;

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
  address: AddressForm;
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
      zipCode: customer.address.zipCode ?? "",
      street: customer.address.street ?? "",
      number: customer.address.number ?? "",
      complement: customer.address.complement ?? "",
      neighborhood: customer.address.neighborhood ?? "",
      city: customer.address.city ?? "",
      state: customer.address.state ?? "",
    },
  };
}

/** Corpo enviado à API. Campos vazios vão como "" e o backend os grava como null (limpeza). */
function formStateToInput(form: CustomerFormState, contactPreference: ContactPreference): CustomerInput {
  return {
    personType: form.personType,
    name: form.name,
    // Nome fantasia só existe para pessoa jurídica: ao mudar para física, é limpo.
    tradeName: form.personType === "BUSINESS" ? form.tradeName : null,
    document: form.document,
    phone: form.phone,
    whatsapp: form.whatsapp,
    email: form.email,
    secondaryPhone: form.secondaryPhone,
    secondaryEmail: form.secondaryEmail,
    address: { ...form.address },
    contactPreference,
  };
}

type FormErrors = Record<string, string>;

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

/** Converte um erro da API em erros de campo e/ou uma mensagem geral do formulário. */
function errorsFromApi(error: unknown): { fields: FormErrors; general: string | null } {
  if (isApiError(error)) {
    if (error.status === 400) {
      const fields = fieldErrorsFrom(error.details);
      return Object.keys(fields).length > 0
        ? { fields, general: "Revise os campos destacados." }
        : { fields: {}, general: error.message };
    }
    if (error.status === 409) return { fields: { document: error.message }, general: error.message };
    if (error.status === 401) return { fields: {}, general: "Sua sessão expirou. Entre novamente para continuar." };
    if (error.status === 403) return { fields: {}, general: "Você não tem permissão para salvar este cliente." };
    if (error.status === 404) return { fields: {}, general: "Este cliente não foi encontrado. Atualize a página." };
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

interface CustomerFormBodyProps {
  customer?: Customer;
  onCancel: () => void;
  onSaved: (customer: Customer) => void;
  onSavingChange: (isSaving: boolean) => void;
}

function CustomerFormBody({ customer, onCancel, onSaved, onSavingChange }: CustomerFormBodyProps) {
  const isEditing = Boolean(customer);
  const [form, setForm] = useState<CustomerFormState>(() =>
    customer ? customerToFormState(customer) : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateAddress<K extends keyof CustomerAddress>(field: K, value: string) {
    setForm((previous) => ({ ...previous, address: { ...previous.address, [field]: value } }));
  }

  /** Props de acessibilidade do campo: inválido + descrição apontando para a mensagem. */
  function fieldProps(field: string) {
    const message = errors[field];
    return {
      "aria-invalid": Boolean(message),
      "aria-describedby": message ? `customer-error-${field.replace(".", "-")}` : undefined,
    };
  }
  const errorId = (field: string) => `customer-error-${field.replace(".", "-")}`;

  async function handleSubmit() {
    if (isSaving) return;
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setGeneralError(null);
    if (Object.keys(validationErrors).length > 0 || !form.contactPreference) return;

    const input = formStateToInput(form, form.contactPreference);
    setIsSaving(true);
    onSavingChange(true);
    try {
      const saved = customer
        ? await updateCustomer(customer.id, { ...input, status: form.status })
        : await createCustomer(input);
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
        <SheetTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</SheetTitle>
        <SheetDescription>
          {isEditing
            ? "Atualize os dados cadastrais do cliente."
            : "Preencha os dados para cadastrar um novo cliente."}
        </SheetDescription>
      </SheetHeader>

      <fieldset disabled={isSaving} className="flex min-w-0 flex-col gap-6 px-4 pb-4">
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
            {...fieldProps("name")}
          />
          <FieldError id={errorId("name")} message={errors.name} />
        </div>

        {form.personType === "BUSINESS" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-trade-name">Nome fantasia</Label>
            <Input
              id="customer-trade-name"
              value={form.tradeName}
              onChange={(event) => setForm((previous) => ({ ...previous, tradeName: event.target.value }))}
              {...fieldProps("tradeName")}
            />
            <FieldError id={errorId("tradeName")} message={errors.tradeName} />
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
            {...fieldProps("document")}
          />
          <FieldError id={errorId("document")} message={errors.document} />
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
              {...fieldProps("phone")}
            />
            <FieldError id={errorId("phone")} message={errors.phone} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-whatsapp">WhatsApp</Label>
            <Input
              id="customer-whatsapp"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(event) => setForm((previous) => ({ ...previous, whatsapp: event.target.value }))}
              {...fieldProps("whatsapp")}
            />
            <FieldError id={errorId("whatsapp")} message={errors.whatsapp} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-email">E-mail</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              {...fieldProps("email")}
            />
            <FieldError id={errorId("email")} message={errors.email} />
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
              {...fieldProps("secondaryPhone")}
            />
            <FieldError id={errorId("secondaryPhone")} message={errors.secondaryPhone} />
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
              {...fieldProps("secondaryEmail")}
            />
            <FieldError id={errorId("secondaryEmail")} message={errors.secondaryEmail} />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Endereço</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-zip">CEP</Label>
              <Input
                id="customer-zip"
                inputMode="numeric"
                value={form.address.zipCode}
                onChange={(event) => updateAddress("zipCode", event.target.value)}
                {...fieldProps("address.zipCode")}
              />
              <FieldError id={errorId("address.zipCode")} message={errors["address.zipCode"]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-state">UF</Label>
              <Input
                id="customer-state"
                maxLength={2}
                value={form.address.state}
                onChange={(event) => updateAddress("state", event.target.value.toUpperCase())}
                {...fieldProps("address.state")}
              />
              <FieldError id={errorId("address.state")} message={errors["address.state"]} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-street">Logradouro</Label>
            <Input
              id="customer-street"
              value={form.address.street}
              onChange={(event) => updateAddress("street", event.target.value)}
              {...fieldProps("address.street")}
            />
            <FieldError id={errorId("address.street")} message={errors["address.street"]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-number">Número</Label>
              <Input
                id="customer-number"
                value={form.address.number}
                onChange={(event) => updateAddress("number", event.target.value)}
                {...fieldProps("address.number")}
              />
              <FieldError id={errorId("address.number")} message={errors["address.number"]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-complement">Complemento</Label>
              <Input
                id="customer-complement"
                value={form.address.complement}
                onChange={(event) => updateAddress("complement", event.target.value)}
                {...fieldProps("address.complement")}
              />
              <FieldError id={errorId("address.complement")} message={errors["address.complement"]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-neighborhood">Bairro</Label>
              <Input
                id="customer-neighborhood"
                value={form.address.neighborhood}
                onChange={(event) => updateAddress("neighborhood", event.target.value)}
                {...fieldProps("address.neighborhood")}
              />
              <FieldError id={errorId("address.neighborhood")} message={errors["address.neighborhood"]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-city">Cidade</Label>
              <Input
                id="customer-city"
                value={form.address.city}
                onChange={(event) => updateAddress("city", event.target.value)}
                {...fieldProps("address.city")}
              />
              <FieldError id={errorId("address.city")} message={errors["address.city"]} />
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
          <FieldError id={errorId("contactPreference")} message={errors.contactPreference} />
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
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  /** Chamado com o cliente devolvido pela API, somente após salvar com sucesso. */
  onSaved: (customer: Customer) => void;
}

export function CustomerFormSheet({ open, onOpenChange, customer, onSaved }: CustomerFormSheetProps) {
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
        <CustomerFormBody
          key={open ? (customer?.id ?? "new") : "closed"}
          customer={customer}
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
