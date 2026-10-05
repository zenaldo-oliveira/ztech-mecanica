"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deactivateCustomer, type Customer } from "@/lib/api/customers";
import { errorMessage } from "@/lib/api/errors";

interface CustomerDeactivateDialogProps {
  /** Cliente a inativar; null mantém o diálogo fechado. */
  customer: Pick<Customer, "id" | "name"> | null;
  onOpenChange: (open: boolean) => void;
  /** Chamado somente após a API confirmar a inativação. */
  onDeactivated: () => void;
}

/**
 * Confirmação da inativação (exclusão LÓGICA via DELETE /customers/:id): o cliente passa a
 * "Inativo" e o histórico é preservado. Sucesso só é sinalizado depois da resposta da API.
 */
export function CustomerDeactivateDialog({ customer, onOpenChange, onDeactivated }: CustomerDeactivateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    if (isSubmitting) return;
    if (!open) setError(null);
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!customer || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deactivateCustomer(customer.id);
      onDeactivated();
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={customer !== null} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isSubmitting} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inativar cliente?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{customer?.name}</span> deixará de aparecer como ativo.
            O cadastro e todo o histórico são preservados, e o cliente pode ser reativado depois pela edição.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {isSubmitting ? "Inativando…" : "Inativar cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
