import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
// Paper R2 (operator 2026-10-30): the home hero is the Talk→Page playbook mock,
// the artifact itself, with the download still attributed to home-hero.
const homeRoute=read('src/pages/index.astro');
assert.match(homeRoute,/<TalkPageHero faces=\{happy\} ctaHref=\{flowDownloadHref\}[^>]*ctaTrack=\{flowLive \? 'home-hero' : undefined\}>/);
assert.match(read('src/components/paper/TalkPageHero.astro'),/data-flow-download=\{ctaTrack\}/);
assert.doesNotMatch(homeRoute,/FlowShot|FlowLaunchHomeHero|home-variants|data-home-variant|FlowRaceBlueprint|<video/);
// Paper R4 (G-143): the /flow/ hero is the live Elements walk, the artifact
// itself; the download is still attributed to flow-hero.
const flowRoute=read('src/pages/flow.astro');
assert.match(flowRoute,/<FlowHeroElementsMock \/>/);
assert.match(flowRoute,/data-flow-download=\{ORIONFOLD_FLOW_LIVE \? 'flow-hero' : undefined\}/);
assert.doesNotMatch(flowRoute,/FlowShot|FlowLaunchHomeHero|home-variants|data-home-variant|FlowRaceBlueprint|<video/);
const runtime=read('src/scripts/living-documents.js');
assert.match(runtime,/IntersectionObserver/);
assert.match(runtime,/document\.hidden/);
assert.match(runtime,/prefers-reduced-motion/);
assert.doesNotMatch(runtime,/fetch\(|XMLHttpRequest|showModal|data-launch-action|data-signup/);
assert.doesNotMatch(read('src/pages/essay.astro'),/living-documents\.js/, 'typography-only essay does not load mock runtime');
console.log('Flagship hero: native mock, attributed download and runtime budget');
