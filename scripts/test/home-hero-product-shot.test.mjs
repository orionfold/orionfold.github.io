import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const hero = read('src/components/sections/Hero.astro');
const creative = read('src/components/flow/HomeFlowHeroCreative.astro');
const home = read('src/pages/index.astro');
const seo = read('src/data/seo.ts');
const og = read('src/data/og.ts');

assert.match(hero, /Flow leads the Orionfold line · Join the Waitlist/);
assert.doesNotMatch(hero, /Flow leads the Orionfold line · In development/);
assert.match(
  hero,
  /<span class="block whitespace-nowrap">Conduct beautiful<\/span>\s*<span class="mt-\[0\.02em\] block whitespace-nowrap">documents with AI<\/span>\s*<span class="mt-\[0\.02em\] block whitespace-nowrap">agency built in<\/span>/,
);
assert.match(
  hero,
  /Orionfold Flow creates documents with self-improving intelligence built in and AI agency enabled to get work done\./,
);
assert.match(hero, /<h1 class="[^"]*hero-gradient-text[^"]*text-\[clamp\(2rem,9vw,3rem\)\][^"]*lg:text-\[clamp\(3rem,3\.4vw,3\.4rem\)\][^"]*">/);
assert.match(hero, /lg:grid-cols-\[0\.82fr_1\.18fr\]/, 'home hero preserves the original creative column width');
assert.match(hero, /<h1 class="[^"]*leading-\[1\.16\][^"]*">/);
assert.doesNotMatch(hero, /leading-\[(?:0\.92|1\.02)\]/);
assert.doesNotMatch(hero, /Your document holds the context|AI moves the work forward/);
assert.doesNotMatch(hero, /text-\[clamp\(2\.35rem,4vw,4rem\)\]/);
assert.doesNotMatch(hero, /text-\[clamp\(2\.35rem,4\.8vw,5rem\)\]/);
assert.doesNotMatch(hero, /text-\[clamp\(3\.25rem,6\.5vw,6\.6rem\)\]/);
assert.match(hero, /import HomeFlowHeroCreative from '\.\.\/flow\/HomeFlowHeroCreative\.astro'/);
assert.match(hero, /<HomeFlowHeroCreative href="\/flow\/" \/>/);
assert.match(hero, /href="\/flow\/"[\s\S]*Explore Orionfold Flow/);
assert.match(hero, /href="#orionfold-line"[\s\S]*Meet the product line/);
for (const benefit of ['Native Mac app', 'Self-improving intelligence', 'Agency with your approval']) {
  assert.match(hero, new RegExp(`<span class="home-flow__chip">${benefit}<\\/span>`));
}
assert.doesNotMatch(hero, /blueprints-gallery|data-relay-shot|\/relay\/demo\//);

assert.match(creative, /assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.match(creative, /loading="eager"/);
assert.match(creative, /fetchpriority="high"/);
assert.match(creative, /perspective: 1500px/);
assert.match(creative, /animation: home-flow-hero-perspective-drift 14s ease-in-out infinite alternate/);
assert.match(creative, /@media \(max-width: 1023px\)[\s\S]*?transform: none/);
assert.match(creative, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);

assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/);
assert.match(home, /description=\{SITE\.description\}/);
assert.match(seo, /tagline: 'Conduct beautiful documents with AI agency built in'/);
assert.match(
  seo,
  /description:\s*\n\s*'Orionfold Flow creates documents with self-improving intelligence built in and AI agency enabled to get work done\.'/,
);
assert.match(
  seo,
  /ogImageAlt:\s*\n\s*'Orionfold Flow: Conduct beautiful documents with AI agency built in\. Orionfold Flow creates documents with self-improving intelligence built in and AI agency enabled to get work done\.'/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(seo, /description: SITE\.description/);
assert.match(og, /'\/': \{[\s\S]*title: SITE\.tagline[\s\S]*alt: SITE\.ogImageAlt/);
assert.doesNotMatch(hero, /Keep the work moving\./);
assert.doesNotMatch(seo, /Work that keeps moving, on terms you control/);

console.log('home hero: Flow JTBD copy, gradient, creative, motion, and metadata contracts pass');
