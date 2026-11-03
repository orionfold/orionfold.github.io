// Helpers for the dev-only Paper 0.4.0 review page (/design/proposed/): the
// before/after chart demos (geometry from chart.ts), the isometric figure and the
// Fold silhouettes.
// Every colour they draw is a var(--pp-*) token.
import { FOLDS, foldShapes, foldById } from './folds';
import { PERSONAL_FOLDS, COLORWAYS, personalFoldSvg } from './personal-folds';
export { FOLDS, foldById };
import { readFileSync, existsSync } from 'node:fs';
// The one-colour template glyphs from the newest exported Paper package (our own output/, then
// the app's bundled copies as a fallback); a cast Fold falls back to its silhouette, a personal
// Fold to its coloured drawing. (The Flow repo's 0.3.4 folder went away when it bundled 0.4.1.)
import { readdirSync } from 'node:fs';
const newest = (dir: string) => { try { return readdirSync(dir).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0]; } catch { return undefined; } };
const GLYPH_DIRS = [`${process.cwd()}/output/paper-package`, `${process.env.HOME}/orionfold-flow/Resources/Paper`].flatMap((base) => { const v = newest(base); return v ? [`${base}/${v}/glyphs`] : []; });
export const glyph = (id: string) => {
  for (const dir of GLYPH_DIRS) { const p = `${dir}/${id}.svg`; if (existsSync(p)) return readFileSync(p, 'utf8').replace(/fill="#000"/g, 'fill="currentColor"').replace(/<svg /, '<svg aria-hidden="true" '); }
  if (id in foldById) return silhouette(id as keyof typeof foldById);
  const pf = PERSONAL_FOLDS.find((f) => f.id === id);
  return pf ? personalFoldSvg(pf, { colorway: COLORWAYS.find((c) => c.id === pf.defaultColorway), shadow: false }) : '';
};

// one-colour silhouette of a Fold for chips (the package ships real template glyphs)
export const silhouette = (id: keyof typeof foldById) => `<svg viewBox="0 0 200 214" aria-hidden="true">${foldShapes(foldById[id]).replace(new RegExp('(fill|stroke)="[^"]*"', 'g'), '$1="currentColor"').replace(new RegExp('opacity="[^"]*"', 'g'), '')}</svg>`;
export const cat = PERSONAL_FOLDS.find((f) => f.id === 'cat')!;
export const catSvg = personalFoldSvg(cat, { colorway: COLORWAYS.find((c) => c.id === 'gold'), shadow: false });

export const HUES = ['teal', 'gold', 'coral', 'violet', 'green', 'pink', 'blue', 'ochre', 'red'];
export const STEPS = ['pale', 'soft', 'base', 'deep', 'ink'];
export { SHAPES, marker, monotonePath } from './chart';
import { marker, monotonePath } from './chart';

