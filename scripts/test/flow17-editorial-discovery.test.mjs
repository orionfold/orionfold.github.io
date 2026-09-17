import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const built = route => read(`dist${route}index.html`);
const essay = '/essays/the-work-we-want-to-keep/';
const notes = `${essay}notes/`;
const article = built(essay), hub = built('/essays/');
const chunkPaths = ['opening', 'working-knowledge', 'before-review', 'after-review']
  .map(part => `src/editorial/the-work-we-want-to-keep-${part}.md`);
const chunks = chunkPaths.map(read);
const normalize = value => value.replace(/\s+/g, ' ').trim();
const onlineLinks = value => value.replace(/\]\(\/(?!\/)/g, '](https://orionfold.com/');
const proseWords = normalize(chunks.join('\n\n')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/^#{1,6}\s+/gm, '')).split(/\s+/).length;
const prose = article.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1] || '';
function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1]));
}
function section(id) {
  const start = article.indexOf(`<section id="${id}"`);
  assert.ok(start >= 0, `illustration section exists: ${id}`);
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag; (tag = tags.exec(article));) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return article.slice(start, tags.lastIndex);
  }
  assert.fail(`illustration section closes: ${id}`);
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
test('the flagship keeps one Customer Research arc with two independent demos and a static Jobs map', () => {
  const first = section('essay-first-job');
  const map = section('essay-jobs-map');
  const review = section('essay-review-decision');
  assert.equal((article.match(/<section\b[^>]*\bdata-essay-illustration(?:\s|=|>)/g) || []).length, 3);
  assert.ok(article.indexOf(first) < article.indexOf(map) && article.indexOf(map) < article.indexOf(review));
  assert.equal((article.match(/\bdata-jobs-demo(?:\s|=|>)/g) || []).length, 2);
  assert.match(first, /data-scenario="customer" data-mode="full"/);
  assert.match(review, /data-scenario="customer" data-mode="review"/);
  assert.match(map, /<figure\b[^>]*aria-label="[^"]*Customer Research/);
  assert.match(map, /Interview Register\.md/);
  assert.match(map, /Research Refresh\.md/);
  assert.match(map, /Research Brief/);
  assert.doesNotMatch(map, /<button\b|<input\b|\bdata-jobs-demo\b/, 'the relationship illustration has no dead controls');
  assert.doesNotMatch(prose, /data-scenario="portfolio"|(?:src|href)="\/essay\/the-work-we-want-to-keep\//, 'the three product captures are replaced by the shared research arc');
  const footnotes = [...article.matchAll(/<p\b[^>]*id="essay-illustration-note"[^>]*>[\s\S]*?<\/p>/g)];
  assert.equal(footnotes.length, 1, 'one shared product-illustration disclosure');
  assert.match(footnotes[0][0], /role="note"/);
  assert.match(footnotes[0][0], /fictional Customer Research data/);
  assert.match(first, /<h2\b[^>]*>[\s\S]*?<a\b[^>]*href="#essay-illustration-note"[^>]*>\*<\/a>[\s\S]*?<\/h2>/);
  assert.match(article, /href="\/flow\/#jobs-workbench"/);
  const ids = [...article.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'no duplicated chapter or walkthrough IDs');
  for (const [,anchor] of article.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), `chapter resolves: ${anchor}`);
});
test('the full essay download and reading time follow the four source prose chunks', () => {
  const manuscript = read('public/downloads/the-work-we-want-to-keep.md');
  assert.ok(proseWords >= 3500 && proseWords <= 4500, `main essay stays within its reading brief: ${proseWords} words`);
  assert.match(manuscript, /^# The Work We Want to Keep\s*$/m);
  assert.match(manuscript.slice(0, manuscript.indexOf(chunks[0].trim().split('\n')[0])), /Manav Sehgal/, 'the download retains its byline');
  const download = normalize(manuscript);
  let previousEnd = -1;
  for (let index = 0; index < chunks.length; index++) {
    const chunk = normalize(onlineLinks(chunks[index]));
    const position = download.indexOf(chunk);
    assert.ok(position > previousEnd, `${chunkPaths[index]} appears completely and in reading order`);
    assert.equal(download.indexOf(chunk, position + 1), -1, `${chunkPaths[index]} is included once`);
    previousEnd = position + chunk.length - 1;
  }
  const footer = download.slice(previousEnd + 1);
  assert.match(footer, /\[Download Flow\]\(https:\/\/orionfold\.com\/flow\/\)/, 'download has its final product link');
  assert.ok(footer.includes(`https://orionfold.com${essay}`), 'offline readers can return to the interactive illustrations');
  const minutes = Math.ceil(proseWords / 230);
  assert.equal(schemas(article).find(s => s['@type'] === 'Article').timeRequired, `PT${minutes}M`);
  assert.ok(article.includes(`${minutes} minute read`), 'visible reading time matches the source prose');
  assert.doesNotMatch(article + manuscript, /\/Users\/|website-essay-handoff|shot-manifest|publish_ready|internal_only|run-jobs-landed-review-ready|jobs-workbench-edit\.png/);
});
test('flagship paper downloads sit at chapter breaks and share the live download contract', () => {
  const bands = [...prose.matchAll(/<aside\b(?=[^>]*data-cta-layout="article")[^>]*>[\s\S]*?<\/aside>/g)];
  const lastChapter = chunks[3].match(/^##\s+(.+)$/gm)?.at(-1)?.replace(/^##\s+/, '');
  assert.ok(lastChapter, 'the concluding source chapter is available');
  const placements = [
    ['workshop', 'Give one document a job.', prose.indexOf(section('essay-first-job')) + section('essay-first-job').length, prose.indexOf('id="essay-jobs-map"')],
    ['first-job', 'Return to work you understand.', prose.indexOf(section('essay-review-decision')) + section('essay-review-decision').length, prose.indexOf(lastChapter)],
    ['closing', 'Make your next document a living one.', prose.indexOf(lastChapter), prose.indexOf('aria-label="About the author"')],
  ];
  assert.equal(bands.length, placements.length, 'three paper cards within the essay body');
  assert.equal((article.match(/<aside\b[^>]*\bdata-cta-layout=/g) || []).length, 3, 'the footer does not repeat the concluding download card');
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
    assert.ok(after >= 0 && bands[index].index >= after, `${source}: follows the complete illustration or concluding chapter`);
    assert.ok(before > bands[index].index + band.length, `${source}: precedes the next reading section or author bio`);
  }
  assert.doesNotMatch(prose, /and begin with one piece of working knowledge of your own/);
});
test('research notes are a linked companion WebPage, not a third essay or duplicate RSS article', () => {
  const html = built(notes);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="https://orionfold.com${notes}"`));
  assert.match(html, /<title>[^<]*Research Notes[^<]*<\/title>/);
  const description = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/)?.[1];
  assert.ok(description && description.length > 50, 'research notes have their own useful description');
  assert.notEqual(description, article.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/)?.[1]);
  const page = schemas(html).find(s => s['@type'] === 'WebPage');
  assert.ok(page, 'notes describe a WebPage');
  assert.equal(page.url, `https://orionfold.com${notes}`);
  assert.equal(page.isPartOf.url, `https://orionfold.com${essay}`);
  assert.ok(!schemas(html).some(s => s['@type'] === 'Article'), 'notes do not claim a separate essay identity');
  assert.ok(prose.includes(`href="${notes}"`), 'essay links to its research');
  assert.ok(html.includes(`href="${essay}"`), 'research links back to the essay');
  const rss = read('dist/story/rss.xml');
  for (const route of [essay, '/essay/']) assert.ok(rss.includes(`<link>https://orionfold.com${route}</link>`), `${route}: essay remains in RSS`);
  assert.ok(!rss.includes(`<link>https://orionfold.com${notes}</link>`), 'notes do not create a third essay feed entry');
});
test('the launch preview preserves downloads while extending sitemap and AI discovery', () => {
  const sitemap = readdirSync(new URL('dist/', root)).filter(p => /^sitemap.*\.xml$/.test(p)).map(p => read(`dist/${p}`)).join('');
  for (const route of ['/essays/', essay, '/essay/', notes]) {
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
