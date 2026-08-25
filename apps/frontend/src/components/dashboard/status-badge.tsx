import { Badge } from "@/components/ui/badge";
import { workOrderStatusConfig } from "@/lib/work-order-status";
import type { WorkOrderStatus } from "@/lib/mock/dashboard";

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <Badge className={workOrderStatusConfig[status].badgeClassName}>{status}</Badge>
  );
}
