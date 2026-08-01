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
assert.match(hero, /<span class="block whitespace-nowrap">World's first<\/span>\s*<span class="block whitespace-nowrap">Document as AI<\/span>/);
assert.match(
  hero,
  /Conduct beautifully crafted documents with intelligence built-in to self improve and AI agency enabled to get work done\./,
);
assert.match(hero, /<h1 class="[^"]*hero-gradient-text[^"]*text-\[clamp\(2\.35rem,4\.8vw,5rem\)\][^"]*">/);
assert.doesNotMatch(hero, /text-\[clamp\(3\.25rem,6\.5vw,6\.6rem\)\]/);
assert.match(hero, /import HomeFlowHeroCreative from '\.\.\/flow\/HomeFlowHeroCreative\.astro'/);
assert.match(hero, /<HomeFlowHeroCreative href="\/flow\/" \/>/);
assert.match(hero, /href="\/flow\/"[\s\S]*Explore Orionfold Flow/);
assert.match(hero, /href="#orionfold-line"[\s\S]*Meet the product line/);
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
assert.match(seo, /tagline: "World's first Document as AI"/);
assert.match(
  seo,
  /description:\s*\n\s*'Conduct beautifully crafted documents with intelligence built-in to self improve and AI agency enabled to get work done\.'/,
);
assert.match(
  seo,
  /ogImageAlt:\s*\n\s*"Orionfold Flow: World's first Document as AI\. Conduct beautifully crafted documents with intelligence built-in to self improve and AI agency enabled to get work done\."/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(seo, /description: SITE\.description/);
assert.match(og, /'\/': \{[\s\S]*title: SITE\.tagline[\s\S]*alt: SITE\.ogImageAlt/);
assert.doesNotMatch(hero, /Keep the work moving\./);
assert.doesNotMatch(seo, /Work that keeps moving, on terms you control/);

console.log('home hero: Document-as-AI copy, gradient, creative, motion, and metadata contracts pass');
