// The Paper 0.4.0 chart kit (spec section 4.9), drawn at build time as SVG that
// reads only the .pp-chart classes: context in viz greys, one teal highlight,
// the takeaway as the title, direct labels at line ends, markers by shape so a
// series is never colour alone, stacked segments with a paper gap, bars from
// zero. Lines are thin monotone curves with round joins and never a fill.
// Axis and tick text is hidden from assistive tech; `label` carries the values.
export type Pt = [number, number];
export const SHAPES = ['circle', 'square', 'diamond', 'triangle up', 'triangle down', 'cross', 'plus', 'hexagon'];
const f1 = (n: number) => Number(n.toFixed(1));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Marker i (0..7) for series i + 1, centred on the origin. */
export const marker = (i: number, s = 6) => {
  const c = `class="pp-s${i + 1}"`;
  switch (i) {
    case 0: return `<circle r="${s}" ${c}/>`;
    case 1: return `<rect x="${-s}" y="${-s}" width="${s * 2}" height="${s * 2}" ${c}/>`;
    case 2: return `<polygon points="0,${-s * 1.3} ${s * 1.3},0 0,${s * 1.3} ${-s * 1.3},0" ${c}/>`;
    case 3: return `<polygon points="0,${-s * 1.2} ${s * 1.2},${s} ${-s * 1.2},${s}" ${c}/>`;
    case 4: return `<polygon points="0,${s * 1.2} ${s * 1.2},${-s} ${-s * 1.2},${-s}" ${c}/>`;
    case 5: return `<path d="M${-s} ${-s}L${s} ${s}M${s} ${-s}L${-s} ${s}" ${c} fill="none" stroke-width="2.4"/>`;
    case 6: return `<path d="M0 ${-s * 1.2}V${s * 1.2}M${-s * 1.2} 0H${s * 1.2}" ${c} fill="none" stroke-width="2.4"/>`;
    default: return `<polygon points="${s},0 ${s / 2},${s * .87} ${-s / 2},${s * .87} ${-s},0 ${-s / 2},${-s * .87} ${s / 2},${-s * .87}" ${c}/>`;
  }
};

/** A smooth line through the points with no overshoot (monotone cubic, as D3's curveMonotoneX). */
export const monotonePath = (pts: Pt[]) => {
  const n = pts.length; if (n < 2) return '';
  const dx: number[] = [], dy: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); dy.push(pts[i + 1][1] - pts[i][1]); m.push(dy[i] / dx[i]); }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; } const a = t[i] / m[i], b = t[i + 1] / m[i], h = Math.hypot(a, b); if (h > 3) { t[i] = 3 * a / h * m[i]; t[i + 1] = 3 * b / h * m[i]; } }
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += ` C${f1(pts[i][0] + h)} ${f1(pts[i][1] + h * t[i])} ${f1(pts[i + 1][0] - h)} ${f1(pts[i + 1][1] - h * t[i + 1])} ${f1(pts[i + 1][0])} ${f1(pts[i + 1][1])}`; }
  return d;
};

export interface Bar { label: string; value: number; hi?: boolean }
export interface BarSpec {
  /** the accessible summary with the real values */
  label: string;
  bars: Bar[];
  max?: number;
  /** grid steps, e.g. [0, 250, 500, 750] */
  grid?: number[];
  w?: number; h?: number;
  /** value labels above the bars */
  values?: boolean;
}
/** Bars from zero: context bars in viz grey, the highlighted one(s) in teal. */
export function barChart(spec: BarSpec): string {
  const W = spec.w ?? 560, H = spec.h ?? 260, L = spec.grid ? 44 : 8, B = H - 38, top = 24;
  const max = spec.max ?? Math.max(...spec.bars.map((b) => b.value)) * 1.08;
  const n = spec.bars.length, gap = Math.min(24, (W - L) / n * .28), bw = (W - L - gap * (n + 1)) / n, plot = B - top;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.label)}">`;
  for (const g of spec.grid ?? []) { const y = f1(B - (g / max) * plot); s += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" class="pp-grid"/>`; if (g) s += `<text x="${L - 6}" y="${y + 4}" text-anchor="end" class="pp-tick" aria-hidden="true">${g}</text>`; }
  spec.bars.forEach((b, i) => {
    const x = f1(L + gap + i * (bw + gap)), h = f1((b.value / max) * plot);
    s += `<rect x="${x}" y="${f1(B - h)}" width="${f1(bw)}" height="${h}" class="${b.hi ? 'pp-hi' : 'pp-ctx'}"/>`;
    if (spec.values !== false) s += `<text x="${f1(x + bw / 2)}" y="${f1(B - h - 7)}" text-anchor="middle" class="pp-dl ${b.hi ? 'pp-dl--hi' : 'pp-dl--ctx'}" aria-hidden="true">${b.value}</text>`;
    s += `<text x="${f1(x + bw / 2)}" y="${B + 16}" text-anchor="middle" class="pp-tick" aria-hidden="true">${esc(b.label)}</text>`;
  });
  s += `<line x1="${L}" x2="${W}" y1="${B}" y2="${B}" class="pp-axis"/>`;
  return s + '</svg>';
}

