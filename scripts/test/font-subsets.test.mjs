import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const manifest=JSON.parse(read('public/fonts/subsets.json'));
const css=read('src/styles/global.css')+'\n'+read('src/styles/living-system.css');
const expand=range=>range.split(',').flatMap(part=>{
 const [start,end]=part.trim().replace(/^U\+/,'').split('-').map(n=>Number.parseInt(n,16));
 return Array.from({length:(end??start)-start+1},(_,i)=>start+i);
});
test('exact-face font subsets retain a complete, disjoint original Unicode fallback',()=>{
 for(const font of manifest.fonts){
  const included=font.includedCodepoints;
  const fallback=font.fallbackCodepoints;
  assert.equal(new Set([...included,...fallback]).size,included.length+fallback.length,'no overlap or lost codepoint in coverage partition');
  assert.equal(included.length+fallback.length,font.family==='Geist Sans'?538:525,'original encoded coverage retained');
  for(const [file,expected,range]of[[font.subset,font.subsetSha256,included],[font.original,font.originalSha256,fallback]]){
   const bytes=readFileSync(new URL('public/fonts/'+file,root));
   assert.equal(bytes.toString('ascii',0,4),'wOF2');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`${file}: glyph/metric-verified asset remains exact`);
   const faces=[...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(m=>m[1]).filter(block=>block.includes(`/fonts/${file}'`));
   assert.equal(faces.length,1,`${file}: one canonical font-face`);
   const declared=faces[0].match(/unicode-range:\s*([^;]+);/)[1];
   assert.deepEqual(expand(declared),range,`${file}: CSS coverage matches verified glyph coverage`);
  }
 }
 const layout=read('src/layouts/Layout.astro');
 assert.match(layout,/href="\/fonts\/geist-sans-common-400-normal\.woff2"/);
 assert.match(layout,/href="\/fonts\/barlow-condensed-bold-common\.woff2"/);
 assert.doesNotMatch(layout,/rel="preload"[^>]+href="\/fonts\/(?:geist-sans-latin-400-normal|barlow-condensed-bold)\.woff2"/);
 assert.ok(manifest.fonts.reduce((n,font)=>n+font.subsetBytes,0)<=65000,'common display/body font budget');
 assert.match(read('public/fonts/Geist-OFL.txt'),/SIL OPEN FONT LICENSE/);
 assert.match(read('public/fonts/Barlow-OFL.txt'),/SIL OPEN FONT LICENSE/);
});
