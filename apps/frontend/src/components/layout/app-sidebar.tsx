"use client";

import { useAppShell } from "@/components/layout/app-shell";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

/** Persistent sidebar for tablet (compact rail) and desktop. Mobile uses the drawer in `MobileNav`. */
export function AppSidebar() {
  const { sidebarCollapsed, isDesktop, toggleSidebar } = useAppShell();

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-sidebar-border/40 transition-[width] duration-200 ease-linear md:flex",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggleCollapse={isDesktop ? toggleSidebar : undefined}
      />
    </aside>
  );
}
