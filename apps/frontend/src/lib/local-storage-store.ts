"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode / blocked storage: behave as if nothing was stored.
    return null;
  }
}

function writeItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Persistence is a convenience — ignore storage failures.
  }
  listeners.get(key)?.forEach((listener) => listener());
}

/**
 * Persists a string value in localStorage and keeps every subscriber in sync.
 * During SSR and hydration it returns `null`, so server and client markup match;
 * the stored value is applied right after hydration.
 */
export function useLocalStorageValue(key: string) {
  const subscribe = useCallback(
    (listener: Listener) => {
      const keyListeners = listeners.get(key) ?? new Set<Listener>();
      keyListeners.add(listener);
      listeners.set(key, keyListeners);
      return () => keyListeners.delete(listener);
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => readItem(key),
    () => null,
  );

  const setValue = useCallback((next: string) => writeItem(key, next), [key]);

  return [value, setValue] as const;
}
