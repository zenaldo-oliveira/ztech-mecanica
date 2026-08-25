import { ShoppingCart } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function PurchasesPage() {
  return (
    <ModulePlaceholder
      icon={ShoppingCart}
      title="Compras"
      description="Processo de aquisição de peças e produtos."
    />
  );
}
