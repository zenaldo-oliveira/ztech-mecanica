"use client";

import { Menu, PanelLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppShell } from "@/components/layout/app-shell";
import { HelpMenu } from "@/components/layout/help-menu";
import { Kbd } from "@/components/layout/kbd";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { TopbarBreadcrumb } from "@/components/layout/topbar-breadcrumb";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkshopSwitcher } from "@/components/layout/workshop-switcher";
import { useIsApplePlatform } from "@/lib/use-media-query";

function SidebarToggle() {
  const { isDesktop, sidebarCollapsed, toggleSidebar } = useAppShell();
  const label = !isDesktop ? "Abrir menu" : sidebarCollapsed ? "Expandir menu" : "Recolher menu";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={label}
          aria-expanded={isDesktop ? !sidebarCollapsed : undefined}
          className="-ml-1.5 shrink-0"
        >
          {isDesktop ? (
            <PanelLeft className="size-4.5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SearchTrigger() {
  const { setSearchOpen } = useAppShell();
  const modifier = useIsApplePlatform() ? "⌘" : "Ctrl";

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setSearchOpen(true)}
        aria-label="Abrir busca global"
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden h-8 w-56 justify-start gap-2 bg-muted/40 px-2.5 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted/70 md:flex xl:w-72"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span className="flex-1 text-left">Buscar…</span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <Kbd>{modifier}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSearchOpen(true)}
        aria-label="Abrir busca global"
        className="md:hidden"
      >
        <Search className="size-4.5" aria-hidden="true" />
      </Button>
    </>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:px-4">
      <SidebarToggle />
      <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-border md:block" />
      <div className="min-w-0 flex-1 px-1">
        <TopbarBreadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <SearchTrigger />
        <div className="hidden lg:block">
          <WorkshopSwitcher />
        </div>
        <div className="hidden sm:block">
          <HelpMenu />
        </div>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
