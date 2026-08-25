"use client";

import { Label, Pie, PieChart } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { workOrderStatusData } from "@/lib/mock/dashboard";
import { workOrderStatusConfig } from "@/lib/work-order-status";

const chartData = workOrderStatusData.map((item) => ({
  ...item,
  key: workOrderStatusConfig[item.status].chartKey,
}));

const chartConfig = workOrderStatusData.reduce<ChartConfig>((config, item) => {
  const { chartKey, color, theme } = workOrderStatusConfig[item.status];
  config[chartKey] = theme
    ? { label: item.status, theme }
    : { label: item.status, color };
  return config;
}, {}) satisfies ChartConfig;

const total = workOrderStatusData.reduce((sum, item) => sum + item.count, 0);

const chartSummary = workOrderStatusData
  .map((item) => `${item.status}: ${item.count}`)
  .join(", ");

export function WorkOrderStatusChart() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">Status das OS</h2>
        <p className="text-xs text-muted-foreground">Distribuição atual</p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-56 sm:h-64"
        role="img"
        aria-label={`Gráfico de distribuição de ordens de serviço por status, total de ${total} OS. ${chartSummary}.`}
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="key"
            innerRadius={64}
            outerRadius={92}
            strokeWidth={2}
            stroke="var(--card)"
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || viewBox.cx == null || viewBox.cy == null) {
                  return null;
                }
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                      {total}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                      OS no total
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-1 flex flex-col gap-1.5">
        {workOrderStatusData.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5 text-xs">
            <span
              className={`size-2 shrink-0 rounded-xs ${workOrderStatusConfig[item.status].dotClassName}`}
              aria-hidden="true"
            />
            <span className="truncate text-muted-foreground">{item.status}</span>
            <span className="ml-auto tabular-nums text-muted-foreground/70">
              {Math.round((item.count / total) * 100)}%
            </span>
            <span className="w-5 shrink-0 text-right font-medium tabular-nums text-foreground">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
