import { BadgeCheck, ClipboardList, Package, Wallet, Wrench } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ClipboardList, text: "Ordens de serviço e orçamentos do recebimento à entrega" },
  { icon: Package, text: "Estoque com rastreabilidade de cada peça usada" },
  { icon: Wallet, text: "Financeiro, pagamentos e documentos fiscais integrados" },
];

function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Wrench className="size-5" aria-hidden="true" />
      </span>
      <span className={inverted ? "text-lg font-semibold tracking-tight text-sidebar-foreground" : "text-lg font-semibold tracking-tight text-foreground"}>
        ZTECH{" "}
        <span className={inverted ? "font-normal text-sidebar-foreground/55" : "font-normal text-muted-foreground"}>
          OFICINA
        </span>
      </span>
    </div>
  );
}

/** Moldura das telas públicas de autenticação: painel da marca (desktop) + formulário. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-sidebar-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <Brand inverted />
        <div className="relative flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
              A oficina inteira em um só lugar.
            </h2>
            <p className="text-sm leading-relaxed text-sidebar-foreground/65">
              Do orçamento ao financeiro, com o histórico de cada cliente e veículo sempre à mão.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-sidebar-foreground/85">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Dados de cada oficina isolados e protegidos.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
