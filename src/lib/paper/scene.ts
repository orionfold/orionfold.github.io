// The paper scene above the home statement (operator 2026-10-30): a world in
// levels, sky, mountains, city, earth and water, with each Fold helping where
// it belongs. Orri flies the sky with Tally, Clause keeps watch from the ridge,
// Ember works the city, Sprout and Shell tend the fields, Atlas swims and Hop
// waits on a lily pad. The sky carries the Orionfold star, folded in the same
// polygon style as the Folds, beside the Flow wordmark. Drawn once at build
// time; decorative art, so its colors live here with the Fold drawings.
import { foldById, foldShapes, type FoldId } from './folds';

const W = 760;
const H = 460;
const poly = (p: string, fill: string) => `<polygon points="${p}" fill="${fill}"/>`;
const pts = (xy: [number, number][]) => xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** A band of faceted ridges: each span gets a light and a shaded face. */
function ridge(peaks: [number, number][], base: number, light: string, shade: string): string {
  let s = '';
  for (let i = 0; i < peaks.length - 1; i++) {
    const [x1, y1] = peaks[i];
    const [x2, y2] = peaks[i + 1];
    s += poly(pts([[x1, y1], [x2, y2], [x2, base], [x1, base]]), i % 2 ? shade : light);
  }
  return s;
}

function house(x: number, y: number, w: number, roofL: string, roofD: string, wall: string): string {
  return poly(pts([[x, y], [x + w, y], [x + w, y + w * 0.8], [x, y + w * 0.8]]), wall)
    + poly(pts([[x - 4, y], [x + w / 2, y - w * 0.6], [x + w / 2, y]]), roofL)
    + poly(pts([[x + w / 2, y - w * 0.6], [x + w + 4, y], [x + w / 2, y]]), roofD)
    + `<rect x="${x + w * 0.38}" y="${y + w * 0.4}" width="${w * 0.24}" height="${w * 0.4}" fill="#171c1a" opacity=".75"/>`;
}

function tower(x: number, y: number, w: number, h: number): string {
  return poly(pts([[x, y], [x + w / 2, y], [x + w / 2, y + h], [x, y + h]]), '#e9e2d3')
    + poly(pts([[x + w / 2, y], [x + w, y], [x + w, y + h], [x + w / 2, y + h]]), '#d3c9b4')
    + poly(pts([[x - 3, y], [x + w / 2, y - w * 0.9], [x + w / 2, y]]), '#247b80')
    + poly(pts([[x + w / 2, y - w * 0.9], [x + w + 3, y], [x + w / 2, y]]), '#1d6062')
    + [0, 1, 2].map((k) => `<rect x="${x + w * 0.32}" y="${y + 8 + k * 16}" width="${w * 0.36}" height="8" fill="#f6b73c" opacity=".85"/>`).join('');
}

/** The Orionfold mark as a folded paper star: a light and a shaded facet per arm, on a teal disc. */
function star(cx: number, cy: number, r: number): string {
  const at = (k: number, rr: number): [number, number] => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  let s = `<circle cx="${cx + 2}" cy="${cy + 3}" r="${r}" fill="#123f43" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a9aa0"/>`;
  for (let k = 0; k < 10; k += 2) {
    const tip = at(k, r * 0.8);
    s += poly(pts([[cx, cy], at(k - 1, r * 0.34), tip]), '#dfe7e4');
    s += poly(pts([[cx, cy], tip, at(k + 1, r * 0.34)]), '#ffffff');
  }
  return s;
}

/** A Fold (200 × 214 art) placed by its top-left corner at a scale, optionally facing left. */
const fold = (id: FoldId, x: number, y: number, s: number, flip = false) =>
  `<g transform="translate(${flip ? x + 200 * s : x},${y}) scale(${flip ? -s : s},${s})">${foldShapes(foldById[id])}</g>`;

const ORION: [number, number][] = [[110, 62], [162, 50], [128, 104], [144, 108], [160, 112], [110, 160], [170, 168]];
const LINES: [number, number][] = [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]];

