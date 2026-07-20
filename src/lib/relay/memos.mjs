// src/lib/relay/memos.mjs
// Shared logic for the /relay/memos/ surface. Memo prose ships verbatim with no
// order field, so Website chrome imports the canonical source handoff order.
//
// Also inlines each memo's signature.svg hero: the SVGs are token-only
// (var(--svg-*) / var(--color-primary), zero hex), so they must be inlined (not
// <img>) for their CSS vars to resolve against the site theme. Read raw at
// build time via import.meta.glob.

export { MEMO_SERIES, groupedMemos, memoNeighbors, orderedMemos } from './memo-series.mjs';

// Raw signature SVGs, keyed by memo folder (the collection id). eager + ?raw so
// each hero is a plain string we can inline. Path is relative to THIS file
// (src/lib/relay -> src/content/memos/<slug>/signature.svg).
const SIGNATURES = import.meta.glob('../../content/memos/*/signature.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The inline hero SVG string for a memo entry, or null if it has none. */
export function memoSignatureHtml(memo) {
  if (!memo?.data?.signature) return null;
  const key = `../../content/memos/${memo.id}/signature.svg`;
  const svg = SIGNATURES[key];
  return typeof svg === 'string' ? svg : null;
}
