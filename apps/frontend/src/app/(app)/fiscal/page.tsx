import { Receipt } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function FiscalPage() {
  return (
    <ModulePlaceholder
      icon={Receipt}
      title="Fiscal"
      description="Documentos fiscais emitidos e recebidos."
    />
  );
}
