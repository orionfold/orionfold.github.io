import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const path=p=>new URL(`../../dist/${p}`,import.meta.url);
if(!existsSync(path('index.html'))){console.log('# skip hero priority: dist missing');process.exit(0);}
// Paper R2 (G-141): the home hero is the Talk→Page mock; its H1 is the LCP
// element, so no hero image is large or asks for priority.
{
 const html=readFileSync(path('index.html'),'utf8');
 const hero=(html.split('<main')[1]??'').split('</section>')[0];
 assert.match(hero,/<h1 class="pp-h1[^"]*">/,'home: the H1 leads the hero');
 assert.doesNotMatch(hero,/fetchpriority="high"|hero-home-paper-planes/,'home: no hero image competes with the H1');
 for (const tag of hero.match(/<img\b[^>]*>/g) ?? []) assert.ok(Number(tag.match(/width="(\d+)"/)?.[1] ?? 0) <= 400,'home: hero faces stay small');
}
// Paper R4 (G-143): the /flow/ hero is the native Elements walk beside the H1, so
// the H1 is the LCP element and no hero image asks for priority.
{
 const html=readFileSync(path('flow/index.html'),'utf8');
 const main=html.split('<main')[1]?.split('</main>')[0]??'';
 const hero=main.split('</section>')[0];
 assert.match(hero,/<h1[^>]*class="pp-h1"/,'flow: the H1 leads the hero');
 assert.doesNotMatch(hero,/fetchpriority="high"|hero-flow-paper-planes/,'flow: no hero image competes with the H1');
 assert.match(hero,/class="dm dm--hero fe"/,'flow: hero uses a native product mock');
 assert.doesNotMatch(main,/first-launch-home-hero|first-launch-flow-hero|pit-stop-daylight|FlowShot/);
}
console.log('# measured per-route origami priority, eager delivery and stable dimensions pass');
