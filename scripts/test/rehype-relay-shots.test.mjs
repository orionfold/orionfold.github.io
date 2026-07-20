// scripts/test/rehype-relay-shots.test.mjs
import assert from 'node:assert/strict';
import rehypeRelayShots from '../../src/lib/relay/rehype-relay-shots.mjs';

// minimal HAST tree with one relay-shot img and one normal img
const tree = {
  type: 'root',
  children: [
    { type: 'element', tagName: 'p', children: [
      { type: 'element', tagName: 'img', properties: { src: 'relay-shot:home-cockpit', alt: 'The home cockpit' }, children: [] },
      { type: 'element', tagName: 'img', properties: { src: '/normal.png', alt: 'untouched' }, children: [] },
    ] },
  ],
};

rehypeRelayShots()(tree);

const p = tree.children[0];
const swapped = p.children[0];
const normal = p.children[1];

assert.equal(swapped.tagName, 'div', 'relay-shot marker becomes a responsive figure wrapper');
assert.deepEqual(swapped.properties.className, ['relay-shot']);
assert.match(swapped.properties.style, /aspect-ratio:1440 \/ 1100/, 'carries aspect-ratio');
const activeImage = swapped.children[0];
assert.equal(activeImage.tagName, 'img');
assert.equal(activeImage.properties.alt, 'The home cockpit', 'markdown alt wins');
assert.equal(activeImage.properties.loading, 'lazy');
assert.match(activeImage.properties['data-shot-light-srcset'], /720w/, 'carries responsive light sources');
assert.match(activeImage.properties['data-shot-dark-srcset'], /1600w/, 'carries responsive dark sources');
assert.equal(swapped.children[1].tagName, 'noscript', 'includes a no-JS fallback');
assert.equal(normal.tagName, 'img', 'a normal img is left untouched');

// idempotent: a second pass changes nothing (no relay-shot: src remains)
rehypeRelayShots()(tree);
assert.equal(tree.children[0].children[0].tagName, 'div');

// unknown id throws
const bad = { type: 'root', children: [ { type: 'element', tagName: 'img', properties: { src: 'relay-shot:nope' }, children: [] } ] };
assert.throws(() => rehypeRelayShots()(bad), /unknown shot id "nope"/);

console.log('rehype-relay-shots: all assertions passed');
