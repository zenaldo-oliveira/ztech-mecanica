import { FileText } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function QuotesPage() {
  return (
    <ModulePlaceholder
      icon={FileText}
      title="Orçamentos"
      description="Criação, aprovação e acompanhamento de orçamentos."
    />
  );
}
