// Rehype plugin: wraps every markdown <table> in a <div class="table-scroll">.
// The DS "anti-collapse law" (global.css) keeps the card frame + horizontal
// scroll on a wide table by making the table itself display:block + overflow-x.
// The side effect is that a NARROW table (few short columns) underfills its
// frame, leaving blank card on the right. Moving the frame + scroll onto a
// wrapper div lets the inner table be a normal width:100% table — so it fills
// the frame when narrow AND the wrapper scrolls when the table is genuinely
// wide. One wrapper benefits every prose table (receipts, story, letters,
// product detail) with no per-table authoring. Runs in the rehypePlugins chain
// after markdown is HTML; idempotent (skips a table already wrapped).

import { visit } from 'unist-util-visit';

export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index == null) return;
      // Already wrapped? (re-run safety)
      if (
        parent.type === 'element' &&
        parent.tagName === 'div' &&
        parent.properties?.className?.includes('table-scroll')
      ) {
        return;
      }
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}
