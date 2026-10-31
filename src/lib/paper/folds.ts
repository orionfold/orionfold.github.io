// The eight Folds: origami helpers drawn as faceted polygons, ported from the
// town-study prototype (operator 2026-10-30). Each Fold belongs to one
// published Domain in src/content/domains; the Paper design system renders
// them as inline SVG at build time, so no page needs JavaScript to draw one.

export type Draw = (a: string, b: string, c: string) => string;

export const INK = '#171c1a';
export const P = (pts: string, fill: string) =>
  `<polygon points="${pts}" fill="${fill}" stroke="${fill}" stroke-width=".6" stroke-linejoin="round"/>`;
export const eye = (x: number, y: number, r = 3.4) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.32}" fill="#fff"/>`;
export const blush = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" fill="#f24b39" opacity=".28"/>`;
export const SHADOW = `<ellipse cx="100" cy="206" rx="52" ry="5" fill="${INK}" opacity=".08"/>`;

/* Orri, a paper plane mid-glide: the guide who carries your updates to clients */
const plane: Draw = (a, b, c) =>
  `<path d="M20 170 q30 -6 52 -26 M34 188 q26 -2 46 -20" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 9"/>` +
  P('184,40 18,116 104,120', a) + P('184,40 104,120 98,150', c) + P('184,40 98,150 92,186', b) + P('104,120 98,150 66,132', b) +
  eye(118, 92) + eye(138, 83) + `<path d="M120 104 q10 4 18 -6" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + blush(108, 104) + blush(148, 92);

const crane: Draw = (a, b, c) =>
  P('100,112 52,34 88,118', c) + P('100,112 156,26 116,118', a) + P('58,124 100,98 100,146', a) + P('100,98 146,124 100,146', b) +
  P('70,126 36,66 80,118', b) + P('36,66 22,80 44,74', b) + P('132,124 180,70 124,116', c) +
  P('92,146 96,146 90,196 86,196', INK) + P('106,146 110,146 116,196 112,196', INK) + eye(39, 71, 2.6);

const fox: Draw = (a, b, c) =>
  P('138,176 190,128 176,196', a) + P('182,138 190,128 186,152', '#fff') +
  P('66,126 100,126 100,196 58,196', a) + P('100,126 134,126 142,196 100,196', b) + P('84,140 116,140 100,186', '#fff8ee') +
  P('58,38 80,84 54,84', b) + P('64,52 74,80 60,80', '#fff8ee') + P('142,38 146,84 120,84', b) +
  P('54,84 100,84 100,132', a) + P('100,84 146,84 100,132', c) + P('80,108 120,108 100,134', '#fff8ee') + P('95,128 105,128 100,135', INK) +
  eye(82, 100) + eye(118, 100) + blush(72, 112) + blush(128, 112);

const owl: Draw = (a, b, c) =>
  P('58,62 54,34 82,62', b) + P('142,62 146,34 118,62', b) +
  P('58,62 100,62 100,192 48,142', a) + P('100,62 142,62 152,142 100,192', b) + P('74,124 126,124 100,182', c) +
  P('48,110 30,150 56,150', b) + P('152,110 170,150 144,150', b) +
  `<circle cx="80" cy="94" r="15" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="120" cy="94" r="15" fill="#fff" stroke="${INK}" stroke-width="2.2"/><path d="M95 94h10" stroke="${INK}" stroke-width="2.2"/>` +
  eye(80, 95, 5.2) + eye(120, 95, 5.2) + P('94,110 106,110 100,122', '#f6b73c') +
  P('82,192 88,182 94,192', '#f6b73c') + P('106,192 112,182 118,192', '#f6b73c');

const turtle: Draw = (a, b, c) =>
  P('150,132 186,112 190,136 154,146', c) + P('42,140 160,140 154,150 48,150', b) +
  P('42,140 68,84 100,140', a) + P('68,84 132,84 100,140', c) + P('132,84 160,140 100,140', b) +
  P('58,150 76,150 64,180', b) + P('124,150 142,150 140,180', b) + P('40,140 22,150 44,148', b) +
  eye(176, 120, 3) + `<path d="M178 131 q5 2 9 -1" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
  `<rect x="80" y="96" width="40" height="28" rx="2" fill="#fff" opacity=".9"/><path d="M86 104h28M86 110h22M86 116h16" stroke="${INK}" stroke-width="1.6"/>`;

const rabbit: Draw = (a, b, c) =>
  P('78,18 92,16 98,84 78,84', a) + P('82,28 90,26 93,78 83,78', '#ffd9e6') + P('112,12 128,20 114,84 100,84', b) +
  P('68,82 132,82 124,128 76,128', a) + P('100,82 132,82 124,128 100,128', c) +
  P('64,128 136,128 146,196 54,196', b) + P('82,140 118,140 112,190 88,190', '#fff') +
  eye(86, 104) + eye(114, 104) + P('96,114 104,114 100,119', '#b02457') + blush(78, 116) + blush(122, 116);

