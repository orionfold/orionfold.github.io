// A Fold that moves (Paper 0.4.0, operator 2026-11-03 "Rive animations for each
// Fold avatar"): the web build of the Fold state machine in folds/state-machine.json.
// Each Fold's drawing is split into a body layer and a face layer (eyes with
// lids and pupils, a mouth with five visemes, blush) so CSS and a small driver
// (fold-live.js) can run idle, listening, thinking, speaking and the right and
// wrong triggers. The same anchors and paths go to the package, so the Rive
// editor and the Mac app work from one geometry.
import { FOLDS, foldShapes, INK, type Fold, type FoldId } from './folds.ts';

type Eye = [number, number, number];
export interface Face {
  /** eye centres and radius, as the drawing has them */
  eyes: Eye[];
  /** which Fold colour the eyelid takes */
  lid: 'a' | 'b' | 'c';
  /** a bigger lid for Folds whose eye sits on a white or coloured disc */
  lidR?: number;
  /** mouth anchor and half-width */
  mouth: [number, number, number];
  blush: [number, number][];
}
export const FACE: Record<FoldId, Face> = {
  orri: { eyes: [[118, 92, 3.4], [138, 83, 3.4]], lid: 'a', mouth: [129, 103, 8], blush: [[108, 104], [148, 92]] },
  tally: { eyes: [[39, 71, 2.6]], lid: 'b', mouth: [31, 78, 4], blush: [] },
  ember: { eyes: [[82, 100, 3.4], [118, 100, 3.4]], lid: 'a', mouth: [100, 138, 8], blush: [[72, 112], [128, 112]] },
  clause: { eyes: [[80, 95, 5.2], [120, 95, 5.2]], lid: 'a', lidR: 15.5, mouth: [100, 127, 6], blush: [] },
  shell: { eyes: [[176, 120, 3]], lid: 'c', mouth: [182, 131, 5], blush: [] },
  sprout: { eyes: [[86, 104, 3.4], [114, 104, 3.4]], lid: 'a', mouth: [100, 123, 6], blush: [[78, 116], [122, 116]] },
  atlas: { eyes: [[66, 118, 3.4]], lid: 'a', mouth: [64, 129, 6], blush: [[56, 130]] },
  hop: { eyes: [[76, 95, 5], [124, 95, 5]], lid: 'a', lidR: 15, mouth: [100, 124, 14], blush: [[72, 122], [128, 122]] },
};

const f1 = (v: number) => Number(v.toFixed(1));
/** The five visemes (closed, small round, open wide, wide thin, tall narrow) around a mouth anchor. */
export const visemes = ([x, y, w]: [number, number, number]) => [
  `M${f1(x - w)} ${y} Q${x} ${f1(y + w * .6)} ${f1(x + w)} ${y}`,
  `M${f1(x - w * .4)} ${f1(y - w * .25)} Q${x} ${f1(y - w * .5)} ${f1(x + w * .4)} ${f1(y - w * .25)} Q${f1(x + w * .55)} ${f1(y + w * .3)} ${x} ${f1(y + w * .45)} Q${f1(x - w * .55)} ${f1(y + w * .3)} ${f1(x - w * .4)} ${f1(y - w * .25)} Z`,
  `M${f1(x - w)} ${f1(y - w * .2)} Q${x} ${f1(y + w * 1.6)} ${f1(x + w)} ${f1(y - w * .2)} Z`,
  `M${f1(x - w * 1.2)} ${y} Q${x} ${f1(y + w * .5)} ${f1(x + w * 1.2)} ${y} Q${x} ${f1(y + w * .9)} ${f1(x - w * 1.2)} ${y} Z`,
  `M${f1(x - w * .25)} ${f1(y - w * .5)} Q${f1(x + w * .25)} ${f1(y - w * .5)} ${f1(x + w * .25)} ${f1(y + w * .4)} Q${x} ${f1(y + w * .9)} ${f1(x - w * .25)} ${f1(y + w * .4)} Z`,
];
/** The mouth in the three held poses: a smile on right, flat on wrong, a small line while thinking. */
export const mouthPoses = ([x, y, w]: [number, number, number]) => ({
  right: `M${f1(x - w * 1.2)} ${f1(y - w * .1)} Q${x} ${f1(y + w * 1.3)} ${f1(x + w * 1.2)} ${f1(y - w * .1)}`,
  wrong: `M${f1(x - w)} ${f1(y + w * .2)} L${f1(x + w)} ${f1(y + w * .2)}`,
  thinking: `M${f1(x - w * .6)} ${f1(y + w * .1)} Q${x} ${f1(y - w * .2)} ${f1(x + w * .6)} ${f1(y + w * .1)}`,
});

