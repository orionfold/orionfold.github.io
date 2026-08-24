// Flow Ideas racing campaign contract.
//
// The launch creative may evolve quickly, but three boundaries must not drift:
// it stays behind its own opt-in flag, it never replaces the real Flow proof,
// and the user remains the driver who controls release.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const launch = read('src/data/launch.ts');
const config = read('astro.config.mjs');
const home = read('src/pages/index.astro');
const flow = read('src/pages/flow.astro');
const component = read('src/components/flow/FlowIdeasPitStop.astro');
const concept = read('src/pages/flow/ideas-in-motion.astro');

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
