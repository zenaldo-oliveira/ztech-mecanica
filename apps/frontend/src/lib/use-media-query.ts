"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Desktop breakpoint (Tailwind `lg`). Below it the sidebar becomes a compact rail or a drawer. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Subscribes to a CSS media query. Returns `false` during SSR/hydration so the
 * server markup matches; the real value is applied right after hydration.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", listener);
      return () => mediaQueryList.removeEventListener("change", listener);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const noopSubscribe = () => () => {};

/** Whether the platform uses ⌘ instead of Ctrl for shortcuts. `false` on the server. */
export function useIsApplePlatform() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}
