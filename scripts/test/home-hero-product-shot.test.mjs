import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const hero = read('src/components/sections/Hero.astro');
const creative = read('src/components/flow/FlowHeroCreative.astro');
const home = read('src/pages/index.astro');
const seo = read('src/data/seo.ts');
const og = read('src/data/og.ts');

assert.match(hero, /Flow leads the Orionfold line · In development/);
assert.match(hero, /Keep the work moving\./);
assert.match(hero, /import FlowHeroCreative from '\.\.\/flow\/FlowHeroCreative\.astro'/);
assert.match(hero, /<FlowHeroCreative href="\/flow\/" \/>/);
assert.match(hero, /href="\/flow\/"[\s\S]*Explore Orionfold Flow/);
assert.match(hero, /href="#orionfold-line"[\s\S]*Meet the product line/);
assert.doesNotMatch(hero, /blueprints-gallery|data-relay-shot|\/relay\/demo\//);

assert.match(creative, /assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.match(creative, /loading="eager"/);
assert.match(creative, /fetchpriority="high"/);
assert.match(creative, /perspective: 1500px/);
assert.match(creative, /animation: flow-hero-perspective-drift 14s ease-in-out infinite alternate/);
assert.match(creative, /@media \(max-width: 1023px\)[\s\S]*?transform: none/);
assert.match(creative, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);

assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/);
assert.match(
  home,
  /description="Orionfold Flow keeps knowledge work moving in one document\. Relay runs repeatable agent work\. Arena shows which local AI wins\."/,
);
assert.match(seo, /tagline: 'Work that keeps moving, on terms you control'/);
assert.match(
  seo,
  /description:\s*\n\s*'Orionfold builds Flow, Relay, and Arena: keep knowledge work moving, run repeatable agent work, and see which local AI wins\.'/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(og, /'\/': \{[\s\S]*title: SITE\.tagline/);

console.log('home hero: Flow creative, delivery, motion, and metadata contracts pass');
