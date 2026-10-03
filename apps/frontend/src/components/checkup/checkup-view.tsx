"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckupCategory } from "@/components/checkup/checkup-category";
import { CheckupProgress, type CheckupStatusFilter } from "@/components/checkup/checkup-progress";
import { CheckupSummary } from "@/components/checkup/checkup-summary";
import { CheckupTypeSelect } from "@/components/checkup/checkup-type-select";
import { CHECKUP_CHECKLISTS } from "@/lib/checkup/checklist-data";
import { classifyCheckup } from "@/lib/checkup/classification";
import type { CheckupItemState, CheckupItemStatus, CheckupItemsState } from "@/lib/checkup/types";
import type { VehicleType } from "@/lib/mock/vehicles";

type CheckupStep = "checklist" | "review";

const TYPE_LABEL: Record<VehicleType, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
};

const EMPTY_COUNTS: Record<CheckupItemStatus, number> = {
  OK: 0,
  ATTENTION: 0,
  PROBLEM: 0,
  NA: 0,
  NOT_CHECKED: 0,
};

function buildInitialItemsState(vehicleType: VehicleType): CheckupItemsState {
  const state: CheckupItemsState = {};
  for (const category of CHECKUP_CHECKLISTS[vehicleType]) {
    for (const item of category.items) {
      state[item.id] = { status: "NOT_CHECKED", note: "" };
    }
  }
  return state;
}

export function CheckupView() {
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [step, setStep] = useState<CheckupStep>("checklist");
  const [itemsState, setItemsState] = useState<CheckupItemsState>({});
  const [filter, setFilter] = useState<CheckupStatusFilter>("ALL");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const categories = vehicleType ? CHECKUP_CHECKLISTS[vehicleType] : [];

  const counts = useMemo(() => {
    const result = { ...EMPTY_COUNTS };
    for (const state of Object.values(itemsState)) {
      result[state.status] += 1;
    }
    return result;
  }, [itemsState]);

  const totalItems = Object.keys(itemsState).length;
  const checkedItems = totalItems - counts.NOT_CHECKED;
  const classification = useMemo(() => classifyCheckup(itemsState), [itemsState]);

  const visibleItemIds = useMemo(() => {
    if (filter === "ALL") return null;
    return new Set(
      Object.entries(itemsState)
        .filter(([, state]) => state.status === filter)
        .map(([id]) => id),
    );
  }, [filter, itemsState]);

  function handleSelectType(type: VehicleType) {
    setVehicleType(type);
    setItemsState(buildInitialItemsState(type));
    setFilter("ALL");
    setIsConfirmed(false);
    setStep("checklist");
  }

  function handleItemChange(itemId: string, next: CheckupItemState) {
    setItemsState((previous) => ({ ...previous, [itemId]: next }));
  }

  function handleRestart() {
    setVehicleType(null);
    setStep("checklist");
    setItemsState({});
    setFilter("ALL");
    setIsConfirmed(false);
  }

  if (!vehicleType) {
    return <CheckupTypeSelect onSelect={handleSelectType} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Check-up em andamento</p>
          <p className="text-lg font-semibold text-foreground">{TYPE_LABEL[vehicleType]}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRestart}>
          <RotateCcw />
          Trocar tipo
        </Button>
      </div>

      {step === "checklist" ? (
        <>
          <CheckupProgress
            totalItems={totalItems}
            checkedItems={checkedItems}
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
          />

          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <CheckupCategory
                key={category.id}
                category={category}
                itemsState={itemsState}
                onItemChange={handleItemChange}
                visibleItemIds={visibleItemIds}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep("review")}>Ir para revisão final</Button>
          </div>
        </>
      ) : (
        <CheckupSummary
          categories={categories}
          itemsState={itemsState}
          classification={classification}
          onBack={() => setStep("checklist")}
          onConfirm={() => setIsConfirmed(true)}
          isConfirmed={isConfirmed}
        />
      )}
    </div>
  );
}
