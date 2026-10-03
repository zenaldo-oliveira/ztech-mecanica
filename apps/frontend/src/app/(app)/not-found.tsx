import Link from "next/link";
import { ArrowLeft, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <MapPinOff className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h1 className="text-base font-medium text-foreground">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço acessado não existe no ZTech Mecânica. Use o menu ou a busca para encontrar o que precisa.
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft aria-hidden="true" />
          Voltar ao Dashboard
        </Link>
      </Button>
    </div>
  );
}
