// Contracts for the Sparkle update feed served at /flow/appcast.xml.
//
// WHAT THESE PROTECT, and why they are worth their weight. Sparkle's defining
// failure mode is SILENT: it decides "is there an update" by comparing
// `CFBundleVersion`, and a non-increasing build number produces "you are up to
// date" with no error, no log line, and a feed that validates perfectly. Every
// Flow build before 0127 A4 shipped build `1`. So the assertions below are
// aimed squarely at the class of defect that looks healthy from the outside.
//
// The feed URL is also a ONE-WAY DOOR — `SUFeedURL` is baked into the notarized
// bundle, so a change here strands every installed copy. That is asserted too.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { renderAppcast, validate } from '../build-flow-appcast.mjs';
import { FEED_URL, latestRelease, RELEASES } from '../../src/data/flow-releases.ts';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// The committed artifact
// ---------------------------------------------------------------------------

assert.ok(
  existsSync(new URL('../../public/flow/appcast.xml', import.meta.url)),
  'public/flow/appcast.xml must exist — the app 404s on a missing feed, and a ' +
  '404 is the fail-soft error state we are shipping this to remove',
);

const xml = read('public/flow/appcast.xml');

// The committed file must be exactly what the generator produces from the
// committed data. Otherwise someone hand-edited the XML and the next run of
// `npm run build:appcast` silently reverts it.
assert.equal(
  xml,
  renderAppcast(RELEASES),
  'public/flow/appcast.xml is stale or hand-edited — run `npm run build:appcast`',
);

// ---------------------------------------------------------------------------
// The one-way door
// ---------------------------------------------------------------------------

assert.equal(
  FEED_URL,
  'https://orionfold.com/flow/appcast.xml',
  'the feed URL is baked into the notarized app (SUFeedURL) — changing it ' +
  'strands every copy already installed. Settled with the product lane 2026-08-22.',
);
assert.match(xml, /<link>https:\/\/orionfold\.com\/flow\/appcast\.xml<\/link>/);

// C1864 — updates are never gated by licence, enforced at the feed level: a
// feed that cannot identify who is asking cannot withhold a fix from someone
// who stopped paying. The app has a matching test on SUFeedURL.
const feed = new URL(FEED_URL);
assert.equal(feed.protocol, 'https:', 'the feed must be HTTPS');
assert.equal(feed.search, '', 'the feed URL must carry no query — it must not identify who is asking');
assert.equal(feed.hash, '', 'the feed URL must carry no fragment');
assert.equal(feed.username, '', 'the feed URL must carry no credentials');
assert.equal(feed.password, '', 'the feed URL must carry no credentials');

// ---------------------------------------------------------------------------
// Well-formedness and shape
// ---------------------------------------------------------------------------

assert.match(xml, /^<\?xml version="1\.0" encoding="utf-8"\?>/, 'must open with an XML declaration');
assert.match(
  xml,
  /xmlns:sparkle="http:\/\/www\.andymatuschak\.org\/xml-namespaces\/sparkle"/,
  'the sparkle namespace must be declared or sparkle:* elements are ignored',
);
assert.match(xml, /<rss version="2\.0"/);
assert.match(xml, /<channel>[\s\S]*<\/channel>/);
assert.match(xml, /GENERATED — do not hand-edit/, 'the artifact must say it is generated');

