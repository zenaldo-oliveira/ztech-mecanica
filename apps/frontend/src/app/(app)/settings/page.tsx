import { Settings } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Configurações"
      description="Configurações da empresa e da conta."
    />
  );
}
