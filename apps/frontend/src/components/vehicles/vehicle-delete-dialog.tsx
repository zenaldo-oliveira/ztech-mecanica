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
import { errorMessage } from "@/lib/api/errors";
import { deleteVehicle, type Vehicle } from "@/lib/api/vehicles";

interface VehicleDeleteDialogProps {
  /** Veículo a excluir; null mantém o diálogo fechado. */
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "plate"> | null;
  onOpenChange: (open: boolean) => void;
  /** Chamado somente após a API confirmar a exclusão. */
  onDeleted: () => void;
}

/**
 * Confirmação da exclusão FÍSICA (DELETE /vehicles/:id, decisão V1). Se o veículo tiver
 * histórico vinculado, o backend recusa (409) e a mensagem é exibida aqui.
 */
export function VehicleDeleteDialog({ vehicle, onOpenChange, onDeleted }: VehicleDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    if (isSubmitting) return;
    if (!open) setError(null);
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!vehicle || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteVehicle(vehicle.id);
      onDeleted();
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={vehicle !== null} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isSubmitting} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir veículo?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {vehicle?.brand} {vehicle?.model} · {vehicle?.plate}
            </span>{" "}
            será excluído definitivamente. Veículos com orçamentos ou ordens de serviço não podem ser excluídos.
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
            {isSubmitting ? "Excluindo…" : "Excluir veículo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
