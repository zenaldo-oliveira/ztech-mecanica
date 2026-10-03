import type { CheckupClassification, CheckupItemsState } from "@/lib/checkup/types";

export function classifyCheckup(itemsState: CheckupItemsState): CheckupClassification {
  const statuses = Object.values(itemsState).map((item) => item.status);

  if (statuses.includes("PROBLEM")) return "REPAIR_NEEDED";
  if (statuses.includes("ATTENTION")) return "ATTENTION";
  return "NORMAL";
}
