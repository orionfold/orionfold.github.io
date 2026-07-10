// src/lib/relay/rehype-memo-interstitial.mjs
// Rehype plugin: inserts ONE mount-point div for the mid-essay Relay CTA into a
// memo body, WITHOUT any marker in the source markdown. The Relay Packs memos
// are copied verbatim (one-direction publish contract, _RELAY #17) — Relay ships
// pure prose and never CTA HTML, so unlike remark-proof-cta (which reads a
// ::proof-cta directive the author placed) this plugin computes the midpoint
// itself. The website's memo route mounts the real <RelayMemoInterstitial>
// component into this slot, keeping conversion chrome on the website side.
//
// Placement rule: the memos share a stable 8-section spine (## 1..## 8). The
// natural mid-essay break is right BEFORE the "Verification" section (## 5) —
// after the argument + the narrative journey, before the proof-and-tradeoffs
// tail. We find the Nth top-level <h2> and insert the slot just before it, so a
// reader hits the interstitial once, mid-read, at a section boundary (never
// mid-paragraph). Falls back to the body midpoint if the spine ever changes.
//
// Guarded + idempotent (house pattern): inserts at most one slot, only on trees
// that actually carry the memo marker class the route stamps via a wrapper —
// but since rehype runs globally, we gate on a page-set flag passed through the
// vfile is overkill; instead we scope by only ever inserting when the tree has
// the memo shape (>= INTERSTITIAL_BEFORE_H2 h2 headings numbered like a memo).
// The route additionally only renders the mounted component on memo pages, so a
// stray slot on a non-memo page (there won't be one, given the h2-count gate)
// would render as an empty div and mount nothing.
import { visit } from 'unist-util-visit';

// Insert the slot immediately before the 5th top-level <h2> ("Verification"),
// i.e. after the four-part argument+journey. 1-based section index.
const INTERSTITIAL_BEFORE_SECTION = 5;

export default function rehypeMemoInterstitial() {
  return (tree) => {
    // Collect the indices of top-level h2 children of <body>/root so we insert
    // at a real section boundary, not inside a nested element.
    const root = tree;
    if (!Array.isArray(root.children)) return;

    const h2Positions = [];
    root.children.forEach((child, i) => {
      if (child.type === 'element' && child.tagName === 'h2') h2Positions.push(i);
    });

    // Only act on bodies that look like a memo (the 8-section spine). Guards
    // against the global rehype chain touching any other markdown page.
    if (h2Positions.length < 6) return;

    // Belt-and-suspenders: never insert twice.
    let already = false;
    visit(tree, 'element', (node) => {
      if (node.properties && node.properties['dataMemoInterstitialSlot'] != null) already = true;
    });
    if (already) return;

    const targetH2 = h2Positions[INTERSTITIAL_BEFORE_SECTION - 1];
    // Fallback to the body midpoint if the spine is shorter than expected.
    const insertBefore =
      targetH2 != null ? targetH2 : Math.floor(root.children.length / 2);

    const slot = {
      type: 'element',
      tagName: 'div',
      properties: { 'data-memo-interstitial-slot': '' },
      children: [],
    };
    root.children.splice(insertBefore, 0, slot);
  };
}
