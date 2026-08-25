"use client";

import { useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  getRevenueSeries,
  getRevenueTotal,
  periodOptions,
  type DashboardPeriod,
} from "@/lib/mock/dashboard";

const chartConfig = {
  revenue: {
    label: "Faturamento",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const MASKED_VALUE = "••••••••";

interface RevenueChartProps {
  period: DashboardPeriod;
  trend?: { direction: "up" | "down"; value: string };
}

export function RevenueChart({ period, trend }: RevenueChartProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const data = getRevenueSeries(period);
  const periodLabel = periodOptions.find((option) => option.value === period)?.label;
  const total = getRevenueTotal(period);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Faturamento · {periodLabel}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-xl",
                isRevealed ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {isRevealed ? total : MASKED_VALUE}
            </span>
            <button
              type="button"
              onClick={() => setIsRevealed((prev) => !prev)}
              aria-label={isRevealed ? "Ocultar faturamento" : "Mostrar faturamento"}
              aria-pressed={isRevealed}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              {isRevealed ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {trend ? (
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.direction === "up" ? "text-success" : "text-destructive",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-4" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-4" aria-hidden="true" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>

      {isRevealed ? (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-20 w-full duration-200 animate-in fade-in-0 sm:h-24"
          role="img"
          aria-label={`Gráfico de evolução do faturamento — ${periodLabel}, total de ${total}.`}
        >
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                  indicator="line"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      ) : null}
    </div>
  );
}
