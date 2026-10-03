"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole, Mail } from "lucide-react";
import { loginInputSchema } from "@ztech/validation";

import { Button } from "@/components/ui/button";
import { enterDelay } from "@/components/auth/motion";
import { AuthHeading, FormAlert, PasswordField, TextField, fieldErrorsFrom, type FieldErrors } from "@/components/auth/form-parts";
import { login } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Field = "email" | "password";
type Status = "idle" | "submitting" | "success";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Muda a cada erro para reiniciar a animação de feedback do alerta.
  const [errorCount, setErrorCount] = useState(0);
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
      // Sucesso somente após a resposta real da API (sessão criada no backend).
      await login(parsed.data);
      setStatus("success");
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setPassword("");
      setFormError(errorMessage(error));
      setErrorCount((count) => count + 1);
    }
  }

  const isBusy = status !== "idle";
  const isSuccess = status === "success";

  return (
    <div className="flex flex-col gap-7">
      <div className="auth-enter" style={enterDelay(80)}>
        <AuthHeading title="Entrar" description="Acesse a sua oficina com o e-mail e a senha cadastrados." />
      </div>

      <form noValidate onSubmit={handleSubmit} className="relative flex flex-col gap-4" aria-busy={isBusy}>
        {/* Progresso indeterminado enquanto a API verifica as credenciais. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute -top-4 right-0 left-0 h-0.5 overflow-hidden rounded-full bg-primary/10 transition-opacity duration-300",
            status === "submitting" ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="auth-progress-bar h-full w-2/5 rounded-full bg-primary" />
        </div>

        {formError ? (
          <FormAlert key={errorCount} className="auth-shake">
            {formError}
          </FormAlert>
        ) : null}

        <div className={cn("flex flex-col gap-4 transition-opacity duration-300", isSuccess && "opacity-60")}>
          <div className="auth-enter" style={enterDelay(160)}>
            <TextField
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              icon={Mail}
              placeholder="voce@suaoficina.com.br"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              error={fieldErrors.email}
              disabled={isBusy}
            />
          </div>
          <div className="auth-enter" style={enterDelay(230)}>
            <PasswordField
              label="Senha"
              name="password"
              autoComplete="current-password"
              icon={LockKeyhole}
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
                  className="rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none transition-colors hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Esqueci minha senha
                </Link>
              }
            />
          </div>
        </div>

        <div className="auth-enter mt-2" style={enterDelay(300)}>
          <Button
            type="submit"
            size="lg"
            disabled={isBusy}
            className={cn(
              "auth-shine group h-11 w-full text-sm font-medium shadow-[0_10px_30px_-12px_var(--primary)] transition-[background-color,box-shadow,transform] duration-200",
              "hover:shadow-[0_14px_34px_-12px_var(--primary)] active:scale-[0.985] disabled:opacity-100",
              status === "submitting" && "bg-primary/85",
              isSuccess && "bg-success text-success-foreground shadow-[0_10px_30px_-12px_var(--success)] hover:bg-success",
            )}
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Verificando…
              </>
            ) : isSuccess ? (
              <span className="flex animate-in items-center gap-2 duration-300 fade-in-0 zoom-in-95">
                <CheckCircle2 aria-hidden="true" />
                Acesso liberado
              </span>
            ) : (
              <>
                Entrar
                <ArrowRight
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
        </div>

        <p className="sr-only" aria-live="polite">
          {status === "submitting" ? "Verificando suas credenciais." : isSuccess ? "Acesso liberado. Abrindo o sistema." : ""}
        </p>
      </form>
    </div>
  );
}
