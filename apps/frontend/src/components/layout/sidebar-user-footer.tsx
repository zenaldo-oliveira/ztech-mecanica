"use client";

import { ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserMenuItems } from "@/components/layout/user-menu";
import { initialsOf, roleLabels, useSession } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarUserFooter({ collapsed, onNavigate }: SidebarUserFooterProps) {
  const me = useSession();
  const role = roleLabels(me);

  const trigger = (
    <button
      type="button"
      aria-label={`Conta de ${me.user.name}, ${role}`}
      className={cn(
        "flex w-full items-center rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/40 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed ? "justify-center" : "gap-3",
      )}
    >
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
          {initialsOf(me.user.name)}
        </AvatarFallback>
      </Avatar>
      {collapsed ? null : (
        <>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{me.user.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/55">{role}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/40" aria-hidden="true" />
        </>
      )}
    </button>
  );

  return (
    <div className={cn("shrink-0 border-t border-sidebar-border/60 p-3", collapsed && "p-2")}>
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              {me.user.name} · {role}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent align="start" side={collapsed ? "right" : "top"} className="w-64">
          <UserMenuItems onNavigate={onNavigate} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
