"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAppShell } from "@/components/layout/app-shell";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/** Navigation drawer for mobile and tablet, opened from the topbar menu button. */
export function MobileNav() {
  const { drawerOpen, setDrawerOpen } = useAppShell();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-72" showCloseButton={false}>
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SheetDescription className="sr-only">Acesse os módulos do ZTech Mecânica.</SheetDescription>
        <SidebarNav onNavigate={() => setDrawerOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
