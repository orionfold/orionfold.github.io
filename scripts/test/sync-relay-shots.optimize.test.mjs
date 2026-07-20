// scripts/test/sync-relay-shots.optimize.test.mjs
import assert from 'node:assert/strict';
import { webpName } from '../sync-relay-shots.mjs';

const bufA = Buffer.from('fake-webp-bytes-A');
const bufB = Buffer.from('fake-webp-bytes-B');

const nameA = webpName('dark', 1600, bufA);
assert.match(nameA, /^dark-1600\.[0-9a-f]{8}\.webp$/, 'name is <theme>-<width>.<hash8>.webp');
assert.equal(webpName('dark', 1600, bufA), nameA, 'stable for same bytes');
assert.notEqual(webpName('dark', 1600, bufB), nameA, 'hash changes with bytes (cache-bust)');
assert.notEqual(webpName('dark', 720, bufA), nameA, 'width is part of the cache key');
assert.match(webpName('light', 1600, bufA), /^light-1600\./, 'theme prefix respected');

console.log('sync-relay-shots webpName: all assertions passed');
