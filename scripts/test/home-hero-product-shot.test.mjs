import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../../src/components/sections/Hero.astro', import.meta.url),
  'utf8',
);
const home = readFileSync(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
const seo = readFileSync(new URL('../../src/data/seo.ts', import.meta.url), 'utf8');
const og = readFileSync(new URL('../../src/data/og.ts', import.meta.url), 'utf8');
const positioningDescription =
  'Orionfold lets you choose open or frontier AI models, local or cloud delivery, solo or multi-user operation, and optimize for cost or intelligence.';

assert.match(source, /id: 'blueprints-gallery'/, 'homepage hero uses the Relay Blueprint Gallery product shot');
assert.match(source, /src=\{relayHeroShot\.dark\.src\}/, 'product shot uses the dark cinematic variant');
assert.match(source, /data-relay-shot/, 'hero screenshot participates in resolved theme switching');
assert.match(source, /data-shot-light-src=\{relayHeroShot\.light\.src\}/, 'light mode uses the light Blueprint Gallery capture');
assert.match(source, /data-shot-dark-src=\{relayHeroShot\.dark\.src\}/, 'dark mode keeps the dark Blueprint Gallery capture');
assert.match(source, /--hero-bg: #eff9f8/, 'hero defines a light blueprint surface by default');
assert.match(source, /:global\(html\[data-theme='dark'\]\) \.home-hero/, 'hero defines a scoped dark-theme override');
assert.match(source, /home-hero__blueprint/, 'homepage hero reuses the Relay Host blueprint field');
assert.match(source, /home-hero__glow--cta/, 'primary CTA has a localized glow');
assert.match(source, /home-hero__glow--shot/, 'Blueprint Gallery screenshot has a localized glow');
assert.match(source, /home-hero-shot-float/, 'Blueprint Gallery screenshot uses the restrained floating motion');
assert.match(source, /aspect-ratio: 1\.74 \/ 1/, 'product shot crops in the gutter immediately after card row three');
assert.match(source, /class="absolute inset-x-0 top-0 block h-auto w-full"/, 'product shot preserves its source scale while cropping vertically');
assert.doesNotMatch(source, /home-hero-shot__bar|home-hero-shot__dot|home-hero-shot__tab|home-hero-shot__live/, 'simulated Mac window chrome is removed');
assert.match(source, /loading="eager"/, 'hero product shot is discovered as an eager image');
assert.match(source, /fetchpriority="high"/, 'hero product shot keeps high LCP priority');
assert.match(
  source,
  /href="\/relay\/demo\/"[\s\S]*aria-label="View the interactive Orionfold Relay demo"/,
  'the whole product frame links to the interactive demo',
);
assert.match(source, /View the interactive demo/, 'demo link uses accurate non-live copy');
assert.doesNotMatch(source, /Try the live demo/, 'the old live-demo badge copy is removed');
assert.doesNotMatch(source, /home-hero-shot__demo\s/, 'the old overlaid demo badge is removed');
assert.match(source, /pt-24 sm:pt-28[\s\S]*lg:pt-28/, 'hero adds breathing room below navigation');
assert.doesNotMatch(source, /href="\/relay\/demo\/"[\s\S]{0,240}underline/, 'demo fallback is not rendered as an orphaned underlined action');
assert.doesNotMatch(source, /ai-team-hero\.jpg/, 'illustrative poster is no longer the homepage hero proof');
assert.match(source, /prefers-reduced-motion: reduce[\s\S]*animation: none/, 'hero motion has a reduced-motion fallback');
assert.match(source, /Proven[\s\S]*AI-native[\s\S]*business in a box/, 'homepage hero uses the approved company promise');
assert.doesNotMatch(source, /Get proven/, 'homepage promise no longer uses the conversion-led Get prefix');
assert.match(source, /hero-gradient-text/, 'the complete company promise uses the prior gradient fill');
assert.doesNotMatch(source, /home-hero__title-accent/, 'gradient applies to the complete promise rather than one phrase');
assert.match(source, /Open or frontier · local or cloud/, 'hero eyebrow supports the full delivery positioning');
assert.match(source, /open or frontier AI models, local or cloud delivery, solo or multi-user operation/, 'hero states the approved optionality dimensions');
assert.match(source, /Run AI-native business[\s\S]*Get Orionfold Relay/, 'CTA connects the positioning promise to Relay');
assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/, 'homepage title front-loads the shared site promise');
assert.ok(source.includes(positioningDescription), 'hero uses the approved positioning description');
assert.ok(home.includes(`description="${positioningDescription}"`), 'homepage metadata uses the approved positioning description');
assert.ok(seo.includes(`'${positioningDescription}'`), 'organization metadata uses the approved positioning description');
assert.match(seo, /tagline: 'Proven AI-native business in a box'/, 'site metadata declares the approved promise once');
assert.match(seo, /slogan: SITE\.tagline/, 'organization schema exposes the approved promise as its slogan');
assert.match(og, /title: SITE\.tagline/, 'homepage social card follows the shared site promise');

console.log('home hero product shot: placement, performance, and motion contracts pass');
