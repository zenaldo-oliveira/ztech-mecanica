import { Hammer, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Módulo em construção"
        description="Esta área será implementada em uma próxima fase do desenvolvimento do frontend."
        action={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hammer className="size-3.5" aria-hidden="true" />
            <span>AutoForge ERP</span>
          </div>
        }
      />
    </div>
  );
}
