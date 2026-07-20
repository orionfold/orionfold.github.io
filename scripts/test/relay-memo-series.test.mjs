import assert from 'node:assert/strict';
import { groupedMemos, memoNeighbors, orderedMemos } from '../../src/lib/relay/memo-series.mjs';

const entry = (id, series) => ({ id, data: { series } });
const shuffled = [
  entry('same-host-new-address', 'Relay Host & Cells'),
  entry('agency-bundle', 'Relay Packs'),
  entry('why-relay-host-cells', 'Relay Host & Cells'),
  entry('why-relay-packs', 'Relay Packs'),
  entry('npm-and-cell-image', 'Relay Host & Cells'),
];

assert.deepEqual(
  orderedMemos(shuffled).map((memo) => memo.id),
  ['why-relay-packs', 'agency-bundle', 'why-relay-host-cells', 'npm-and-cell-image', 'same-host-new-address'],
);
assert.deepEqual(groupedMemos(shuffled).map((group) => group.name), ['Relay Packs', 'Relay Host & Cells']);

const pillar = memoNeighbors(shuffled, 'why-relay-host-cells');
assert.equal(pillar.prev, null, 'Host/Cell navigation starts inside its own series');
assert.equal(pillar.next.id, 'npm-and-cell-image');

const capstone = memoNeighbors(shuffled, 'same-host-new-address');
assert.equal(capstone.prev.id, 'npm-and-cell-image');
assert.equal(capstone.next, null, 'Host/Cell navigation stops at its series boundary');

console.log('relay-memo-series: all assertions passed');
