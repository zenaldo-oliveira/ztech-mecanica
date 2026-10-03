"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getBreadcrumbs } from "@/lib/navigation";

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);
  if (crumbs.length === 0) return null;

  const current = crumbs[crumbs.length - 1];

  return (
    <>
      {/* Mobile: only the current page title. */}
      <p className="truncate text-sm font-medium text-foreground md:hidden">{current.label}</p>

      <nav aria-label="Trilha de navegação" className="hidden min-w-0 md:block">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 ? (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate text-muted-foreground">{crumb.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
