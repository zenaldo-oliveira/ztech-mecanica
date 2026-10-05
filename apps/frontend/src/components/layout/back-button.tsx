"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allNavItems, findActiveNavItem } from "@/lib/navigation";
import {
  HOME_PATH,
  fallbackPath,
  isSafeInternalPath,
  navigationHistoryStore,
  previousInternalPath,
} from "@/lib/navigation-history";

const KNOWN_PATHS: ReadonlySet<string> = new Set(allNavItems.map(({ item }) => item.href));

function labelFor(path: string): string {
  if (path === HOME_PATH) return "Dashboard";
  return findActiveNavItem(path)?.item.label ?? "tela anterior";
}

/**
 * "Voltar" da topbar. Com origem interna conhecida, volta no histórico do navegador
 * (mesmo efeito do botão Voltar do navegador, sem recarregar). Sem origem confiável (rota
 * aberta diretamente ou página recarregada), vai para a rota pai no mapa de navegação,
 * substituindo a entrada atual para não criar loop. Nunca usa URL vinda do usuário.
 */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const history = useSyncExternalStore(
    navigationHistoryStore.subscribe,
    navigationHistoryStore.getSnapshot,
    navigationHistoryStore.getServerSnapshot,
  );

  useEffect(() => {
    navigationHistoryStore.record(pathname);
  }, [pathname]);

  const previous = previousInternalPath(history);
  const fallback = fallbackPath(pathname, KNOWN_PATHS);
  const target = previous ?? fallback;
  if (!target) return null;

  const label = `Voltar para ${labelFor(target)}`;

  function handleBack() {
    if (previous) {
      router.back();
      return;
    }
    if (fallback && isSafeInternalPath(fallback)) {
      navigationHistoryStore.markReplace();
      router.replace(fallback);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label={label} className="shrink-0">
          <ArrowLeft className="size-4.5" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
