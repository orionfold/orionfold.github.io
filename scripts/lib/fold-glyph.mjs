// One-colour Fold glyphs for the Flow app's toolbar (template images: the
// system tints them for light, dark and selection). Product lane ask
// 2026-10-31 21:01. A glyph is generated from the same drawing as the coloured
// Fold, never hand-drawn, so the two cannot drift. Exact vector geometry
// (clipper-lib: union, difference, offset), no raster tracing:
//
//   1. The mass is the union of every filled shape in the drawing.
//   2. Holes: pale patches (bellies, face masks, the turtle's page) and the
//      eyes, enlarged so they survive at 16 pt. An eye that sits inside a
//      hole (the owl's) stays solid as a pupil. Blush, ground shadow and thin
//      strokes (mouths, trails, page lines) are dropped.
//   3. Creases (optional): each coloured facet's edges cut as a thin band, kept
//      inside an inset of the mass so the outline is never shaved and the
//      shape never splits at its rim. It still reads as folded paper.
//
// Output: viewBox 0 0 100 100, the shape centred with optical padding, one
// <path> in one colour, no strokes, gradients or shadow. Outer loops and holes
// wind in opposite directions, so nonzero and even-odd fill agree.
import ClipperLib from 'clipper-lib';

const { Clipper, ClipperOffset, ClipType, PolyType, PolyFillType, JoinType, EndType } = ClipperLib;
const INK = '#171c1a';
const PALE = new Set(['#fff', '#ffffff', '#fff8ee', '#ffd9e6']);
const S = 1000; // clipper works in integers: art units x 1000

// Same winding for every drawn shape, so nonzero union never cancels an overlap.
// Only raw inputs are oriented; clipper's own output keeps its holes reversed.
const orient = (p) => (Clipper.Orientation(p) ? p : [...p].reverse());
const attrs = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
const poly = (str) => orient(str.trim().split(/\s+/).map((p) => { const [x, y] = p.split(',').map(Number); return { X: Math.round(x * S), Y: Math.round(y * S) }; }));
const circle = (cx, cy, r, n = 48) => orient(Array.from({ length: n }, (_, i) => ({ X: Math.round((cx + r * Math.cos((2 * Math.PI * i) / n)) * S), Y: Math.round((cy + r * Math.sin((2 * Math.PI * i) / n)) * S) })));
const rect = (x, y, w, h) => orient([{ X: x * S, Y: y * S }, { X: (x + w) * S, Y: y * S }, { X: (x + w) * S, Y: (y + h) * S }, { X: x * S, Y: (y + h) * S }]);

const NZ = PolyFillType.pftNonZero;
const op = (type, subj, clip = []) => {
  const c = new Clipper();
  c.AddPaths(subj, PolyType.ptSubject, true);
  if (clip.length) c.AddPaths(clip, PolyType.ptClip, true);
  const out = [];
  c.Execute(type, out, NZ, NZ);
  return out;
};
const union = (a) => op(ClipType.ctUnion, a);
const minus = (a, b) => op(ClipType.ctDifference, a, b);
const meet = (a, b) => op(ClipType.ctIntersection, a, b);
const inflate = (paths, by, end = EndType.etClosedPolygon, join = JoinType.jtRound) => {
  const o = new ClipperOffset(2, 0.25 * S);
  o.AddPaths(paths, join, end);
  const out = [];
  o.Execute(out, by * S);
  return out;
};
const inside = (x, y, holes) => holes.some((h) => Clipper.PointInPolygon({ X: x * S, Y: y * S }, h) !== 0);

/** Read the drawing's shapes in paint order. */
function read(inner, eyeMin) {
  const solid = [], holes = [], eyes = [], pupils = [], facets = [];
  for (const [, tag, rest] of inner.matchAll(/<(polygon|circle|ellipse|path|rect)\b([^>]*)\/?>/g)) {
    const a = attrs(rest);
    const fill = (a.fill || '').toLowerCase();
    if (tag === 'polygon') {
      const p = poly(a.points);
      solid.push(p);
      // A pale patch is a hole unless it is a sliver (the fox's tail tip),
      // which would only be a notch of noise at 16 pt.
      if (PALE.has(fill)) { if (Math.abs(Clipper.Area(p)) >= 100 * S * S) holes.push(p); }
      else facets.push(p);
    } else if (tag === 'circle') {
      const cx = +a.cx, cy = +a.cy, r = +a.r;
      if (fill === INK) {
        if (inside(cx, cy, holes)) pupils.push(circle(cx, cy, r));
        else eyes.push({ cx, cy, r: Math.max(r, eyeMin) });
      } else if (PALE.has(fill)) {
        if (r < 3) continue; // the glint in an eye
        solid.push(circle(cx, cy, r));
        holes.push(circle(cx, cy, r));
      } else {
        solid.push(circle(cx, cy, r));
        facets.push(circle(cx, cy, r));
      }
    } else if (tag === 'rect' && PALE.has(fill)) {
      holes.push(rect(+a.x, +a.y, +a.width, +a.height));
    }
    // ellipse (blush, ground shadow) and stroked paths (mouths, trails, page lines) are dropped.
  }
  return { solid, holes, eyes, pupils, facets };
}

