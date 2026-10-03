// Geometria das ilustrações SVG das telas de autenticação (fundo e painel de instrumentos).
// Funções puras: rodam igual no servidor e no cliente.

export interface Point {
  x: number;
  y: number;
}

/** Ponto em coordenadas polares; ângulo em graus, sentido horário a partir do eixo x. */
export function polar(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** Arco SVG de `fromDeg` a `toDeg` (sentido horário). */
export function arcPath(cx: number, cy: number, radius: number, fromDeg: number, toDeg: number): string {
  const start = polar(cx, cy, radius, fromDeg);
  const end = polar(cx, cy, radius, toDeg);
  const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/** Contorno de engrenagem com dentes trapezoidais. */
export function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
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
      const point = polar(cx, cy, radius, base + offset);
      points.push(`${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    }
  }
  return `M ${points.join(" L ")} Z`;
}
