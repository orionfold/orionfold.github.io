// The Orionfold mark as a folded paper star, in the same faceted polygon style
// as the Folds: a light and a shaded facet per arm, on a teal disc. Used by the
// home scene and by the Paper package the Flow app bundles (D8, 2026-10-30).
const pts = (xy: [number, number][]) => xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const poly = (p: string, fill: string) => `<polygon points="${p}" fill="${fill}"/>`;

/** The star's shapes, centred on (cx, cy) with radius r, for placing inside another SVG. */
export function foldedStar(cx: number, cy: number, r: number): string {
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

/** A standalone star SVG. Decorative unless given a label. */
export function foldedStarSvg(label?: string): string {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" ${a11y}>${foldedStar(39, 38, 34)}</svg>`;
}
