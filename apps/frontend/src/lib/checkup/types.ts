export type CheckupItemStatus = "OK" | "ATTENTION" | "PROBLEM" | "NA" | "NOT_CHECKED";

export interface CheckupItemDefinition {
  id: string;
  label: string;
}

export interface CheckupCategoryDefinition {
  id: string;
  label: string;
  items: CheckupItemDefinition[];
}

export interface CheckupItemState {
  status: CheckupItemStatus;
  note: string;
}

export type CheckupItemsState = Record<string, CheckupItemState>;

export type CheckupClassification = "NORMAL" | "ATTENTION" | "REPAIR_NEEDED";
