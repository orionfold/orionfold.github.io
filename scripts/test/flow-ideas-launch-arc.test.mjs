// Flow Ideas launch contract after the canonical light-only homepage selection.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const launch = read('src/data/launch.ts');
const config = read('astro.config.mjs');
const home = read('src/pages/index.astro');
const flow = read('src/pages/flow.astro');
const nav = read('src/components/Nav.astro');
const pitStop = read('src/components/flow/FlowIdeasPitStop.astro');
const release = read('src/components/flow/FlowIdeasReleaseCut.astro');
const hero = read('src/components/flow/FlowLaunchHomeHero.astro');
const ticker = read('src/components/flow/FlowCapabilityTicker.astro');
const raceAct = read('src/components/flow/HomeRaceCapabilityAct.astro');
const blueprint = read('src/components/flow/FlowRaceBlueprint.astro');
const concept = read('src/pages/flow/ideas-in-motion.astro');
const measurements = read('src/data/flow-measurements.ts');

assert.match(launch, /PUBLIC_FLOW_IDEAS_CAMPAIGN === ["']true["']/, 'concept route retains its explicit opt-in flag');
assert.doesNotMatch(flow, /ORIONFOLD_FLOW_IDEAS_CAMPAIGN|FlowIdeasPitStop/, 'the definitive Flow overview leaves racing campaign art on Home');
assert.match(concept, /if \(!ORIONFOLD_FLOW_IDEAS_CAMPAIGN\)/, 'concept route remains gated');
assert.match(concept, /noindex=\{true\}/, 'concept route stays out of search');
assert.match(config, /!page\.endsWith\(['"]\/flow\/ideas-in-motion\/['"]\)/, 'sitemap excludes the concept route');

assert.match(home, /<FlowLaunchHomeHero\s*\/>/, 'homepage always mounts the launch hero');
assert.match(home, /<FlowIdeasPitStop id="home-flow-ideas-pit-stop" variant="home"\s*\/>/, 'homepage keeps the pit-stop creative');
assert.doesNotMatch(home, /Take the product tour|Writing about Flow\? Get the facts/, 'problem section has no product-tour or press CTA row');
assert.match(home, /capabilityActs\.map/, 'homepage keeps the complete racing editorial arc');
assert.match(home, /id: 'home-race-control'[\s\S]*?number: '04'[\s\S]*?label: 'Governance'[\s\S]*?title: 'Keep the record with the work\.'/, 'receipt proof is presented as race act 04');
assert.doesNotMatch(home, /Final lap · The origin story|FLOW_ENTERPRISE_TEASER/, 'homepage stays on the Flow launch argument');
assert.doesNotMatch(home, /HomeVariant|homeVariant|raceTone|data-home-variant|home-variants/, 'homepage has no variant runtime');
assert.doesNotMatch(nav, /theme-toggle|lockedTheme|data-theme-lock|of-theme/, 'navigation has no palette control');

assert.match(hero, /flow-ideas-pit-stop-daylight-wide\.webp/, 'hero retains daylight landscape art');
assert.match(hero, /flow-ideas-pit-stop-daylight-portrait\.webp/, 'hero keeps mobile art direction');
assert.match(hero, /loading="eager"[\s\S]*fetchpriority="high"/, 'campaign background owns LCP priority');
assert.match(hero, /shot = shotExpandHoverPanel[\s\S]*flow-launch-hero__product[\s\S]*<FlowShot[\s\S]*src=\{shot\}/, 'right side defaults to the selected real Flow product proof');
assert.match(hero, /home-hero__shot-frame[\s\S]*home-hero__sheen/, 'product proof keeps float and sheen hooks');
assert.doesNotMatch(hero, /<video\b|flow-launch-hero__film|Replay film|Play film/, 'hero has no vertical campaign film');
assert.doesNotMatch(hero, /flow-launch-hero__metaphor|Enter the Ideas pit stop|Pit-wall telemetry/, 'hero drops the legend, pit-stop link, and telemetry block');
assert.match(hero, /<FlowCapabilityTicker\s*\/>/, 'capability ticker stays inside the hero racing world');
assert.match(ticker, /Cloud models[\s\S]*OpenAI[\s\S]*Anthropic[\s\S]*OpenRouter/, 'ticker names the verified hosted providers');
assert.match(ticker, /Local models[\s\S]*Flow Runtime[\s\S]*Ollama[\s\S]*LM Studio/, 'ticker names the verified local model routes');

assert.match(blueprint, /flow-race-blueprint-daylight-wide\.webp/);
assert.match(blueprint, /flow-race-blueprint-daylight-portrait\.webp/);
assert.match(blueprint, /flow-race-blueprint__grid/);
assert.match(blueprint, /filter:\s*contrast\(/);
assert.match(blueprint, /mask-image:/);
assert.doesNotMatch(blueprint, /tone\??:|blueprintWideDark|blueprintPortraitDark/);
assert.match(raceAct, /<FlowRaceBlueprint class="home-race-act__blueprint" placement=\{blueprintPlacement\}/);
assert.match(raceAct, /<FlowShot[\s\S]*?<FlowDetail/, 'race acts keep real context and detail proof');
assert.match(raceAct, /id\?: string;[\s\S]*rows\?: CapabilityRow\[\]/, 'the shared act supports a stable custom anchor and editorial-only content');
assert.match(raceAct, /Astro\.slots\.has\(['"]default['"]\)[\s\S]*<slot\s*\/>/, 'the shared act accepts the governance cards in its numbered shell');

assert.match(pitStop, /pitStopDaylightWide/);
assert.match(pitStop, /pitStopDaylightPortrait/);
assert.doesNotMatch(pitStop, /pitStopWide|pitStopPortrait|videoSrc|<video\b/);
assert.match(pitStop, /Flow Capabilities \. The Pit Stop/, 'high-fidelity creative is framed as the Flow capabilities pit stop');
assert.match(pitStop, /FLOW_STORYBOARD_MEASUREMENTS\.map[\s\S]*<LineIcon[\s\S]*measurement\.icon[\s\S]*measurement\.label[\s\S]*measurement\.value/, 'storyboard overlay reuses the canonical measured values, labels and icons');
for (const value of ['22.3 ms', 'Search, 95th percentile', '$0.00425', 'A real billed run, to the digit', '1.1 s', 'First index of 10,000 notes', '7 actions', 'The Agency catalog']) {
  assert.match(measurements, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${value} remains canonical measured evidence`);
}
assert.doesNotMatch(pitStop, /BrandMark|flow-pit__brand|Campaign telemetry is illustrative|<figcaption>/, 'creative has no overlaid brand badge or caption bar');
assert.doesNotMatch(pitStop, /flow-pit__actions|flow-pit__primary|flow-pit__secondary|Enter the Ideas Pit Stop|See the real Flow product/, 'old two-button row is removed');
for (const target of ['#home-race-act-01', '#home-race-act-02', '#home-race-act-03', '#home-race-control']) {
  assert.match(pitStop, new RegExp(`href: ["']${target}["']`), `${target} remains in the four-card storyboard navigation`);
}
assert.match(raceAct, /<section id=\{actId\}[\s\S]*aria-labelledby=\{`\$\{actId\}-title`\}/, 'capability acts expose stable anchor targets');
assert.match(home, /id: 'home-race-control'[\s\S]*number: '04'/, 'governance preserves the fourth storyboard target');
assert.match(release, /flow-ideas-pit-stop-tune\.mp4/);
assert.match(release, /flow-ideas-release-exit\.mp4/);
assert.match(release, /muted[\s\S]*playsinline[\s\S]*preload=["']metadata["']/);
assert.doesNotMatch(release, /\bautoplay\b|\bloop\b/, 'concept motion remains user-initiated and finite');

for (const asset of [
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-wide.webp',
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-portrait.webp',
  'src/assets/flow/launch/flow-race-blueprint-daylight-wide.webp',
  'src/assets/flow/launch/flow-race-blueprint-daylight-portrait.webp',
  'public/video/flow/flow-ideas-pit-stop-tune.mp4',
  'public/video/flow/flow-ideas-release-exit.mp4',
]) {
  assert.ok(existsSync(new URL(asset, root)), `${asset} exists`);
}

console.log('Flow Ideas launch arc: canonical daylight home, real product proof, optional concept motion');