export function paperScene(): string {
  const stars = Array.from({ length: 46 }, (_, i) => `<circle cx="${(i * 97) % W}" cy="${((i * 53) % 170) + 8}" r="${i % 3 ? 0.9 : 1.4}" fill="#fff" opacity=".7"/>`).join('');
  const trail = Array.from({ length: 7 }, (_, i) => `<circle cx="${262 - i * 13}" cy="${136 + i * 5}" r="1.6" fill="#f6e7bf" opacity="${(0.75 - i * 0.09).toFixed(2)}"/>`).join('');
  const waves = Array.from({ length: 9 }, (_, i) => {
    const x = i * 95 - 20;
    return poly(pts([[x, 414], [x + 48, 402], [x + 95, 414]]), i % 2 ? '#3f7fae' : '#4f93c0');
  }).join('');
  const furrows = [0, 1, 2, 3].map((k) => `<line x1="${200 + k * 44}" y1="${352 + k * 4}" x2="${300 + k * 44}" y2="${348 + k * 4}" stroke="#b98c45" stroke-width="1.2" opacity=".5"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="A paper world in levels under the Orion constellation: the Folds at work in the sky, on the mountains, in the city, in the fields and in the water, beside the Orionfold star and the Flow wordmark">
<defs><linearGradient id="pp-scene-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a40"/><stop offset=".6" stop-color="#5f739c"/><stop offset="1" stop-color="#e9cfa9"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#pp-scene-sky)"/>${stars}
${LINES.map(([a, b]) => `<line x1="${ORION[a][0]}" y1="${ORION[a][1]}" x2="${ORION[b][0]}" y2="${ORION[b][1]}" stroke="#f6e7bf" stroke-width="1" opacity=".55"/>`).join('')}
${ORION.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i > 1 && i < 5 ? 3 : 4}" fill="#f6e7bf"/>`).join('')}
${star(488, 92, 34)}
<text x="536" y="111" font-family="Fraunces, Georgia, serif" font-weight="400" font-size="56" letter-spacing="-1" fill="#fbfaf6">Flow</text>
${trail}${fold('orri', 262, 96, 0.34)}${fold('tally', 640, 146, 0.3, true)}
${ridge([[0, 236], [70, 190], [150, 228], [240, 172], [330, 222], [420, 182], [500, 226], [600, 176], [690, 220], [760, 196]], 300, '#7e8fb3', '#5f6f94')}
${poly(pts([[228, 183], [240, 172], [252, 185], [242, 189]]), '#f4f1e8')}${poly(pts([[588, 187], [600, 176], [612, 189], [601, 193]]), '#f4f1e8')}
${fold('clause', 395, 134, 0.26)}
${ridge([[0, 286], [110, 262], [220, 284], [330, 258], [450, 286], [560, 262], [660, 282], [760, 266]], 330, '#c7a7c9', '#a886ab')}
${house(150, 296, 32, '#f24b39', '#ba2d21', '#fbfaf6')}${house(196, 304, 26, '#247b80', '#1d6062', '#fff8ee')}${tower(238, 268, 26, 56)}
${house(470, 298, 34, '#7c5bd6', '#5a3fb0', '#fbfaf6')}${house(522, 306, 26, '#f6b73c', '#e3951a', '#fff8ee')}
${fold('ember', 300, 282, 0.24)}
${ridge([[0, 334], [190, 324], [380, 336], [570, 322], [760, 334]], 406, '#e8c27f', '#d8aa62')}${furrows}
${fold('sprout', 96, 318, 0.26)}${fold('shell', 604, 336, 0.27)}
<rect y="404" width="${W}" height="${H - 404}" fill="#2f6f9e"/>${waves}
${poly(pts([[0, 446], [760, 438], [760, 460], [0, 460]]), '#285f88')}
${fold('atlas', 250, 404, 0.3)}
<ellipse cx="560" cy="434" rx="34" ry="8" fill="#5e9e5a"/>${fold('hop', 538, 396, 0.22)}
</svg>`;
}
