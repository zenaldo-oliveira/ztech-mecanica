import { Wrench } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function ServicesPage() {
  return (
    <ModulePlaceholder
      icon={Wrench}
      title="Serviços"
      description="Cadastro dos serviços oferecidos pela oficina."
    />
  );
}
