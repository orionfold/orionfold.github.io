// Flow Ideas racing campaign contract.
//
// The launch creative may evolve quickly, but three boundaries must not drift:
// it stays behind its own opt-in flag, it never replaces the real Flow proof,
// and the user remains the driver who controls release.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const launch = read('src/data/launch.ts');
const config = read('astro.config.mjs');
const home = read('src/pages/index.astro');
const flow = read('src/pages/flow.astro');
const component = read('src/components/flow/FlowIdeasPitStop.astro');
const release = read('src/components/flow/FlowIdeasReleaseCut.astro');
const launchHero = read('src/components/flow/FlowLaunchHomeHero.astro');
const raceAct = read('src/components/flow/HomeRaceCapabilityAct.astro');
const blueprint = read('src/components/flow/FlowRaceBlueprint.astro');
const concept = read('src/pages/flow/ideas-in-motion.astro');
const motionManifest = JSON.parse(read('public/video/flow/flow-ideas-motion-manifest.json'));
const sha256 = (path) => createHash('sha256')
  .update(readFileSync(new URL(path, root)))
  .digest('hex');

// A live Flow download is not evidence that Ideas is ready to launch. The
// campaign therefore owns a separate, default-dark public build flag.
assert.match(
  launch,
  /export const ORIONFOLD_FLOW_IDEAS_CAMPAIGN\s*=\s*\n?\s*publicBuildEnv\?\.PUBLIC_FLOW_IDEAS_CAMPAIGN === ["']true["'];/,
  'Flow Ideas campaign requires an explicit true environment value',
);
assert.doesNotMatch(
  launch,
  /ORIONFOLD_FLOW_IDEAS_CAMPAIGN\s*=\s*true/,
  'Flow Ideas campaign must not be permanently enabled in source',
);
assert.match(
  config,
  /!page\.endsWith\(['"]\/flow\/ideas-in-motion\/['"]\)/,
  'sitemap always excludes the noindex campaign-review route',
);
assert.doesNotMatch(config, /FLOW_IDEAS_CAMPAIGN/, 'sitemap indexing never follows the preview flag');

for (const [name, page] of [['Home', home], ['Flow', flow]]) {
  assert.match(page, /ORIONFOLD_FLOW_IDEAS_CAMPAIGN && \(/, `${name} gates the campaign mount`);
  assert.match(page, /<FlowIdeasPitStop\b/, `${name} mounts the shared campaign component`);
}

const homeArc = home.indexOf('ORIONFOLD_FLOW_IDEAS_CAMPAIGN && (');
assert.ok(homeArc > home.indexOf('THE BROKEN LOOP'), 'Home campaign follows the buyer problem');
assert.ok(homeArc < home.indexOf('CAPABILITY BANDS'), 'Home campaign precedes the capability proof bands');

// The homepage launch skin is a complete alternate composition behind the
// same dark flag. It keeps the locked product promise, real build evidence,
// measured facts, conversion wiring, and every capability row.
assert.match(
  home,
  /ORIONFOLD_FLOW_IDEAS_CAMPAIGN \? \(\s*<FlowLaunchHomeHero stats=\{heroStats\} \/>/,
  'campaign flag selects the cinematic launch hero',
);
assert.match(home, /ORIONFOLD_FLOW_IDEAS_CAMPAIGN && 'home-race-theme'/, 'campaign flag skins the full homepage');
assert.match(home, /const capabilityActs = \[/, 'launch structure owns explicit editorial acts');
for (const slice of ['slice(0, 2)', 'slice(2, 5)', 'slice(5)']) {
  assert.match(home, new RegExp(slice.replace(/[()]/g, '\\$&')), `${slice} preserves the original capability order`);
}
assert.match(home, /<HomeRaceCapabilityAct[\s\S]*?rows=\{act\.rows\}/, 'launch acts reuse the capability objects');
assert.match(home, /Race control · For enterprise AI owners/, 'enterprise section becomes race control');
assert.match(home, /Final lap · The origin story/, 'origin story closes the launch poster arc');

assert.match(launchHero, /Conduct beautiful documents\.[\s\S]*Choose where AI operates\./, 'launch hero keeps the locked H1 promise');
assert.match(launchHero, /flow-ideas-pit-stop-wide\.webp/, 'launch hero uses the selected wide key art');
assert.match(launchHero, /flow-ideas-pit-stop-portrait\.webp/, 'launch hero uses selected mobile art direction');
assert.match(launchHero, /loading="eager"[\s\S]*fetchpriority="high"[\s\S]*decoding="sync"/, 'key art is the launch LCP');
assert.match(launchHero, /flow-ideas-pit-stop-tune\.mp4/, 'hero trailer uses the safe pit and tune cut');
assert.match(launchHero, /flow-ideas-pit-stop-tune-poster\.webp/, 'hero trailer poster matches the safe cut');
assert.doesNotMatch(launchHero, /\bautoplay\b|\bloop\b/, 'hero trailer waits for the user and does not repeat');
assert.match(launchHero, /Replay film/, 'hero trailer can be replayed');
assert.match(launchHero, /Release held/, 'hero trailer keeps driver control visible');
for (const status of ['System health', '99%', 'Specialists', '06 ready', 'Driver control']) {
  assert.match(launchHero, new RegExp(status), `hero trailer keeps ${status} telemetry populated`);
}
assert.match(launchHero, /<FlowShot[\s\S]*?src=\{shotGuideSales\}/, 'real Flow output remains in the launch hero');
assert.doesNotMatch(launchHero, /src=\{shotGuideSales\}[\s\S]{0,260}?\bpriority\b/, 'campaign art, not the below-fold proof shot, owns LCP priority');
for (const mapping of ['User', 'Driver', 'Flow', 'Race car', 'Ideas', 'Pit stop', 'Specialists', 'Pit crew']) {
  assert.match(launchHero, new RegExp(`'${mapping}'`), `hero maps ${mapping} explicitly`);
}
assert.match(launchHero, /Measured on the running build/, 'product telemetry retains its scope');
assert.match(launchHero, /<FlowRaceBlueprint class="flow-launch-hero__blueprint"/, 'pit wall uses the source-derived blueprint');

assert.match(raceAct, /<FlowRaceBlueprint class="home-race-act__blueprint"/, 'each race act carries the blueprint system');
assert.match(raceAct, /<FlowShot[\s\S]*?<FlowDetail/, 'race acts retain real context and proof crops');
assert.match(raceAct, /See it in the tour/, 'race acts retain the product tour conversion path');
assert.match(blueprint, /flow-race-blueprint-wide\.webp/, 'blueprint uses the selected wide source derivation');
assert.match(blueprint, /flow-race-blueprint-portrait\.webp/, 'blueprint has true mobile art direction');
assert.match(blueprint, /media="\(max-width: 699px\)"/, 'blueprint switches art at the mobile breakpoint');
for (const asset of [
  'src/assets/flow/launch/flow-race-blueprint-wide.webp',
  'src/assets/flow/launch/flow-race-blueprint-portrait.webp',
]) {
  assert.ok(existsSync(new URL(asset, root)), `${asset} exists`);
}

const flowArc = flow.indexOf('ORIONFOLD_FLOW_IDEAS_CAMPAIGN && (');
assert.ok(flowArc > flow.indexOf('Measured, not promised'), 'Flow campaign follows measured proof');
assert.ok(flowArc < flow.indexOf('THE WHOLE PROMISE IN ONE PICTURE'), 'Flow campaign precedes the architecture picture');

// The metaphor is explicit and bounded. Specialist support must never turn
// into an autonomy claim, and telemetry must never be presented as product
// evidence.
assert.match(component, /You drive\. Flow brings the pit crew\./, 'the user is the driver');
assert.match(component, /You choose what runs and when to release it\./, 'the user controls release');
assert.match(component, /Narrow experts propose\./, 'specialists propose narrow work');
assert.match(component, /None of them takes the wheel\./, 'specialists do not take control');
assert.doesNotMatch(component, /\bspawn(?:s|ed|ing)?\b/i, 'public campaign copy does not claim agents are spawned');
assert.doesNotMatch(component, /\bautonomous(?:ly)?\b/i, 'public campaign copy does not claim autonomy');
for (const screen of ['Lap time', 'System health', 'Specialists', 'Driver control']) {
  assert.match(component, new RegExp(`>${screen}<`), `telemetry screen ${screen} is populated`);
}
assert.match(component, /Campaign telemetry is illustrative\./, 'illustrative telemetry is labeled');
assert.match(component, /flow-ideas-pit-stop-wide\.webp/, 'desktop art uses the selected campaign creative');
assert.match(component, /flow-ideas-pit-stop-portrait\.webp/, 'mobile art uses the selected portrait creative');
assert.match(component, /media=["']\(max-width: 699px\)["']/, 'mobile art direction is explicit');
assert.match(component, /portraitWidths = \[480, 720, 960, 1280\]/, 'portrait art has a responsive source set');
assert.match(component, /loading=\{isStory \? ['"]eager['"] : ['"]lazy['"]\}/, 'only the story LCP loads eagerly');
assert.match(component, /fetchpriority=\{isStory \? ['"]high['"] : undefined\}/, 'story LCP receives high fetch priority');
assert.match(component, /\{variant === ['"]flow['"] && \(\s*<ol class=["']flow-pit__roles["']/, 'the full infographic is reserved for the Flow landing');
assert.doesNotMatch(component, /flow-pit__scene/, 'component does not fabricate replacement artwork in CSS');
assert.doesNotMatch(component, /backdrop-filter|filter:\s*blur/i, 'campaign treatment does not blur the selected art');
assert.match(component, /variant === ['"]story['"] \? \([\s\S]*?<h1\b/, 'the story placement owns the page H1');
assert.match(component, /flow-pit__motion-toggle/, 'optional campaign motion includes a pause and play control');

// The concept is a noindex review route, not a Story collection entry. With
// the flag off it cannot be navigated as a public campaign page.
assert.match(concept, /if \(!ORIONFOLD_FLOW_IDEAS_CAMPAIGN\)/, 'concept route uses the campaign flag');
assert.match(concept, /Astro\.redirect\(['"]\/flow\/['"], 302\)/, 'dark route returns readers to Flow');
assert.match(concept, /noindex=\{true\}/, 'campaign review route stays out of search');
assert.doesNotMatch(concept, /src\/content\/story/, 'campaign concept is not a Story collection entry');
assert.match(concept, /They propose and report\. They do not take the wheel\./, 'story preserves driver control');
assert.match(concept, /<h2 id=["']flow-ideas-story-arc-title["']/, 'story arc follows the campaign H1');
assert.match(concept, /<h3>\{beat\.title\}<\/h3>/, 'story beats preserve heading hierarchy');
assert.match(concept, /<FlowIdeasReleaseCut\s*\/>/, 'story carries the edited release motion beat');

// The Gemini salvage edit is now an ordered two-act sequence: the pit crew
// works while release stays held, then the user sends Flow forward. Both clips
// preserve their full portrait frame and wait for a direct play command.
assert.match(release, /flow-ideas-pit-stop-tune\.mp4/, 'first act uses the curated pit and tune cut');
assert.match(release, /flow-ideas-release-exit\.mp4/, 'second act uses the curated release cut');
assert.match(release, /<ol class=["']flow-race__acts["'] aria-label=["']Two-act Flow Ideas race sequence["']>/, 'motion is one ordered two-act sequence');
assert.ok(release.indexOf("id: 'tune'") < release.indexOf("id: 'release'"), 'pit and tune precedes release');
assert.match(release, /data-race-act=\{act\.id\}/, 'rendered acts expose their sequence id');
assert.match(release, /Act 01 · Pit \/ tune · 5\.625 seconds/, 'pit act states its exact editorial duration');
assert.match(release, /Act 02 · Release · 1\.5 seconds/, 'release act states its editorial duration');
assert.match(release, /The crew works\. Release stays held\./, 'pit act preserves the release gate');
assert.match(release, /Your call puts Flow back on track\./, 'release act keeps the user in control');
assert.match(release, /Driver control: release held\. Illustrative, not product evidence\./, 'pit cut is truthfully labeled');
assert.match(release, /The crew clears\. The user releases\. Flow moves\. Illustrative, not product evidence\./, 'release cut is truthfully labeled');
assert.match(release, /playLabel: 'Play pit and tune'/, 'pit cut has its own play control');
assert.match(release, /playLabel: 'Play release'/, 'release cut has its own play control');
assert.match(release, /replace\('Play', 'Pause'\)/, 'each control can pause its clip');
assert.match(release, /replace\('Play', 'Replay'\)/, 'each control can replay its clip');
assert.match(release, /if \(peer !== video\) peer\.pause\(\);/, 'starting one act pauses the other');
assert.match(release, /muted[\s\S]*playsinline[\s\S]*preload=["']metadata["']/, 'both mapped clips are silent inline metadata loads');
assert.doesNotMatch(release, /\bautoplay\b|\bloop\b/, 'motion never starts or repeats itself');
assert.match(release, /object-fit:\s*contain/, 'motion preserves the full 9:16 frame');
assert.doesNotMatch(release, /object-fit:\s*cover/, 'motion is not cropped');
assert.match(release, /<BrandMark\b/, 'both mapped acts carry the official Orionfold mark');
for (const telemetry of ['System health', 'Specialists', 'Driver control', 'Release', 'Track status', 'Flow state']) {
  assert.match(release, new RegExp(`'${telemetry}'`), `motion console keeps ${telemetry} telemetry populated`);
}

// Provenance is exact and machine-checkable. The generated source itself is
// intentionally outside the public repository; the published cuts are hashed
// against the manifest so an accidental re-export cannot silently replace one.
assert.equal(motionManifest.schemaVersion, 1, 'motion manifest schema is explicit');
assert.deepEqual(
  motionManifest.source,
  {
    provider: 'Google Gemini',
    assetName: 'gemini-motion-latest-2.mp4',
    sha256: '359d2f11c327a5d0187e3f1d1f0e98502c9d44da88caf8f0623fe43ce2a64496',
    durationSeconds: 8,
    video: { width: 720, height: 1280, framesPerSecond: 24 },
  },
  'manifest identifies the exact Gemini source',
);
assert.deepEqual(
  motionManifest.cuts.map(({ id, asset, sha256: hash, sourceIntervalSeconds, durationSeconds }) => ({
    id,
    asset,
    sha256: hash,
    sourceIntervalSeconds,
    durationSeconds,
  })),
  [
    {
      id: 'pit-tune',
      asset: '/video/flow/flow-ideas-pit-stop-tune.mp4',
      sha256: '8cd04ef2b8fdd41dd592635da3c0bc31b8b8b5f4fd44a077a7077f5be9736e42',
      sourceIntervalSeconds: { start: 0, end: 5.625 },
      durationSeconds: 5.625,
    },
    {
      id: 'release',
      asset: '/video/flow/flow-ideas-release-exit.mp4',
      sha256: 'b3e08de0ecc6c9026ac9a749efe720f73317c52b18329d5ac9085b9b6c25456c',
      sourceIntervalSeconds: { start: 6.5, end: 8 },
      durationSeconds: 1.5,
    },
  ],
  'manifest records the exact source intervals and cut hashes',
);
assert.deepEqual(
  motionManifest.omittedSourceIntervalsSeconds,
  [{ start: 5.625, end: 6.5, reason: 'Transition omitted between the pit and release beats.' }],
  'manifest records the intentionally omitted transition',
);
for (const cut of motionManifest.cuts) {
  assert.equal(
    sha256(`public${cut.asset}`),
    cut.sha256,
    `${cut.id} bytes match the provenance manifest`,
  );
}
