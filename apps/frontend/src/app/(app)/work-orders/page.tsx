import { ClipboardList } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function WorkOrdersPage() {
  return (
    <ModulePlaceholder
      icon={ClipboardList}
      title="Ordens de Serviço"
      description="Execução e acompanhamento das ordens de serviço."
    />
  );
}