const frog: Draw = (a, b, c) =>
  P('40,194 56,160 72,194', b) + P('128,194 144,160 160,194', b) +
  P('52,192 100,112 100,192', a) + P('100,112 148,192 100,192', b) + P('80,192 100,142 120,192', '#fff8ee') +
  P('70,192 86,160 94,192', b) + P('106,192 114,160 130,192', b) +
  P('60,124 100,92 100,144', c) + P('100,92 140,124 100,144', a) +
  `<circle cx="76" cy="96" r="15" fill="${c}"/><circle cx="124" cy="96" r="15" fill="${a}"/>` + eye(76, 95, 5) + eye(124, 95, 5) +
  `<path d="M84 124 q16 10 32 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + blush(72, 122) + blush(128, 122);

const whale: Draw = (a, b, c) =>
  P('152,124 194,88 180,128 196,160', b) +
  P('24,128 76,82 152,92 168,132 112,166 36,156', a) + P('76,82 152,92 168,132 100,118', c) + P('36,148 112,166 160,136 96,140', '#fff') +
  P('98,138 120,120 126,142', b) + eye(66, 118) + blush(56, 130) +
  `<path d="M70 70 q-4 -14 6 -22 M70 70 q8 -10 18 -8" stroke="${b}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

export type FoldId = 'orri' | 'tally' | 'ember' | 'clause' | 'shell' | 'sprout' | 'atlas' | 'hop';

export interface Fold {
  id: FoldId;
  name: string;
  kind: string;
  /** The published Domain this Fold belongs to (src/content/domains/<domainSlug>.md). */
  domain: string;
  domainSlug: string;
  /** a = main face, b = shadow face, c = light face, ink = readable text tint, tint = soft background */
  a: string;
  b: string;
  c: string;
  ink: string;
  draw: Draw;
}

export const FOLDS: Fold[] = [
  { id: 'orri', name: 'Orri', kind: 'paper plane', domain: 'AI Consulting', domainSlug: 'ai-consulting', a: '#f6b73c', b: '#e3951a', c: '#ffd77a', ink: '#ba2d21', draw: plane },
  { id: 'tally', name: 'Tally', kind: 'crane', domain: 'Accounting Advisory', domainSlug: 'accounting-advisory', a: '#2a9aa0', b: '#1d6f74', c: '#9fd6d6', ink: '#0c7480', draw: crane },
  { id: 'ember', name: 'Ember', kind: 'fox', domain: 'Content Strategy', domainSlug: 'content-strategy', a: '#f2783c', b: '#cf5420', c: '#ffa56e', ink: '#b9471a', draw: fox },
  { id: 'clause', name: 'Clause', kind: 'owl', domain: 'Contract Review', domainSlug: 'contract-review', a: '#7c5bd6', b: '#5a3fb0', c: '#d6c9fb', ink: '#6b32d6', draw: owl },
  { id: 'shell', name: 'Shell', kind: 'turtle', domain: 'Cybersecurity Advisory', domainSlug: 'cybersecurity-advisory', a: '#3d8a4f', b: '#2b6a3b', c: '#9fd3a8', ink: '#157a3c', draw: turtle },
  { id: 'sprout', name: 'Sprout', kind: 'rabbit', domain: 'Executive Coaching', domainSlug: 'executive-coaching', a: '#f08bb0', b: '#d65f8b', c: '#ffc2d8', ink: '#b02457', draw: rabbit },
  { id: 'atlas', name: 'Atlas', kind: 'whale', domain: 'Research Synthesis', domainSlug: 'research-synthesis', a: '#4f74c9', b: '#3456a3', c: '#a9c0f2', ink: '#1257c4', draw: whale },
  { id: 'hop', name: 'Hop', kind: 'frog', domain: 'Learning Design', domainSlug: 'learning-design', a: '#d0a43a', b: '#a8801c', c: '#ecd38a', ink: '#8a6410', draw: frog },
];

export const foldById = Object.fromEntries(FOLDS.map((f) => [f.id, f])) as Record<FoldId, Fold>;

/** The Fold's body only, for placing inside another SVG (the scene). */
export const foldShapes = (f: Fold) => f.draw(f.a, f.b, f.c);

/** A standalone Fold SVG. Decorative by default; pass a label to make it an image. */
export function foldSvg(f: Fold, opts: { label?: string; className?: string; shadow?: boolean } = {}) {
  const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  return `<svg viewBox="0 0 200 214" ${a11y}${cls}>${opts.shadow === false ? '' : SHADOW}${foldShapes(f)}</svg>`;
}
