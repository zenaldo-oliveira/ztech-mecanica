"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-sidebar-border/40 transition-[width] duration-200 ease-linear md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarNav collapsed={collapsed} onToggleCollapse={toggle} />
    </aside>
  );
}
