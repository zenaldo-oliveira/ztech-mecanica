import { Package } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function ProductsPage() {
  return (
    <ModulePlaceholder
      icon={Package}
      title="Produtos"
      description="Cadastro de peças, produtos, materiais e insumos."
    />
  );
}
