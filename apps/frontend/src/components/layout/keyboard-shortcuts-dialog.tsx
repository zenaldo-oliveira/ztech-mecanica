"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppShell } from "@/components/layout/app-shell";
import { Kbd } from "@/components/layout/kbd";
import { useIsApplePlatform } from "@/lib/use-media-query";

export function KeyboardShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useAppShell();
  const modifier = useIsApplePlatform() ? "⌘" : "Ctrl";

  const shortcuts = [
    { keys: [modifier, "K"], description: "Abrir a busca global" },
    { keys: [modifier, "B"], description: "Expandir ou recolher o menu lateral" },
    { keys: ["↑", "↓"], description: "Navegar pelos resultados da busca" },
    { keys: ["Enter"], description: "Abrir o resultado selecionado" },
    { keys: ["Esc"], description: "Fechar busca, menus e janelas" },
  ];

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>Trabalhe mais rápido sem tirar as mãos do teclado.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y divide-border">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.description} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
