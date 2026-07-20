// Relay memo articles are copied from the source corpus without rewriting.
// Inside that corpus, sibling articles link to ../<slug>/article.md. Convert
// only that exact source shape to the Website's canonical public memo route.
import { visit } from 'unist-util-visit';

const SOURCE_MEMO_LINK = /^\.\.\/([a-z0-9-]+)\/article\.md(?:#([a-z0-9-]+))?$/;

export default function rehypeRelayMemoLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
      const match = node.properties.href.match(SOURCE_MEMO_LINK);
      if (!match) return;
      node.properties.href = `/relay/memos/${match[1]}/${match[2] ? `#${match[2]}` : ''}`;
    });
  };
}
