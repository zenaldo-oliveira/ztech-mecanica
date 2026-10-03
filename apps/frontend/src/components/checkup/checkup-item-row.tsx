"use client";

import { AlertTriangle, Ban, Check, CircleDashed, X, type LucideIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { CheckupItemDefinition, CheckupItemState, CheckupItemStatus } from "@/lib/checkup/types";

interface StatusOption {
  value: CheckupItemStatus;
  label: string;
  icon: LucideIcon;
  activeClassName: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "OK",
    label: "OK",
    icon: Check,
    activeClassName: "data-[state=on]:border-success/40 data-[state=on]:bg-success/15 data-[state=on]:text-success",
  },
  {
    value: "ATTENTION",
    label: "Atenção",
    icon: AlertTriangle,
    activeClassName: "data-[state=on]:border-warning/40 data-[state=on]:bg-warning/15 data-[state=on]:text-warning",
  },
  {
    value: "PROBLEM",
    label: "Problema",
    icon: X,
    activeClassName:
      "data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive",
  },
  {
    value: "NA",
    label: "N/A",
    icon: Ban,
    activeClassName: "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
  },
  {
    value: "NOT_CHECKED",
    label: "Não verificado",
    icon: CircleDashed,
    activeClassName: "data-[state=on]:bg-muted data-[state=on]:text-muted-foreground",
  },
];

interface CheckupItemRowProps {
  item: CheckupItemDefinition;
  state: CheckupItemState;
  onChange: (next: CheckupItemState) => void;
}

export function CheckupItemRow({ item, state, onChange }: CheckupItemRowProps) {
  const needsNote = state.status === "ATTENTION" || state.status === "PROBLEM";

  function handleStatusChange(value: string) {
    if (!value) return;
    onChange({ ...state, status: value as CheckupItemStatus });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors",
        state.status === "PROBLEM" && "border-destructive/40 bg-destructive/5",
        state.status === "ATTENTION" && "border-warning/40 bg-warning/5",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium text-foreground">{item.label}</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={state.status}
          onValueChange={handleStatusChange}
          className="flex-wrap"
        >
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, activeClassName }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label} className={activeClassName}>
              <Icon />
              <span className="hidden lg:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {needsNote ? (
        <textarea
          value={state.note}
          onChange={(event) => onChange({ ...state, note: event.target.value })}
          placeholder="Descreva o que foi observado..."
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      ) : null}
    </div>
  );
}
