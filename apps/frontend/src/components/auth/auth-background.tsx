import { gearPath } from "@/components/auth/auth-geometry";

// Fundo tecnológico de tela cheia das telas de autenticação (decorativo, aria-hidden).
// Somente CSS + SVG estático; movimento via classes auth-* (desligadas em reduced-motion).

const GEAR_LARGE = gearPath(160, 160, 150, 128, 22);
const GEAR_SMALL = gearPath(90, 90, 82, 68, 14);

const RINGS = [180, 260, 340, 430];

export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base: azul-noite com iluminação central suave */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,color-mix(in_oklab,var(--sidebar-primary)_16%,transparent),transparent_70%)]" />
      <div className="auth-glow absolute -top-56 -left-40 size-[38rem] rounded-full bg-sidebar-primary/15 blur-3xl" />
      <div
        className="auth-glow absolute -right-48 -bottom-64 size-[42rem] rounded-full bg-primary/12 blur-3xl"
        style={{ animationDelay: "-9s" }}
      />

      {/* Grade técnica e varredura de luz */}
      <div className="auth-grid auth-fade-in absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,black_25%,transparent_80%)]" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="auth-scan h-1/3 w-full bg-gradient-to-b from-transparent via-sidebar-primary/[0.06] to-transparent" />
      </div>

      {/* Anéis concêntricos atrás do cartão */}
      <svg
        viewBox="-500 -500 1000 1000"
        className="auth-fade-in absolute top-1/2 left-1/2 size-[min(120vmax,1100px)] -translate-x-1/2 -translate-y-1/2 text-sidebar-foreground"
        fill="none"
      >
        {RINGS.map((radius, index) => (
          <circle
            key={radius}
            r={radius}
            stroke="currentColor"
            strokeOpacity={0.07 - index * 0.012}
            strokeDasharray={index % 2 === 0 ? "2 10" : "60 18 6 18"}
            className={index % 2 === 0 ? "auth-spin-slow" : "auth-spin-reverse"}
          />
        ))}
        <line x1="-500" y1="0" x2="500" y2="0" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="2 8" />
        <line x1="0" y1="-500" x2="0" y2="500" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="2 8" />
      </svg>

      {/* Engrenagens abstratas nos cantos */}
      <svg
        viewBox="0 0 320 320"
        className="auth-fade-in absolute -top-24 -right-20 hidden w-[26rem] text-sidebar-foreground sm:block"
        fill="none"
      >
        <g className="auth-spin-slow">
          <path d={GEAR_LARGE} stroke="currentColor" strokeOpacity="0.09" strokeWidth="1.5" />
          <circle cx="160" cy="160" r="70" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1.5" />
          <circle cx="160" cy="160" r="22" stroke="var(--sidebar-primary)" strokeOpacity="0.35" strokeWidth="2" />
        </g>
      </svg>
      <svg
        viewBox="0 0 180 180"
        className="auth-fade-in absolute -bottom-10 -left-10 hidden w-64 text-sidebar-foreground sm:block"
        fill="none"
      >
        <g className="auth-spin-reverse">
          <path d={GEAR_SMALL} stroke="currentColor" strokeOpacity="0.09" strokeWidth="1.5" />
          <circle cx="90" cy="90" r="30" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Anotações técnicas discretas */}
      <div className="absolute top-6 left-6 hidden font-mono text-[10px] tracking-[0.25em] text-sidebar-foreground/25 sm:block">
        SYS · READY
      </div>
      <div className="absolute right-6 bottom-6 hidden font-mono text-[10px] tracking-[0.25em] text-sidebar-foreground/25 sm:block">
        ZT · OFICINA
      </div>
    </div>
  );
}
