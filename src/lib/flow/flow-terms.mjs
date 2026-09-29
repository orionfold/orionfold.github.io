// Flow vocabulary: the words people see on Flow's own screens (buttons, menu
// items, panels, settings). When site copy uses one inside a sentence, it is
// set apart as `<span class="flow-term">` so a reader can tell "press this in
// the app" from ordinary prose (operator 2026-09-29).
//
// Two ways a term gets marked:
//   1. PLAIN_TERMS match anywhere in running text. They are only the labels
//      that cannot be mistaken for ordinary words.
//   2. Any bold or italic run whose whole text is a term in PLAIN_TERMS or
//      MARKED_TERMS. Generic words ("Publish", "Keep", "Ask") count only when
//      the writer already set them apart that way, as the product articles do.
//
// Hand-written .astro copy uses the FlowTerm component instead.

/** Labels safe to find in running text: specific to Flow, case as shown in the app. */
export const PLAIN_TERMS = [
  'I accept changes',
  'Add Folder…',
  'Add Folder',
  'Review Changes',
  'Exact changes',
  'Expand with Sources',
  'Run Jobs',
  'Smart Routing',
  'Choose the model myself',
  'this Mac first, free before metered',
  'Flow Runtime',
  'Night Shift',
  'Morning Briefing',
  'Keep sources fresh',
  'Jobs Workbench',
  'Files Flow Writes',
  'Describe Picture',
  'Changed by Claude Code',
  'Changed by Codex',
  'Your Claude subscription',
  'Your Codex subscription',
  'What are you working on?',
  'Proofread',
];

/** Labels that are also ordinary words: marked only when already bold or italic. */
export const MARKED_TERMS = [
  'Import', 'Import…', 'Publish', 'Publish…', 'Ask', 'Summarize', 'Translate', 'Dictation', 'History',
  'Keep', 'Revert', 'Open', 'Run', 'Approve', 'Agency', 'Workbench', 'Ideas', 'Home', 'Included',
  'On this Mac', 'Later', 'Settings', 'Models', 'Billing', 'Living Document', 'Living Documents',
];

const ALL = new Set([...PLAIN_TERMS, ...MARKED_TERMS]);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first, so "Add Folder…" wins over "Add Folder". A term must not sit
// inside a longer word.
const PLAIN_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${[...PLAIN_TERMS].sort((a, b) => b.length - a.length).map(escapeRe).join('|')})(?![\\p{L}\\p{N}])`,
  'gu',
);

/** True when a whole run of text is one Flow term (used for bold/italic runs). */
export const isFlowTerm = (text) => ALL.has(text.trim());

/** Split running text into plain and term segments. */
export function splitFlowTerms(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(PLAIN_RE)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), term: false });
    out.push({ text: m[0], term: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), term: false });
  return out;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escaped HTML for a plain string, with its Flow terms marked. */
export function flowTermsHtml(text) {
  return splitFlowTerms(text)
    .map((s) => (s.term ? `<span class="flow-term">${escapeHtml(s.text)}</span>` : escapeHtml(s.text)))
    .join('');
}

const SKIP = new Set(['link', 'linkReference', 'inlineCode', 'code', 'heading', 'html', 'image']);
const termNode = (value) => ({ type: 'emphasis', data: { hName: 'span', hProperties: { className: ['flow-term'] } }, children: [{ type: 'text', value }] });

/**
 * Remark plugin: marks Flow terms in the Paths and Compare collections only.
 * Headings, links and code are left alone.
 */
export function remarkFlowTerms({ include = /[\\/]content[\\/](paths|compare)[\\/]/ } = {}) {
  return (tree, file) => {
    const where = file?.path ?? file?.history?.[0] ?? '';
    if (!include.test(where)) return;
    const walk = (node) => {
      if (!node.children || SKIP.has(node.type)) return;
      node.children = node.children.flatMap((child) => {
        if ((child.type === 'strong' || child.type === 'emphasis') && child.children?.length === 1 && child.children[0].type === 'text' && isFlowTerm(child.children[0].value)) {
          return [termNode(child.children[0].value)];
        }
        if (child.type === 'text') {
          const parts = splitFlowTerms(child.value);
          if (parts.length === 1 && !parts[0].term) return [child];
          return parts.map((p) => (p.term ? termNode(p.text) : { type: 'text', value: p.text }));
        }
        walk(child);
        return [child];
      });
    };
    walk(tree);
  };
}
