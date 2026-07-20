import assert from 'node:assert/strict';
import rehypeRelayMemoLinks from '../../src/lib/relay/rehype-relay-memo-links.mjs';

const tree = {
  type: 'root',
  children: [
    { type: 'element', tagName: 'a', properties: { href: '../npm-and-cell-image/article.md' }, children: [] },
    { type: 'element', tagName: 'a', properties: { href: '../why-relay-host-cells/article.md#the-claim' }, children: [] },
    { type: 'element', tagName: 'a', properties: { href: 'https://example.com/article.md' }, children: [] },
  ],
};

rehypeRelayMemoLinks()(tree);
assert.equal(tree.children[0].properties.href, '/relay/memos/npm-and-cell-image/');
assert.equal(tree.children[1].properties.href, '/relay/memos/why-relay-host-cells/#the-claim');
assert.equal(tree.children[2].properties.href, 'https://example.com/article.md');

console.log('rehype-relay-memo-links: all assertions passed');
