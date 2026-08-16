// Story RSS feed contracts. The feed is generated at build time by
// src/pages/story/rss.xml.ts and is a PUBLISHED interface: feed readers keep
// subscriptions keyed on <guid>, so the URL shape and the escaping are the two
// things that must not regress silently.
//
// Runs against dist/, so it needs a build first (npm run test:regression builds
// before calling this, same as the other dist-reading contracts).
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const distPath = new URL('../../dist/story/rss.xml', import.meta.url);
assert.ok(existsSync(distPath), 'the story feed must be emitted to dist/story/rss.xml');
const xml = readFileSync(distPath, 'utf8');

// ── Channel envelope ───────────────────────────────────────────────────────
assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, 'the feed must open with an XML declaration');
assert.match(xml, /<rss version="2\.0"/, 'RSS 2.0');
assert.match(xml, /<title>Orionfold Story<\/title>/);
assert.match(xml, /<link>https:\/\/orionfold\.com\/story\/<\/link>/);
assert.match(xml, /<atom:link href="https:\/\/orionfold\.com\/story\/rss\.xml" rel="self"/, 'the self link lets readers canonicalize the feed URL');
assert.match(xml, /<language>en-us<\/language>/);

// ── Items: one per published story, absolute URLs ──────────────────────────
const items = xml.match(/<item>/g) ?? [];
assert.ok(items.length >= 20, `the feed must carry the story archive, found ${items.length} items`);
const guids = [...xml.matchAll(/<guid isPermaLink="true">([^<]+)<\/guid>/g)].map((m) => m[1]);
assert.equal(guids.length, items.length, 'every item needs a guid so readers can dedupe');
assert.equal(new Set(guids).size, guids.length, 'guids must be unique');
for (const guid of guids) {
  assert.match(guid, /^https:\/\/orionfold\.com\/story\/[a-z0-9-]+\/$/, `guid must be an absolute canonical story URL: ${guid}`);
}
// Relative links break in every feed reader; absolute is the whole contract.
assert.doesNotMatch(xml, /<link>\/story\//, 'item links must be absolute, never root-relative');

// ── Dates: RFC-822, newest first ───────────────────────────────────────────
const dates = [...xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) => m[1]);
assert.ok(dates.length >= items.length, 'every item needs a pubDate');
for (const d of dates) {
  assert.ok(!Number.isNaN(Date.parse(d)), `pubDate must be a parseable RFC-822 date: ${d}`);
  assert.match(d, /GMT$/, `pubDate must be UTC: ${d}`);
}
// Skip index 0: that is the channel-level lastBuildDate, not an item.
const itemDates = dates.slice(1).map((d) => Date.parse(d));
const sortedDesc = [...itemDates].sort((a, b) => b - a);
assert.deepEqual(itemDates, sortedDesc, 'items must stay newest first, matching the /story/ index');

// ── Escaping: author prose contains & and quotes ───────────────────────────
// A single raw & makes the whole feed unparseable, which is exactly the kind of
// break that ships unnoticed because the site itself still renders fine.
const rawAmp = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g) ?? [];
assert.equal(rawAmp.length, 0, `every ampersand must be escaped, found ${rawAmp.length} raw`);

// ── Autodiscovery: readers find the feed from any page ─────────────────────
for (const page of ['dist/index.html', 'dist/story/index.html']) {
  const html = readFileSync(new URL(`../../${page}`, import.meta.url), 'utf8');
  assert.match(
    html,
    /<link rel="alternate" type="application\/rss\+xml" title="Orionfold Story" href="\/story\/rss\.xml"/,
    `${page} must advertise the feed for autodiscovery`,
  );
}

console.log(`[story-rss-feed] ${items.length} stories in a well-formed, escaped, newest-first RSS 2.0 feed`);
