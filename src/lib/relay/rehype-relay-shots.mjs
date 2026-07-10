// src/lib/relay/rehype-relay-shots.mjs
// Rehype plugin: rewrites a portable ![alt](relay-shot:<id>) markdown image
// into the ThemedShot markup (a <div class="relay-shot"> with the same
// --shot-*/aspect-ratio inline style + role/aria-label the .astro component
// emits). Relay ships the verbatim portable marker; the website owns the
// chrome — honoring the one-direction publish contract. Guarded + idempotent
// (house pattern, cf. rehype-table-scroll.mjs): only touches nodes whose src
// starts with "relay-shot:", so it is safe in the global rehype chain.
import { visit } from 'unist-util-visit';
import index from '../../data/relay-shots.json' with { type: 'json' };
import { themedShotProps } from '../../components/relay/themed-shot.logic.mjs';

const PREFIX = 'relay-shot:';

export default function rehypeRelayShots() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (typeof src !== 'string' || !src.startsWith(PREFIX)) return;
      const id = src.slice(PREFIX.length);
      const alt = node.properties.alt; // markdown alt overrides manifest alt
      const { style, role, ariaLabel } = themedShotProps(index, { id, alt });
      node.tagName = 'div';
      node.children = [];
      node.properties = {
        className: ['relay-shot'],
        style,
        role,
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      };
    });
  };
}
