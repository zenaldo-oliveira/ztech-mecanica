import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <MobileNav />

      <div className="relative flex-1 sm:max-w-55">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/70"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Pesquisar clientes, veículos, OS..."
          aria-label="Pesquisa global"
          className="h-7 border-transparent bg-muted/60 pl-7 text-xs placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:border-ring md:text-xs"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
