"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { topServicesData } from "@/lib/mock/dashboard";

const chartConfig = {
  count: {
    label: "Serviços realizados",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const chartSummary = topServicesData
  .map((item) => `${item.service}: ${item.count}`)
  .join(", ");

export function TopServicesChart() {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Serviços mais realizados</CardTitle>
        <CardDescription className="text-xs">No período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-48 w-full sm:h-52"
          role="img"
          aria-label={`Gráfico de serviços mais realizados. ${chartSummary}.`}
        >
          <BarChart data={topServicesData} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="service"
              type="category"
              tickLine={false}
              axisLine={false}
              width={104}
              fontSize={12}
            />
            <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4}>
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground tabular-nums"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
