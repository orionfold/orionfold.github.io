import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
const page=read('src/pages/index.astro'), hero=read('src/components/living/HomeHero.astro');
const mock=read('src/components/flow/mocks/HomeHeroDomainMock.astro'), css=read('src/styles/living-base.css')+read('src/styles/living-home.css');
assert.match(page, /<HomeHero \/>/);
// Operator 2026-10-27: the homepage hero pitches Flow Domains.
assert.match(hero, /TURN WHAT[\s\S]*YOU KNOW[\s\S]*INTO A[\s\S]*DOMAIN/);
assert.match(hero, /<HomeHeroDomainMock \/>/);
assert.match(hero, /href="\/domains\/"/);
assert.match(hero, /<picture[\s\S]*hero-home-paper-planes\.webp/);
assert.doesNotMatch(page+hero, /FlowShot|pit-stop-daylight|FlowRaceBlueprint|<video/);
// The Domain mock's words are the AI Consulting Starter walk's own.
for (const fact of ['AI Consulting Starter', '6 files · 75 KB', 'CC BY 4.0', 'You have not changed this one, so replacing it loses nothing.', 'Update Selected']) assert.ok(mock.includes(fact), fact);
// Operator 2026-10-27: the client's copy renders exactly as published, so both
// windows draw the README and its figure from the same words.
assert.equal((mock.match(/\{P1\}/g) ?? []).length, 2, 'both windows show the same opening');
assert.equal((mock.match(/set:html=\{P2\}/g) ?? []).length, 2, 'both windows show the same claims to check');
assert.equal((mock.match(/<p class="hd-fig-h">\{FIG\}<\/p>/g) ?? []).length, 2, 'both windows draw the same figure');
assert.ok(mock.includes('Exactly as you published it'));
assert.match(read('src/components/living/FlowHero.astro'), /<FlowHeroElementsMock \/>/, 'the Flow hero pitches Elements (operator 2026-10-27)');
assert.match(mock, /src="\/logos\/orionfold-mark-3d-32\.png"/, 'native mock reuses the shared small brand mark');
assert.match(css,/backdrop-filter:/);
assert.match(css,/prefers-reduced-motion/);
assert.match(page,/<ConfirmBanner \/>/);
assert.match(page,/SoftwareApplication/);
assert.match(read('src/data/og.ts'), /ogVersion\(p\)/, 'social URLs remain content-versioned');
assert.match(read('src/lib/og/card.ts'),/hasShot \? 560 : 900/, 'other shot-based cards still reserve room for their screenshots');
console.log('home hero: approved origami, native interactive mock, metadata and confirmation seams');