/** The drawing without its baked-in eyes, mouth and blush (the face layer redraws them so they can move). */
export function bodyShapes(f: Fold): string {
  let s = foldShapes(f);
  const face = FACE[f.id];
  for (const [x, y] of face.eyes) s = s.replace(new RegExp(`<circle cx="${x}" cy="${y}" r="[^"]*" fill="${INK}"/><circle [^>]*fill="#fff"/>`), '');
  for (const [x, y] of face.blush) s = s.replace(new RegExp(`<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6"[^>]*/>`), '');
  // drawn mouths that the mouth layer replaces
  s = s.replace(/<path d="M120 104 q10 4 18 -6"[^>]*\/>/, '').replace(/<path d="M178 131 q5 2 9 -1"[^>]*\/>/, '').replace(/<path d="M84 124 q16 10 32 0"[^>]*\/>/, '');
  return s;
}

/** A Fold with a face layer, ready for fold-live.js. Decorative unless given a label. */
export function liveFoldSvg(f: Fold, opts: { label?: string } = {}): string {
  const face = FACE[f.id];
  const lid = f[face.lid];
  const vis = visemes(face.mouth), poses = mouthPoses(face.mouth);
  const eyes = face.eyes.map(([x, y, r]) => {
    const lr = face.lidR ?? r + 1;
    return `<g class="pp-live-eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><g class="pp-live-pupil"><circle cx="${x}" cy="${y}" r="${f1(r * .62)}" fill="${INK}"/><circle cx="${f1(x + r * .3)}" cy="${f1(y - r * .3)}" r="${f1(r * .24)}" fill="#fff"/></g><ellipse class="pp-live-lid" cx="${x}" cy="${y}" rx="${lr}" ry="${f1(lr * .95)}" fill="${lid}"/></g>`;
  }).join('');
  const blush = face.blush.map(([x, y]) => `<ellipse class="pp-live-blush" cx="${x}" cy="${y}" rx="5" ry="2.6" fill="#f24b39"/>`).join('');
  const aria = opts.label ? ` role="img" aria-label="${opts.label}"` : ' aria-hidden="true"';
  return `<svg viewBox="0 0 200 214" class="pp-live-svg"${aria} data-fold="${f.id}" data-visemes='${JSON.stringify(vis)}' data-mouth-right="${poses.right}" data-mouth-wrong="${poses.wrong}" data-mouth-thinking="${poses.thinking}"><g class="pp-live-body">${bodyShapes(f)}</g><g class="pp-live-face">${eyes}<path class="pp-live-mouth" d="${vis[0]}" fill="none" stroke="${INK}" stroke-width="${f1(Math.max(1.4, face.mouth[2] * .22))}" stroke-linecap="round"/>${blush}</g></svg>`;
}

/** Every Fold's face geometry for the package and the Rive editor. */
export const FOLD_FACES = Object.fromEntries(FOLDS.map((f) => [f.id, { ...FACE[f.id], lidColor: f[FACE[f.id].lid], visemes: visemes(FACE[f.id].mouth), poses: mouthPoses(FACE[f.id].mouth) }]));
