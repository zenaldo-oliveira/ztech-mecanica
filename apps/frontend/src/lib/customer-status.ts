import type { CustomerStatus } from "@/lib/mock/customers";

interface CustomerStatusConfig {
  label: string;
  dotClassName: string;
}

export const customerStatusConfig: Record<CustomerStatus, CustomerStatusConfig> = {
  ACTIVE: {
    label: "Ativo",
    dotClassName: "bg-success",
  },
  INACTIVE: {
    label: "Inativo",
    dotClassName: "bg-muted-foreground/50",
  },
  BLOCKED: {
    label: "Bloqueado",
    dotClassName: "bg-destructive",
  },
};

export const customerStatusOptions: { value: CustomerStatus; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "BLOCKED", label: "Bloqueado" },
];
