// scripts/test/themed-shot.render.test.mjs
import assert from 'node:assert/strict';
import { themedShotProps } from '../../src/components/relay/themed-shot.logic.mjs';

const index = { 'home-cockpit': { light: '/l.webp', dark: '/d.webp', ratio: '1440 / 1100', alt: 'Home cockpit', area: 'home' } };

// resolves style + a11y for a known id
{
  const p = themedShotProps(index, { id: 'home-cockpit' });
  assert.equal(p.style, 'aspect-ratio:1440 / 1100;');
  assert.equal(p.width, 1440);
  assert.equal(p.height, 1100);
  assert.equal(p.alt, 'Home cockpit');
  assert.deepEqual(p.light, { src: '/l.webp', srcset: '/l.webp' });
  assert.deepEqual(p.dark, { src: '/d.webp', srcset: '/d.webp' });
}
// alt override
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: 'Custom context' });
  assert.equal(p.alt, 'Custom context');
}
// decorative escape hatch
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: '' });
  assert.equal(p.alt, '');
}
// unknown id throws with a helpful message
assert.throws(() => themedShotProps(index, { id: 'nope' }), /unknown shot id "nope"/);

console.log('themed-shot logic: all assertions passed');
