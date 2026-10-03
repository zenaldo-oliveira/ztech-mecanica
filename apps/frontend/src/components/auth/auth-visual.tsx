// Ilustração técnica do painel de marca (decorativa, aria-hidden).
// SVG estático gerado no servidor: conta-giros, engrenagem e linhas de blueprint.
// Movimento apenas via classes CSS (auth-spin-*), desligadas em prefers-reduced-motion.

const CENTER = 300;
const GAUGE_RADIUS = 210;
const START_ANGLE = 135; // graus, sentido horário a partir do eixo x
const SWEEP = 270;
const TICKS = 48;
const GAUGE_VALUE = 0.62; // posição decorativa do ponteiro

function polar(angleDeg: number, radius: number, cx = CENTER, cy = CENTER) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcPath(fromDeg: number, toDeg: number, radius: number) {
  const start = polar(fromDeg, radius);
  const end = polar(toDeg, radius);
  const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

const ticks = Array.from({ length: TICKS + 1 }, (_, index) => {
  const angle = START_ANGLE + (SWEEP * index) / TICKS;
  const major = index % 6 === 0;
  const outer = polar(angle, GAUGE_RADIUS);
  const inner = polar(angle, GAUGE_RADIUS - (major ? 22 : 11));
  const label = major ? polar(angle, GAUGE_RADIUS - 42) : null;
  return { outer, inner, major, label, value: index / 6 };
});

const needleAngle = START_ANGLE + SWEEP * GAUGE_VALUE;
const needleTip = polar(needleAngle, GAUGE_RADIUS - 30);

/** Contorno de engrenagem (dentes trapezoidais). */
function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number) {
  const step = 360 / teeth;
  const points: string[] = [];
  for (let tooth = 0; tooth < teeth; tooth++) {
    const base = tooth * step;
    for (const [offset, radius] of [
      [0, inner],
      [step * 0.18, outer],
      [step * 0.5, outer],
      [step * 0.68, inner],
    ] as const) {
      const point = polar(base + offset, radius, cx, cy);
      points.push(`${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    }
  }
  return `M ${points.join(" L ")} Z`;
}

const GEAR = gearPath(470, 470, 92, 78, 16);

export function AuthVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" fill="none" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="auth-arc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sidebar-primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--sidebar-primary)" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="auth-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--sidebar-primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--sidebar-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Linhas de blueprint */}
      <g stroke="currentColor" strokeOpacity="0.1" strokeWidth="1">
        <line x1="0" y1={CENTER} x2="600" y2={CENTER} strokeDasharray="2 6" />
        <line x1={CENTER} y1="0" x2={CENTER} y2="600" strokeDasharray="2 6" />
        <line x1="60" y1="60" x2="540" y2="540" strokeDasharray="1 9" />
      </g>

      {/* Anéis concêntricos (giro lento) */}
      <circle cx={CENTER} cy={CENTER} r="262" stroke="currentColor" strokeOpacity="0.12" strokeDasharray="1 7" className="auth-spin-reverse" />
      <circle cx={CENTER} cy={CENTER} r="240" stroke="currentColor" strokeOpacity="0.16" strokeDasharray="40 14 4 14" className="auth-spin-slow" />

      {/* Conta-giros */}
      <path d={arcPath(START_ANGLE, START_ANGLE + SWEEP, GAUGE_RADIUS)} stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
      <path
        d={arcPath(START_ANGLE, needleAngle, GAUGE_RADIUS + 10)}
        stroke="url(#auth-arc)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g stroke="currentColor">
        {ticks.map((tick, index) => (
          <line
            key={index}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            strokeOpacity={tick.major ? 0.55 : 0.22}
            strokeWidth={tick.major ? 2 : 1}
          />
        ))}
      </g>
      <g fill="currentColor" fillOpacity="0.32" fontSize="15" fontFamily="var(--font-geist-mono)" textAnchor="middle">
        {ticks
          .filter((tick) => tick.label)
          .map((tick) => (
            <text key={tick.value} x={tick.label!.x} y={tick.label!.y + 5}>
              {tick.value}
            </text>
          ))}
      </g>

      {/* Ponteiro */}
      <circle cx={CENTER} cy={CENTER} r="70" fill="url(#auth-hub)" />
      <line x1={CENTER} y1={CENTER} x2={needleTip.x} y2={needleTip.y} stroke="var(--sidebar-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={CENTER} cy={CENTER} r="9" fill="var(--sidebar)" stroke="var(--sidebar-primary)" strokeWidth="3" />
      <text x={CENTER} y={CENTER + 72} fill="currentColor" fillOpacity="0.4" fontSize="12" letterSpacing="3" fontFamily="var(--font-geist-mono)" textAnchor="middle">
        RPM ×1000
      </text>

      {/* Engrenagem */}
      <g className="auth-spin-slow">
        <path d={GEAR} stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
        <circle cx="470" cy="470" r="40" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="470" cy="470" r="12" stroke="var(--sidebar-primary)" strokeOpacity="0.6" strokeWidth="2" />
      </g>

    </svg>
  );
}
