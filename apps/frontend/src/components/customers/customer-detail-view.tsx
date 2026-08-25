"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Car,
  ClipboardList,
  FileText,
  Heart,
  History,
  Pencil,
  SearchX,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { contactPreferenceLabels, personTypeLabels } from "@/lib/customer-options";
import { formatDocument, formatPhone } from "@/lib/format-document";
import { customers as initialCustomers, type Customer } from "@/lib/mock/customers";

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
  { label: "Veículos", icon: Car },
  { label: "Orçamentos", icon: FileText },
  { label: "Ordens de Serviço", icon: ClipboardList },
  { label: "Histórico", icon: History },
  { label: "Financeiro", icon: Banknote },
  { label: "CRM", icon: Heart },
  { label: "Manutenções", icon: Wrench },
];

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | undefined>(() =>
    initialCustomers.find((item) => item.id === customerId),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!customer) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/customers">
            <ArrowLeft />
            Voltar para clientes
          </Link>
        </Button>
        <EmptyState
          icon={SearchX}
          title="Cliente não encontrado"
          description={`Não existe nenhum cliente com o identificador "${customerId}".`}
        />
      </div>
    );
  }

  const address = customer.address;
  const addressLine = address
    ? [address.street, address.number].filter(Boolean).join(", ")
    : undefined;
  const addressComplement = address
    ? [address.neighborhood, address.city, address.state].filter(Boolean).join(" — ")
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/customers">
            <ArrowLeft />
            Voltar para clientes
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.id} · {personTypeLabels[customer.personType]}
            </p>
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
            <DetailField label="Tipo de pessoa" value={personTypeLabels[customer.personType]} />
            <DetailField
              label={customer.personType === "INDIVIDUAL" ? "Nome completo" : "Razão social"}
              value={customer.name}
            />
            {customer.personType === "BUSINESS" ? (
              <DetailField label="Nome fantasia" value={customer.tradeName} />
            ) : null}
            <DetailField
              label={customer.personType === "INDIVIDUAL" ? "CPF" : "CNPJ"}
              value={formatDocument(customer.document, customer.personType)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Telefone" value={formatPhone(customer.phone)} />
            <DetailField label="WhatsApp" value={customer.whatsapp ? formatPhone(customer.whatsapp) : undefined} />
            <DetailField label="E-mail" value={customer.email} />
            <DetailField
              label="Preferência de contato"
              value={contactPreferenceLabels[customer.contactPreference]}
            />
            <DetailField
              label="Telefone secundário"
              value={customer.secondaryPhone ? formatPhone(customer.secondaryPhone) : undefined}
            />
            <DetailField label="E-mail secundário" value={customer.secondaryEmail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="CEP" value={address?.zipCode} />
            <DetailField label="Logradouro" value={addressLine} />
            <DetailField label="Complemento" value={address?.complement} />
            <DetailField label="Bairro / Cidade / UF" value={addressComplement} />
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

      <CustomerFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={customer}
        onSubmit={setCustomer}
      />
    </div>
  );
}
