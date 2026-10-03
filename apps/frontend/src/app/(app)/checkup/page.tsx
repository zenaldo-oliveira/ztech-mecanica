import { CheckupView } from "@/components/checkup/checkup-view";
import { PageHeader } from "@/components/layout/page-header";

export default function CheckupPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Check-up Inteligente"
        description="Checklists completos e independentes para inspeção de motos e carros."
      />
      <CheckupView />
    </div>
  );
}
