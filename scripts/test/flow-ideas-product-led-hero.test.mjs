import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
// Paper R2 (operator 2026-10-30): the home hero is the Talk→Page playbook mock,
// the artifact itself, with the download still attributed to home-hero.
const homeRoute=read('src/pages/index.astro');
assert.match(homeRoute,/<TalkPageHero faces=\{happy\} ctaHref=\{flowDownloadHref\}[^>]*ctaTrack=\{flowLive \? 'home-hero' : undefined\}>/);
assert.match(read('src/components/paper/TalkPageHero.astro'),/data-flow-download=\{ctaTrack\}/);
assert.doesNotMatch(homeRoute,/FlowShot|FlowLaunchHomeHero|home-variants|data-home-variant|FlowRaceBlueprint|<video/);
for (const [page,hero,art] of [['flow','FlowHero','flow']]) {
 const route=read(`src/pages/${page}.astro`), composition=read(`src/components/living/${hero}.astro`);
 assert.match(route,new RegExp(`<${hero} \\/>`));
 // Operator 2026-10-27: the homepage hero pitches Flow Domains, the /flow/ hero
 // Flow Elements, and both buttons read Download Flow Now.
 assert.match(composition,page === 'index' ? /<HomeHeroDomainMock \/>/ : /<FlowHeroElementsMock \/>/);
 assert.match(composition,/>Download Flow Now</);
 assert.match(composition,/data-flow-download=\{ORIONFOLD_FLOW_LIVE \? '(home|flow)-hero' : undefined\}/);
 assert.match(composition,new RegExp(`hero-${art}-paper-planes\\.webp`));
 assert.doesNotMatch(route+composition,/FlowShot|FlowLaunchHomeHero|home-variants|data-home-variant|FlowRaceBlueprint|<video/);
 const bytes=statSync(new URL(`../../public/assets/living-systems/hero-${art}-paper-planes.webp`,import.meta.url)).size;
 assert.ok(bytes>10000 && bytes<70000,`${art}: meaningful approved art stays under70KB`);
}
const runtime=read('src/scripts/living-documents.js');
assert.match(runtime,/IntersectionObserver/);
assert.match(runtime,/document\.hidden/);
assert.match(runtime,/prefers-reduced-motion/);
assert.doesNotMatch(runtime,/fetch\(|XMLHttpRequest|showModal|data-launch-action|data-signup/);
assert.doesNotMatch(read('src/pages/essay.astro'),/living-documents\.js/, 'typography-only essay does not load mock runtime');
console.log('Flagship hero: native model, approved light origami, proportional image and runtime budget');
