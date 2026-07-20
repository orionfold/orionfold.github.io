// src/lib/relay/rehype-relay-shots.mjs
// Rehype plugin: rewrites a portable ![alt](relay-shot:<id>) markdown image
// into the same responsive, theme-aware markup as ThemedShot. Relay ships the
// verbatim portable marker; the website owns the
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
      const shot = themedShotProps(index, { id, alt });
      node.tagName = 'div';
      node.properties = {
        className: ['relay-shot'],
        style: shot.style,
      };
      const imageProperties = {
        className: ['relay-shot__image'],
        width: shot.width,
        height: shot.height,
        alt: shot.alt,
        loading: 'lazy',
        decoding: 'async',
        sizes: shot.sizes,
        'data-relay-shot': '',
        'data-shot-light-src': shot.light.src,
        'data-shot-light-srcset': shot.light.srcset,
        'data-shot-dark-src': shot.dark.src,
        'data-shot-dark-srcset': shot.dark.srcset,
        'data-no-zoom': '',
      };
      node.children = [
        { type: 'element', tagName: 'img', properties: imageProperties, children: [] },
        {
          type: 'element',
          tagName: 'noscript',
          properties: {},
          children: [{
            type: 'element',
            tagName: 'img',
            properties: {
              className: ['relay-shot__image'],
              src: shot.light.src,
              srcSet: shot.light.srcset,
              sizes: shot.sizes,
              width: shot.width,
              height: shot.height,
              alt: shot.alt,
              loading: 'lazy',
              decoding: 'async',
              'data-no-zoom': '',
            },
            children: [],
          }],
        },
      ];
    });
  };
}
