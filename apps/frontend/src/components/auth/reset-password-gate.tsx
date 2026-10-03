"use client";

import { useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordContent } from "@/components/auth/reset-password-form";

const noopSubscribe = () => () => {};

/**
 * O token chega no fragmento da URL, que só existe no navegador. No servidor (e na
 * hidratação) mostramos um esqueleto; no cliente, o formulário lê o token.
 */
export function ResetPasswordGate() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Um único cartão: a entrada animada não se repete ao trocar esqueleto → formulário.
  return (
    <AuthCard>
      {isClient ? (
        <ResetPasswordContent />
      ) : (
        <div className="flex flex-col items-center gap-4" aria-busy="true" aria-label="Carregando">
          <Skeleton className="size-11 rounded-xl" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}
    </AuthCard>
  );
}
