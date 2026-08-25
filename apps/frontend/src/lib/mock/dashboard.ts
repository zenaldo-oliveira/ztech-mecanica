export type DashboardPeriod = "today" | "7d" | "30d" | "month";

export const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Este mês" },
];

export interface KpiDatum {
  id: string;
  label: string;
  value: string;
  context: string;
  trend?: { direction: "up" | "down"; value: string };
}

export const kpiData: KpiDatum[] = [
  {
    id: "open-work-orders",
    label: "OS Abertas",
    value: "18",
    context: "no total, hoje",
    trend: { direction: "up", value: "+3 desde ontem" },
  },
  {
    id: "in-service",
    label: "Em Serviço",
    value: "7",
    context: "em execução agora",
  },
  {
    id: "waiting-approval",
    label: "Aguardando Aprovação",
    value: "5",
    context: "orçamentos enviados",
    trend: { direction: "down", value: "-2 desde ontem" },
  },
  {
    id: "revenue",
    label: "Faturamento",
    value: "R$ 24.580",
    context: "no período selecionado",
    trend: { direction: "up", value: "+12% vs. período anterior" },
  },
];

interface RevenuePoint {
  date: string;
  revenue: number;
}

const revenueByPeriod: Record<DashboardPeriod, RevenuePoint[]> = {
  today: [
    { date: "08h", revenue: 320 },
    { date: "10h", revenue: 680 },
    { date: "12h", revenue: 540 },
    { date: "14h", revenue: 910 },
    { date: "16h", revenue: 1240 },
    { date: "18h", revenue: 860 },
  ],
  "7d": [
    { date: "Seg", revenue: 2450 },
    { date: "Ter", revenue: 3120 },
    { date: "Qua", revenue: 2780 },
    { date: "Qui", revenue: 3560 },
    { date: "Sex", revenue: 4210 },
    { date: "Sáb", revenue: 3890 },
    { date: "Dom", revenue: 1340 },
  ],
  "30d": [
    { date: "01", revenue: 1800 }, { date: "03", revenue: 2100 }, { date: "05", revenue: 1950 },
    { date: "07", revenue: 2600 }, { date: "09", revenue: 2300 }, { date: "11", revenue: 2900 },
    { date: "13", revenue: 3100 }, { date: "15", revenue: 2750 }, { date: "17", revenue: 3400 },
    { date: "19", revenue: 3050 }, { date: "21", revenue: 3600 }, { date: "23", revenue: 3300 },
    { date: "25", revenue: 3800 }, { date: "27", revenue: 4100 }, { date: "29", revenue: 3950 },
  ],
  month: [
    { date: "Sem 1", revenue: 12400 },
    { date: "Sem 2", revenue: 15800 },
    { date: "Sem 3", revenue: 14200 },
    { date: "Sem 4", revenue: 18100 },
  ],
};

const revenueTotalByPeriod: Record<DashboardPeriod, string> = {
  today: "R$ 4.550",
  "7d": "R$ 21.350",
  "30d": "R$ 45.700",
  month: "R$ 60.500",
};

export function getRevenueSeries(period: DashboardPeriod): RevenuePoint[] {
  return revenueByPeriod[period];
}

export function getRevenueTotal(period: DashboardPeriod): string {
  return revenueTotalByPeriod[period];
}

export type WorkOrderStatus =
  | "Aberta"
  | "Em diagnóstico"
  | "Em serviço"
  | "Aguardando aprovação"
  | "Pronta"
  | "Finalizada";

export const workOrderStatusData: { status: WorkOrderStatus; count: number; fill: string }[] = [
  { status: "Aberta", count: 6, fill: "var(--color-aberta)" },
  { status: "Em diagnóstico", count: 4, fill: "var(--color-diagnostico)" },
  { status: "Em serviço", count: 7, fill: "var(--color-servico)" },
  { status: "Aguardando aprovação", count: 5, fill: "var(--color-aprovacao)" },
  { status: "Pronta", count: 3, fill: "var(--color-pronta)" },
  { status: "Finalizada", count: 12, fill: "var(--color-finalizada)" },
];

export interface RecentWorkOrder {
  id: string;
  customer: string;
  vehicle: string;
  service: string;
  status: WorkOrderStatus;
  value: string;
}

export const recentWorkOrders: RecentWorkOrder[] = [
  { id: "OS-001", customer: "João Silva", vehicle: "Honda CG 160", service: "Revisão", status: "Em serviço", value: "R$ 480" },
  { id: "OS-002", customer: "Maria Souza", vehicle: "Toyota Corolla", service: "Freios", status: "Aguardando aprovação", value: "R$ 1.280" },
  { id: "OS-003", customer: "Carlos Lima", vehicle: "Honda Civic", service: "Suspensão", status: "Pronta", value: "R$ 950" },
  { id: "OS-004", customer: "Ana Ferreira", vehicle: "Yamaha Fazer 250", service: "Troca de óleo", status: "Finalizada", value: "R$ 180" },
  { id: "OS-005", customer: "Pedro Rocha", vehicle: "Jeep Renegade", service: "Elétrica", status: "Em diagnóstico", value: "R$ 320" },
  { id: "OS-006", customer: "Beatriz Nunes", vehicle: "Fiat Argo", service: "Alinhamento", status: "Aberta", value: "R$ 140" },
];

export interface CriticalStockItem {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
}

export const criticalStockItems: CriticalStockItem[] = [
  { id: "prod-001", name: "Filtro de óleo", quantity: 3, minStock: 10 },
  { id: "prod-002", name: "Pastilha de freio", quantity: 2, minStock: 8 },
  { id: "prod-003", name: "Óleo 10W40", quantity: 4, minStock: 15 },
  { id: "prod-004", name: "Corrente de transmissão", quantity: 1, minStock: 6 },
];

export interface TopServiceDatum {
  service: string;
  count: number;
}

export const topServicesData: TopServiceDatum[] = [
  { service: "Troca de óleo", count: 42 },
  { service: "Revisão", count: 35 },
  { service: "Freios", count: 28 },
  { service: "Suspensão", count: 19 },
  { service: "Elétrica", count: 14 },
];
