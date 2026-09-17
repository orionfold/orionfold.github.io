import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const built = route => read(`dist${route}index.html`);
const essay = '/essays/the-work-we-want-to-keep/';
const article = built(essay), hub = built('/essays/');
function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1]));
}
test('the editorial hub and both essays retain distinct, discoverable canonical identities', () => {
  for (const route of ['/essays/', essay, '/essay/']) {
    const html = built(route);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, route);
    assert.ok(html.includes(`rel="canonical" href="https://orionfold.com${route}"`), route);
    assert.ok(html.includes('href="/essays/"'), 'global Essays navigation');
    assert.ok(html.includes('href="/story/rss.xml"'), 'RSS autodiscovery');
    const image = html.match(/property="og:image" content="https:\/\/orionfold.com([^"?]+)(?:\?[^" ]*)?"/)?.[1];
    assert.ok(image && existsSync(new URL(`dist${image}`, root)), `${route}: real generated OG image`);
  }
  const collection = schemas(hub).find(s => s['@type'] === 'CollectionPage');
  assert.deepEqual(collection.mainEntity.itemListElement.map(i => i.item.url), [
    `https://orionfold.com${essay}`, 'https://orionfold.com/essay/',
  ]);
  const a = schemas(article).find(s => s['@type'] === 'Article');
  assert.equal(a.mainEntityOfPage, `https://orionfold.com${essay}`);
  assert.equal(a.author.name, 'Manav Sehgal');
  assert.equal(a.isPartOf.url, 'https://orionfold.com/essays/');
  assert.equal(schemas(built('/essay/')).find(s => s['@type'] === 'Article').datePublished, '2026-09-06T00:00:00.000Z');
});
test('flagship body, chapter links and clean native figures survive the static build', () => {
  assert.ok(article.indexOf('Why we are going the other way') < article.indexOf('The personal computer becomes an AI workshop'), 'the human-agency argument opens the thesis');
  assert.match(article, /data-scenario="portfolio" data-mode="review"/);
  assert.match(article, /href="\/flow\/#jobs-workbench"/);
  const ids = [...article.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'no duplicated chapter or walkthrough IDs');
  for (const [,anchor] of article.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), `chapter resolves: ${anchor}`);
  for (const [,src] of article.matchAll(/(?:src|href)="(\/essay\/the-work-we-want-to-keep\/[^"#?]+)"/g)) {
    assert.ok(existsSync(new URL(`dist${src}`, root)), `native capture resolves: ${src}`);
  }
  const manuscript = read('public/downloads/the-work-we-want-to-keep.md');
  assert.ok(manuscript.split(/\s+/).length > 7500, 'the download contains the complete essay');
  assert.doesNotMatch(article + manuscript, /\/Users\/|website-essay-handoff|shot-manifest|publish_ready|internal_only|run-jobs-landed-review-ready|jobs-workbench-edit\.png/);
});
test('flagship paper downloads sit at chapter breaks and share the live download contract', () => {
  const prose = article.slice(article.indexOf('<article class="ed-prose"'), article.indexOf('</article>'));
  const bands = [...prose.matchAll(/<aside\b(?=[^>]*data-cta-layout="article")[^>]*>[\s\S]*?<\/aside>/g)];
  const placements = [
    ['workshop', 'Build your own AI workshop.', 'why-we-are-going-the-other-way', 'the-tax-on-coming-back'],
    ['first-job', 'Give one document a job.', 'give-one-document-a-real-responsibility', 'jobs-that-meet-the-actual-page'],
    ['closing', 'Make your next document a living one.', 'what-we-get-to-carry-forward', null],
  ];
  assert.equal(bands.length, placements.length, 'three paper cards within the essay body');
  const flowAnchor = built('/flow/').match(/<a\b[^>]*data-flow-download="[^"]+"[^>]*>/)?.[0];
  const flowDownload = flowAnchor?.match(/href="([^"]+)"/)?.[1];
  assert.ok(flowDownload?.includes('/flow-downloads/Orionfold-Flow.dmg'), 'the landing page has a live download target');
  for (let index = 0; index < placements.length; index++) {
    const [source, heading, after, before] = placements[index];
    const band = bands[index][0];
    const anchor = band.match(/<a\b[^>]*data-flow-download="[^"]+"[^>]*>/)?.[0];
    assert.ok(anchor, `${source}: download remains available`);
    assert.ok(anchor.includes(`data-flow-download="essay-work-we-want-to-keep-${source}"`), `${source}: distinct attribution`);
    assert.equal(anchor.match(/href="([^"]+)"/)?.[1], flowDownload, `${source}: shared download target`);
    const text = band.replace(/<br\s*\/?\s*>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    assert.ok(text.includes(heading), `${source}: approved contextual heading`);
    assert.ok(bands[index].index > prose.indexOf(`id="${after}"`), `${source}: follows its chapter`);
    const next = before ? prose.indexOf(`id="${before}"`) : prose.indexOf('class="ed-author-bio"');
    assert.ok(next > bands[index].index + band.length, `${source}: precedes the next chapter or author bio`);
  }
  assert.doesNotMatch(prose, /and begin with one piece of working knowledge of your own/);
  assert.match(read('public/downloads/the-work-we-want-to-keep.md'), /\[Download Flow\]\(https:\/\/orionfold\.com\/flow\/\) and begin with one piece of working knowledge of your own\./);
});
test('the launch preview preserves downloads while extending sitemap and AI discovery', () => {
  const sitemap = readdirSync(new URL('dist/', root)).filter(p => /^sitemap.*\.xml$/.test(p)).map(p => read(`dist/${p}`)).join('');
  for (const route of ['/essays/', essay, '/essay/']) {
    assert.ok(sitemap.includes(`<loc>https://orionfold.com${route}</loc>`));
    assert.ok(read('public/llms.txt').includes(`https://orionfold.com${route}`));
  }
  for (const route of ['/', '/flow/']) {
    const html = built(route);
    assert.match(html, /flow-downloads\/Orionfold-Flow\.dmg/);
    assert.match(html, /data-theme="light"/);
  }
  assert.match(built('/flow/'), /MEET FLOW 1\.7/);
  assert.match(built('/flow/'), /data-jobs-demo/);
});
