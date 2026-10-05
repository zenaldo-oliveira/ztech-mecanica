/**
 * Histórico de navegação INTERNO da área logada (por aba, em memória).
 *
 * Registra apenas caminhos internos visitados nesta aba e acompanha Voltar/Avançar do
 * navegador (popstate). Serve para o botão "Voltar" da topbar decidir entre:
 * - voltar no histórico do navegador (router.back), quando a tela anterior é interna e conhecida;
 * - ir para uma rota de retorno segura (rota pai no mapa de navegação), quando a rota foi aberta
 *   diretamente ou após recarregar a página.
 *
 * Módulo puro (sem dependências do Next/React) para poder ser verificado isoladamente.
 */

export interface InternalHistory {
  entries: readonly string[];
  /** Posição atual em `entries`; -1 quando nada foi registrado. */
  index: number;
}

export type NavigationKind = "push" | "pop" | "replace";

export const EMPTY_HISTORY: InternalHistory = { entries: [], index: -1 };

/** Rota inicial da área logada: último recurso de retorno e única tela sem rota pai. */
export const HOME_PATH = "/dashboard";

/** Aceita apenas caminhos relativos da própria aplicação (nunca outro domínio ou esquema). */
export function isSafeInternalPath(path: string): boolean {
  // "//host" e "/\host" seriam interpretados pelo navegador como outro domínio.
  return path.startsWith("/") && !path.startsWith("//") && !/[\s\\]/.test(path);
}

/** Atualiza o histórico interno com a nova rota, conforme o tipo de navegação. */
export function recordNavigation(history: InternalHistory, path: string, kind: NavigationKind): InternalHistory {
  if (!isSafeInternalPath(path)) return history;
  const { entries, index } = history;
  if (entries[index] === path) return history;

  if (kind === "replace" && index >= 0) {
    return { entries: [...entries.slice(0, index), path], index };
  }
  if (kind === "pop") {
    if (entries[index - 1] === path) return { entries, index: index - 1 };
    if (entries[index + 1] === path) return { entries, index: index + 1 };
    // Saltou para fora do trecho conhecido (ex.: vários passos de uma vez): recomeça com segurança.
    return { entries: [path], index: 0 };
  }
  const next = [...entries.slice(0, index + 1), path];
  return { entries: next, index: next.length - 1 };
}

/** Tela interna anterior conhecida, ou null quando não há origem interna confiável. */
export function previousInternalPath(history: InternalHistory): string | null {
  return history.index > 0 ? (history.entries[history.index - 1] ?? null) : null;
}

/**
 * Rota de retorno quando não há origem interna: o ancestral mais próximo presente no mapa de
 * navegação (ex.: /customers/123 → /customers; /inventory/movements → /inventory); sem
 * ancestral conhecido, a rota inicial. Na própria rota inicial não há retorno (null).
 */
export function fallbackPath(pathname: string, knownPaths: ReadonlySet<string>): string | null {
  if (!isSafeInternalPath(pathname) || pathname === HOME_PATH) return null;
  const segments = pathname.split("/").filter(Boolean);
  for (let length = segments.length - 1; length > 0; length -= 1) {
    const ancestor = `/${segments.slice(0, length).join("/")}`;
    if (knownPaths.has(ancestor)) return ancestor;
  }
  return HOME_PATH;
}

// ---------------------------------------------------------------------------
// Armazenamento por aba (navegador). No servidor, sempre vazio.
// ---------------------------------------------------------------------------

type Listener = () => void;

let current: InternalHistory = EMPTY_HISTORY;
let pendingKind: NavigationKind | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  // Voltar/Avançar do navegador: a próxima rota registrada é um deslocamento no histórico.
  window.addEventListener("popstate", () => {
    pendingKind = "pop";
  });
}

export const navigationHistoryStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: (): InternalHistory => current,
  getServerSnapshot: (): InternalHistory => EMPTY_HISTORY,
  /** Registra a rota atual (chamado a cada mudança de rota). */
  record(path: string) {
    const kind = pendingKind ?? "push";
    pendingKind = null;
    const next = recordNavigation(current, path, kind);
    if (next !== current) {
      current = next;
      emit();
    }
  },
  /** Marca que a próxima navegação substitui a entrada atual (router.replace). */
  markReplace() {
    pendingKind = "replace";
  },
};
