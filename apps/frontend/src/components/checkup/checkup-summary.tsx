"use client";

import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CheckupCategoryDefinition, CheckupClassification, CheckupItemsState } from "@/lib/checkup/types";

interface CheckupSummaryProps {
  categories: CheckupCategoryDefinition[];
  itemsState: CheckupItemsState;
  classification: CheckupClassification;
  onBack: () => void;
  onConfirm: () => void;
  isConfirmed: boolean;
}

interface ClassificationConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const CLASSIFICATION_CONFIG: Record<CheckupClassification, ClassificationConfig> = {
  NORMAL: {
    label: "CONDIÇÃO NORMAL",
    icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success",
  },
  ATTENTION: {
    label: "ATENÇÃO NECESSÁRIA",
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  REPAIR_NEEDED: {
    label: "NECESSITA REPARO",
    icon: XCircle,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function CheckupSummary({
  categories,
  itemsState,
  classification,
  onBack,
  onConfirm,
  isConfirmed,
}: CheckupSummaryProps) {
  const config = CLASSIFICATION_CONFIG[classification];
  const Icon = config.icon;

  const flaggedItems = categories.flatMap((category) =>
    category.items
      .filter((item) => {
        const status = itemsState[item.id]?.status;
        return status === "ATTENTION" || status === "PROBLEM";
      })
      .map((item) => ({ categoryLabel: category.label, item, state: itemsState[item.id] })),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex items-center gap-3 rounded-xl border p-4", config.className)}>
        <Icon className="size-6 shrink-0" />
        <div>
          <p className="text-xs font-medium tracking-wide uppercase opacity-80">Classificação geral</p>
          <p className="text-lg font-semibold">{config.label}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens sinalizados ({flaggedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {flaggedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item com atenção ou problema.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {flaggedItems.map(({ categoryLabel, item, state }) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <Badge
                      variant={state?.status === "PROBLEM" ? "destructive" : "default"}
                      className={state?.status === "ATTENTION" ? "bg-warning/15 text-warning" : undefined}
                    >
                      {state?.status === "PROBLEM" ? "Problema" : "Atenção"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{categoryLabel}</span>
                  {state?.note ? <p className="text-sm text-foreground">{state.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          Voltar ao checklist
        </Button>
        <Button onClick={onConfirm} disabled={isConfirmed}>
          {isConfirmed ? "Check-up confirmado" : "Confirmar check-up"}
        </Button>
      </div>

      {isConfirmed ? (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-success">
          Check-up confirmado. Classificação final: {config.label}.
        </div>
      ) : null}
    </div>
  );
}
