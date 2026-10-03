"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, SearchX } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAppShell } from "@/components/layout/app-shell";
import { Kbd } from "@/components/layout/kbd";
import { searchAll, type SearchResult } from "@/lib/search-index";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  onClose: () => void;
}

/** Mounted only while the dialog is open, so query and selection reset on every opening. */
function SearchPanel({ onClose }: SearchPanelProps) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = useMemo(() => searchAll(query), [query]);
  const flatResults = useMemo(() => groups.flatMap((group) => group.results), [groups]);
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeResult: SearchResult | undefined = flatResults[activeIndex];

  useEffect(() => {
    document.getElementById(`${listboxId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId]);

  function open(result: SearchResult) {
    onClose();
    router.push(result.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = flatResults.length;
    if (count === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + count) % count);
    } else if (event.key === "Home" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(count - 1);
    } else if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      open(activeResult);
    }
  }

  let runningIndex = 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeResult ? optionId(activeIndex) : undefined}
          aria-label="Buscar no ZTECH OFICINA"
          placeholder="Buscar cliente, placa, OS, produto ou página…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          className="h-12 min-w-0 flex-1 truncate bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <Kbd className="hidden sm:inline-flex">Esc</Kbd>
      </div>

      <div
        id={listboxId}
        role="listbox"
        aria-label="Resultados da busca"
        className="max-h-[min(60dvh,26rem)] overflow-y-auto p-2"
      >
        {flatResults.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-foreground">Nenhum resultado para “{query.trim()}”</p>
            <p className="text-xs text-muted-foreground">
              Tente o nome do cliente, a placa, o número da OS ou o nome de uma página.
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const labelId = `${listboxId}-${group.id}`;
            return (
              <div key={group.id} role="group" aria-labelledby={labelId} className="mb-1 last:mb-0">
                <div
                  id={labelId}
                  role="presentation"
                  className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                >
                  {group.label}
                </div>
                {group.results.map((result) => {
                  const index = runningIndex++;
                  const active = index === activeIndex;
                  const Icon = result.icon;
                  return (
                    <div
                      key={result.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => {
                        if (!active) setActiveIndex(index);
                      }}
                      onClick={() => open(result)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm",
                        active ? "bg-accent text-accent-foreground" : "text-foreground",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{result.title}</span>
                        {result.subtitle ? (
                          <span className="truncate text-xs text-muted-foreground">{result.subtitle}</span>
                        ) : null}
                      </span>
                      {active ? (
                        <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="hidden items-center gap-3 sm:flex">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> abrir
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> fechar
          </span>
        </span>
        <span>Dados de demonstração</span>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { searchOpen, setSearchOpen } = useAppShell();

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[10dvh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:top-[14dvh]"
      >
        <DialogTitle className="sr-only">Busca global</DialogTitle>
        <DialogDescription className="sr-only">
          Busque clientes, veículos, ordens de serviço, orçamentos, produtos, páginas e configurações.
        </DialogDescription>
        <SearchPanel onClose={() => setSearchOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
