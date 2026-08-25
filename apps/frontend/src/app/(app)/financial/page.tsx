import { Wallet } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function FinancialPage() {
  return (
    <ModulePlaceholder
      icon={Wallet}
      title="Financeiro"
      description="Contas a pagar, a receber e fluxo de caixa."
    />
  );
}
