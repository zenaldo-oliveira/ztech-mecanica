"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarUserFooter } from "@/components/layout/sidebar-user-footer";
import { dashboardNavItem, navGroups, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

interface NavLinkProps {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, pathname, collapsed, onNavigate }: NavLinkProps) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg py-2 text-sm transition-colors",
        collapsed ? "justify-center gap-0 px-0" : "justify-start gap-2.5 px-2.5",
        active
          ? "bg-sidebar-primary/10 font-medium text-sidebar-foreground"
          : "font-normal text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90",
      )}
    >
      {active ? (
        <span
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary"
          aria-hidden="true"
        />
      ) : null}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span
        aria-hidden={collapsed}
        className={cn(
          "truncate transition-[opacity,max-width] duration-200 ease-linear",
          collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
        )}
      >
        {item.label}
      </span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  const label = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={!collapsed}
          className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex shrink-0 flex-col gap-2 px-3 pt-4 pb-3", collapsed && "items-center px-2")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
          <div className={cn("flex min-w-0 items-center", collapsed ? "gap-0" : "gap-2")}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Hammer className="size-4" aria-hidden="true" />
            </span>
            <span
              aria-hidden={collapsed}
              className={cn(
                "truncate text-sm font-semibold tracking-tight text-sidebar-foreground transition-[opacity,max-width] duration-200 ease-linear",
                collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
              )}
            >
              AutoForge <span className="font-normal text-sidebar-foreground/50">ERP</span>
            </span>
          </div>

          {!collapsed && onToggleCollapse ? (
            <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
          ) : null}
        </div>

        {collapsed && onToggleCollapse ? (
          <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
        ) : null}
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        <nav
          className={cn("flex flex-col px-3 pb-4", collapsed && "px-2")}
          aria-label="Navegação principal"
        >
          <div className="pt-1">
            <NavLink item={dashboardNavItem} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
          </div>

          {navGroups.map((group) => (
            <div key={group.label} className="mt-6">
              {!collapsed ? (
                <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wider text-sidebar-foreground/35 uppercase">
                  {group.label}
                </p>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <SidebarUserFooter collapsed={collapsed} />
    </div>
  );
}
