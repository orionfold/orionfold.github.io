// Personal Folds: the shapes a person folds from a blank sheet in the Flow
// app's first launch (decided between the website and product lanes under the
// operator's 2026-10-30 delegation). They sit outside the eight Flow Domain
// Folds, carry no name until the person gives one, and are drawn for 16 pt:
// one solid mass, no thin limbs or dotted trails, contrast carried by the body.
// Each line names a temperament, never a capability, so it stays true on Base
// and before any feature ships. The colorways reuse the cast's palettes,
// named by color; each shape has a default and the person can change it later.
import { P, eye, blush, INK, SHADOW, foldById, type Draw, type FoldId } from './folds.ts';

export interface Colorway { id: string; name: string; a: string; b: string; c: string; ink: string }
// Named by color, taken from the cast's own palettes so the two never drift.
const PALETTE_OF: [string, string, FoldId][] = [
  ['teal', 'Teal', 'tally'], ['gold', 'Gold', 'orri'], ['coral', 'Coral', 'ember'], ['violet', 'Violet', 'clause'],
  ['green', 'Green', 'shell'], ['pink', 'Pink', 'sprout'], ['blue', 'Blue', 'atlas'], ['ochre', 'Ochre', 'hop'],
];
export const COLORWAYS: Colorway[] = PALETTE_OF.map(([id, name, fold]) => {
  const f = foldById[fold];
  return { id, name, a: f.a, b: f.b, c: f.c, ink: f.ink };
});

const elephant: Draw = (a, b, c) =>
  P('44,96 120,80 150,112 146,176 52,176', a) + P('120,80 150,112 146,176 112,150', b) +
  P('52,176 72,176 72,196 52,196', b) + P('84,176 104,176 104,196 84,196', b) + P('120,166 140,170 140,196 120,196', b) +
  P('120,80 176,74 182,124 150,112', a) + P('140,82 170,80 168,116 146,112', c) +
  P('168,118 186,122 190,176 176,184 172,140', b) + P('176,184 190,176 196,190 180,194', a) +
  eye(160, 96) + blush(170, 108);

const boat: Draw = (a, b, c) =>
  P('100,40 100,128 54,128', c) + P('100,40 146,128 100,128', a) +
  P('22,128 178,128 150,176 50,176', a) + P('100,128 178,128 150,176 100,176', b) +
  P('40,176 160,176 150,184 50,184', b) +
  eye(84, 150) + eye(116, 150) + `<path d="M92 162 q8 6 16 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + blush(72, 160) + blush(128, 160);

const bear: Draw = (a, b, c) =>
  P('58,52 82,52 76,76', b) + P('118,52 142,52 124,76', b) +
  P('60,60 100,52 100,120 54,104', a) + P('100,52 140,60 146,104 100,120', b) + P('82,96 118,96 100,122', c) +
  P('48,118 100,112 100,196 42,196', a) + P('100,112 152,118 158,196 100,196', b) + P('74,138 126,138 116,190 84,190', c) +
  P('95,104 105,104 100,111', INK) + eye(82, 84) + eye(118, 84) + blush(70, 98) + blush(130, 98);

const butterfly: Draw = (a, b, c) =>
  P('100,96 26,40 38,118', a) + P('100,96 38,118 20,104', c) + P('100,106 40,128 56,180', b) + P('100,106 56,180 84,168', a) +
  P('100,96 174,40 162,118', b) + P('100,96 162,118 180,104', c) + P('100,106 160,128 144,180', a) + P('100,106 144,180 116,168', b) +
  P('92,82 108,82 110,170 90,170', INK) + eye(96, 92, 2.6) + eye(104, 92, 2.6);

const lotus: Draw = (a, b, c) =>
  P('100,44 76,126 124,126', a) + P('100,44 100,126 124,126', b) +
  P('46,72 74,140 100,128', c) + P('154,72 126,140 100,128', c) +
  P('20,118 70,152 100,140', b) + P('180,118 130,152 100,140', b) +
  P('36,152 164,152 140,176 60,176', a) + P('100,152 164,152 140,176 100,176', b) +
  eye(88, 104, 3) + eye(112, 104, 3) + blush(80, 114) + blush(120, 114);

const penguin: Draw = (a, b, c) =>
  P('100,30 140,64 150,170 100,194', b) + P('100,30 60,64 50,170 100,194', a) +
  P('100,82 130,96 134,168 100,186 66,168 70,96', '#fff8ee') +
  P('50,98 30,150 54,148', a) + P('150,98 170,150 146,148', b) +
  P('92,72 108,72 100,84', '#f6b73c') + P('76,190 96,184 92,198 70,198', '#f6b73c') + P('104,184 124,190 130,198 108,198', '#f6b73c') +
  eye(86, 62) + eye(114, 62) + blush(80, 76) + blush(120, 76);

const cat: Draw = (a, b, c) =>
  P('58,40 86,66 58,72', a) + P('142,40 114,66 142,72', b) +
  P('58,66 100,58 100,124 52,108', a) + P('100,58 142,66 148,108 100,124', b) + P('86,104 114,104 100,124', c) +
  P('56,124 100,118 100,196 50,196', a) + P('100,118 144,124 150,196 100,196', b) +
  P('146,170 184,128 192,138 156,190', a) + P('184,128 196,112 198,132 192,138', b) +
  P('95,108 105,108 100,114', INK) + eye(82, 88) + eye(118, 88) + blush(70, 102) + blush(130, 102);

const hummingbird: Draw = (a, b, c) =>
  P('40,96 132,72 150,112 64,146', a) + P('132,72 150,112 110,118', b) +
  P('64,90 100,30 120,84', c) + P('80,88 140,24 128,80', b) +
  P('40,96 64,146 18,176', b) +
  P('150,94 196,84 152,106', INK) + eye(134, 90) + blush(122, 102);

export interface PersonalFold { id: string; shape: string; line: string; defaultColorway: string; draw: Draw }
export const PERSONAL_FOLDS: PersonalFold[] = [
  { id: 'elephant', shape: 'elephant', line: 'Patient, and never in a hurry.', defaultColorway: 'blue', draw: elephant },
  { id: 'boat', shape: 'paper boat', line: 'Steady when the deadline comes.', defaultColorway: 'teal', draw: boat },
  { id: 'bear', shape: 'bear', line: 'Calm, and hard to rattle.', defaultColorway: 'ochre', draw: bear },
  { id: 'butterfly', shape: 'butterfly', line: 'Notices how things link up.', defaultColorway: 'violet', draw: butterfly },
  { id: 'lotus', shape: 'lotus', line: 'Keeps to one thing at a time.', defaultColorway: 'pink', draw: lotus },
  { id: 'penguin', shape: 'penguin', line: 'Dependable, in a quiet way.', defaultColorway: 'coral', draw: penguin },
  { id: 'cat', shape: 'cat', line: 'Quiet, and watches closely.', defaultColorway: 'gold', draw: cat },
  { id: 'hummingbird', shape: 'hummingbird', line: 'Quick, and full of energy.', defaultColorway: 'green', draw: hummingbird },
];

export const colorwayById = Object.fromEntries(COLORWAYS.map((c) => [c.id, c])) as Record<string, Colorway>;

/** A personal Fold as a standalone SVG in a colorway (its default unless given). */
export function personalFoldSvg(f: PersonalFold, opts: { colorway?: Colorway; shadow?: boolean; label?: string } = {}) {
  const cw = opts.colorway ?? colorwayById[f.defaultColorway];
  const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214" ${a11y}>${opts.shadow === false ? '' : SHADOW}${f.draw(cw.a, cw.b, cw.c)}</svg>`;
}
