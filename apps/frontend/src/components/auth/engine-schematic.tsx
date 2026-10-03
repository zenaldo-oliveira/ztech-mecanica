"use client";

import { useEffect, useRef } from "react";

import { gearPath } from "@/components/auth/auth-geometry";
import { useMediaQuery } from "@/lib/use-media-query";

// Motor 4 cilindros em linha, aberto, desenhado em SVG — fundo do login enquanto
// /public/videos/engine.mp4 não existir (ou se o vídeo falhar).
//
// Cinemática real de biela-manivela (não é translateY independente):
//   pino do virabrequim: (cx + r·sinθ, cy − r·cosθ)
//   pino do pistão:      y = cy − (r·cosθ + √(l² − r²·sin²θ))
// Virabrequim → bielas → pistões, com cilindros em fases diferentes (1 e 4 em 0°,
// 2 e 3 em 180°), ordem de ignição 1-3-4-2 e comando de válvulas a meia rotação.
// Animação via requestAnimationFrame escrevendo direto nos atributos SVG.

const W = 1600;
const H = 900;
const CRANK_Y = 660;
const CRANK_R = 62;
const ROD_L = 210;
const PISTON_W = 140;
const PISTON_H = 108;
const PIN_FROM_TOP = 66;
const CYLINDERS = [430, 650, 870, 1090];
/** Ângulo do pino de cada cilindro (graus) e quando cada um inicia a combustão no ciclo de 720°. */
const CRANK_OFFSET = [0, 180, 180, 0];
const FIRE_AT = [0, 540, 180, 360];
const REV_MS = 2200; // uma volta do virabrequim (ritmo cinematográfico)
const STATIC_ANGLE = 38; // quadro fixo em prefers-reduced-motion
/** ~30 fps: suficiente para a rotação lenta do fundo e metade do custo de CPU de 60 fps. */
const FRAME_INTERVAL_MS = 1000 / 30;

const GEAR_X = 1290;
const CAM_Y = 196;
const CRANK_GEAR = gearPath(GEAR_X, CRANK_Y, 50, 42, 18);
const CAM_GEAR = gearPath(GEAR_X, CAM_Y, 96, 86, 36);

interface CylinderFrame {
  pin: { x: number; y: number };
  pistonPinY: number;
  crankDeg: number;
  glow: number;
}

function cylinderFrame(index: number, thetaDeg: number): CylinderFrame {
  const cx = CYLINDERS[index];
  const crankDeg = thetaDeg + CRANK_OFFSET[index];
  const theta = (crankDeg * Math.PI) / 180;
  const pin = { x: cx + CRANK_R * Math.sin(theta), y: CRANK_Y - CRANK_R * Math.cos(theta) };
  const pistonPinY =
    CRANK_Y - (CRANK_R * Math.cos(theta) + Math.sqrt(ROD_L ** 2 - CRANK_R ** 2 * Math.sin(theta) ** 2));
  const cycle = (((thetaDeg - FIRE_AT[index]) % 720) + 720) % 720;
  const glow = cycle < 55 ? 1 - cycle / 55 : 0;
  return { pin, pistonPinY, crankDeg, glow };
}

const INITIAL = CYLINDERS.map((_, index) => cylinderFrame(index, STATIC_ANGLE));

