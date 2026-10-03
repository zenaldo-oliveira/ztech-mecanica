"use client";

import Link from "next/link";
import { BookOpen, CircleQuestionMark, Keyboard, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppShell } from "@/components/layout/app-shell";

export function HelpMenu() {
  const { setShortcutsOpen } = useAppShell();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ajuda">
              <CircleQuestionMark className="size-4.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Ajuda</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ajuda</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/help">
            <BookOpen aria-hidden="true" />
            Central de ajuda
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
          <Keyboard aria-hidden="true" />
          Atalhos de teclado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help">
            <LifeBuoy aria-hidden="true" />
            Falar com o suporte
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
