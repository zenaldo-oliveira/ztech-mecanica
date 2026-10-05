import { customerStatusConfig } from "@/lib/customer-status";
import type { CustomerStatus } from "@/lib/api/customers";

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const config = customerStatusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className={`size-1.5 shrink-0 rounded-full ${config.dotClassName}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
