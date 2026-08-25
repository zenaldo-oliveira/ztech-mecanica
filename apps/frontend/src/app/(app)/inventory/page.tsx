import { Boxes } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      icon={Boxes}
      title="Estoque"
      description="Controle físico e financeiro do estoque."
    />
  );
}
