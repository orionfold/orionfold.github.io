import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const read = file => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');

test('shared Living Systems actions preserve product intent and transactional hooks', () => {
  const flow = read('src/components/flow/FlowDownloadCta.astro');
  assert.match(flow, /href=\{FLOW_DMG_URL\}/);
  assert.match(flow, /data-flow-download=\{source\}/);
  const paper = read('src/components/ui/PaperCta.astro');
  assert.match(paper, /FlowDownloadCta source=\{source\}/);
  assert.match(flow, /FLOW_DOWNLOAD_CAPTION/, 'the shared download owns the exact free/trial caption');
  assert.doesNotMatch(paper, /showCaption=\{false\}/, 'band action keeps the shared caption visible');
  assert.match(read('src/components/product/BuyBox.astro'), /data-checkout=\{view.lookupKey\}/);
  assert.match(read('src/components/product/BuyBox.astro'), /id="buybox-err" role="alert"/);
  assert.match(read('src/components/relay/RelayCtaBand.astro'), /href = '\/relay\/'/);
  assert.match(read('src/components/sections/StorySubscribe.astro'), /<WaitlistForm/);
  assert.doesNotMatch(read('src/components/story/FlowStoryCta.astro'), /FlowRaceBlueprint|<Image/);
});

test('shared shell retains semantic metadata and private-page protections', () => {
  const layout = read('src/layouts/Layout.astro');
  for (const contract of ['application/ld+json', 'captureAttribution', 'data-flow-download', 'canonicalURL', 'twitter:card', 'og:image:alt']) assert.ok(layout.includes(contract), contract);
  assert.match(layout, /SERVICE_MODE === 'production' \? requestedNoindex : true/);
  const privateLayout = read('src/layouts/PrivateLayout.astro');
  assert.match(privateLayout, /noindex,nofollow/);
  assert.match(privateLayout, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(privateLayout, /gtag|fbq|captureAttribution/);
  const footer = read('src/components/Footer.astro');
  assert.doesNotMatch(footer, /getCollection|detailKeySet|softwareLinks|latestStories/, 'curated footer does not load the removed directory');
  assert.match(footer, /showDownload && ORIONFOLD_FLOW_LIVE && <PaperCta source=\{downloadSource\} tone="yellow" \/>/, 'the single closing CTA preserves gating and attribution');
  assert.equal((footer.match(/<h2 id="footer-/g) ?? []).length, 3, 'the menu has exactly three headings');
  for (const heading of ['Flow', 'Orionfold', 'Connect']) assert.match(footer, new RegExp('>' + heading + '<\/h2>'));
  assert.match(footer, /href="https:\/\/www\.linkedin\.com\/in\/manavsehgal\/"/);
  assert.doesNotMatch(footer, /youtube\.com/);
  assert.match(footer, /<Wordmark size=\{28\} \/>/);
  for (const href of ['/promise/', '/terms/', '/privacy/']) assert.ok(footer.includes("href: '" + href + "'"));
  assert.doesNotMatch(footer, /Site source: Apache/);
});

test('primary CTA palette clears normal-text AA contrast, distinct from editorial red', () => {
  const css = read('src/styles/living-system.css');
  const luminance = hex => {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  };
  for (const token of ['living-action','living-action-hover']) {
    const value=css.match(new RegExp(`--${token}: #(\\w{6})`))[1];
    assert.ok(1.05/(luminance(value)+.05)>=4.5, token);
  }
  assert.match(css, /--living-red: #f24b39/);
  assert.ok(existsSync(new URL('../../public/fonts/barlow-condensed-bold.woff2',import.meta.url)));
});

test('code tabs support roving keyboard focus and do not duplicate listeners after navigation', () => {
  const source=read('src/components/product/CodeTabs.astro');
  for(const attr of ['aria-controls=', 'aria-labelledby=', 'role="tabpanel"','tabindex=']) assert.ok(source.includes(attr));
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const listeners = [];
  const tabs=[0,1,2].map(i=>({dataset:{tab:String(i)},tabIndex:i===0?0:-1,attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.events[k]=fn;listeners.push(k)},focus(){this.focused=true}}));
  const panels=[0,1,2].map(i=>({dataset:{panel:String(i)},hidden:i!==0}));
  const root={dataset:{},querySelectorAll:sel=>sel==='[data-tab]'?tabs:panels,querySelector:()=>null};
  const after=[];
  runInNewContext(ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,{document:{querySelectorAll:()=>[root],addEventListener:(_e,f)=>after.push(f)}});
  const key=(idx,key)=>{let prevented=false;tabs[idx].events.keydown({key,preventDefault(){prevented=true}});return prevented};
  assert.equal(key(0,'ArrowRight'),true);
  assert.deepEqual(tabs.map(t=>t.tabIndex),[-1,0,-1]);
  assert.deepEqual(panels.map(p=>p.hidden),[true,false,true]);
  assert.equal(tabs[1].focused,true);
  key(1,'End');assert.deepEqual(panels.map(p=>p.hidden),[true,true,false]);
  key(2,'ArrowRight');assert.deepEqual(panels.map(p=>p.hidden),[false,true,true]);
  key(0,'ArrowLeft');assert.deepEqual(panels.map(p=>p.hidden),[true,true,false]);
  key(2,'Home');assert.deepEqual(panels.map(p=>p.hidden),[false,true,true]);
  assert.equal(key(0,'Tab'),false);
  const count=listeners.length;after.forEach(fn=>fn());assert.equal(listeners.length,count);
});