export function EngineSchematic({ className }: { className?: string }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pistonRefs = useRef<(SVGGElement | null)[]>([]);
  const rodRefs = useRef<(SVGLineElement | null)[]>([]);
  const rodCoreRefs = useRef<(SVGLineElement | null)[]>([]);
  const bigEndRefs = useRef<(SVGCircleElement | null)[]>([]);
  const crankRefs = useRef<(SVGGElement | null)[]>([]);
  const glowRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const lobeRefs = useRef<(SVGGElement | null)[]>([]);
  const crankGearRef = useRef<SVGGElement>(null);
  const camGearRef = useRef<SVGGElement>(null);
  const beltRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let start: number | null = null;
    let lastDraw = -Infinity;

    const draw = (thetaDeg: number) => {
      CYLINDERS.forEach((cx, index) => {
        const f = cylinderFrame(index, thetaDeg);
        pistonRefs.current[index]?.setAttribute("transform", `translate(0 ${(f.pistonPinY - INITIAL[index].pistonPinY).toFixed(2)})`);
        for (const line of [rodRefs.current[index], rodCoreRefs.current[index]]) {
          line?.setAttribute("x1", f.pin.x.toFixed(2));
          line?.setAttribute("y1", f.pin.y.toFixed(2));
          line?.setAttribute("y2", f.pistonPinY.toFixed(2));
        }
        bigEndRefs.current[index]?.setAttribute("cx", f.pin.x.toFixed(2));
        bigEndRefs.current[index]?.setAttribute("cy", f.pin.y.toFixed(2));
        crankRefs.current[index]?.setAttribute("transform", `rotate(${f.crankDeg.toFixed(2)} ${cx} ${CRANK_Y})`);
        glowRefs.current[index]?.setAttribute("opacity", f.glow.toFixed(3));
        lobeRefs.current[index]?.setAttribute(
          "transform",
          `rotate(${(thetaDeg / 2 + FIRE_AT[index] / 2).toFixed(2)} ${cx} ${CAM_Y})`,
        );
      });
      crankGearRef.current?.setAttribute("transform", `rotate(${thetaDeg.toFixed(2)} ${GEAR_X} ${CRANK_Y})`);
      camGearRef.current?.setAttribute("transform", `rotate(${(thetaDeg / 2).toFixed(2)} ${GEAR_X} ${CAM_Y})`);
      // Correia avança na velocidade periférica da engrenagem do virabrequim.
      beltRef.current?.setAttribute("stroke-dashoffset", (-(thetaDeg * Math.PI) / 180 * 46).toFixed(2));
    };

    const tick = (now: number) => {
      start ??= now;
      if (now - lastDraw >= FRAME_INTERVAL_MS) {
        lastDraw = now;
        draw(STATIC_ANGLE + ((now - start) / REV_MS) * 360);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="engine-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1b1f27" />
          <stop offset="45%" stopColor="#5b6472" />
          <stop offset="55%" stopColor="#7c8594" />
          <stop offset="100%" stopColor="#1d222b" />
        </linearGradient>
        <linearGradient id="engine-piston" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a303b" />
          <stop offset="50%" stopColor="#a3acba" />
          <stop offset="100%" stopColor="#262b35" />
        </linearGradient>
        <linearGradient id="engine-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#151922" />
          <stop offset="100%" stopColor="#0b0e14" />
        </linearGradient>
        <radialGradient id="engine-fire" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9ec5ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="var(--sidebar-primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--sidebar-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bloco e cabeçote em corte */}
      <rect x="300" y="130" width="910" height="460" rx="18" fill="url(#engine-block)" stroke="#2b3240" strokeWidth="2" />
      <rect x="300" y="130" width="910" height="112" rx="18" fill="#10141c" stroke="#2b3240" strokeWidth="2" />

      {/* Comando de válvulas (meia rotação) */}
      <line x1="320" y1={CAM_Y} x2={GEAR_X} y2={CAM_Y} stroke="url(#engine-metal)" strokeWidth="14" strokeLinecap="round" />

      {CYLINDERS.map((cx, index) => {
        const initial = INITIAL[index];
        const pistonTop = initial.pistonPinY - PIN_FROM_TOP;
        return (
          <g key={cx}>
            {/* Cilindro */}
            <rect x={cx - PISTON_W / 2 - 8} y="242" width={PISTON_W + 16} height="330" fill="#06080c" stroke="#323a49" strokeWidth="2" />
            <line x1={cx - PISTON_W / 2 - 8} y1="242" x2={cx - PISTON_W / 2 - 8} y2="572" stroke="var(--sidebar-primary)" strokeOpacity="0.25" strokeWidth="1.5" />

            {/* Combustão (azul elétrico, discreta) */}
            <ellipse
              ref={(element) => {
                glowRefs.current[index] = element;
              }}
              cx={cx}
              cy="282"
              rx="74"
              ry="46"
              fill="url(#engine-fire)"
              opacity={initial.glow}
            />

            {/* Válvulas e ressalto do comando */}
            <path d={`M ${cx - 34} 242 v -30 m -12 30 h 24`} stroke="#6b7484" strokeWidth="5" strokeLinecap="round" />
            <path d={`M ${cx + 34} 242 v -30 m -12 30 h 24`} stroke="#6b7484" strokeWidth="5" strokeLinecap="round" />
            <g
              ref={(element) => {
                lobeRefs.current[index] = element;
              }}
              transform={`rotate(${STATIC_ANGLE / 2 + FIRE_AT[index] / 2} ${cx} ${CAM_Y})`}
            >
              <path d={`M ${cx} ${CAM_Y - 24} q 20 6 18 24 q -4 18 -18 18 q -14 0 -18 -18 q -2 -18 18 -24 z`} fill="url(#engine-metal)" stroke="#8b94a3" strokeOpacity="0.5" />
            </g>

            {/* Biela: corpo largo + núcleo claro (pontas atualizadas a cada quadro) */}
            <line
              ref={(element) => {
                rodRefs.current[index] = element;
              }}
              x1={initial.pin.x}
              y1={initial.pin.y}
              x2={cx}
              y2={initial.pistonPinY}
              stroke="url(#engine-metal)"
              strokeWidth="30"
              strokeLinecap="round"
            />
            <line
              ref={(element) => {
                rodCoreRefs.current[index] = element;
              }}
              x1={initial.pin.x}
              y1={initial.pin.y}
              x2={cx}
              y2={initial.pistonPinY}
              stroke="#9aa3b1"
              strokeOpacity="0.35"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Pistão com anéis (desliza no cilindro) */}
            <g
              ref={(element) => {
                pistonRefs.current[index] = element;
              }}
            >
              <rect x={cx - PISTON_W / 2} y={pistonTop} width={PISTON_W} height={PISTON_H} rx="10" fill="url(#engine-piston)" />
              {[14, 26, 38].map((offset) => (
                <line key={offset} x1={cx - PISTON_W / 2 + 2} y1={pistonTop + offset} x2={cx + PISTON_W / 2 - 2} y2={pistonTop + offset} stroke="#141821" strokeWidth="3" />
              ))}
              <rect x={cx - PISTON_W / 2} y={pistonTop} width={PISTON_W} height="4" fill="var(--sidebar-primary)" fillOpacity="0.35" />
              <circle cx={cx} cy={initial.pistonPinY} r="13" fill="#2b313c" stroke="#9aa3b1" strokeWidth="3" />
            </g>

            {/* Virabrequim: braço e contrapeso giram com o eixo */}
            <g
              ref={(element) => {
                crankRefs.current[index] = element;
              }}
              transform={`rotate(${initial.crankDeg} ${cx} ${CRANK_Y})`}
            >
              <path
                d={`M ${cx - 70} ${CRANK_Y + 10} A 72 72 0 0 0 ${cx + 70} ${CRANK_Y + 10} L ${cx + 26} ${CRANK_Y - CRANK_R} L ${cx - 26} ${CRANK_Y - CRANK_R} Z`}
                fill="url(#engine-metal)"
                stroke="#3a4250"
                strokeWidth="2"
              />
            </g>
            <circle
              ref={(element) => {
                bigEndRefs.current[index] = element;
              }}
              cx={initial.pin.x}
              cy={initial.pin.y}
              r="20"
              fill="#2b313c"
              stroke="#a3acba"
              strokeWidth="3"
            />
          </g>
        );
      })}

      {/* Eixo principal e mancais */}
      <line x1="300" y1={CRANK_Y} x2={GEAR_X} y2={CRANK_Y} stroke="url(#engine-metal)" strokeWidth="26" strokeLinecap="round" />
      {[320, 540, 760, 980, 1200].map((x) => (
        <rect key={x} x={x - 14} y={CRANK_Y - 24} width="28" height="48" rx="6" fill="#151a23" stroke="#3a4250" strokeWidth="2" />
      ))}

      {/* Distribuição: engrenagens 1:2 e correia */}
      <path
        ref={beltRef}
        d={`M ${GEAR_X - 50} ${CRANK_Y} L ${GEAR_X - 96} ${CAM_Y} A 96 96 0 0 1 ${GEAR_X + 96} ${CAM_Y} L ${GEAR_X + 50} ${CRANK_Y} A 50 50 0 0 1 ${GEAR_X - 50} ${CRANK_Y}`}
        fill="none"
        stroke="#3d4553"
        strokeWidth="9"
        strokeDasharray="10 6"
      />
      <g ref={crankGearRef} transform={`rotate(${STATIC_ANGLE} ${GEAR_X} ${CRANK_Y})`}>
        <path d={CRANK_GEAR} fill="#1a1f28" stroke="#8b94a3" strokeWidth="2" />
        <circle cx={GEAR_X} cy={CRANK_Y} r="14" fill="#0e1218" stroke="var(--sidebar-primary)" strokeOpacity="0.5" strokeWidth="2" />
      </g>
      <g ref={camGearRef} transform={`rotate(${STATIC_ANGLE / 2} ${GEAR_X} ${CAM_Y})`}>
        <path d={CAM_GEAR} fill="#1a1f28" stroke="#8b94a3" strokeWidth="2" />
        <circle cx={GEAR_X} cy={CAM_Y} r="28" fill="#0e1218" stroke="#5b6472" strokeWidth="2" />
        <line x1={GEAR_X} y1={CAM_Y - 70} x2={GEAR_X} y2={CAM_Y + 70} stroke="#5b6472" strokeWidth="4" />
        <line x1={GEAR_X - 70} y1={CAM_Y} x2={GEAR_X + 70} y2={CAM_Y} stroke="#5b6472" strokeWidth="4" />
      </g>
    </svg>
  );
}
