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

assert.equal(swapped.tagName, 'div', 'relay-shot img becomes a div');
assert.deepEqual(swapped.properties.className, ['relay-shot']);
assert.match(swapped.properties.style, /--shot-dark:url\(/, 'carries the dark var');
assert.match(swapped.properties.style, /aspect-ratio:1440 \/ 1100/, 'carries aspect-ratio');
assert.equal(swapped.properties.role, 'img');
assert.equal(swapped.properties['aria-label'], 'The home cockpit', 'markdown alt wins');
assert.equal(normal.tagName, 'img', 'a normal img is left untouched');

// idempotent: a second pass changes nothing (no relay-shot: src remains)
rehypeRelayShots()(tree);
assert.equal(tree.children[0].children[0].tagName, 'div');

// unknown id throws
const bad = { type: 'root', children: [ { type: 'element', tagName: 'img', properties: { src: 'relay-shot:nope' }, children: [] } ] };
assert.throws(() => rehypeRelayShots()(bad), /unknown shot id "nope"/);

console.log('rehype-relay-shots: all assertions passed');
