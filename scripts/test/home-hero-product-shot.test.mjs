import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
// Paper R2 (G-141, operator 2026-10-30): the home hero is the Talk→Page mock.
// A person says how they work, their Fold turns it into a playbook, and step 3
// stays the expert's call. The Living HomeHero is unused until R8 retires it.
const page=read('src/pages/index.astro'), hero=read('src/components/paper/TalkPageHero.astro');
const sheet=read('src/components/paper/PlaybookSheet.astro'), cast=read('src/lib/paper/cast.ts');
assert.match(page, /<TalkPageHero /);
assert.doesNotMatch(page, /<HomeHero[\s/>]|FlowShot|pit-stop-daylight|FlowRaceBlueprint|<video/);
assert.match(page, /<h1 slot="title" class="pp-h1 pp-h1--lines"><span class="pp-h1-line">Teach your expertise to an AI team\./);
assert.match(page, /<span class="pp-hl">a playbook<\/span>/, 'the hook word is "playbook"');
// Without the script (or with reduced motion) the first Fold's finished page is plain HTML.
assert.match(hero, /data-act="page"/);
assert.match(hero, /prefers-reduced-motion/);
assert.match(hero, /'YOUR CALL'/, 'step 3 is always the expert’s call');
assert.match(sheet, /Step 3 is your call\./);
// Sample clients come only from the blueprints' own mocks (guarded in paper-design-system).
assert.match(cast, /Sample clients come only from each blueprint's mock\.client; never invent one\./);
assert.match(page,/<ConfirmBanner \/>/);
assert.match(page,/SoftwareApplication/);
assert.match(read('src/data/og.ts'), /ogVersion\(p\)/, 'social URLs remain content-versioned');
assert.match(read('src/lib/og/card.ts'),/const titleWidth = hasShot \? 520 : 560;/, 'shot-based cards still reserve room for their screenshots');
console.log('home hero: Talk→Page playbook mock, locked headline, metadata and confirmation seams');
