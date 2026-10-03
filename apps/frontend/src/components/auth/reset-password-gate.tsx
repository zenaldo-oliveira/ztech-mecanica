"use client";

import { useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const noopSubscribe = () => () => {};

/**
 * O token chega no fragmento da URL, que só existe no navegador. No servidor (e na
 * hidratação) mostramos um esqueleto; no cliente, o formulário lê o token.
 */
export function ResetPasswordGate() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  if (!isClient) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  return <ResetPasswordForm />;
}
