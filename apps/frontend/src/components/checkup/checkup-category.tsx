"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckupItemRow } from "@/components/checkup/checkup-item-row";
import { cn } from "@/lib/utils";
import type { CheckupCategoryDefinition, CheckupItemState, CheckupItemsState } from "@/lib/checkup/types";

interface CheckupCategoryProps {
  category: CheckupCategoryDefinition;
  itemsState: CheckupItemsState;
  onItemChange: (itemId: string, next: CheckupItemState) => void;
  visibleItemIds: Set<string> | null;
}

export function CheckupCategory({ category, itemsState, onItemChange, visibleItemIds }: CheckupCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFiltering = visibleItemIds !== null;

  const visibleItems = isFiltering
    ? category.items.filter((item) => visibleItemIds.has(item.id))
    : category.items;

  if (visibleItems.length === 0) return null;

  const total = category.items.length;
  const verified = category.items.filter((item) => itemsState[item.id]?.status !== "NOT_CHECKED").length;
  const problems = category.items.filter((item) => itemsState[item.id]?.status === "PROBLEM").length;
  const attentions = category.items.filter((item) => itemsState[item.id]?.status === "ATTENTION").length;

  const expanded = isOpen || isFiltering;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{category.label}</span>
          {problems > 0 ? (
            <Badge variant="destructive">
              {problems} {problems > 1 ? "problemas" : "problema"}
            </Badge>
          ) : null}
          {attentions > 0 ? <Badge className="bg-warning/15 text-warning">{attentions} atenção</Badge> : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {verified}/{total} verificados
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-border p-3">
          {visibleItems.map((item) => (
            <CheckupItemRow
              key={item.id}
              item={item}
              state={itemsState[item.id] ?? { status: "NOT_CHECKED", note: "" }}
              onChange={(next) => onItemChange(item.id, next)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
