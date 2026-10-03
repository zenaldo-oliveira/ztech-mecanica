"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, BellOff, CheckCheck, ClipboardList, FileText, Package, Wallet, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifications as initialNotifications, type NotificationKind } from "@/lib/mock/notifications";
import { cn } from "@/lib/utils";

const kindIcon: Record<NotificationKind, LucideIcon> = {
  "work-order": ClipboardList,
  quote: FileText,
  stock: Package,
  financial: Wallet,
};

export function NotificationsMenu() {
  const [items, setItems] = useState(initialNotifications);
  const unreadCount = items.filter((item) => item.unread).length;

  function markAsRead(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }

  function markAllAsRead() {
    setItems((current) => current.map((item) => ({ ...item, unread: false })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `Notificações: ${unreadCount} não lidas` : "Notificações"}
          className="relative"
        >
          <Bell className="size-4.5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span
              className="absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] leading-none font-semibold text-primary-foreground ring-2 ring-background"
              aria-hidden="true"
            >
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          Notificações
          {unreadCount > 0 ? (
            <span className="text-xs font-normal text-muted-foreground">{unreadCount} não lidas</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <BellOff className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">Nenhuma notificação no momento.</p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = kindIcon[item.kind];
            return (
              <DropdownMenuItem key={item.id} asChild className="items-start gap-3 py-2">
                <Link href={item.href} onClick={() => markAsRead(item.id)}>
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", item.unread ? "font-medium" : "text-muted-foreground")}>
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                    <span className="text-[11px] text-muted-foreground/70">{item.time}</span>
                  </span>
                  {item.unread ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                      <span className="sr-only">Não lida</span>
                    </span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        {unreadCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-muted-foreground"
              onSelect={(event) => {
                // Keep the menu open so the user sees the list update.
                event.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck aria-hidden="true" />
              Marcar todas como lidas
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
