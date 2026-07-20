import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../../src/components/sections/Hero.astro', import.meta.url),
  'utf8',
);

assert.match(source, /id: 'agents-list'/, 'homepage hero uses the Relay Agents product shot');
assert.match(source, /src=\{relayHeroShot\.dark\.src\}/, 'product shot uses the dark cinematic variant');
assert.match(source, /data-relay-shot/, 'hero screenshot participates in resolved theme switching');
assert.match(source, /data-shot-light-src=\{relayHeroShot\.light\.src\}/, 'light mode uses the light Agents capture');
assert.match(source, /data-shot-dark-src=\{relayHeroShot\.dark\.src\}/, 'dark mode keeps the dark Agents capture');
assert.match(source, /--hero-bg: #eff9f8/, 'hero defines a light blueprint surface by default');
assert.match(source, /:global\(html\[data-theme='dark'\]\) \.home-hero/, 'hero defines a scoped dark-theme override');
assert.match(source, /home-hero__blueprint/, 'homepage hero reuses the Relay Host blueprint field');
assert.match(source, /home-hero__glow--cta/, 'primary CTA has a localized glow');
assert.match(source, /home-hero__glow--shot/, 'Agents screenshot has a localized glow');
assert.match(source, /home-hero-shot-float/, 'Agents screenshot uses the restrained floating motion');
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

console.log('home hero product shot: placement, performance, and motion contracts pass');
