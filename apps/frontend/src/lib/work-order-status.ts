import type { WorkOrderStatus } from "@/lib/mock/dashboard";

interface StatusConfig {
  chartKey: string;
  /** CSS color for the Recharts fill when an existing theme-aware token covers this status. */
  color?: string;
  /** Explicit light/dark pair for the Recharts fill when no existing token applies. */
  theme?: { light: string; dark: string };
  /** Tailwind classes for the legend swatch — always theme-safe on their own. */
  dotClassName: string;
  badgeClassName: string;
}

export const workOrderStatusConfig: Record<WorkOrderStatus, StatusConfig> = {
  Aberta: {
    chartKey: "aberta",
    color: "var(--muted-foreground)",
    dotClassName: "bg-muted-foreground/60",
    badgeClassName: "bg-muted text-muted-foreground",
  },
  "Em diagnóstico": {
    chartKey: "diagnostico",
    theme: { light: "oklch(0.588 0.158 241.966)", dark: "oklch(0.746 0.16 232.661)" },
    dotClassName: "bg-sky-500 dark:bg-sky-400",
    badgeClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  "Em serviço": {
    chartKey: "servico",
    color: "var(--primary)",
    dotClassName: "bg-primary",
    badgeClassName: "bg-primary/10 text-primary",
  },
  "Aguardando aprovação": {
    chartKey: "aprovacao",
    color: "var(--warning)",
    dotClassName: "bg-warning",
    badgeClassName: "bg-warning/10 text-warning",
  },
  Pronta: {
    chartKey: "pronta",
    color: "var(--success)",
    dotClassName: "bg-success",
    badgeClassName: "bg-success/10 text-success",
  },
  Finalizada: {
    chartKey: "finalizada",
    color: "var(--muted-foreground)",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "bg-secondary text-secondary-foreground",
  },
};