// chart data (fictional teaching sample, the same the Flow lane used)
export const Q = [['Q4 FY25', 410], ['Q1 FY26', 455], ['Q2 FY26', 498], ['Q3 FY26', 687], ['Q4 FY26', 602]] as const;
export const barChart = (proposed: boolean) => {
  const W = 560, H = 260, L = 44, B = 222, bw = 78, gap = 24, max = 750;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ARR by quarter in thousands of dollars: Q4 FY25 410, Q1 FY26 455, Q2 FY26 498, Q3 FY26 687, Q4 FY26 602. Q3 FY26 is the highest.">`;
  for (const g of [0, 250, 500, 750]) { const y = B - (g / max) * 190; s += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" class="pp-grid"/>`; if (proposed && g) s += `<text x="${L - 6}" y="${y + 4}" text-anchor="end" class="pp-tick">${g}</text>`; }
  Q.forEach(([q, v], i) => {
    const x = L + 16 + i * (bw + gap), h = (v / max) * 190, hi = q === 'Q3 FY26';
    s += `<rect x="${x}" y="${B - h}" width="${bw}" height="${h}" class="${hi ? 'pp-hi' : 'pp-ctx'}"${proposed ? '' : ` style="fill:var(--pp-${hi ? 'teal' : 'line'})"`}/>`;
    s += `<text x="${x + bw / 2}" y="${B - h - 7}" text-anchor="middle" class="pp-dl ${hi ? 'pp-dl--hi' : proposed ? 'pp-dl--ctx' : ''}">${v}</text>`;
    s += `<text x="${x + bw / 2}" y="${B + 16}" text-anchor="middle" class="pp-tick">${q}</text>`;
  });
  s += `<line x1="${L}" x2="${W}" y1="${B}" y2="${B}" class="pp-axis"/>`;
  if (proposed) s += `<rect x="428" y="6" width="132" height="34" rx="3" fill="var(--pp-white)" stroke="var(--pp-line)"/><text x="436" y="20" class="pp-dl" style="font-weight:400">The catering contract</text><text x="436" y="34" class="pp-dl" style="font-weight:400">landed here</text><path d="M428 36 L420 46" class="pp-leader"/><circle cx="420" cy="46" r="2.2" class="pp-leader-dot"/>`;
  return s + '</svg>';
};
export const lineChart = (proposed: boolean) => {
  const W = 560, H = 240, L = 30, B = 200;
  const series = [
    ['Catering', [22, 28, 31, 40, 46, 52]], ['Retail', [30, 29, 33, 31, 35, 34]], ['Classes', [12, 14, 13, 18, 17, 21]], ['Online', [4, 5, 7, 8, 10, 12]],
  ] as const;
  const legacy = ['teal', 'gold', 'red', 'ink-3'];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly revenue by line, January to June. Catering grows from 22 to 52 thousand, Retail holds near 30, Classes from 12 to 21, Online from 4 to 12.">`;
  for (const g of [0, 20, 40, 60]) { const y = B - g * 3; s += `<line x1="${L}" x2="${W - 90}" y1="${y}" y2="${y}" class="pp-grid"/>`; }
  series.forEach(([name, pts], i) => {
    const d = monotonePath(pts.map((v, j) => [L + j * 88, B - v * 3] as [number, number]));
    s += `<path d="${d}" fill="none" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" class="pp-s${i + 1}"${proposed ? '' : ` style="stroke:var(--pp-${legacy[i]})"`}/>`;
    if (proposed) pts.forEach((v, j) => { s += `<g transform="translate(${L + j * 88} ${B - v * 3})" class="pp-mk">${marker(i, 3.2)}</g>`; });
  });
  // direct labels at the line ends, nudged apart so none overlap (13px minimum)
  const ends = series.map(([name, pts], i) => ({ name, i, y: B - pts[pts.length - 1] * 3 + 4 })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
  for (const e of ends) s += `<text x="${L + 5 * 88 + 12}" y="${e.y}" class="pp-dl"${proposed ? '' : ` style="fill:var(--pp-${legacy[e.i]})"`}>${e.name}</text>`;
  s += `<line x1="${L}" x2="${W - 90}" y1="${B}" y2="${B}" class="pp-axis"/>`;
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach((m, j) => { s += `<text x="${L + j * 88}" y="${B + 16}" text-anchor="middle" class="pp-tick">${m}</text>`; });
  return s + '</svg>';
};
export const stacked = (proposed: boolean) => {
  const rows = [['Juniper', [40, 25, 15]], ['Larkspur', [30, 35, 10]], ['Harbor', [22, 18, 30]]] as const;
  const legacy = ['teal', 'gold', 'red'];
  let s = `<svg viewBox="0 0 560 150" role="img" aria-label="Hours by client and kind. Juniper 40 advisory, 25 review, 15 admin. Larkspur 30, 35, 10. Harbor 22, 18, 30.">`;
  rows.forEach(([name, parts], r) => {
    let x = 90; const y = 14 + r * 44;
    s += `<text x="80" y="${y + 20}" text-anchor="end" class="pp-dl">${name}</text>`;
    parts.forEach((p, i) => { s += `<rect x="${x}" y="${y}" width="${p * 5}" height="30" class="pp-s${i + 1}"${proposed ? '' : ` style="fill:var(--pp-${legacy[i]})"`}/>`; if (proposed && i) s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + 30}" class="pp-gap"/>`; x += p * 5; });
  });
  return s + '</svg>';
};
export const iso = (proposed: boolean) => {
  const slab = (cy: number, label: string) => {
    const w = 88, h = 50, t = 18, cx = 150;
    const top = proposed ? 'var(--pp-fig-accent-soft)' : 'var(--pp-teal-pale)', left = proposed ? 'var(--pp-fig-accent-base)' : 'var(--pp-teal)', right = proposed ? 'var(--pp-fig-accent-deep)' : 'var(--pp-teal)';
    return `<polygon points="${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + t} ${cx - w},${cy + t}" fill="${left}"/>` +
      `<polygon points="${cx},${cy + h} ${cx + w},${cy} ${cx + w},${cy + t} ${cx},${cy + h + t}" fill="${right}"/>` +
      `<polygon points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${top}" stroke="var(--pp-fig-paper)" stroke-width="1"/>` +
      `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="500" fill="var(--pp-fig-ink)" font-family="var(--pp-sans)">${label}</text>`;
  };
  return `<svg viewBox="0 0 300 290" role="img" aria-label="Three stacked layers: top shelf, empty tins, bench." style="max-width:300px;display:block;margin:0 auto">${slab(210, 'Bench')}${slab(140, 'Empty tins')}${slab(70, 'Top shelf')}</svg>`;
};
export const icon = {
  notes: '<svg viewBox="0 0 48 48"><rect x="8" y="10" width="14" height="12" rx="2"/><rect x="8" y="26" width="14" height="12" rx="2"/><rect x="28" y="18" width="12" height="12" rx="2"/><path d="M22 16h3v16h-3M25 24h3"/></svg>',
  review: '<svg viewBox="0 0 48 48"><rect x="8" y="8" width="16" height="32" rx="2"/><rect x="30" y="12" width="10" height="24" rx="2"/><path d="M12 18l3 3 5-6M12 28l3 3 5-6M24 24h6"/></svg>',
  learn: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="14"/><path d="M18 24l4 4 8-8"/></svg>',
  voice: '<svg viewBox="0 0 48 48"><path d="M10 8h20l8 8v24H10z"/><path d="M16 22h16M16 28h16M16 34h10"/></svg>',
};
