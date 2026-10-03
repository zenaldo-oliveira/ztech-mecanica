"use client";

import { useCallback } from "react";

import { useLocalStorageValue } from "@/lib/local-storage-store";

const STORAGE_KEY = "ztech.sidebar.collapsed";

export function useSidebarCollapsed() {
  const [stored, setStored] = useLocalStorageValue(STORAGE_KEY);
  const collapsed = stored === "true";

  const setCollapsed = useCallback((value: boolean) => setStored(String(value)), [setStored]);

  const toggle = useCallback(() => setStored(String(!collapsed)), [collapsed, setStored]);

  return { collapsed, setCollapsed, toggle };
}
