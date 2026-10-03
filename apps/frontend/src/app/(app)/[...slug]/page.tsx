import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getPlannedRoute, getPlannedRoutes } from "@/lib/navigation";

// Serves every menu route whose module is not built yet (registered with `planned`
// in lib/navigation.ts); those are prerendered. Any other path reaches `notFound()`
// below, so the 404 renders inside the app shell (`(app)/not-found.tsx`).
export function generateStaticParams() {
  return getPlannedRoutes().map((route) => ({ slug: route.href.slice(1).split("/") }));
}

function routeFromSlug(slug: string[]) {
  return getPlannedRoute(`/${slug.join("/")}`);
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const route = routeFromSlug(slug);
  return route ? { title: route.label, description: route.description } : {};
}

export default async function PlannedModulePage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const route = routeFromSlug(slug);
  if (!route?.planned) notFound();

  return (
    <ModulePlaceholder
      icon={route.icon}
      title={route.label}
      description={route.description}
      phase={route.planned.phase}
      highlights={route.planned.highlights}
    />
  );
}
