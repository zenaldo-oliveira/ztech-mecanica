import Link from "next/link";
import { ArrowLeft, CircleDashed, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Roadmap phase, when known. */
  phase?: string;
  /** What the module will offer once built. */
  highlights?: string[];
}

export function ModulePlaceholder({ title, description, icon: Icon, phase, highlights }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />

      <section
        aria-labelledby="module-status-title"
        className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16"
      >
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <CircleDashed className="size-3" aria-hidden="true" />
              Em desenvolvimento
            </Badge>
            <h2 id="module-status-title" className="text-base font-medium text-foreground">
              {title} chega em breve
            </h2>
            <p className="text-sm text-muted-foreground">
              Este módulo faz parte do roteiro do ZTECH OFICINA
              {phase ? (
                <>
                  {" "}
                  e está previsto na fase <span className="font-medium text-foreground">{phase}</span>
                </>
              ) : null}
              .
            </p>
          </div>

          {highlights && highlights.length > 0 ? (
            <div className="w-full rounded-lg border border-border bg-background p-4 text-left">
              <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                O que você vai encontrar aqui
              </p>
              <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft aria-hidden="true" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
