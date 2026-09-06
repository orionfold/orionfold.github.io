import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
for (const [page,hero,art] of [['index','HomeHero','home'],['flow','FlowHero','flow']]) {
 const route=read(`src/pages/${page}.astro`), composition=read(`src/components/living/${hero}.astro`);
 assert.match(route,new RegExp(`<${hero} \\/>`));
 assert.match(composition,page === 'index' ? /<HomeKnowledgeDemo \/>/ : /<ProductDemo \/>/);
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
