// scripts/test/sync-relay-shots.optimize.test.mjs
import assert from 'node:assert/strict';
import { webpName } from '../sync-relay-shots.mjs';

const bufA = Buffer.from('fake-webp-bytes-A');
const bufB = Buffer.from('fake-webp-bytes-B');

const nameA = webpName('dark', bufA);
assert.match(nameA, /^dark\.[0-9a-f]{8}\.webp$/, 'name is <theme>.<hash8>.webp');
assert.equal(webpName('dark', bufA), nameA, 'stable for same bytes');
assert.notEqual(webpName('dark', bufB), nameA, 'hash changes with bytes (cache-bust)');
assert.match(webpName('light', bufA), /^light\./, 'theme prefix respected');

console.log('sync-relay-shots webpName: all assertions passed');
