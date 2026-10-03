"use client";

import { useEffect, useRef, useState } from "react";
import { Battery, Droplet, Thermometer, Zap } from "lucide-react";

import { arcPath, polar } from "@/components/auth/auth-geometry";
import { cn } from "@/lib/utils";

// Painel de instrumentos exibido SOMENTE depois que a API confirma o login.
// Efeito "ligando o motor": ponteiro 0 → 190 com aceleração progressiva, pico com
// vibração e brilho, desaceleração e "Carregando seu painel…". Sem dependências:
// SVG + CSS + requestAnimationFrame escrevendo direto no DOM (sem re-render por quadro).

const SIZE = 400;
const CX = 200;
const CY = 205;
const RADIUS = 156;
const MAX = 190;
const START = 135; // graus
const SWEEP = 270;
const REDLINE = 160;

const LABELS = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 190];

/** Trechos da aceleração [ms desde o início do giro, valor]. A velocidade só cresce. */
const KEYFRAMES: readonly (readonly [number, number])[] = [
  [0, 0],
  [520, 60], // partida suave (ease-in)
  [780, 120], // mais rápida
  [970, 170], // rápida
  [1040, 190], // arrancada final
];
const SWEEP_DURATION = 1040;

// Linha do tempo (ms desde a montagem).
const SWEEP_DELAY = 260;
const PEAK_AT = SWEEP_DELAY + SWEEP_DURATION;
const PEAK_DURATION = 220;
const SETTLE_DURATION = 240;
const SETTLE_TO = 182;
const HOLD = 120;
const LOADING_AT = PEAK_AT + PEAK_DURATION + SETTLE_DURATION + HOLD;
const READY_AT = LOADING_AT + 120;
const LIGHTS_OFF_AT = 650;

const angleFor = (value: number) => START + (SWEEP * value) / MAX;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function valueAt(elapsed: number): number {
  for (let index = 1; index < KEYFRAMES.length; index++) {
    const [t1, v1] = KEYFRAMES[index];
    const [t0, v0] = KEYFRAMES[index - 1];
    if (elapsed <= t1) {
      const progress = (elapsed - t0) / (t1 - t0);
      const eased = index === 1 ? progress * progress : progress; // só a partida tem ease-in
      return v0 + (v1 - v0) * eased;
    }
  }
  return MAX;
}

const ticks = Array.from({ length: MAX / 5 + 1 }, (_, index) => {
  const value = index * 5;
  const major = value % 20 === 0 || value === MAX;
  const medium = !major && value % 10 === 0;
  const length = major ? 18 : medium ? 11 : 6;
  return {
    value,
    from: polar(CX, CY, RADIUS - length, angleFor(value)),
    to: polar(CX, CY, RADIUS, angleFor(value)),
    major,
    redline: value >= REDLINE,
  };
});

const labels = LABELS.map((value) => ({ value, point: polar(CX, CY, RADIUS - 36, angleFor(value)) }));
const TRACK = arcPath(CX, CY, RADIUS + 12, START, START + SWEEP);
const REDLINE_ARC = arcPath(CX, CY, RADIUS + 12, angleFor(REDLINE), START + SWEEP);

type Phase = "rev" | "peak" | "loading";

