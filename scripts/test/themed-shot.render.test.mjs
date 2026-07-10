// scripts/test/themed-shot.render.test.mjs
import assert from 'node:assert/strict';
import { themedShotProps } from '../../src/components/relay/themed-shot.logic.mjs';

const index = { 'home-cockpit': { light: '/l.webp', dark: '/d.webp', ratio: '1440 / 1100', alt: 'Home cockpit', area: 'home' } };

// resolves style + a11y for a known id
{
  const p = themedShotProps(index, { id: 'home-cockpit' });
  assert.equal(p.style, '--shot-light:url("/l.webp");--shot-dark:url("/d.webp");aspect-ratio:1440 / 1100;');
  assert.equal(p.role, 'img');
  assert.equal(p.ariaLabel, 'Home cockpit');
}
// alt override
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: 'Custom context' });
  assert.equal(p.ariaLabel, 'Custom context');
}
// decorative escape hatch
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: '' });
  assert.equal(p.role, 'presentation');
  assert.equal(p.ariaLabel, undefined);
}
// unknown id throws with a helpful message
assert.throws(() => themedShotProps(index, { id: 'nope' }), /unknown shot id "nope"/);

console.log('themed-shot logic: all assertions passed');
