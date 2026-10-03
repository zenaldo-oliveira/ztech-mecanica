import { Car, ClipboardList, FileText, Package, Users, type LucideIcon } from "lucide-react";

import { customers } from "@/lib/mock/customers";
import { recentWorkOrders } from "@/lib/mock/dashboard";
import { products } from "@/lib/mock/products";
import { quoteStatusLabel, quotes } from "@/lib/mock/quotes";
import { vehicles } from "@/lib/mock/vehicles";
import { allNavItems, settingsSection } from "@/lib/navigation";

// Mock-backed global search. When the backend exists, record groups will come
// from a tenant-scoped search endpoint; pages and settings stay client-side.

export type SearchGroupId =
  | "pages"
  | "work-orders"
  | "quotes"
  | "customers"
  | "vehicles"
  | "products"
  | "settings";

export interface SearchResult {
  id: string;
  group: SearchGroupId;
  title: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  /** Normalized text matched against the query. */
  haystack: string;
}

export interface SearchResultGroup {
  id: SearchGroupId;
  label: string;
  results: SearchResult[];
}

const GROUPS: { id: SearchGroupId; label: string; limit: number }[] = [
  { id: "pages", label: "Páginas", limit: 6 },
  { id: "work-orders", label: "Ordens de serviço", limit: 5 },
  { id: "quotes", label: "Orçamentos", limit: 5 },
  { id: "customers", label: "Clientes", limit: 5 },
  { id: "vehicles", label: "Veículos", limit: 5 },
  { id: "products", label: "Produtos", limit: 5 },
  { id: "settings", label: "Configurações", limit: 6 },
];

const QUICK_ACCESS_HREFS = ["/dashboard", "/work-orders", "/quotes", "/customers", "/vehicles", "/checkup"];

/** Lowercase, without accents and punctuation — "OS-001" and "os 001" both match. */
export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function result(entry: Omit<SearchResult, "haystack">, extra: string[] = []): SearchResult {
  const haystack = normalizeSearchText([entry.title, entry.subtitle ?? "", ...extra].join(" "));
  return { ...entry, haystack };
}

function buildIndex(): SearchResult[] {
  const index: SearchResult[] = [];
  const seenHrefs = new Set<string>();

  // A page listed twice (ex.: Produtos) is indexed once, under its first menu position.
  for (const { item, section } of allNavItems) {
    if (seenHrefs.has(item.href)) continue;
    seenHrefs.add(item.href);
    index.push(
      result(
        {
          id: `page:${item.href}`,
          group: section?.id === settingsSection.id ? "settings" : "pages",
          title: item.label,
          subtitle: section ? `${section.label} · ${item.description}` : item.description,
          href: item.href,
          icon: item.icon,
        },
        item.keywords,
      ),
    );
  }

  recentWorkOrders.forEach((order) =>
    index.push(
      result({
        id: `os:${order.id}`,
        group: "work-orders",
        title: `${order.id} · ${order.customer}`,
        subtitle: `${order.vehicle} · ${order.service} · ${order.status} · ${order.value}`,
        href: "/work-orders",
        icon: ClipboardList,
      }),
    ),
  );

  quotes.forEach((quote) =>
    index.push(
      result(
        {
          id: `quote:${quote.id}`,
          group: "quotes",
          title: `${quote.id} · ${quote.customer}`,
          subtitle: `${quote.vehicle} · ${quoteStatusLabel[quote.status]} · ${quote.total}`,
          href: "/quotes",
          icon: FileText,
        },
        [quote.plate],
      ),
    ),
  );

  customers.forEach((customer) =>
    index.push(
      result(
        {
          id: `customer:${customer.id}`,
          group: "customers",
          title: customer.name,
          subtitle: [customer.id, customer.tradeName].filter(Boolean).join(" · "),
          href: `/customers/${customer.id}`,
          icon: Users,
        },
        [customer.document, customer.phone, customer.email ?? ""],
      ),
    ),
  );

  vehicles.forEach((vehicle) =>
    index.push(
      result({
        id: `vehicle:${vehicle.id}`,
        group: "vehicles",
        title: `${vehicle.plate} · ${vehicle.brand} ${vehicle.model}`,
        subtitle: [vehicle.version, vehicle.modelYear, vehicle.customer.name].filter(Boolean).join(" · "),
        href: `/vehicles/${vehicle.id}`,
        icon: Car,
      }),
    ),
  );

  products.forEach((product) =>
    index.push(
      result(
        {
          id: `product:${product.code}`,
          group: "products",
          title: product.name,
          subtitle: `${product.code} · ${product.brand} · ${product.stock} ${product.unit} · ${product.salePrice}`,
          href: "/products",
          icon: Package,
        },
        [product.brand],
      ),
    ),
  );

  return index;
}

const index = buildIndex();

function score(entry: SearchResult, normalizedQuery: string, tokens: string[]) {
  if (!tokens.every((token) => entry.haystack.includes(token))) return -1;
  const title = normalizeSearchText(entry.title);
  if (title.startsWith(normalizedQuery)) return 0;
  if (title.includes(normalizedQuery)) return 1;
  return 2;
}

export function searchAll(query: string): SearchResultGroup[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    const quick = QUICK_ACCESS_HREFS.map((href) => index.find((entry) => entry.href === href && entry.group === "pages"))
      .filter((entry): entry is SearchResult => Boolean(entry));
    return [{ id: "pages", label: "Acesso rápido", results: quick }];
  }

  const tokens = normalizedQuery.split(" ");

  const ranked = GROUPS.map(({ id, label, limit }) => {
    const matches = index
      .filter((entry) => entry.group === id)
      .map((entry) => ({ entry, rank: score(entry, normalizedQuery, tokens) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
    return {
      group: { id, label, results: matches.map(({ entry }) => entry) },
      bestRank: matches[0]?.rank ?? Number.POSITIVE_INFINITY,
    };
  }).filter(({ group }) => group.results.length > 0);

  // Groups whose best hit matches the title come first (ex.: "corolla" → the vehicle,
  // not an OS that only mentions it); ties keep the default group order (stable sort).
  return ranked.sort((a, b) => a.bestRank - b.bestRank).map(({ group }) => group);
}
