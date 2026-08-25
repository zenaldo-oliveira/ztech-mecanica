import type { KpiDatum } from "@/lib/mock/dashboard";

interface KpiCardProps {
  data: KpiDatum;
}

export function KpiCard({ data }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4 sm:px-6 sm:py-5">
      <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
        {data.value}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{data.label}</span>
    </div>
  );
}
