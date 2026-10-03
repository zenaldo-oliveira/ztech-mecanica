import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getServerSession, safeNextPath } from "@/lib/api/server";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  // Já autenticado: segue direto. Falha ao consultar a sessão não bloqueia o login.
  const session = await getServerSession().catch(() => null);
  if (session) redirect(nextPath);

  return <LoginForm nextPath={nextPath} />;
}
