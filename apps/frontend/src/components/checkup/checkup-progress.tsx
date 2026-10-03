"use client";

import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CheckupItemStatus } from "@/lib/checkup/types";

export type CheckupStatusFilter = CheckupItemStatus | "ALL";

interface CheckupProgressProps {
  totalItems: number;
  checkedItems: number;
  counts: Record<CheckupItemStatus, number>;
  filter: CheckupStatusFilter;
  onFilterChange: (filter: CheckupStatusFilter) => void;
}

const FILTERS: { value: CheckupStatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "OK", label: "OK" },
  { value: "ATTENTION", label: "Atenção" },
  { value: "PROBLEM", label: "Problema" },
  { value: "NA", label: "N/A" },
  { value: "NOT_CHECKED", label: "Não verificados" },
];

export function CheckupProgress({
  totalItems,
  checkedItems,
  counts,
  filter,
  onFilterChange,
}: CheckupProgressProps) {
  const percentage = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Progresso do check-up</span>
        <span className="text-muted-foreground">
          {checkedItems}/{totalItems} itens verificados ({percentage}%)
        </span>
      </div>

      <Progress value={percentage} />

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(value) => value && onFilterChange(value as CheckupStatusFilter)}
        className="flex-wrap"
      >
        {FILTERS.map(({ value, label }) => (
          <ToggleGroupItem key={value} value={value}>
            {label}
            {value !== "ALL" ? (
              <span className="ml-1 text-xs text-muted-foreground">({counts[value]})</span>
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
