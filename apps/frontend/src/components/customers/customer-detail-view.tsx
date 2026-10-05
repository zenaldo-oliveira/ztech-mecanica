"use client";

import { useCallback, useEffect, useState } from "react";
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
  RotateCw,
  SearchX,
  UserX,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/components/auth/session-provider";
import { CustomerDeactivateDialog } from "@/components/customers/customer-deactivate-dialog";
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { contactPreferenceLabels, personTypeLabels } from "@/lib/customer-options";
import { formatDocument, formatPhone } from "@/lib/format-document";
import { customerCode, getCustomer, type Customer } from "@/lib/api/customers";
import { errorMessage, isApiError } from "@/lib/api/errors";

interface DetailFieldProps {
  label: string;
  value?: string | null;
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

type LoadState =
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; customer: Customer };

function BackToCustomers() {
  return (
    <Button variant="ghost" size="sm" className="w-fit" asChild>
      <Link href="/customers">
        <ArrowLeft />
        Voltar para clientes
      </Link>
    </Button>
  );
}

export function CustomerDetailView({ customerId }: { customerId: string }) {
  // Somente para adaptar a interface: o backend sempre reaplica a autorização.
  const canUpdate = useCan("customers.update");
  const canDeactivate = useCan("customers.delete");
  const [reloadToken, setReloadToken] = useState(0);
  /** Resultado da última carga, com a chave (cliente + recarga) que o originou. */
  const [loaded, setLoaded] = useState<{ key: string; state: LoadState } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadKey = `${customerId}:${reloadToken}`;
  const state = loaded?.key === loadKey ? loaded.state : null;

  useEffect(() => {
    const controller = new AbortController();
    getCustomer(customerId, controller.signal)
      .then((customer) => setLoaded({ key: loadKey, state: { status: "ready", customer } }))
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
  }, [customerId, loadKey]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  if (state === null) {
    return (
      <div className="flex flex-1 flex-col gap-6" aria-busy="true">
        <BackToCustomers />
        <span role="status" className="sr-only">
          Carregando cliente…
        </span>
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-4 w-40" />
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
        <BackToCustomers />
        <EmptyState
          icon={SearchX}
          title="Cliente não encontrado"
          description="O cliente não existe ou não pertence a esta oficina."
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <BackToCustomers />
        <ErrorState
          title="Não foi possível carregar o cliente"
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

  const { customer } = state;
  const address = customer.address;
  const addressLine = [address.street, address.number].filter(Boolean).join(", ");
  const addressComplement = [address.neighborhood, address.city, address.state].filter(Boolean).join(" — ");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <BackToCustomers />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {customerCode(customer.number)} · {personTypeLabels[customer.personType]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDeactivate && customer.status !== "INACTIVE" ? (
              <Button size="sm" variant="outline" onClick={() => setIsDeactivateOpen(true)}>
                <UserX />
                Inativar
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
            <DetailField label="CEP" value={address.zipCode} />
            <DetailField label="Logradouro" value={addressLine} />
            <DetailField label="Complemento" value={address.complement} />
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
        onSaved={(saved) => {
          setLoaded({ key: loadKey, state: { status: "ready", customer: saved } });
          setFeedback("Alterações salvas.");
        }}
      />
      <CustomerDeactivateDialog
        customer={isDeactivateOpen ? customer : null}
        onOpenChange={setIsDeactivateOpen}
        onDeactivated={() => {
          setFeedback("Cliente inativado.");
          reload();
        }}
      />
    </div>
  );
}
