import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(
  new URL('../../src/components/product/RelayHostBox.astro', import.meta.url),
  'utf8',
);
const homepage = readFileSync(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
const relayPage = readFileSync(new URL('../../src/pages/relay/index.astro', import.meta.url), 'utf8');

// 2026-08-15 Flow takeover: the homepage is Flow-only, so Relay Host moved off
// it; the Relay overview remains the canonical placement.
assert.doesNotMatch(homepage, /<RelayHostBox/, 'Relay Host stays off the Flow-first homepage');
assert.match(relayPage, /<RelayHostBox\s*\/>/, 'Relay overview uses the shared Relay Host feature');
assert.match(component, /id: 'settings-host-deployment'/, 'feature uses the current Host deployment capture');
assert.match(component, /src=\{deploymentShot\.light\.src\}/, 'feature uses the optimized light capture directly');
assert.match(component, /srcset=\{deploymentShot\.light\.srcset\}/, 'feature keeps responsive light sources');
assert.doesNotMatch(component, /data-relay-shot|data-shot-dark|deploymentShot\.dark/, 'feature has no runtime appearance switch');
assert.match(component, /--host-canvas-bg: #eff9f8/, 'feature defines a light canvas by default');
assert.doesNotMatch(component, /data-theme=['"]dark|data-theme='dark'/, 'feature has no dark override');
assert.doesNotMatch(component, /import relayHostDeployment/, 'feature no longer pins the legacy dark-only screenshot');

console.log('relay-host-feature-theme: Relay placement uses one responsive light surface');
