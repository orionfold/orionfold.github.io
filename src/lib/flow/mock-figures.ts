// Drawn figures for the Playbook mocks (operator 2026-10-31: "instead of
// charts/diagrams it shows an icon, it feels lazy; animate draw the chart").
// One small figure per chart, diagram or skill kind a Playbook names, keyed by
// its Element card. Ink is currentColor (the Element's tint); labels are
// placeholder bars, so only the page's own names are ever on screen.
// Parts carry a motion class and a stagger index --k; DomainMock animates them:
//   mf-g  grows up from its base     mf-gx grows right from its start
//   mf-s  strokes itself in          mf-p  pops in
const W = 320;
const H = 112;
const LINE = '#cfd6d3';
const PH = '#e3e7e4';

const k = (n: number) => `style="--k:${n}"`;
const bar = (x: number, y: number, w: number, h: number, n: number, o = 0.85, cls = 'mf-g') =>
  `<rect class="${cls}" ${k(n)} x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="currentColor" fill-opacity="${o}"/>`;
const stroke = (d: string, n: number, w = 2, extra = '') =>
  `<path class="mf-s" ${k(n)} pathLength="1" d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const pop = (inner: string, n: number) => `<g class="mf-p" ${k(n)}>${inner}</g>`;
const dot = (x: number, y: number, r = 3.5, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" fill-opacity="${o}"/>`;
const ph = (x: number, y: number, w: number, h = 5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${PH}"/>`;
const box = (x: number, y: number, w: number, h: number, o = 0.14, r = 5) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="currentColor" fill-opacity="${o}" stroke="currentColor" stroke-opacity=".55"/>`;
const axis = (y = 100) => `<path d="M20 ${y}H300" stroke="${LINE}" stroke-width="1"/>`;
const grid = (ys: number[]) => ys.map((y) => `<path d="M20 ${y}H300" stroke="${PH}" stroke-width="1"/>`).join('');
const svg = (body: string) => `<svg class="mf" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>`;

function barChart() {
  const hs = [34, 52, 44, 68, 58, 80, 72];
  return svg(grid([30, 55, 80]) + axis() + hs.map((h, i) => bar(34 + i * 38, 100 - h, 22, h, i, i === 5 ? 0.95 : 0.45)).join(''));
}
function lineChart() {
  const pts = [[24, 78], [64, 70], [104, 74], [144, 56], [184, 60], [224, 40], [264, 44], [300, 26]];
  const d = `M${pts.map((p) => p.join(' ')).join('L')}`;
  return svg(grid([30, 55, 80]) + axis()
    + `<path class="mf-p" ${k(6)} d="${d}L300 100L24 100Z" fill="currentColor" fill-opacity=".1"/>`
    + stroke(d, 0, 2.5) + pts.map((p, i) => pop(dot(p[0], p[1], 3), 2 + i)).join(''));
}
function waterfall() {
  const steps: [number, number][] = [[100, 40], [40, 22], [22, 34], [34, 16], [16, 28]];
  let out = grid([30, 55, 80]) + axis();
  steps.forEach(([from, to], i) => {
    const top = Math.min(from, to); const h = Math.abs(from - to);
    const o = i === 0 ? 0.85 : to < from ? 0.55 : 0.25;
    out += bar(30 + i * 48, top, 30, h, i, o);
    if (i > 0) out += `<path class="mf-p" ${k(i)} d="M${30 + (i - 1) * 48 + 30} ${from}H${30 + i * 48}" stroke="${LINE}" stroke-dasharray="3 3"/>`;
  });
  return svg(out + bar(270, 28, 30, 72, 6, 0.95));
}
function radar() {
  const cx = 160; const cy = 56; const n = 6;
  const pt = (i: number, r: number) => [cx + r * Math.sin((i / n) * Math.PI * 2), cy - r * Math.cos((i / n) * Math.PI * 2)];
  const ring = (r: number) => `M${Array.from({ length: n }, (_, i) => pt(i, r).map((v) => v.toFixed(1)).join(' ')).join('L')}Z`;
  const vals = [44, 30, 40, 22, 36, 28];
  const shape = `M${vals.map((r, i) => pt(i, r).map((v) => v.toFixed(1)).join(' ')).join('L')}Z`;
  return svg([16, 32, 48].map((r) => `<path d="${ring(r)}" fill="none" stroke="${PH}"/>`).join('')
    + Array.from({ length: n }, (_, i) => `<path d="M${cx} ${cy}L${pt(i, 48).join(' ')}" stroke="${PH}"/>`).join('')
    + `<path class="mf-p" ${k(5)} d="${shape}" fill="currentColor" fill-opacity=".18"/>`
    + stroke(shape, 0, 2) + vals.map((r, i) => pop(dot(pt(i, r)[0], pt(i, r)[1], 3), 1 + i)).join(''));
}
function quadrant() {
  const pts = [[72, 30, 7], [110, 44, 5], [208, 26, 9], [240, 48, 6], [92, 78, 5], [196, 82, 7], [256, 70, 4]];
  return svg(`<rect x="164" y="8" width="132" height="44" rx="4" fill="currentColor" fill-opacity=".08"/>`
    + stroke('M24 56H296', 0, 1.2, `stroke-opacity=".5"`) + stroke('M160 6V106', 1, 1.2, `stroke-opacity=".5"`)
    + pts.map(([x, y, r], i) => pop(dot(x, y, r, i === 2 ? 0.95 : 0.5), 2 + i)).join(''));
}
function gantt() {
  const rows: [number, number][] = [[24, 70], [70, 90], [110, 60], [150, 110], [200, 80]];
  return svg(rows.map((_, i) => ph(4, 12 + i * 19, 14, 5)).join('')
    + rows.map(([x, w], i) => bar(x, 9 + i * 19, w, 11, i, i === 3 ? 0.9 : 0.45, 'mf-gx')).join('')
    + `<path class="mf-p" ${k(6)} d="M188 4V104" stroke="currentColor" stroke-dasharray="3 3"/>`);
}
function heatmap() {
  let out = '';
  const lv = [0.12, 0.3, 0.55, 0.85];
  for (let c = 0; c < 22; c++) for (let r = 0; r < 7; r++) {
    const v = lv[(c * 7 + r * 3 + (c % 5) * 2) % 4];
    out += `<rect class="mf-p" ${k(c)} x="${22 + c * 12.5}" y="${12 + r * 12.5}" width="10" height="10" rx="2" fill="currentColor" fill-opacity="${v}"/>`;
  }
  return svg(out);
}
function bullet() {
  const rows = [[200, 150, 176], [230, 196, 210], [180, 120, 168]];
  return svg(rows.map(([range, val, target], i) => {
    const y = 14 + i * 32;
    return ph(4, y + 6, 40) + `<rect x="56" y="${y}" width="${range}" height="18" rx="3" fill="currentColor" fill-opacity=".1"/>`
      + bar(56, y + 5, val, 8, i, 0.85, 'mf-gx') + pop(`<rect x="${56 + target}" y="${y - 2}" width="3" height="22" rx="1" fill="currentColor"/>`, 3 + i);
  }).join(''));
}
function kanban() {
  const cols = [3, 2, 1];
  return svg(cols.map((n, c) => {
    const x = 18 + c * 98;
    return `<rect x="${x}" y="6" width="88" height="100" rx="6" fill="${PH}" fill-opacity=".45"/>` + ph(x + 8, 12, 34, 5)
      + Array.from({ length: n }, (_, j) => pop(`<rect x="${x + 6}" y="${24 + j * 26}" width="76" height="20" rx="4" fill="#fff" stroke="currentColor" stroke-opacity=".45"/>${ph(x + 12, 31 + j * 26, 44)}`, c * 2 + j)).join('');
  }).join(''));
}
function flowchart() {
  return svg(pop(`<rect x="12" y="44" width="52" height="22" rx="11" fill="currentColor" fill-opacity=".85"/>`, 0)
    + stroke('M64 55H90', 1, 1.6) + pop(box(90, 42, 58, 26), 2) + stroke('M148 55H168', 3, 1.6)
    + pop(`<path d="M196 33L224 55L196 77L168 55Z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-opacity=".6"/>`, 4)
    + stroke('M224 55H244V24H256', 5, 1.6) + stroke('M224 55H244V86H256', 5, 1.6)
    + pop(box(256, 12, 52, 24), 6) + pop(box(256, 74, 52, 24, 0.3), 7));
}
function c4() {
  const person = `<circle cx="40" cy="30" r="9" fill="currentColor" fill-opacity=".85"/><path d="M24 62C24 48 56 48 56 62Z" fill="currentColor" fill-opacity=".85"/>`;
  return svg(pop(person, 0) + stroke('M60 48H118', 1, 1.6, 'stroke-dasharray="4 4"')
    + pop(`<rect x="118" y="28" width="86" height="44" rx="6" fill="currentColor" fill-opacity=".85"/>${ph(132, 46, 56).replace(PH, '#ffffff99')}`, 2)
    + stroke('M204 40L246 22', 3, 1.6, 'stroke-dasharray="4 4"') + stroke('M204 62L246 84', 4, 1.6, 'stroke-dasharray="4 4"')
    + pop(box(246, 6, 64, 30, 0.12), 5) + pop(box(246, 70, 64, 30, 0.12), 6));
}
function mindmap() {
  const leaves = [[52, 18], [36, 60], [60, 96], [268, 20], [284, 62], [258, 98]];
  return svg(leaves.map(([x, y], i) => stroke(`M160 56C${(160 + x) / 2} 56 ${(160 + x) / 2} ${y} ${x} ${y}`, i, 1.8)).join('')
    + pop(`<ellipse cx="160" cy="56" rx="40" ry="18" fill="currentColor" fill-opacity=".85"/>`, 0)
    + leaves.map(([x, y], i) => pop(`<rect x="${x - 26}" y="${y - 8}" width="52" height="16" rx="8" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-opacity=".5"/>`, 3 + i)).join(''));
}
function workflowPath() {
  const xs = [30, 92, 160, 228, 290];
  return svg(stroke('M30 56H290', 0, 2.5)
    + xs.map((x, i) => pop(i === 2
      ? `<path d="M${x} 40L${x + 16} 56L${x} 72L${x - 16} 56Z" fill="currentColor"/>`
      : `<circle cx="${x}" cy="56" r="12" fill="#fff" stroke="currentColor" stroke-width="2.5"/><circle cx="${x}" cy="56" r="5" fill="currentColor"/>`, 1 + i)).join('')
    + xs.map((x, i) => ph(x - 18, 84, 36)).join('') + `<g class="mf-p" ${k(6)}>${ph(142, 22, 36)}</g>`);
}
function scorecard() {
  const vals = [0.82, 0.55, 0.7, 0.38];
  return svg(vals.map((v, i) => {
    const y = 10 + i * 24;
    return ph(8, y + 5, 70) + `<rect x="96" y="${y + 2}" width="160" height="11" rx="5.5" fill="${PH}"/>` + bar(96, y + 2, 160 * v, 11, i, v > 0.6 ? 0.85 : 0.45, 'mf-gx');
  }).join('') + pop(`<circle cx="288" cy="50" r="20" fill="currentColor" fill-opacity=".9"/><path d="M279 50l6 6 12-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, 5));
}
function roadmap() {
  const lanes: [number, number][][] = [[[20, 80], [112, 70]], [[60, 110], [184, 90]], [[30, 60], [150, 60], [222, 74]]];
  return svg([0, 1, 2].map((l) => `<rect x="10" y="${8 + l * 33}" width="300" height="28" rx="5" fill="${PH}" fill-opacity=".4"/>`).join('')
    + lanes.map((items, l) => items.map(([x, w], j) => bar(x, 14 + l * 33, w, 16, l * 2 + j, j === items.length - 1 ? 0.3 : 0.75, 'mf-gx')).join('')).join('')
    + pop(`<path d="M206 2L213 9L206 16L199 9Z" fill="currentColor"/>`, 6) + `<path class="mf-p" ${k(6)} d="M206 16V108" stroke="currentColor" stroke-dasharray="3 3"/>`);
}
function scenario() {
  const up = 'M24 74C110 66 190 40 300 18'; const base = 'M24 74C110 70 190 58 300 52'; const down = 'M24 74C110 76 190 84 300 94';
  return svg(grid([30, 55, 80]) + axis(104)
    + `<path class="mf-p" ${k(4)} d="M24 74C110 66 190 40 300 18L300 94C190 84 110 76 24 74Z" fill="currentColor" fill-opacity=".1"/>`
    + stroke(up, 0, 2, `stroke-opacity=".55" stroke-dasharray="1"`) + stroke(base, 1, 2.6) + stroke(down, 2, 2, `stroke-opacity=".55"`)
    + pop(dot(300, 18, 4, 0.6), 5) + pop(dot(300, 52, 4.5), 5) + pop(dot(300, 94, 4, 0.6), 5));
}
function optionComparison() {
  const harvey = (x: number, y: number, f: number) => {
    const a = f * Math.PI * 2; const ex = x + 7 * Math.sin(a); const ey = y - 7 * Math.cos(a);
    const wedge = f >= 1 ? `<circle cx="${x}" cy="${y}" r="7" fill="currentColor"/>` : f <= 0 ? '' : `<path d="M${x} ${y}L${x} ${y - 7}A7 7 0 ${f > 0.5 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}Z" fill="currentColor"/>`;
    return `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="currentColor" stroke-opacity=".6"/>${wedge}`;
  };
  const vals = [[1, 0.5, 0.25], [0.75, 1, 0.5], [0.5, 0.75, 1], [1, 0.25, 0.75]];
  return svg(`<rect class="mf-p" ${k(0)} x="176" y="2" width="56" height="108" rx="6" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".4"/>`
    + [140, 204, 268].map((x) => ph(x - 16, 8, 32)).join('')
    + vals.map((row, r) => ph(10, 30 + r * 21, 70) + row.map((v, c) => pop(harvey(140 + c * 64, 32 + r * 21, v), 1 + r + c)).join('')).join(''));
}
function opportunityMap() {
  const bubbles = [[70, 70, 10], [118, 40, 16], [196, 30, 22], [250, 64, 12], [150, 84, 8], [270, 24, 9]];
  return svg(stroke('M24 104H300', 0, 1.2, `stroke-opacity=".5"`) + stroke('M24 104V6', 0, 1.2, `stroke-opacity=".5"`)
    + bubbles.map(([x, y, r], i) => pop(`<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" fill-opacity="${i === 2 ? 0.85 : 0.3}" stroke="currentColor" stroke-opacity=".6"/>`, 1 + i)).join(''));
}
function fieldNotes() {
  const ws = [240, 168, 110, 66];
  return svg(ws.map((w, i) => ph(8, 13 + i * 25, 46) + bar(66, 8 + i * 25, w, 14, i, i === 2 ? 0.95 : 0.35, 'mf-gx')).join('')
    + stroke('M66 106H306', 5, 1, `stroke-opacity=".5"`) + pop(`<path d="M180 92V100M180 100H306M306 92V100" fill="none" stroke="currentColor"/>`, 6));
}
function decisionBrief() {
  return svg(`<rect x="40" y="4" width="240" height="104" rx="7" fill="#fff" stroke="${LINE}"/>` + ph(56, 14, 110, 7)
    + [0, 1, 2].map((r) => pop(`<rect x="54" y="${30 + r * 22}" width="212" height="17" rx="4" fill="currentColor" fill-opacity="${r === 1 ? 0.2 : 0.06}" stroke="currentColor" stroke-opacity="${r === 1 ? 0.7 : 0.2}"/>${ph(64, 36 + r * 22, 90 - r * 14)}`, r)).join('')
    + pop(`<circle cx="252" cy="60" r="7" fill="currentColor"/><path d="M248.5 60l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, 4));
}

const FIGURES: Record<string, () => string> = {
  'kind-bar-chart': barChart,
  'kind-grouped-bar-chart': barChart,
  'kind-line-chart': lineChart,
  'kind-area-chart': lineChart,
  'kind-waterfall-chart': waterfall,
  'kind-radar-chart': radar,
  'kind-quadrant-chart': quadrant,
  'kind-gantt-chart': gantt,
  'kind-gantt-diagram': gantt,
  'kind-calendar-heatmap': heatmap,
  'kind-heatmap': heatmap,
  'kind-bullet-chart': bullet,
  'kind-kanban-board': kanban,
  'kind-flowchart': flowchart,
  'kind-c4-context-diagram': c4,
  'kind-mindmap': mindmap,
  'skill-workflow-path': workflowPath,
  'skill-scorecard': scorecard,
  'skill-roadmap': roadmap,
  'skill-scenario-model': scenario,
  'skill-option-comparison': optionComparison,
  'skill-opportunity-map': opportunityMap,
  'skill-field-notes-diagram': fieldNotes,
  'skill-decision-brief': decisionBrief,
};

/** The drawn figure for an Element card, or undefined when none is drawn yet. */
export function mockFigure(card: string): string | undefined {
  return FIGURES[card]?.();
}
export const MOCK_FIGURE_CARDS = Object.keys(FIGURES);
