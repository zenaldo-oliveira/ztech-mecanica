"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "autoforge.sidebar.collapsed";

type Listener = () => void;

const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

function persistCollapsed(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(value));
  listeners.forEach((listener) => listener());
}

export function useSidebarCollapsed() {
  // useSyncExternalStore renders `getServerSnapshot` during SSR and initial
  // hydration (matching the server markup exactly, so no mismatch), then
  // resyncs to the real `getSnapshot` value before the browser paints —
  // this is what avoids a flash of the wrong width on reload.
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((value: boolean) => {
    persistCollapsed(value);
  }, []);

  const toggle = useCallback(() => {
    persistCollapsed(!collapsed);
  }, [collapsed]);

  return { collapsed, setCollapsed, toggle };
}
