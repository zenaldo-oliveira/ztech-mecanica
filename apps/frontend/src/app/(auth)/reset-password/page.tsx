import type { Metadata } from "next";

import { ResetPasswordGate } from "@/components/auth/reset-password-gate";

export const metadata: Metadata = {
  title: "Criar nova senha",
  // Nada desta página deve vazar em cabeçalhos Referer.
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <ResetPasswordGate />;
}
