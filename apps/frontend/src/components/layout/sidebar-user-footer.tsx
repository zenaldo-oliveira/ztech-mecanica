"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockSession } from "@/lib/mock/session";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  collapsed: boolean;
}

export function SidebarUserFooter({ collapsed }: SidebarUserFooterProps) {
  const { tenant, user } = mockSession;

  const trigger = (
    <button
      type="button"
      aria-label={`Conta: ${tenant.name}`}
      className={cn(
        "flex w-full items-center rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent/40",
        collapsed ? "justify-center gap-0" : "justify-start gap-3",
      )}
    >
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
          {user.initials}
        </AvatarFallback>
      </Avatar>
      <span
        aria-hidden={collapsed}
        className={cn(
          "flex min-w-0 items-center overflow-hidden transition-[opacity,max-width] duration-200 ease-linear",
          collapsed ? "max-w-0 opacity-0" : "max-w-full flex-1 opacity-100",
        )}
      >
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span
            title={tenant.name}
            className="w-full truncate text-sm font-medium text-sidebar-foreground"
          >
            {tenant.name}
          </span>
          <span className="w-full truncate text-xs text-sidebar-foreground/50">
            Plano {tenant.plan}
          </span>
        </span>
        <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/40" aria-hidden="true" />
      </span>
    </button>
  );

  return (
    <div className="shrink-0 border-t border-sidebar-border/60 p-3">
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              {tenant.name} · {user.name}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent align="end" side="top" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{tenant.name}</span>
              <Badge variant="secondary">{tenant.plan}</Badge>
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              {user.name} · {user.role}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