export interface LineSpec {
  label: string;
  series: { name: string; pts: number[] }[];
  x: string[];
  max?: number;
  w?: number; h?: number;
  grid?: number[];
}
/** Categorical lines on the data ramp with markers by shape and direct labels at the ends. */
export function lineChart(spec: LineSpec): string {
  const W = spec.w ?? 560, H = spec.h ?? 240, L = 30, B = H - 40, R = 90, top = 16;
  const max = spec.max ?? Math.max(...spec.series.flatMap((r) => r.pts)) * 1.1;
  const cols = spec.x.length, step = (W - L - R) / (cols - 1), plot = B - top;
  const X = (j: number) => f1(L + j * step), Y = (v: number) => f1(B - (v / max) * plot);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.label)}">`;
  for (const g of spec.grid ?? []) s += `<line x1="${L}" x2="${W - R}" y1="${Y(g)}" y2="${Y(g)}" class="pp-grid"/>`;
  spec.series.forEach((r, i) => {
    s += `<path d="${monotonePath(r.pts.map((v, j) => [X(j), Y(v)] as Pt))}" fill="none" stroke-width="1.6" class="pp-s${i + 1}"/>`;
    r.pts.forEach((v, j) => { s += `<g transform="translate(${X(j)} ${Y(v)})" class="pp-mk">${marker(i, 3.2)}</g>`; });
  });
  const ends = spec.series.map((r, i) => ({ name: r.name, i, y: Y(r.pts[r.pts.length - 1]) + 4 })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
  for (const e of ends) s += `<text x="${X(cols - 1) + 12}" y="${f1(e.y)}" class="pp-dl" aria-hidden="true">${esc(e.name)}</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${B}" y2="${B}" class="pp-axis"/>`;
  spec.x.forEach((m, j) => { s += `<text x="${X(j)}" y="${B + 16}" text-anchor="middle" class="pp-tick" aria-hidden="true">${esc(m)}</text>`; });
  return s + '</svg>';
}

export interface StackSpec { label: string; rows: { name: string; parts: number[] }[]; scale?: number; w?: number }
/** Horizontal stacked bars, one paper gap between segments. */
export function stackedBars(spec: StackSpec): string {
  const W = spec.w ?? 560, scale = spec.scale ?? 5, H = 14 + spec.rows.length * 44;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.label)}">`;
  spec.rows.forEach((r, k) => {
    let x = 90; const y = 14 + k * 44;
    s += `<text x="80" y="${y + 20}" text-anchor="end" class="pp-dl" aria-hidden="true">${esc(r.name)}</text>`;
    r.parts.forEach((p, i) => { s += `<rect x="${x}" y="${y}" width="${p * scale}" height="30" class="pp-s${i + 1}"/>`; if (i) s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + 30}" class="pp-gap"/>`; x += p * scale; });
  });
  return s + '</svg>';
}

/** The figure around a chart: the takeaway as the title, a one-line sub, the source in ink-3. */
export function chartFigure(o: { title?: string; sub?: string; src?: string; svg: string; class?: string }): string {
  return `<figure class="pp-chart${o.class ? ' ' + o.class : ''}">${o.title ? `<p class="pp-chart-title">${esc(o.title)}</p>` : ''}${o.sub ? `<p class="pp-chart-sub">${esc(o.sub)}</p>` : ''}${o.svg}${o.src ? `<p class="pp-chart-src">${esc(o.src)}</p>` : ''}</figure>`;
}
