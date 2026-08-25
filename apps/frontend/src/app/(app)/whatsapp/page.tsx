import { MessageCircle } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function WhatsappPage() {
  return (
    <ModulePlaceholder
      icon={MessageCircle}
      title="WhatsApp"
      description="Comunicação com clientes via WhatsApp."
    />
  );
}