export function IgnitionTransition({ onReady }: { onReady: () => void }) {
  const needleRef = useRef<SVGGElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const readoutRef = useRef<SVGTextElement>(null);
  const onReadyRef = useRef(onReady);
  const [phase, setPhase] = useState<Phase>("rev");
  const [lightsOn, setLightsOn] = useState(true);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    let current: Phase = "rev";
    let notified = false;

    const render = (value: number) => {
      const clamped = Math.min(Math.max(value, 0), MAX);
      needleRef.current?.setAttribute("transform", `rotate(${angleFor(value).toFixed(3)} ${CX} ${CY})`);
      progressRef.current?.setAttribute("stroke-dashoffset", (MAX - clamped).toFixed(2));
      if (readoutRef.current) readoutRef.current.textContent = String(Math.round(clamped));
    };

    const enter = (next: Phase) => {
      if (current === next) return;
      current = next;
      setPhase(next);
    };

    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      let value = 0;

      if (elapsed < SWEEP_DELAY) {
        value = 0;
      } else if (elapsed < PEAK_AT) {
        value = valueAt(elapsed - SWEEP_DELAY);
      } else if (elapsed < PEAK_AT + PEAK_DURATION) {
        // Pico: vibração amortecida em torno de 190.
        const progress = (elapsed - PEAK_AT) / PEAK_DURATION;
        value = MAX + Math.sin(progress * Math.PI * 9) * 2.2 * (1 - progress);
        enter("peak");
      } else if (elapsed < PEAK_AT + PEAK_DURATION + SETTLE_DURATION) {
        // Desaceleração após o pico.
        const progress = (elapsed - PEAK_AT - PEAK_DURATION) / SETTLE_DURATION;
        value = MAX - (MAX - SETTLE_TO) * easeOutCubic(progress);
      } else {
        value = SETTLE_TO;
      }

      render(value);
      if (elapsed >= LOADING_AT) enter("loading");
      if (elapsed >= READY_AT && !notified) {
        notified = true;
        onReadyRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    render(0);
    frame = requestAnimationFrame(tick);
    const lightsTimer = window.setTimeout(() => setLightsOn(false), LIGHTS_OFF_AT);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(lightsTimer);
    };
  }, []);

  return (
    <div className="ignition-enter flex w-full flex-col items-center gap-6" data-phase={phase}>
      <div
        className={cn(
          "relative w-[min(86vw,26rem)] transition-[opacity,transform] duration-300 ease-out",
          phase === "peak" && "ignition-shake",
          phase === "loading" && "scale-[0.97] opacity-0",
        )}
      >
        {/* Clarão no pico */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-[12%] rounded-full bg-sidebar-primary/40 opacity-0 blur-3xl",
            phase === "peak" && "ignition-flash",
          )}
        />
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Painel de instrumentos" className="relative w-full">
          <defs>
            <radialGradient id="ignition-face" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--sidebar-accent)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--sidebar)" stopOpacity="0.95" />
            </radialGradient>
            <linearGradient id="ignition-progress" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--sidebar-primary)" stopOpacity="0.35" />
              <stop offset="85%" stopColor="var(--sidebar-primary)" />
              <stop offset="100%" stopColor="var(--warning)" />
            </linearGradient>
          </defs>

          {/* Mostrador */}
          <circle cx={CX} cy={CY} r={RADIUS + 30} fill="url(#ignition-face)" stroke="var(--sidebar-foreground)" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={RADIUS + 22} stroke="var(--sidebar-foreground)" strokeOpacity="0.06" strokeWidth="1" fill="none" />

          {/* Trilha, faixa vermelha e progresso */}
          <path d={TRACK} stroke="var(--sidebar-foreground)" strokeOpacity="0.1" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d={REDLINE_ARC} stroke="var(--destructive)" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path
            ref={progressRef}
            d={TRACK}
            pathLength={MAX}
            strokeDasharray={MAX}
            strokeDashoffset={MAX}
            stroke="url(#ignition-progress)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            className="ignition-progress-glow"
          />

          {/* Marcações */}
          <g strokeLinecap="round">
            {ticks.map((tick) => (
              <line
                key={tick.value}
                x1={tick.from.x}
                y1={tick.from.y}
                x2={tick.to.x}
                y2={tick.to.y}
                stroke={tick.redline ? "var(--destructive)" : "var(--sidebar-foreground)"}
                strokeOpacity={tick.major ? 0.85 : 0.35}
                strokeWidth={tick.major ? 2.5 : 1.25}
              />
            ))}
          </g>
          <g fontFamily="var(--font-geist-mono)" fontSize="14" fontWeight="500" textAnchor="middle">
            {labels.map(({ value, point }) => (
              <text
                key={value}
                x={point.x}
                y={point.y + 5}
                fill={value >= REDLINE ? "var(--destructive)" : "var(--sidebar-foreground)"}
                fillOpacity={value >= REDLINE ? 0.9 : 0.7}
              >
                {value}
              </text>
            ))}
          </g>

          {/* Leitura digital */}
          <text
            ref={readoutRef}
            data-readout=""
            x={CX}
            y={CY + 88}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono)"
            fontSize="38"
            fontWeight="600"
            fill="var(--sidebar-foreground)"
          >
            0
          </text>
          <text x={CX} y={CY + 108} textAnchor="middle" fontSize="11" letterSpacing="3" fill="var(--sidebar-foreground)" fillOpacity="0.5">
            KM/H
          </text>

          {/* Ponteiro (desenhado em 0°, girado via transform) */}
          <g ref={needleRef} transform={`rotate(${START} ${CX} ${CY})`}>
            <line x1={CX - 22} y1={CY} x2={CX + RADIUS - 14} y2={CY} stroke="var(--sidebar-primary)" strokeWidth="9" strokeLinecap="round" strokeOpacity="0.25" />
            <line x1={CX - 22} y1={CY} x2={CX + RADIUS - 14} y2={CY} stroke="var(--sidebar-primary)" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle cx={CX} cy={CY} r="14" fill="var(--sidebar)" stroke="var(--sidebar-primary)" strokeWidth="3" />
          <circle cx={CX} cy={CY} r="4" fill="var(--sidebar-primary)" />

          {/* Marca no mostrador */}
          <text x={CX} y={CY - 68} textAnchor="middle" fontSize="11" letterSpacing="4" fontWeight="600" fill="var(--sidebar-foreground)" fillOpacity="0.45">
            ZTECH OFICINA
          </text>
        </svg>

        {/* Luzes-espia: acendem na ignição e apagam após a verificação */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-[6%] flex justify-center gap-3">
          <span className="flex size-6 items-center justify-center rounded-md border border-success/40 font-mono text-[11px] font-bold text-success">
            N
          </span>
          {[Battery, Droplet, Thermometer, Zap].map((Icon, index) => (
            <Icon
              key={index}
              className={cn(
                "size-5 transition-[opacity,color] duration-300",
                lightsOn ? "text-warning opacity-100" : "text-sidebar-foreground opacity-20",
              )}
            />
          ))}
        </div>
      </div>

      {/* Status: anunciado a leitores de tela */}
      <div role="status" aria-live="polite" className="flex h-6 items-center gap-3 text-sm text-sidebar-foreground/80">
        {phase === "loading" ? (
          <>
            <span className="ignition-dots flex gap-1" aria-hidden="true">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
            </span>
            Carregando seu painel…
          </>
        ) : (
          <span className="sr-only">Acesso liberado. Ligando o painel.</span>
        )}
      </div>
    </div>
  );
}
