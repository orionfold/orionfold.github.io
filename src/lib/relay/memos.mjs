// src/lib/relay/memos.mjs
// Shared logic for the /relay/memos/ surface (Rail B, _RELAY #17). The Relay
// Packs memos ship verbatim with NO order field in their frontmatter — the
// series reading order (pillar first, then the four domain memos) is defined by
// the _RELAY #17 pickup table, not the content. So the reading order is
// website-owned chrome (like the docs index TOUR map): encoded here by slug,
// pillar first. A memo not in the map sorts last, alphabetically, so a future
// 6th memo still renders (just append its slug to keep the intended order).
//
// Also inlines each memo's signature.svg hero: the SVGs are token-only
// (var(--svg-*) / var(--color-primary), zero hex), so they must be inlined (not
// <img>) for their CSS vars to resolve against the site theme. Read raw at
// build time via import.meta.glob.

// Canonical series order (pillar -> domain arc), _RELAY #17.
const SERIES_ORDER = [
  'why-relay-packs',      // 1 · pillar: the structural argument
  'web-designer-pack',    // 2 · one owned artifact
  'agency-bundle',        // 3 · persona + vertical flatten
  'marketing-line',       // 4 · cross-domain join
  'industry-verticals',   // 5 · the domain from the inside
];

// Raw signature SVGs, keyed by memo folder (the collection id). eager + ?raw so
// each hero is a plain string we can inline. Path is relative to THIS file
// (src/lib/relay -> src/content/memos/<slug>/signature.svg).
const SIGNATURES = import.meta.glob('../../content/memos/*/signature.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Sort a memos collection into the canonical series reading order. */
export function orderedMemos(collection) {
  const rank = (id) => {
    const i = SERIES_ORDER.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...collection].sort((a, b) => {
    const d = rank(a.id) - rank(b.id);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
}

/** The inline hero SVG string for a memo entry, or null if it has none. */
export function memoSignatureHtml(memo) {
  if (!memo?.data?.signature) return null;
  const key = `../../content/memos/${memo.id}/signature.svg`;
  const svg = SIGNATURES[key];
  return typeof svg === 'string' ? svg : null;
}