// Every opened tag closes. A malformed feed is a hard parse error in Sparkle.
for (const tag of ['rss', 'channel', 'title', 'link', 'description']) {
  const open = (xml.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;
  const close = (xml.match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
  assert.equal(open, close, `<${tag}> is unbalanced in the generated feed`);
}

// ---------------------------------------------------------------------------
// The empty channel is a deliberate state, not a stub
// ---------------------------------------------------------------------------

if (RELEASES.length === 0) {
  assert.equal(latestRelease(), null, 'no releases means no latest release');
  assert.doesNotMatch(
    xml,
    /<item>/,
    'an empty channel must contain no <item> — a fabricated entry would be ' +
    'downloaded and then fail signature verification in front of a user',
  );
  // Guards against a well-meaning "let me just put a placeholder in" edit.
  assert.doesNotMatch(xml, /sparkle:edSignature/, 'no signature attribute without a real release');
  assert.doesNotMatch(xml, /example\.com|placeholder|TODO|FIXME|CHANGEME/i, 'no placeholder values in a served feed');
}

// ---------------------------------------------------------------------------
// The validator refuses what Sparkle would mis-serve
// ---------------------------------------------------------------------------

assert.deepEqual(validate([]), [], 'an empty release list is valid');

const good = {
  build: 1048,
  shortVersion: '0.2.0',
  published: '2026-08-22T12:00:00Z',
  url: 'https://downloads.orionfold.com/flow/Orionfold-Flow-0.2.0.dmg',
  length: 48_231_004,
  edSignature: 'Zm9vYmFyc2lnbmF0dXJlZXhhbXBsZQ==',
};
assert.deepEqual(validate([good]), [], `a complete release must validate: ${validate([good])}`);

// THE SILENT DEFECT. Both of these produce "you are up to date" forever.
assert.ok(
  validate([good, { ...good, build: 1048 }]).some((p) => /duplicate/i.test(p)),
  'a duplicate CFBundleVersion must be refused — Sparkle would serve neither',
);
assert.ok(
  validate([good, { ...good, build: 1047 }]).some((p) => /strictly increase/i.test(p)),
  'a non-increasing build must be refused — this is the silent failure Sparkle has',
);

// A missing signature means the user downloads an update and then it is
// refused at install. Cheaper to catch here.
assert.ok(
  validate([{ ...good, edSignature: '' }]).some((p) => /edSignature/i.test(p)),
  'a release without an EdDSA signature must be refused',
);

// The DMG must be fetchable by an app whose subscription lapsed (C1864).
assert.ok(
  validate([{ ...good, url: 'http://downloads.orionfold.com/f.dmg' }]).some((p) => /https/i.test(p)),
  'a non-HTTPS download URL must be refused',
);
assert.ok(
  validate([{ ...good, url: 'https://downloads.orionfold.com/f.dmg?token=abc' }]).some((p) => /query/i.test(p)),
  'a download URL carrying a query must be refused — it can identify who is asking',
);

// The website repo is PUBLIC and GitHub hard-rejects files over 100 MB, so a
// DMG pointed at orionfold.com is a mistake worth catching before `git push`.
assert.ok(
  validate([{ ...good, url: 'https://orionfold.com/flow/Flow.dmg' }])
    .some((p) => /public|100 MB/i.test(p)),
  'a DMG served from the website must be refused — the repo is public and size-capped',
);

assert.ok(
  validate([{ ...good, length: 0 }]).some((p) => /length/i.test(p)),
  'a zero byte length must be refused',
);
assert.ok(
  validate([{ ...good, published: 'not a date' }]).some((p) => /date/i.test(p)),
  'an unparseable date must be refused',
);

// ---------------------------------------------------------------------------
// A rendered release carries what Sparkle reads
// ---------------------------------------------------------------------------

const rendered = renderAppcast([good]);
assert.match(rendered, /<sparkle:version>1048<\/sparkle:version>/, 'sparkle:version carries CFBundleVersion');
assert.match(rendered, /<sparkle:shortVersionString>0\.2\.0<\/sparkle:shortVersionString>/);
assert.match(rendered, /sparkle:edSignature="Zm9vYmFyc2lnbmF0dXJlZXhhbXBsZQ=="/);
assert.match(rendered, /length="48231004"/, 'the byte length must render unformatted');
// 2026-08-22 is a Saturday — the weekday is computed, not copied, so this
// doubles as a check that rfc822() derives the day rather than guessing it.
assert.match(rendered, /<pubDate>Sat, 22 Aug 2026 12:00:00 \+0000<\/pubDate>/, 'RFC 822 pubDate');

// Newest first, so a human reading the file sees the current release at the top.
const two = renderAppcast([good, { ...good, build: 1050, shortVersion: '0.3.0' }]);
assert.ok(
  two.indexOf('0.3.0') < two.indexOf('0.2.0'),
  'releases must render newest-first',
);

// XML escaping — release notes are prose and will eventually contain an ampersand.
const escaped = renderAppcast([{ ...good, shortVersion: '0.2.0 "Beta" & <b>' }]);
assert.match(escaped, /&amp;/, 'ampersands must be escaped');
assert.doesNotMatch(escaped, /<b>/, 'raw markup must not survive into the feed');

console.log(
  `flow-appcast: feed well-formed at ${FEED_URL}; ${RELEASES.length} release(s); ` +
  'silent-failure guards (duplicate/non-increasing build, missing signature) hold',
);
