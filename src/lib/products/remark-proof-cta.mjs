// Remark plugin: turns a `::proof-cta` leaf directive in a story .md body into
// an empty mount-point div. The story page (story/[slug]) server-renders the
// real <ProofCTA> Astro component (which needs <Image> for the optimized
// thumbnail, something a remark plugin can't emit) and a tiny inline script
// relocates it into this slot at the authored midpoint. Keeping the slot as a
// directive — not raw HTML — means the marker lives ONE place in the markdown
// and never collides with the body's inline images (those still flow through
// <Content />'s image pipeline untouched). Same mechanism family as
// remark-asciinema; runs in the same remarkPlugins chain.
//
// Authoring syntax (place where you want the CTA, mid-article):
//   ::proof-cta
//
// No attributes: the per-story thumbnail/title/description live in the page's
// PROOF_CTA map keyed by slug, so the markdown stays pure prose.

import { visit, SKIP } from 'unist-util-visit';

export default function remarkProofCta() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.type !== 'leafDirective' && node.type !== 'textDirective') return;
      if (node.name !== 'proof-cta') return;

      parent.children[index] = {
        type: 'html',
        value: '<div data-proof-cta-slot></div>',
      };
      return [SKIP, index];
    });
  };
}
