import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const path=p=>new URL(`../../dist/${p}`,import.meta.url);
if(!existsSync(path('index.html'))){console.log('# skip hero priority: dist missing');process.exit(0);}
for(const [route,kind,priority] of [['index.html','home','low'],['flow/index.html','flow','high']]) {
 const html=readFileSync(path(route),'utf8');
 const main=html.split('<main')[1]?.split('</main>')[0]??'';
 // The heading is the observed homepage LCP. Give its font/CSS priority;
 // the measured Flow route retains high priority for its lighter hero art.
 const hero=main.split('</section>')[0];
 const art=[...hero.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).filter(tag=>tag.includes(`hero-${kind}-paper-planes`));
 assert.equal(art.length,1,`${route}: one primary decorative hero image`);
 assert.match(art[0],new RegExp(`fetchpriority="${priority}"`),`${route}: measured route-specific image priority`);
 assert.match(art[0],/alt=""/,'origami remains decorative');
 assert.doesNotMatch(art[0],/loading="lazy"/,'hero art keeps eager/default delivery');
 assert.match(art[0],/width="1642"/);assert.match(art[0],/height="958"/);
 assert.match(main,new RegExp(`<source[^>]+srcset="/assets/living-systems/hero-${kind}-paper-planes\\.webp"`));
 assert.doesNotMatch(main,/first-launch-home-hero|first-launch-flow-hero|pit-stop-daylight|FlowShot/);
 assert.match(main,/data-demo=/,'hero uses the native interactive model');
}
console.log('# measured per-route origami priority, eager delivery and stable dimensions pass');
