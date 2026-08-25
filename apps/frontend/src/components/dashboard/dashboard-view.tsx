"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { WorkOrderStatusChart } from "@/components/dashboard/work-order-status-chart";
import { RecentWorkOrdersCard } from "@/components/dashboard/recent-work-orders-card";
import { CriticalStockCard } from "@/components/dashboard/critical-stock-card";
import { TopServicesChart } from "@/components/dashboard/top-services-chart";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  kpiData,
  workOrderStatusData,
  type DashboardPeriod,
  type KpiDatum,
} from "@/lib/mock/dashboard";

const LOADING_DELAY_MS = 400;

export function DashboardView() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timeout);
  }, []);

  const revenueKpi = kpiData.find((kpi) => kpi.id === "revenue");
  const readyCount = workOrderStatusData.find((item) => item.status === "Pronta")?.count ?? 0;
  const readyKpi: KpiDatum = {
    id: "ready",
    label: "Prontas",
    value: String(readyCount),
    context: "prontas para retirada",
  };
  const summaryKpis = [...kpiData.filter((kpi) => kpi.id !== "revenue"), readyKpi];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação da oficina"
        actions={
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <Button size="sm">
              <Plus />
              Nova OS
            </Button>
          </>
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Nível 1 — Resumo Operacional */}
          <section className="rounded-xl border border-border bg-card duration-200 animate-in fade-in-0 slide-in-from-bottom-2">
            <div className="border-b border-border/60 px-5 py-3 sm:px-6">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Operação
              </h2>
            </div>
            <div className="grid grid-cols-2 divide-y divide-border/60 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {summaryKpis.map((kpi, index) => (
                <div
                  key={kpi.id}
                  className="duration-200 animate-in fade-in-0"
                  style={{ animationDelay: `${(index + 1) * 40}ms` }}
                >
                  <KpiCard data={kpi} />
                </div>
              ))}
            </div>
          </section>

          {/* Nível 2 — Ordens de Serviço + Status */}
          <section className="grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-card duration-200 animate-in fade-in-0 slide-in-from-bottom-2 delay-[40ms] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="p-5 sm:p-6 lg:col-span-2">
              <RecentWorkOrdersCard />
            </div>
            <div className="p-5 sm:p-6">
              <WorkOrderStatusChart />
            </div>
          </section>

          {/* Nível 3 — Estoque + Serviços */}
          <div className="grid gap-4 duration-200 animate-in fade-in-0 slide-in-from-bottom-2 delay-[80ms] lg:grid-cols-2">
            <CriticalStockCard />
            <TopServicesChart />
          </div>

          {/* Nível 4 — Financeiro discreto */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 duration-200 animate-in fade-in-0 slide-in-from-bottom-2 delay-[120ms] sm:px-6">
            <RevenueChart period={period} trend={revenueKpi?.trend} />
          </div>
        </>
      )}
    </div>
  );
}
