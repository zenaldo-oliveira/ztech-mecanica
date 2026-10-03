import type { CSSProperties } from "react";

/** Atraso da entrada sequencial (lido pelas classes auth-* em globals.css). */
export function enterDelay(ms: number): CSSProperties {
  return { "--auth-delay": `${ms}ms` } as CSSProperties;
}
