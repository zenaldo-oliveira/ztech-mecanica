"use client";

import Link from "next/link";
import { LogOut, Settings, SlidersHorizontal, User } from "lucide-react";

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
import { mockSession } from "@/lib/mock/session";

/** Header + items shared by the topbar avatar menu and the sidebar footer menu. */
export function UserMenuItems({ onNavigate }: { onNavigate?: () => void }) {
  const { tenant, user } = mockSession;

  return (
    <>
      <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
        <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">
          {user.role} · {tenant.name}
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
      <DropdownMenuItem variant="destructive" asChild>
        <Link href="/signed-out" onClick={onNavigate}>
          <LogOut aria-hidden="true" />
          Sair
        </Link>
      </DropdownMenuItem>
    </>
  );
}

export function UserMenu() {
  const { user } = mockSession;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Menu do usuário: ${user.name}`}
        >
          <Avatar size="sm">
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
