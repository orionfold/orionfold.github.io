import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const launch = readFileSync(new URL('../../src/data/launch.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../src/pages/relay/host.astro', import.meta.url), 'utf8');
const guide = readFileSync(new URL('../../src/content/relay-docs/set-trust-runtime-and-local-controls.md', import.meta.url), 'utf8');

assert.match(launch, /export const RELAY_HOST_LIVE = true;/, 'Relay Host checkout must be enabled for launch');
assert.match(page, /Relay 0\.44\.9 passed a fresh guided-beta run/, 'page must name the accepted public Relay release');
assert.match(guide, /v0\.44\.9/, 'operator guide must name the accepted public Relay release');
assert.match(guide, /sha256:42bea7a0a65bf799ddbbc4a078667f256400c5cca0fe682c07ab68f2bf5c3cd5/, 'operator guide must pin the accepted public Cell image');
assert.match(page, /subject to provider billing lag/, 'proof-run cost must retain its billing-lag qualification');
assert.match(page, /This is a proof-run cost, not\s+a monthly sizing or operating-cost promise/, 'proof-run cost must not become a recurring-cost promise');
assert.match(page, /Portability beyond the tested DigitalOcean topology/, 'page must preserve the portability boundary');
assert.doesNotMatch(page, /DigitalOcean path stays closed|Not yet\. The product and local managed journey|Launch waits for DigitalOcean proof|Before this page opens checkout/, 'stale pre-launch copy must be absent');

console.log('[relay-host-launch] public flag and bounded DigitalOcean claim are aligned');
