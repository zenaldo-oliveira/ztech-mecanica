"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcutsDialog } from "@/components/layout/keyboard-shortcuts-dialog";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";

interface AppShellContextValue {
  isDesktop: boolean;
  /** Effective rail state: tablets always get the compact rail. */
  sidebarCollapsed: boolean;
  /** Desktop: expand/collapse the sidebar. Tablet/mobile: open the navigation drawer. */
  toggleSidebar: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside <AppShell>.");
  return context;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { collapsed, toggle } = useSidebarCollapsed();
  const [drawerOpenState, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // The drawer only exists below the desktop breakpoint; resizing to desktop closes it.
  const drawerOpen = drawerOpenState && !isDesktop;

  const toggleSidebar = useCallback(() => {
    if (isDesktop) toggle();
    else setDrawerOpen(true);
  }, [isDesktop, toggle]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier || event.altKey || event.shiftKey) return;

      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      } else if (key === "b" && !isEditableTarget(event.target)) {
        event.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      isDesktop,
      sidebarCollapsed: isDesktop ? collapsed : true,
      toggleSidebar,
      drawerOpen,
      setDrawerOpen,
      searchOpen,
      setSearchOpen,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [isDesktop, collapsed, toggleSidebar, drawerOpen, searchOpen, shortcutsOpen],
  );

  return (
    <AppShellContext.Provider value={value}>
      <div className="flex h-dvh w-full overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Pular para o conteúdo
        </a>
        <AppSidebar />
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 outline-none sm:p-6"
          >
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcutsDialog />
    </AppShellContext.Provider>
  );
}
