"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole, Mail } from "lucide-react";
import { loginInputSchema } from "@ztech/validation";

import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeading, FormAlert, PasswordField, TextField, fieldErrorsFrom, type FieldErrors } from "@/components/auth/form-parts";
import { IgnitionTransition } from "@/components/auth/ignition-transition";
import { enterDelay } from "@/components/auth/motion";
import { login } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Field = "email" | "password";
/**
 * idle → submitting → (API confirma) leaving → ignition → navegação.
 * Com prefers-reduced-motion: leaving → loading-static → navegação imediata.
 */
type Status = "idle" | "submitting" | "leaving" | "ignition" | "loading-static";

const CARD_LEAVE_MS = 260;
const APP_ENTER_MARK_MS = 3000;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Muda a cada erro para reiniciar a animação de feedback do alerta.
  const [errorCount, setErrorCount] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const navigatedRef = useRef(false);

  /** Navegação real para a área autenticada (a sessão já foi criada pela API). */
  const enterApp = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    // Marca a entrada para o fade-in do app (CSS: html[data-app-enter]).
    const root = document.documentElement;
    root.dataset.appEnter = "";
    window.setTimeout(() => delete root.dataset.appEnter, APP_ENTER_MARK_MS);
    router.replace(nextPath);
    router.refresh();
  }, [nextPath, router]);

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
      // A transição só começa após a resposta real da API (sessão criada no backend).
      await login(parsed.data);
    } catch (error) {
      setStatus("idle");
      setPassword("");
      setFormError(errorMessage(error));
      setErrorCount((count) => count + 1);
      return;
    }

    router.prefetch(nextPath);
    setStatus("leaving");
    if (prefersReducedMotion()) {
      setStatus("loading-static");
      enterApp();
      return;
    }
    window.setTimeout(() => setStatus("ignition"), CARD_LEAVE_MS);
  }

  if (status === "ignition") return <IgnitionTransition onReady={enterApp} />;

  if (status === "loading-static") {
    return (
      <AuthCard>
        <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
          <p className="text-base font-medium text-foreground">Acesso liberado</p>
          <p className="text-sm text-muted-foreground">Carregando seu painel…</p>
        </div>
      </AuthCard>
    );
  }

  const isBusy = status !== "idle";
  const isLeaving = status === "leaving";

  return (
    <AuthCard leaving={isLeaving}>
      <div className="auth-enter" style={enterDelay(120)}>
        <AuthHeading align="center" title="Entrar" description="Acesse a sua oficina com o e-mail e a senha cadastrados." />
      </div>

      <form noValidate onSubmit={handleSubmit} className="relative flex flex-col gap-4" aria-busy={isBusy}>
        {/* Progresso indeterminado enquanto a API verifica as credenciais. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute -top-3.5 right-0 left-0 h-0.5 overflow-hidden rounded-full bg-primary/15 transition-opacity duration-300",
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

        <div className="auth-enter" style={enterDelay(190)}>
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
        <div className="auth-enter" style={enterDelay(250)}>
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
          />
        </div>

        <div className="auth-enter mt-2 flex flex-col gap-4" style={enterDelay(310)}>
          <Button
            type="submit"
            size="lg"
            disabled={isBusy}
            className={cn(
              "auth-shine group h-11 w-full text-sm font-medium shadow-[0_10px_30px_-12px_var(--primary)] transition-[background-color,box-shadow,transform] duration-200",
              "hover:shadow-[0_14px_34px_-12px_var(--primary)] active:scale-[0.985] disabled:opacity-100",
              status === "submitting" && "bg-primary/85",
              isLeaving && "bg-success text-success-foreground hover:bg-success",
            )}
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Verificando…
              </>
            ) : isLeaving ? (
              <>
                <CheckCircle2 aria-hidden="true" />
                Acesso liberado
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </Button>

          <Link
            href="/forgot-password"
            className="self-center rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none transition-colors hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Esqueci minha senha
          </Link>
        </div>

        <p className="sr-only" aria-live="polite">
          {status === "submitting" ? "Verificando suas credenciais." : isLeaving ? "Acesso liberado." : ""}
        </p>
      </form>
    </AuthCard>
  );
}
