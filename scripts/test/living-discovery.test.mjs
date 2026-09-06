import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const pages=['/','/flow/','/essay/','/manifesto/'];
const built=route=>read(`dist${route}index.html`);
const meta=(html,name)=>html.match(new RegExp(`<meta[^>]*(?:name|property)="${name}"[^>]*content="([^"]+)"`))?.[1];
test('Living pages have canonical discovery and unique matching social cards',()=>{
 const seen=new Set();
 for(const route of pages){
  const html=built(route);assert.equal((html.match(/<h1\b/g)||[]).length,1,route);
  assert.ok(html.includes(`rel="canonical" href="https://orionfold.com${route}"`),route);
  const card=meta(html,'og:image');assert.ok(card?.startsWith('https://orionfold.com/og/'));assert.ok(!seen.has(card));seen.add(card);
  const bytes=readFileSync(new URL('dist'+new URL(card).pathname,root));assert.ok(bytes.length>1000);
  assert.equal(meta(html,'og:title'),meta(html,'twitter:title'));
  assert.equal(meta(html,'og:image:width'),'1200');assert.equal(meta(html,'og:image:height'),'630');
  assert.doesNotMatch(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),/Private Review|Private review: nothing|Free Starter Kit/);
 }
});
test('New writing has timezone-qualified Article dates and a named author',()=>{
 for(const route of ['/essay/','/manifesto/']){
  const html=built(route);const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).flat();
  const article=schemas.find(x=>x['@type']==='Article');assert.ok(article,route);assert.equal(article.author.name,'Manav Sehgal');
  for(const k of ['datePublished','dateModified'])assert.match(article[k],/^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(article.mainEntityOfPage,`https://orionfold.com${route}`);
 }
 assert.equal((built('/manifesto/').match(/data-principle="true"/g)||[]).length,18,'all eighteen principles are server-rendered');
});
test('Every authored page receives the shared design system; demo bundles and redirect stubs remain separate',()=>{
 let checked=0;
 function visit(dir){for(const name of readdirSync(dir)){const p=path.join(dir,name);if(statSync(p).isDirectory())visit(p);else if(p.endsWith('.html')){
  const rel=p.replaceAll('\\','/');if(/\/dist\/(arena|relay)\/demo\//.test(rel))continue;
  const html=readFileSync(p,'utf8');if(/http-equiv="refresh"/i.test(html))continue;
  assert.match(html,/<body[^>]*class="[^"]*\bliving-site\b/,rel);checked++;
 }}}
 visit(new URL('dist',root).pathname);assert.ok(checked>130,`covered ${checked} authored pages`);
});
