"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut, Settings, SlidersHorizontal, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf, roleLabels, tenantDisplayName, useSession } from "@/components/auth/session-provider";
import { logout } from "@/lib/api/auth";

/** Encerra a sessão no backend e volta ao login. */
function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Mesmo com falha de rede, o usuário sai da interface; o backend expira a sessão.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return { isLoggingOut, handleLogout };
}

/** Header + items shared by the topbar avatar menu and the sidebar footer menu. */
export function UserMenuItems({ onNavigate }: { onNavigate?: () => void }) {
  const me = useSession();
  const { isLoggingOut, handleLogout } = useLogout();

  return (
    <>
      <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
        <span className="truncate text-sm font-medium text-foreground">{me.user.name}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">{me.user.email}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">
          {roleLabels(me)} · {tenantDisplayName(me)}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/account/profile" onClick={onNavigate}>
            <User aria-hidden="true" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/preferences" onClick={onNavigate}>
            <SlidersHorizontal aria-hidden="true" />
            Preferências
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" onClick={onNavigate}>
            <Settings aria-hidden="true" />
            Configurações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        disabled={isLoggingOut}
        onSelect={(event) => {
          event.preventDefault();
          void handleLogout();
        }}
      >
        {isLoggingOut ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
        {isLoggingOut ? "Saindo…" : "Sair"}
      </DropdownMenuItem>
    </>
  );
}

export function UserMenu() {
  const me = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Menu do usuário: ${me.user.name}`}>
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(me.user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
