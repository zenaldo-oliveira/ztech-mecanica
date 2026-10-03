"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { PASSWORD_MIN_LENGTH, resetPasswordInputSchema } from "@ztech/validation";

import { Button } from "@/components/ui/button";
import { AuthHeading, FormAlert, PasswordField, fieldErrorsFrom, type FieldErrors } from "@/components/auth/form-parts";
import { resetPassword } from "@/lib/api/auth";
import { errorMessage, isApiError } from "@/lib/api/errors";

type Field = "password" | "confirmation";

/** O token vem no fragmento (#token=…): nunca é enviado ao servidor em GET nem em Referer. */
function readTokenFromHash(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("token");
}

/** Renderizado somente no navegador (o fragmento não existe no servidor). */
export function ResetPasswordForm() {
  const [token] = useState(readTokenFromHash);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<{ message: string; expired: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Remove o token da barra de endereço e do histórico assim que lido.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          title="Link inválido"
          description="Este link de redefinição está incompleto ou já foi usado. Solicite um novo para continuar."
        />
        <Button asChild size="lg" className="h-10">
          <Link href="/forgot-password">Solicitar novo link</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <AuthHeading
          title="Senha redefinida"
          description="Sua nova senha já está valendo. Por segurança, encerramos as sessões abertas em outros dispositivos."
        />
        <Button asChild size="lg" className="h-10">
          <Link href="/login">Entrar com a nova senha</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordInputSchema.safeParse({ token, password });
    const errors: FieldErrors<Field> = parsed.success ? {} : fieldErrorsFrom<Field>(parsed.error);
    if (!errors.password && password !== confirmation) errors.confirmation = "As senhas não conferem.";
    if (!parsed.success || errors.confirmation) {
      setFieldErrors(errors);
      if (!parsed.success && parsed.error.issues.some((issue) => issue.path[0] === "token")) {
        setFormError({ message: "Link de redefinição inválido.", expired: true });
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await resetPassword(parsed.data);
      setDone(true);
    } catch (error) {
      const expired = isApiError(error) && error.code === "INVALID_RESET_TOKEN";
      setFormError({ message: errorMessage(error), expired });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <KeyRound className="size-5" aria-hidden="true" />
      </div>
      <AuthHeading title="Criar nova senha" description={`Use ao menos ${PASSWORD_MIN_LENGTH} caracteres.`} />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isSubmitting}>
        {formError ? (
          <FormAlert>
            {formError.message}{" "}
            {formError.expired ? (
              <Link href="/forgot-password" className="font-medium underline">
                Solicitar novo link
              </Link>
            ) : null}
          </FormAlert>
        ) : null}
        <PasswordField
          label="Nova senha"
          name="new-password"
          autoComplete="new-password"
          autoFocus
          icon={LockKeyhole}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={isSubmitting}
        />
        <PasswordField
          label="Confirme a nova senha"
          name="confirm-password"
          autoComplete="new-password"
          icon={LockKeyhole}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={fieldErrors.confirmation}
          disabled={isSubmitting}
        />
        <Button type="submit" size="lg" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? "Salvando…" : "Redefinir senha"}
        </Button>
      </form>
    </div>
  );
}
