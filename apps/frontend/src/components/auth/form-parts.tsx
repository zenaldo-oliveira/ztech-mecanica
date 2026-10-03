"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, type LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

interface ValidationIssues {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}

/** Primeira mensagem de erro (Zod) para cada campo do formulário. */
export function fieldErrorsFrom<Field extends string>(error: ValidationIssues): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "") as Field;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  /** Elemento ao lado do rótulo (ex.: link "Esqueci minha senha"). */
  action?: React.ReactNode;
  /** Elemento dentro do campo, à direita (ex.: botão mostrar senha). */
  trailing?: React.ReactNode;
  /** Ícone à esquerda; acende com a cor primária quando o campo recebe foco. */
  icon?: LucideIcon;
}

/** Campo com rótulo, erro anunciado ao leitor de tela e (opcional) ação ao lado do rótulo. */
export function TextField({ label, error, action, trailing, icon: Icon, className, ...props }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="group/field flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={id}
          className={cn(
            "transition-colors duration-200 group-focus-within/field:text-primary",
            error && "text-destructive group-focus-within/field:text-destructive",
          )}
        >
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within/field:text-primary",
              error && "text-destructive/80 group-focus-within/field:text-destructive",
            )}
          />
        ) : null}
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 bg-card shadow-xs transition-[border-color,box-shadow,background-color] duration-200",
            "hover:border-foreground/25 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
            Icon && "pl-9",
            trailing && "pr-10",
            className,
          )}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p id={errorId} className="animate-in text-xs text-destructive duration-200 fade-in-0 slide-in-from-top-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Campo de senha com botão mostrar/ocultar. */
export function PasswordField(props: Omit<TextFieldProps, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          disabled={props.disabled}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:opacity-50"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
    />
  );
}

export function FormAlert({
  tone = "error",
  className,
  children,
}: {
  tone?: "error" | "success";
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex animate-in items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm duration-300 fade-in-0 slide-in-from-top-1",
        className,
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
