import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contract = readFileSync(new URL('../../src/data/relay-host-portable.ts', import.meta.url), 'utf8');
const host = readFileSync(new URL('../../src/pages/relay/host.astro', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../src/pages/relay/host/linux-vm.astro', import.meta.url), 'utf8');
const config = readFileSync(new URL('../../astro.config.mjs', import.meta.url), 'utf8');
const og = readFileSync(new URL('../../src/data/og.ts', import.meta.url), 'utf8');

assert.match(contract, /RELAY_HOST_PORTABLE_RELEASE: string \| null = '0\.45\.2'/, 'portable playbook must pin the accepted public Relay release');
assert.match(contract, /blob\/v\$\{RELAY_HOST_PORTABLE_RELEASE\}\/docs\/relay-host-linux-vm\.md/, 'guide URL must derive from the exact activated Relay release');
assert.doesNotMatch(contract, /blob\/main|<X\.Y\.Z>/, 'portable guide must never use a floating branch or placeholder release');

assert.match(host, /import\.meta\.env\.DEV \|\| RELAY_HOST_PORTABLE_LIVE/, 'Host discovery must be visible locally and release-gated in production');
assert.match(host, /Run Relay Host in your cloud account\./, 'Host page must make customer-chosen infrastructure a first-class product promise');
assert.match(host, /Relay Host is not tied to DigitalOcean/, 'Host page must distinguish the product from its first reference implementation');
assert.match(host, /preferred hyperscaler,\s*neocloud or private infrastructure/, 'Host page must welcome customer-preferred infrastructure without naming unverified providers');
assert.match(host, /Bring a compatible Linux VM/, 'Host page must offer the portable contract as a deployment choice');
assert.match(host, /Follow the DigitalOcean reference path/, 'Host page must offer the verified reference path as a deployment choice');
assert.match(host, /Not yet provider-verified/, 'Host page must distinguish unverified providers from the portable contract');
assert.match(host, /0\.45\.2[^]*portable Host release/, 'Host proof facts must name the activated portable Host release');
assert.match(host, /id="portable-linux-vm" class="scroll-mt-36/, 'Host discovery anchor must clear the fixed navigation');
assert.doesNotMatch(host, /AWS|Azure|GCP|Google Cloud|CoreWeave|Lambda Labs/, 'Host positioning must not name or badge providers without receipts');
assert.match(og, /relayHostPortablePositioning = import\.meta\.env\.DEV \|\| RELAY_HOST_PORTABLE_LIVE/, 'provider-neutral OG positioning must share the release gate');
assert.match(og, /Your Relay Host\. Your cloud account\./, 'activated Host OG card must match the provider-neutral positioning');

for (const phrase of [
  'Your Relay Host. Your cloud account.',
  'Customer-owned',
  'Secret-free setup',
  'Receipt-driven',
  'Portable contract',
  'Provider-verified',
  'Not yet provider-verified',
  '2 vCPU minimum',
  '4 GB minimum',
  '80 GB minimum',
  'Relay Core + one unmanaged Cell',
  'One Host · up to ten managed Cells',
  'Existing managed Cells remain startable, stoppable, exportable, recoverable and purgeable',
  'DigitalOcean is the only named provider with a current accepted live receipt',
]) {
  assert.match(page, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `portable page missing contract phrase: ${phrase}`);
}

for (const forbidden of [
  /one[ -]click/i,
  /managed cloud/i,
  /works on any cloud/i,
  /multi-cloud GA/i,
  /AWS|Azure|GCP|Google Cloud/,
  /relay-host-playbook\s/i,
  /cloud-init\.ya?ml/i,
]) {
  assert.doesNotMatch(page, forbidden, `portable customer page must not copy commands or broaden support: ${forbidden}`);
}

assert.match(page, /noindex=\{!RELAY_HOST_PORTABLE_LIVE \? 'follow' : false\}/, 'unreleased route must be noindex');
assert.match(config, /RELAY_HOST_PORTABLE_LIVE \|\| !page\.endsWith\(RELAY_HOST_PORTABLE_ROUTE\)/, 'unreleased route must be excluded from the sitemap');
assert.match(page, /RELAY_HOST_PORTABLE_GUIDE_URL \?/, 'guide CTA must remain unavailable until its release-pinned URL exists');
assert.match(page, /no cloud credentials handed to Orionfold/, 'customer copy must state the provider-credential boundary');
assert.doesNotMatch(page, /(?:send|provide|enter|upload) (?:your )?(?:cloud )?provider (?:token|API key|credentials)/i, 'customer copy must not ask customers to hand provider credentials to Orionfold');
assert.doesNotMatch(page, /Website/, 'customer-facing copy must say Orionfold or this page, never internal Website nomenclature');

console.log('[relay-host-portable-playbook] release gate, promise boundaries and customer guidance pass');
