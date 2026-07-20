// scripts/test/sync-relay-shots.test.mjs
import assert from 'node:assert/strict';
import { resolvePairs } from '../sync-relay-shots.mjs';

const manifest = {
  entries: [
    { id: 'home-cockpit', area: 'home', theme: 'light', viewport: 'desktop', path: 'light/home/home-cockpit__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Home cockpit' },
    { id: 'home-cockpit', area: 'home', theme: 'dark', viewport: 'desktop', path: 'dark/home/home-cockpit__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Home cockpit' },
    { id: 'lonely-light', area: 'apps', theme: 'light', viewport: 'desktop', path: 'light/apps/lonely-light__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Lonely' },
  ],
};

// happy path: a matched pair resolves with ratio + label-as-alt fallback
{
  const { pairs, errors } = resolvePairs(manifest, ['home-cockpit']);
  assert.equal(errors.length, 0, 'no errors for a matched pair');
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].id, 'home-cockpit');
  assert.equal(pairs[0].ratio, '1440 / 1100');
  assert.equal(pairs[0].width, 1440);
  assert.equal(pairs[0].height, 1100);
  assert.equal(pairs[0].alt, 'Home cockpit', 'falls back to label when manifest has no alt');
  assert.equal(pairs[0].light.path, 'light/home/home-cockpit__desktop.png');
  assert.equal(pairs[0].dark.path, 'dark/home/home-cockpit__desktop.png');
}

// half-pair: fail loud
{
  const { errors } = resolvePairs(manifest, ['lonely-light']);
  assert.ok(errors.some((e) => e.includes('lonely-light')), 'half-pair produces an error naming the id');
}

// unknown id: fail loud
{
  const { errors } = resolvePairs(manifest, ['does-not-exist']);
  assert.ok(errors.some((e) => e.includes('does-not-exist')), 'unknown id produces an error naming the id');
}

console.log('sync-relay-shots resolvePairs: all assertions passed');
