"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ChevronRight, PanelLeftClose, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarUserFooter } from "@/components/layout/sidebar-user-footer";
import { useLocalStorageValue } from "@/lib/local-storage-store";
import { useIsApplePlatform } from "@/lib/use-media-query";
import {
  findActiveNavItem,
  primaryNav,
  settingsSection,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const SECTIONS_STORAGE_KEY = "ztech.sidebar.sections";

type SectionOverrides = Record<string, boolean>;

function parseOverrides(raw: string | null): SectionOverrides {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SectionOverrides) : {};
  } catch {
    return {};
  }
}

/** Open/closed state per section. Untouched sections open only when they contain the current page. */
function useSectionState() {
  const [raw, setRaw] = useLocalStorageValue(SECTIONS_STORAGE_KEY);
  const overrides = useMemo(() => parseOverrides(raw), [raw]);

  const setOpen = useCallback(
    (id: string, open: boolean) => setRaw(JSON.stringify({ ...overrides, [id]: open })),
    [overrides, setRaw],
  );

  return { overrides, setOpen };
}

const itemBaseClass =
  "group relative flex items-center rounded-lg text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdleClass =
  "font-normal text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90";
const itemActiveClass = "bg-sidebar-primary/10 font-medium text-sidebar-foreground";

function ActiveIndicator() {
  return (
    <span
      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary"
      aria-hidden="true"
    />
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, active, collapsed, nested = false, onNavigate }: NavLinkProps) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        itemBaseClass,
        collapsed ? "h-9 justify-center px-0" : "h-8 justify-start gap-2.5 px-2.5",
        nested && !collapsed && "pl-3",
        active ? itemActiveClass : itemIdleClass,
      )}
    >
      {active && !nested ? <ActiveIndicator /> : null}
      {nested ? null : <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

interface SectionProps {
  section: NavSection;
  activeHref: string | undefined;
  collapsed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
}

/** Compact rail: the section icon opens a flyout with its pages. */
function CollapsedSection({ section, activeHref, onNavigate }: SectionProps) {
  const Icon = section.icon;
  const containsActive = section.items.some((item) => item.href === activeHref);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={section.label}
              className={cn(
                itemBaseClass,
                "h-9 w-full justify-center",
                containsActive ? itemActiveClass : itemIdleClass,
              )}
            >
              {containsActive ? <ActiveIndicator /> : null}
              <Icon className="size-4 shrink-0" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">{section.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{section.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {section.items.map((item) => {
          const ItemIcon = item.icon;
          const active = item.href === activeHref;
          return (
            <DropdownMenuItem
              key={item.label}
              asChild
              className={cn(active && "bg-accent font-medium text-accent-foreground")}
            >
              <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
                <ItemIcon aria-hidden="true" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExpandedSection({ section, activeHref, open, onOpenChange, onNavigate }: SectionProps) {
  const Icon = section.icon;
  const containsActive = section.items.some((item) => item.href === activeHref);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            itemBaseClass,
            "h-8 w-full justify-start gap-2.5 px-2.5",
            containsActive && !open ? itemActiveClass : itemIdleClass,
          )}
        >
          {containsActive && !open ? <ActiveIndicator /> : null}
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{section.label}</span>
          <ChevronRight
            className={cn(
              "ml-auto size-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
              open && "rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-0.5 ml-[1.15rem] flex flex-col gap-0.5 border-l border-sidebar-border/70 pl-2">
          {section.items.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={item.href === activeHref}
              collapsed={false}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Section(props: SectionProps) {
  return props.collapsed ? <CollapsedSection {...props} /> : <ExpandedSection {...props} />;
}

/** Shown only while the sidebar is expanded; the collapsed rail is expanded from the topbar or Ctrl+B. */
function CollapseToggle({ onToggle }: { onToggle: () => void }) {
  const modifier = useIsApplePlatform() ? "⌘" : "Ctrl";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label="Recolher menu"
          aria-expanded="true"
          className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        >
          <PanelLeftClose className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        Recolher menu <span className="ml-1 opacity-60">{modifier} B</span>
      </TooltipContent>
    </Tooltip>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="ZTECH OFICINA — ir para o Dashboard"
      className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Wrench className="size-4" aria-hidden="true" />
      </span>
      {collapsed ? null : (
        <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          ZTECH <span className="font-normal text-sidebar-foreground/55">OFICINA</span>
        </span>
      )}
    </Link>
  );
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** When provided, shows the expand/collapse button (desktop only). */
  onToggleCollapse?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);
  const activeHref = active?.item.href;
  const activeSectionId = active?.section?.id;
  const { overrides, setOpen } = useSectionState();

  function sectionProps(section: NavSection): SectionProps {
    return {
      section,
      activeHref,
      collapsed,
      open: overrides[section.id] ?? section.id === activeSectionId,
      onOpenChange: (open) => setOpen(section.id, open),
      onNavigate,
    };
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center px-3",
          collapsed ? "justify-center px-2" : "justify-between gap-2",
        )}
      >
        <Brand collapsed={collapsed} />
        {!collapsed && onToggleCollapse ? <CollapseToggle onToggle={onToggleCollapse} /> : null}
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        <nav
          className={cn("flex flex-col gap-0.5 px-3 pt-2 pb-4", collapsed && "px-2")}
          aria-label="Navegação principal"
        >
          {primaryNav.map((entry) =>
            entry.kind === "link" ? (
              <NavLink
                key={entry.item.href}
                item={entry.item}
                active={entry.item.href === activeHref}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : (
              <Section key={entry.section.id} {...sectionProps(entry.section)} />
            ),
          )}
        </nav>
      </div>

      <nav
        aria-label="Configurações"
        className={cn(
          "scrollbar-none max-h-[45dvh] shrink-0 overflow-y-auto border-t border-sidebar-border/60 px-3 py-2",
          collapsed && "px-2",
        )}
      >
        <Section {...sectionProps(settingsSection)} />
      </nav>

      <SidebarUserFooter collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  );
}
