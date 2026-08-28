// Canonical homepage hero contracts after the product-led racing merge.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
const home = read('src/pages/index.astro');
const hero = read('src/components/flow/FlowLaunchHomeHero.astro');
const ticker = read('src/components/flow/FlowCapabilityTicker.astro');
const css = read('src/styles/global.css');
const seo = read('src/data/seo.ts');
const og = read('src/data/og.ts');

assert.match(home, /<FlowLaunchHomeHero\s*\/>/, 'homepage mounts one canonical hero');
assert.match(hero, /Flow brings AI to documents\.[\s\S]*You keep the wheel\./, 'hero keeps the accepted document and wheel promise');
assert.match(hero, /\.flow-launch-hero h1\s*\{[\s\S]*?opacity:\s*0\.9;/, 'hero title uses the requested ten-percent transparency');
assert.match(hero, /Flow proofreads my drafts, draws charts from plain text, and runs free on my Mac\. Every run leaves a record I can check[\s\S]*Manav Sehgal, built Flow after nine years at Amazon\./, 'founder quote grounds the metaphor in the work and the approved founder byline');
assert.match(hero, /padding-top: clamp\(6\.25rem, calc\(6\.5vw \+ 1\.25rem\), 7\.25rem\)/, 'desktop hero leaves a deliberate gap below the navigation');
assert.match(hero, /flow-launch-hero__meta-row[\s\S]*margin-bottom: clamp\(0\.75rem, 1\.05vw, 1rem\)[\s\S]*flow-launch-hero__ticker[\s\S]*margin-top: clamp\(0\.75rem, 1\.4vw, 1\.25rem\)/, 'shared hero reclaims lower whitespace without pushing the ticker down');
assert.match(hero, /flow-launch-hero__chip[^>]*>[\s\S]*?Orionfold Flow\s*<\/span>[\s\S]*flow-launch-hero__chip flow-launch-hero__chip--accent">Native Mac app<\/span>/, 'product labels keep Flow and its native Mac platform in separate pills');
assert.doesNotMatch(hero, /Flow Ideas launch|Orionfold Flow · Native Mac app/, 'hero omits the launch label and the combined product-platform pill');
assert.match(hero, /Patent pending/, 'patent-pending status stays above the fold');
assert.match(hero, /waitlistId = 'home-hero-waitlist'[\s\S]*<WaitlistForm[\s\S]*id=\{waitlistId\}[\s\S]*offer="flow-waitlist"/, 'pre-launch conversion path remains');
assert.match(hero, /Free to join · Double opt-in · One email a week, no more/, 'waitlist caption remains');

assert.match(hero, /src=\{pitStopDaylightWide\}[\s\S]*loading="eager"[\s\S]*fetchpriority="high"/, 'landscape campaign art is the eager background');
assert.match(hero, /shot = shotHomeHero[\s\S]*<FlowShot[\s\S]*src=\{shot\}[\s\S]*natural/, 'right column defaults to the selected full-fit Flow product shot');
assert.doesNotMatch(hero, /flow-launch-hero__product-window :global\(\.flow-shot\)[\s\S]*?opacity:/, 'product shot remains at full opacity');
assert.match(hero, /flow-launch-hero__product-window[\s\S]*--flow-product-edge-bleed[\s\S]*width:\s*calc\(100% \+ var\(--flow-product-edge-bleed\)\)/, 'desktop product proof uses the full space through the right edge');
assert.match(hero, /flow-launch-hero__product-window > \.home-hero__shot-frame\s*\{[\s\S]*?width:\s*110%;[\s\S]*?margin-left:\s*-10%;/, 'large desktop product proof grows ten percent while staying right-anchored');
assert.doesNotMatch(hero, /width:\s*111\.111%|clip-path:\s*inset\(-4rem 0 -4rem -4rem\)/, 'product proof is not enlarged behind a clipping mask');
assert.doesNotMatch(hero, /Real Flow build|Live cockpit|Product evidence from the running Mac build/, 'product proof carries no badge or caption');
assert.doesNotMatch(hero, /src=\{shot\}[\s\S]{0,260}?\bpriority\b/, 'product proof does not compete with the LCP background');
assert.match(hero, /home-hero__shot-frame/);
assert.match(hero, /home-hero__sheen/);
assert.match(css, /@keyframes home-hero-float/);
assert.match(css, /@keyframes home-hero-sheen/);
assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.home-hero__shot-frame\s*\{ animation: none; \}/);
assert.match(css, /html:has\(\.flow-launch-hero--light\)::-webkit-scrollbar-track\s*\{\s*background:\s*#eef4f1;/, 'homepage scrollbar track blends into the light racing canvas instead of leaving a white seam');

assert.doesNotMatch(home, /heroStats/, 'homepage no longer carries a hero telemetry data structure');
assert.doesNotMatch(hero, /Pit-wall telemetry|Measured on the running build|flow-launch-hero__telemetry/, 'hero telemetry surface is removed');
assert.doesNotMatch(hero, /Enter the Ideas pit stop|flow-launch-hero__story-link/, 'hero has no pit-stop text link');
assert.doesNotMatch(hero, /flow-launch-hero__metaphor|\['User', 'Driver'\]|\['Flow', 'Race car'\]/, 'hero has no explanatory racing legend');
assert.match(hero, /flow-launch-hero__meta-row[\s\S]*flow-launch-hero__eyebrow[\s\S]*flow-launch-hero__chips/, 'audience copy and right-aligned pills share the compact top row');
assert.match(hero, /<FlowCapabilityTicker\s*\/>/, 'capability ticker remains inside the racing hero creative');
for (const value of ['Cloud models', 'OpenAI', 'Anthropic', 'OpenRouter', 'Local models', 'Flow Runtime', 'Ollama', 'LM Studio', 'AI subscriptions', 'Codex CLI', 'Claude Code', 'Everyday work', 'Markdown', 'Charts + diagrams', 'Tables', 'Images', 'Agency', 'Search', 'Benchmarks', 'Routing', 'Guardrails', 'Govern', 'Cost', 'Evidence', 'Receipts', 'Reviews']) {
  assert.match(ticker, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${value} remains in the buyer-facing capability ticker`);
}
assert.doesNotMatch(ticker, /Exact diffs/, 'ticker omits exact diffs');
assert.match(ticker, /label: 'Everyday work'[\s\S]*?Markdown[\s\S]*?Charts \+ diagrams[\s\S]*?Tables[\s\S]*?Images[\s\S]*?label: 'Agency'/, 'Everyday work contains only its selected four capabilities');
assert.match(ticker, /label: 'Govern'[\s\S]*?Cost[\s\S]*?Evidence[\s\S]*?Receipts[\s\S]*?Reviews/, 'receipts return under the Govern category');
assert.match(ticker, /Tables', icon: 'table'/, 'Tables uses a dedicated table pictogram');
assert.match(ticker, /Images', icon: 'image'/, 'Images uses a dedicated image pictogram');
assert.match(ticker, /OpenRouter', path: brandPaths\.openrouter/, 'OpenRouter uses its provider mark');
assert.match(ticker, /Ollama', image: ollamaLogo/, 'Ollama uses its official provider logo');
assert.match(ticker, /LM Studio', brandIcon: 'lmstudio'/, 'LM Studio uses a crisp monochrome vector rendition of its provider mark');
assert.match(ticker, /Codex CLI', path: brandPaths\.openai/, 'Codex reuses the OpenAI provider glyph');
assert.match(ticker, /Claude Code', path: brandPaths\.anthropic/, 'Claude Code reuses the Anthropic provider glyph');
assert.doesNotMatch(ticker, /lm-studio-logo\.webp/, 'ticker no longer uses the low-contrast LM Studio raster app icon');
assert.match(ticker, /width:\s*1\.5rem;[\s\S]*height:\s*1\.5rem;/, 'ticker icons remain visibly sized');
assert.doesNotMatch(ticker, /flow-capability-ticker__mark/, 'capability icons no longer use tiny boxed glyphs');
assert.match(ticker, /\[0, 1\]\.map/, 'ticker renders two identical halves');
assert.match(ticker, /translateX\(-50%\)/, 'ticker loop lands on its identical second half');
assert.match(ticker, /prefers-reduced-motion:\s*reduce[\s\S]*animation-play-state:\s*paused/, 'ticker pauses for reduced motion');

assert.match(seo, /tagline: 'Flow brings AI to documents\. You keep the wheel\.'/, 'the site tagline matches the home hero H1');
assert.match(seo, /slogan: SITE\.tagline/);
const homeOg = og.match(/'\/': \{([\s\S]*?)\n  \},/)?.[1] ?? '';
assert.match(homeOg, /title: 'Flow brings AI to documents\. You keep the wheel\.'/);
assert.match(homeOg, /alt: '[^']*What Flow is using readout[^']*trip plan/, 'home OG alt describes the installed-1382 readout card that is actually cut into the social image');
// OG shot cards: the framed screenshot starts at left 660, the title block at
// padLeft 80. Title width must stay <= 580 or a full line runs under the pane
// (the 2026-08-28 four-line home headline exposed this at 600).
const card = read('src/lib/og/card.ts');
assert.match(card, /hasShot \? 560 : 900/, 'OG shot-card title width stays clear of the screenshot pane');

console.log('home hero: daylight racing world, real Flow proof, conversion and metadata contracts pass');
