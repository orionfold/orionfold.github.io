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
//   ::proof-cta   (Orionfold Proof card, PROOF_CTA map)
//   ::flow-cta    (Orionfold Flow download card, FLOW_CTA map)
//   :flow-download[Download Flow]   (inline prose link, upgraded to the DMG URL when live)
//
// No attributes: the per-story thumbnail/title/description live in the page's
// PROOF_CTA map keyed by slug, so the markdown stays pure prose.

import { visit, SKIP } from 'unist-util-visit';

export default function remarkProofCta() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.type !== 'leafDirective' && node.type !== 'textDirective') return;

      // `:flow-download[Download Flow]` is the inline prose form of the same
      // ask. It renders as a plain link to /flow/ (the waitlist when Flow is
      // off, the download section when it is on); while ORIONFOLD_FLOW_LIVE is
      // on, the story page's script rewrites it to the canonical FLOW_DMG_URL
      // and attributes the click like every other Download CTA.
      if (node.type === 'textDirective' && node.name === 'flow-download') {
        const label = (node.children ?? []).map((child) => child.value ?? '').join('') || 'Download Flow';
        parent.children[index] = {
          type: 'html',
          value: `<a href="/flow/" data-flow-inline-download>${label}</a>`,
        };
        return [SKIP, index];
      }
      // `::flow-cta` is the same mechanism for the Flow launch stories: the
      // page renders the Flow download card (FLOW_CTA map in story/[slug]) and
      // relocates it into this slot. Two slot names keep the two product cards
      // from ever landing in each other's midpoint.
      if (node.name !== 'proof-cta' && node.name !== 'flow-cta') return;

      parent.children[index] = {
        type: 'html',
        value: `<div data-${node.name}-slot></div>`,
      };
      return [SKIP, index];
    });
  };
}
