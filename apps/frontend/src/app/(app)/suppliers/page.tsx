import { Truck } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function SuppliersPage() {
  return (
    <ModulePlaceholder
      icon={Truck}
      title="Fornecedores"
      description="Cadastro e histórico dos fornecedores."
    />
  );
}
