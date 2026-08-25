import { CreditCard } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function PaymentsPage() {
  return (
    <ModulePlaceholder
      icon={CreditCard}
      title="Pagamentos"
      description="Pagamentos, recebimentos e conciliação."
    />
  );
}
