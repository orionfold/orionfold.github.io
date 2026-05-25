// OG constellation background (I-series). Renders the site's signature Orion
// motif as a standalone 1200x630 SVG string, ready for resvg to rasterize into
// the OG card background. The PRNG + node/edge logic is the SAME as
// src/components/ui/ConstellationCover.astro, so a given seed draws the SAME sky
// here as on the on-site card — the share image and the page cover match.
//
// Two differences from the component: (1) coordinates are in full 1200x630 space
// (not a 400x225 viewBox) for a crisp background, and (2) the OKLCH gradient is
// pre-converted to hex, because resvg's CSS color support does not include oklch.

const W = 1200;
const H = 630;
const COUNT = 20;

// ── deterministic PRNG (string hash -> mulberry32), copied from ConstellationCover ──
function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = { x: number; y: number; r: number; bright: boolean };

/** A self-contained dark navy/indigo field with a seeded star constellation. */
export function constellationSvg(seed: string): string {
  const rnd = mulberry32(hash(seed));
  const uid = 'og' + hash(seed).toString(36);

  const nodes: Node[] = Array.from({ length: COUNT }, () => ({
    x: Math.round(rnd() * W),
    y: Math.round(rnd() * H),
    r: 1.6 + rnd() * 3.4,
    bright: rnd() > 0.74,
  }));

  // connect each node to its 1-2 nearest neighbours (skip far pairs)
  const edges: [Node, Node][] = [];
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ b, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2, j }))
      .filter((o) => o.j !== i)
      .sort((u, v) => u.d - v.d);
    const links = 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < links && k < near.length; k++) {
      if (near[k].d < 105000) edges.push([a, near[k].b]);
    }
  });

  // seeded glow position (mirrors the component's glowX), kept toward the top
  const glowX = (18 + Math.round(rnd() * 60)) / 100;

  const lines = edges
    .map(
      ([a, b]) =>
        `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ffffff" stroke-width="1" stroke-opacity="0.14"/>`,
    )
    .join('');

  const stars = nodes
    .map((n) =>
      n.bright
        ? `<circle cx="${n.x}" cy="${n.y}" r="${(n.r * 4).toFixed(1)}" fill="url(#${uid}-g)" opacity="0.6"/><circle cx="${n.x}" cy="${n.y}" r="${n.r.toFixed(1)}" fill="#ffffff"/>`
        : `<circle cx="${n.x}" cy="${n.y}" r="${n.r.toFixed(1)}" fill="#ffffff" opacity="0.5"/>`,
    )
    .join('');

  // Pre-converted hex stops approximating ConstellationCover's OKLCH navy/indigo.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="${uid}-bg" cx="${glowX}" cy="-0.1" r="1.25">
      <stop offset="0%" stop-color="#2f3c72"/>
      <stop offset="52%" stop-color="#1a2340"/>
      <stop offset="100%" stop-color="#0e1322"/>
    </radialGradient>
    <radialGradient id="${uid}-g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${uid}-bg)"/>
  ${lines}
  ${stars}
</svg>`;
}
