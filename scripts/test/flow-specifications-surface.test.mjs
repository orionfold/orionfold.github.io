import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, 'utf8');

const page = read('src/pages/flow/specifications.astro');
const data = read('src/data/flow-specifications.ts');
const pricing = read('src/data/flow-pricing.ts');
const measurements = read('src/data/flow-measurements.ts');
const flow = read('src/pages/flow.astro');
const nav = read('src/components/Nav.astro');
const flowSubNav = read('src/components/flow/FlowSubNav.astro');
const og = read('src/data/og.ts');
const config = read('astro.config.mjs');

for (const section of ['compatibility', 'documents', 'agency', 'models', 'proof', 'plans', 'measurements', 'availability']) {
  assert.match(page, new RegExp(`id=["']${section}["']`), `${section} section stays addressable`);
  assert.match(page, new RegExp(`href: ['"]#${section}['"]`), `${section} stays in the scan navigation`);
}

assert.match(page, /Technical specifications\./, 'the page leads with a literal, scan-first title');
assert.match(page, /Requirements, documents, Agency, model routes, proof, privacy, plans, and measurements\./, 'the lede names the page contents');
assert.match(page, /State is part of the specification\./, 'provider state is explained beside the table');
assert.match(page, /Detection alone never grants permission or proves a runnable Agency path\./, 'detection is not allowed to imply execution');
assert.match(page, /FLOW_DOWNLOAD_READY \? 'Available now' : 'Package not connected yet'/, 'availability follows the real download readiness seam');

assert.match(pricing, /FLOW_SYSTEM_REQUIREMENT = "macOS 26 or later, Apple silicon or Intel"/, 'the public minimum follows the current build target');
assert.doesNotMatch(`${page}\n${data}\n${pricing}`, /macOS 14|Sonoma/, 'the retired deployment target cannot return to Flow specifications');
assert.match(data, /label: 'App payload'[\s\S]*value: 'Around 40 MB'/, 'the specification states the current approximate complete app payload');
assert.match(data, /Two local inference engines account for 19\.2 MiB of the app payload\./, 'the engine increment stays distinct from the complete payload');

for (const state of ['Built in', 'Runnable now', 'Detected today', 'Launch priority']) {
  assert.match(data, new RegExp(`'${state}'`), `${state} remains an explicit provider state`);
}
for (const provider of ['Flow Runtime', 'Ollama', 'Anthropic', 'OpenAI', 'OpenRouter', 'LM Studio', 'Codex CLI', 'Claude Code']) {
  assert.match(data, new RegExp(`provider: '${provider}'`), `${provider} remains represented`);
}

assert.match(data, /provider: 'LM Studio'[\s\S]*state: 'Runnable now'[\s\S]*exact loaded text model directly through Agency[\s\S]*without copying or sharing its weights/, 'LM Studio follows the operator-accepted G-0164 direct Agency path');
assert.match(data, /provider: 'Codex CLI'[\s\S]*state: 'Launch priority'[\s\S]*Ordinary Agency execution is not yet accepted\./, 'Codex CLI execution stays qualified');
assert.match(data, /provider: 'Claude Code'[\s\S]*state: 'Launch priority'[\s\S]*Ordinary Agency execution is not yet accepted\./, 'Claude Code execution stays qualified');

for (const capability of ['7 approval-gated actions', 'Pause, Stop, 12-lookups maximum, 180-second maximum', 'One durable run card', 'Exact revisions, diff, review, and restore', 'Scored dimensions with coverage and uncertainty', 'A grid over the Markdown in the file']) {
  assert.match(data, new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${capability} remains in the expanded technical contract`);
}
assert.match(data, /Flow Runtime generated text 30–80% faster than Ollama/, 'the bounded competitive throughput claim stays in one shared source');
assert.match(data, /Measured generation throughput on an M3 Max with 36 GB of memory[\s\S]*comparable 7B and 27B quantized model pairs[\s\S]*Results vary by model, context, and Mac\./, 'the competitive claim keeps its measurement boundary');
assert.match(page, /FLOW_RUNTIME_COMPARISON\.qualifier/, 'the qualifier renders beside the comparison');
assert.match(pricing, /bundled 28 document guide, plus 13 assets/, 'Tech Specs uses the current Flow Guide corpus size');

const stableMeasurements = measurements.slice(measurements.indexOf('export const FLOW_SPECIFICATION_MEASUREMENTS'));
assert.match(stableMeasurements, /searchP95[\s\S]*firstIndex/, 'the technical page uses the canonical qualified measurements');
assert.doesNotMatch(stableMeasurements, /recentChanges/, 'the rolling release count stays out of durable specifications');
assert.match(measurements, /value: '7 actions'[\s\S]*label: 'The Agency catalog'/, 'the canonical measurement carries the current seven-action catalog');
assert.match(stableMeasurements, /agencyCatalog/, 'the seven-action catalog reaches technical measurements through the canonical object');

assert.match(flow, /href="\/flow\/specifications\/"[\s\S]*Review technical specifications/, 'the overview routes technical readers to the dedicated page');
assert.doesNotMatch(nav, /Specifications|Tech Specs/, 'technical specifications stay out of the global menu');
assert.doesNotMatch(nav, /label: 'Tour'|label: 'Enterprise'/, 'Flow-specific destinations stay out of the global menu');
assert.match(nav, /href: '\/relay\/', label: 'Relay'/, 'Relay remains a global flagship destination');
assert.match(nav, /href: '\/arena\/', label: 'Arena'/, 'Arena remains a global flagship destination');
assert.match(flowSubNav, /label: 'Tech Specs', href: '\/flow\/specifications\/'/, 'the Flow-local rail uses Apple\'s concise Tech Specs label');
assert.match(page, /<FlowSubNav active="specs" \/>/, 'the technical specifications page marks its local-nav item active');
assert.match(nav, /flowDownloadReady \? FLOW_DMG_URL : \(flowLive \? '\/flow\/#pricing' : '\/flow\/#waitlist'\)/, 'the shared nav cannot advertise the placeholder as a download');
assert.match(og, /'\/flow\/specifications\/': {[\s\S]*slug: 'flow-specifications'/, 'the route has a social card source');
assert.match(config, /map\['\/flow\/specifications\/'\] = '2026-08-25'/, 'the route has an honest sitemap date');

console.log('flow specifications surface regression: pass');
