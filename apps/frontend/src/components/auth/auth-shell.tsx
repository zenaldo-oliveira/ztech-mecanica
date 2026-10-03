import { ClipboardList, Lock, Package, ShieldCheck, Wallet, Wrench } from "lucide-react";

import { AuthVisual } from "@/components/auth/auth-visual";
import { enterDelay } from "@/components/auth/motion";

const HIGHLIGHTS = [
  { icon: ClipboardList, text: "Ordens de serviço e orçamentos do recebimento à entrega" },
  { icon: Package, text: "Estoque com rastreabilidade de cada peça usada" },
  { icon: Wallet, text: "Financeiro, pagamentos e documentos fiscais integrados" },
];

function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_24px_-8px_var(--sidebar-primary)]">
        <Wrench className="size-5" aria-hidden="true" />
      </span>
      <span
        className={
          inverted
            ? "text-lg font-semibold tracking-tight text-sidebar-foreground"
            : "text-lg font-semibold tracking-tight text-foreground"
        }
      >
        ZTECH{" "}
        <span className={inverted ? "font-normal text-sidebar-foreground/55" : "font-normal text-muted-foreground"}>
          OFICINA
        </span>
      </span>
    </div>
  );
}

/** Cartão ilustrativo de produto (decorativo): uma OS em andamento. */
function ProductPreviewCard() {
  return (
    <div
      aria-hidden="true"
      className="auth-float-in w-72 rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-md"
      style={enterDelay(640)}
    >
      <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-sidebar-foreground/60 uppercase">
        <span className="font-mono">OS-0124</span>
        <span className="flex items-center gap-1.5 text-sidebar-primary">
          <span className="auth-pulse-dot size-1.5 rounded-full bg-sidebar-primary" />
          Em serviço
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-sidebar-foreground">Revisão 40.000 km · Honda Civic</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-sidebar-primary/60 to-sidebar-primary" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-sidebar-foreground/50">
        <span>Serviços + peças</span>
        <span className="font-mono">68%</span>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
      {/* Camadas de fundo (decorativas) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="auth-glow absolute -top-40 -right-24 size-[34rem] rounded-full bg-sidebar-primary/25 blur-3xl" />
        <div
          className="auth-glow absolute -bottom-56 -left-40 size-[30rem] rounded-full bg-primary/15 blur-3xl"
          style={{ animationDelay: "-9s" }}
        />
        <div className="auth-grid auth-fade-in absolute inset-0" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="auth-scan h-1/3 w-full bg-gradient-to-b from-transparent via-sidebar-primary/[0.07] to-transparent" />
        </div>
        <AuthVisual className="auth-fade-in absolute top-1/2 -right-[19rem] w-[620px] -translate-y-1/2 text-sidebar-foreground [mask-image:linear-gradient(to_left,black_40%,transparent_78%)] xl:-right-[15rem] xl:w-[680px] 2xl:-right-40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-sidebar to-transparent" />
      </div>

      <div className="auth-enter relative" style={enterDelay(0)}>
        <Brand inverted />
      </div>

      <div className="relative flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span
            className="auth-enter inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-sidebar-foreground/75"
            style={enterDelay(90)}
          >
            <span className="auth-pulse-dot size-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
            Plataforma de gestão para oficinas
          </span>
          <h2
            className="auth-enter text-4xl leading-[1.1] font-semibold tracking-tight text-balance xl:text-5xl"
            style={enterDelay(170)}
          >
            A oficina inteira{" "}
            <span className="bg-gradient-to-r from-sidebar-foreground via-sidebar-primary to-sidebar-primary bg-clip-text text-transparent">
              em um só lugar.
            </span>
          </h2>
          <p className="auth-enter text-base leading-relaxed text-sidebar-foreground/65" style={enterDelay(250)}>
            Do orçamento ao financeiro, com o histórico de cada cliente e veículo sempre à mão.
          </p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {HIGHLIGHTS.map(({ icon: Icon, text }, index) => (
            <li
              key={text}
              className="auth-enter flex items-center gap-3 text-sm text-sidebar-foreground/85"
              style={enterDelay(330 + index * 80)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                <Icon className="size-4 text-sidebar-primary" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <ProductPreviewCard />
      </div>

      <p className="auth-enter relative flex items-center gap-2 text-xs text-sidebar-foreground/50" style={enterDelay(720)}>
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Dados de cada oficina isolados, sessões protegidas e ações auditadas.
      </p>
    </aside>
  );
}

/** Moldura das telas públicas de autenticação: painel da marca (desktop) + formulário. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl"
        />
        <div className="relative flex w-full max-w-sm flex-col gap-8">
          <div className="auth-enter lg:hidden" style={enterDelay(0)}>
            <Brand />
          </div>
          {children}
          <p
            className="auth-fade-in flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80"
            style={enterDelay(600)}
          >
            <Lock className="size-3" aria-hidden="true" />
            Conexão protegida · © {year} ZTECH OFICINA
          </p>
        </div>
      </main>
    </div>
  );
}
