"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { forgotPasswordInputSchema } from "@ztech/validation";

import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeading, FormAlert, TextField, fieldErrorsFrom, type FieldErrors } from "@/components/auth/form-parts";
import { forgotPassword } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Voltar para o login
    </Link>
  );
}

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"email">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = forgotPasswordInputSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFrom<"email">(parsed.error));
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      setConfirmation(await forgotPassword(parsed.data));
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-11 items-center justify-center self-center rounded-xl bg-success/10 text-success">
          <MailCheck className="size-5" aria-hidden="true" />
        </div>
        <AuthHeading align="center" title="Verifique seu e-mail" description={confirmation} />
        <p className="text-center text-sm text-muted-foreground">
          O link vale por 30 minutos. Não recebeu? Confira a caixa de spam ou solicite novamente.
        </p>
        <BackToLogin />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToLogin />
      <AuthHeading
        align="center"
        title="Esqueceu a senha?"
        description="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha."
      />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isSubmitting}>
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={isSubmitting}
        />
        <Button type="submit" size="lg" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? "Enviando…" : "Enviar link de redefinição"}
        </Button>
      </form>
    </div>
  );
}

export function ForgotPasswordForm() {
  return (
    <AuthCard>
      <ForgotPasswordContent />
    </AuthCard>
  );
}
