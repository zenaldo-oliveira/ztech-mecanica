"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { periodOptions, type DashboardPeriod } from "@/lib/mock/dashboard";

interface PeriodFilterProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as DashboardPeriod);
      }}
      aria-label="Selecionar período"
    >
      {periodOptions.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="px-3">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
