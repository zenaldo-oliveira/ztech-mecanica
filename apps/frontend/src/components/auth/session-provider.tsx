"use client";

import { createContext, useContext } from "react";
import { ROLES, type Permission } from "@ztech/validation";

import type { Me } from "@/lib/api/types";

const SessionContext = createContext<Me | null>(null);

/**
 * Sessão validada no servidor (layout privado) e disponibilizada aos componentes.
 * Somente dados públicos de /api/v1/me — nenhum token. Permissões aqui servem só
 * para adaptar a interface; o backend sempre reaplica a autorização.
 */
export function SessionProvider({ me, children }: { me: Me; children: React.ReactNode }) {
  return <SessionContext.Provider value={me}>{children}</SessionContext.Provider>;
}

export function useSession(): Me {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession deve ser usado dentro de <SessionProvider>.");
  return session;
}

/** Indica se a sessão possui a permissão (apenas para ajustar a UI). */
export function useCan(permission: Permission): boolean {
  return useSession().permissions.includes(permission);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

/** Rótulos em português dos papéis da sessão (ex.: "Proprietário · Financeiro"). */
export function roleLabels(me: Me): string {
  return me.roles.map((role) => ROLES[role]).join(" · ") || "Sem papel";
}

export function tenantDisplayName(me: Me): string {
  return me.tenant.tradeName ?? me.tenant.legalName;
}
