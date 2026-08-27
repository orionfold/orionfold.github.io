import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (relativePath) => readFileSync(new URL(relativePath, root), 'utf8');

const home = read('src/pages/index.astro');
const hero = read('src/components/flow/FlowLaunchHomeHero.astro');
const blueprint = read('src/components/flow/FlowRaceBlueprint.astro');
const globalCss = read('src/styles/global.css');
const config = read('astro.config.mjs');

assert.doesNotMatch(home, /HomeVariant|homeVariant|raceTone|pageTheme|lockedTheme|data-home-variant/, 'homepage has one canonical composition');
assert.match(home, /<FlowLaunchHomeHero\s*\/>/, 'homepage always mounts the product-led racing hero');
assert.doesNotMatch(home, /flow\/home-variants/, 'homepage no longer references the comparison lab');

assert.match(hero, /flow-ideas-pit-stop-daylight-wide\.webp/, 'hero retains the daylight landscape pit-stop master');
assert.match(hero, /flow-ideas-pit-stop-daylight-portrait\.webp/, 'hero retains responsive portrait background art');
assert.match(hero, /loading="eager"[\s\S]*fetchpriority="high"[\s\S]*decoding="sync"/, 'landscape campaign art remains the eager LCP background');
assert.match(hero, /shot = shotHomeHero[\s\S]*class="[^"]*flow-launch-hero__product[^"]*"[\s\S]*?<FlowShot[\s\S]*?src=\{shot\}/, 'right-side proof defaults to the selected real Flow product shot');
assert.match(hero, /home-hero__shot-frame/, 'product proof reuses the earlier compositor-only float shell');
assert.match(hero, /home-hero__sheen/, 'product proof reuses the earlier diagonal sheen');
assert.doesNotMatch(hero, /pitStopDaylightPoster|tunePoster|pitFilmSrc|<video\b|flow-launch-hero__film|Play film|Replay film/, 'vertical campaign card and hero film are removed');

for (const selector of ['.home-hero__shot-frame', '.home-hero__sheen', '@keyframes home-hero-float', '@keyframes home-hero-sheen']) {
  assert.match(globalCss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${selector} remains available to the product proof`);
}
assert.match(globalCss, /prefers-reduced-motion:\s*reduce[\s\S]*?\.home-hero__shot-frame\s*\{\s*animation:\s*none;[\s\S]*?\.home-hero__sheen\s*\{\s*display:\s*none;/, 'reduced motion leaves a static product shot');

assert.match(blueprint, /flow-race-blueprint-daylight-wide\.webp/, 'blueprint retains the daylight wide master');
assert.match(blueprint, /flow-race-blueprint-daylight-portrait\.webp/, 'blueprint retains the daylight portrait master');
assert.doesNotMatch(blueprint, /flow-race-blueprint-wide\.webp|flow-race-blueprint-portrait\.webp|tone\??:/, 'blueprint has no dark appearance branch');
assert.match(blueprint, /flow-race-blueprint__grid/, 'blueprint owns a deterministic technical grid layer');
assert.match(blueprint, /mask-image:/, 'blueprint and grid fade rather than ending as a hard rectangle');
assert.match(blueprint, /filter:\s*contrast\(/, 'existing daylight linework receives a deterministic sharpening treatment');

for (const asset of [
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-wide.webp',
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-portrait.webp',
  'src/assets/flow/launch/flow-race-blueprint-daylight-wide.webp',
  'src/assets/flow/launch/flow-race-blueprint-daylight-portrait.webp',
  'src/assets/flow/shots/first-launch-home-hero-welcome.webp',
]) {
  assert.ok(existsSync(new URL(asset, root)), `${asset} exists`);
}

assert.doesNotMatch(config, /home-variants/, 'sitemap config no longer carries comparison-lab infrastructure');

console.log('Flow Ideas hero: landscape campaign world, real Flow proof, faded sharp blueprint grid');
