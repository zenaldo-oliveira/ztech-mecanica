"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { loginInputSchema } from "@ztech/validation";

import { Button } from "@/components/ui/button";
import { AuthHeading, FormAlert, PasswordField, TextField, fieldErrorsFrom, type FieldErrors } from "@/components/auth/form-parts";
import { login } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";

type Field = "email" | "password";
type Status = "idle" | "submitting" | "success";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFrom<Field>(parsed.error));
      return;
    }
    setFieldErrors({});
    setStatus("submitting");

    try {
      await login(parsed.data);
      setStatus("success");
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setPassword("");
      setFormError(errorMessage(error));
    }
  }

  const isBusy = status !== "idle";

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Entrar" description="Acesse a sua oficina com o e-mail e a senha cadastrados." />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isBusy}>
        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          error={fieldErrors.email}
          disabled={isBusy}
        />
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          error={fieldErrors.password}
          disabled={isBusy}
          action={
            <Link
              href="/forgot-password"
              className="rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Esqueci minha senha
            </Link>
          }
        />

        <Button type="submit" size="lg" className="mt-2 h-10" disabled={isBusy}>
          {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {status === "success" ? "Entrando…" : status === "submitting" ? "Verificando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