/**
 * @param inner  the Fold's drawing (SVG fragment in the 200 x 214 art box)
 * @param o.creases  cut facet edges as creases (default false: at 16 pt they
 *                   read as noise; the plain mass with eye holes reads best)
 * @param o.crease   crease width in art units
 * @param o.rim      how far creases stop short of the outline, in art units
 * @param o.eyeMin   eye radius to aim for, in art units
 * @param o.eyeFloor an eye that cannot fit above this radius is dropped
 * @param o.pad      padding on each side, as a share of the box
 */
export function foldGlyph(inner, { creases = false, crease = 6, rim = 9, eyeMin = 6, eyeFloor = 3.5, pad = 0.08, label = '' } = {}) {
  const r = read(inner, eyeMin);
  // The art hides hairline seams between facets with a 0.6 stroke; grow each
  // shape by half that before the union so the seams close here too.
  const mass = union(inflate(r.solid, 0.35, EndType.etClosedPolygon, JoinType.jtMiter));
  // Fit the eyes: all share one radius, grown toward eyeMin only while each
  // stays inside the body with a solid rim and the pair stays apart. If that
  // radius is below eyeFloor the eyes are dropped together, never one of a
  // pair (the butterfly's sit on a thin body and would merge into a bar).
  const room = inflate(mass, -1.6);
  const fitsRoom = (e, rr) => {
    const c = circle(e.cx, e.cy, rr);
    return meet([c], room).reduce((t, p) => t + Math.abs(Clipper.Area(p)), 0) >= Math.abs(Clipper.Area(c)) * 0.995;
  };
  let rr = Math.max(eyeMin, ...r.eyes.map((e) => e.r));
  for (let i = 0; i < r.eyes.length; i++) for (let j = i + 1; j < r.eyes.length; j++) {
    rr = Math.min(rr, (Math.hypot(r.eyes[i].cx - r.eyes[j].cx, r.eyes[i].cy - r.eyes[j].cy) - 2.4) / 2);
  }
  while (rr > eyeFloor && !r.eyes.every((e) => fitsRoom(e, rr))) rr -= 0.25;
  const fitted = rr > eyeFloor ? r.eyes.map((e) => ({ ...e, r: rr })) : [];
  const eyeHoles = fitted.map((e) => circle(e.cx, e.cy, e.r));
  let shape = union([...minus(mass, [...r.holes, ...eyeHoles]), ...r.pupils]);
  if (creases && r.facets.length) {
    // every facet edge as an open segment, thickened into a band
    const edges = r.facets.flatMap((p) => p.map((pt, i) => [pt, p[(i + 1) % p.length]]));
    const bands = inflate(edges, crease / 2, EndType.etOpenButt, JoinType.jtMiter);
    const core = inflate(mass, -rim);
    // keep a solid ring round each eye so a crease never runs into it
    const guard = inflate(eyeHoles, crease * 0.6);
    shape = minus(shape, minus(meet(bands, core), guard));
  }
  shape = Clipper.CleanPolygons(shape, 0.05 * S).filter((p) => p.length >= 3 && Math.abs(Clipper.Area(p)) > (1.5 * S) ** 2);
  const b = Clipper.GetBounds(shape);
  const w = b.right - b.left, h = b.bottom - b.top, side = Math.max(w, h);
  const k = (100 * (1 - 2 * pad)) / side;
  const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;
  const f = (v) => +v.toFixed(2);
  const d = shape.map((p) => `M${p.map(({ X, Y }) => `${f((X - cx) * k + 50)} ${f((Y - cy) * k + 50)}`).join('L')}Z`).join('');
  const a11y = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${a11y}><path fill="#000" fill-rule="evenodd" d="${d}"/></svg>\n`;
  return { svg, d, parts: shape.length };
}
