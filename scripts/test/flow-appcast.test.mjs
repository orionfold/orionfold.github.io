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
//
// THE FEED MUST BE SIGNED, EMPTY OR NOT. Measured 2026-08-27: the app sets
// `SURequireSignedFeed`, so Sparkle verifies the downloaded bytes before it
// parses items, and an unsigned empty feed fails every check with error 1000.
// The committed file therefore has two halves: the generator's content and the
// operator's signature block. This test checks the content against the
// generator and the block against the app's baked public key, the same way the
// installed app will. It FAILS CLOSED on an unsigned feed on purpose: a green
// suite over a feed every installed Flow rejects would be the silent failure
// this file exists to refuse.
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { renderAppcast, validate } from '../build-flow-appcast.mjs';
import {
  SIGN_FEED_COMMAND,
  appendSignatureBlock,
  extractSignedFeed,
  verifyFeedSignature,
} from '../lib/sparkle-feed.mjs';
import {
  FEED_PUBLIC_ED_KEY_BASE64,
  FEED_URL,
  latestRelease,
  RELEASES,
} from '../../src/data/flow-releases.ts';

const readBytes = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url));

// ---------------------------------------------------------------------------
// The committed artifact
// ---------------------------------------------------------------------------

assert.ok(
  existsSync(new URL('../../public/flow/appcast.xml', import.meta.url)),
  'public/flow/appcast.xml must exist — the app 404s on a missing feed, and a ' +
  '404 is the fail-soft error state we are shipping this to remove',
);

const feedBytes = readBytes('public/flow/appcast.xml');
const feed = extractSignedFeed(feedBytes);
const xml = feed.content.toString('utf8');

// `sign_update` without `--disable-signing-warning` re-serialises the XML
// through Foundation to insert a warning comment. Catch that by name before
// the byte comparison below reports it as a mysterious hand-edit.
assert.doesNotMatch(
  xml,
  /sparkle-sign-warning/,
  'the feed was signed without --disable-signing-warning, which re-serialised the XML. ' +
  'This feed is FROZEN at build 1526 (2026-08-29) — the product lane publishes releases now. ' +
  `Restore the committed bytes with git rather than regenerating: ${SIGN_FEED_COMMAND}`,
);

// The content half must be exactly what the generator produces from the
// committed data. Since 2026-08-29 this is a FREEZE check rather than a
// staleness check: the feed and the data are both frozen at build 1526, so any
// divergence means someone edited one of them by hand, and the served feed the
// installed copies poll would no longer be the operator-signed bytes.
assert.equal(
  xml,
  renderAppcast(RELEASES),
  'public/flow/appcast.xml no longer matches src/data/flow-releases.ts. Both are FROZEN ' +
  'at build 1526 (2026-08-29, ledger 20:55) — the product lane publishes releases now, so ' +
  'the fix is to restore the committed bytes with git, NOT to regenerate and re-sign.',
);

// ---------------------------------------------------------------------------
// The signature half — fail closed
// ---------------------------------------------------------------------------

const verdict = verifyFeedSignature(feedBytes, FEED_PUBLIC_ED_KEY_BASE64);
assert.ok(
  verdict.signed,
  'public/flow/appcast.xml carries NO signature block. The app requires a signed feed, so ' +
  'every installed Flow fails its update check (SUSparkleErrorDomain 1000) until the operator ' +
  `signs it: ${SIGN_FEED_COMMAND}`,
);
assert.ok(
  verdict.valid,
  `public/flow/appcast.xml signature block is present but wrong (${verdict.reason}). ` +
  `Re-sign after every regeneration: ${SIGN_FEED_COMMAND}`,
);
assert.equal(
  verdict.length,
  feed.content.length,
  'the block\'s length must equal the byte count before it — Sparkle checks this too',
);

// ---------------------------------------------------------------------------
// The extractor and verifier mirror Sparkle (SPUExtractSignedFeed.m), proven
// with a throwaway key so the assertions do not depend on the operator's.
// ---------------------------------------------------------------------------

{
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const rawPublic = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
  const content = Buffer.from(renderAppcast([]), 'utf8');
  const signature = cryptoSign(null, content, privateKey).toString('base64');
  const signed = appendSignatureBlock(content, signature);

  const parsed = extractSignedFeed(signed);
  assert.ok(parsed.content.equals(content), 'extraction returns exactly the bytes before the block');
  assert.equal(parsed.edSignature, signature, 'the edSignature line is read back trimmed');
  assert.equal(parsed.length, content.length, 'the length line is read back as an integer');
  assert.match(
    signed.toString('utf8'),
    /<!-- sparkle-signatures:\nedSignature: [A-Za-z0-9+/=]+\nlength: \d+\n-->\n$/,
    'the block is formatted exactly as Sparkle\'s signAppcast writes it',
  );

  const good = verifyFeedSignature(signed, rawPublic);
  assert.ok(good.signed && good.valid, `a correctly signed feed verifies: ${good.reason}`);

  // One flipped byte in the content — the case a hand-edit after signing hits.
  const tampered = Buffer.from(signed);
  tampered[tampered.indexOf('<channel>') + 1] ^= 0x01;
  assert.equal(verifyFeedSignature(tampered, rawPublic).valid, false, 'a tampered content byte must fail');

  // The right block signed by the wrong key — the case a rotated key hits.
  assert.equal(verifyFeedSignature(signed, FEED_PUBLIC_ED_KEY_BASE64).valid, false, 'another key must fail');

  // A wrong length line — the case a re-render without re-signing hits.
  const wrongLength = Buffer.from(
    signed.toString('utf8').replace(/length: \d+/, `length: ${content.length + 1}`),
    'utf8',
  );
  const lengthVerdict = verifyFeedSignature(wrongLength, rawPublic);
  assert.equal(lengthVerdict.valid, false, 'a length mismatch must fail');
  assert.match(lengthVerdict.reason, /length/, 'and say so');

  // A truncated block (no `-->`) is unsigned to Sparkle, so it is unsigned here.
  const truncated = signed.subarray(0, signed.length - 4);
  assert.equal(extractSignedFeed(truncated).edSignature, null, 'a block without a closing --> is not a block');
  assert.equal(verifyFeedSignature(truncated, rawPublic).signed, false);

  // No block at all.
  assert.equal(verifyFeedSignature(content, rawPublic).signed, false, 'plain content is unsigned');
}

// The app's public key must be a real 32-byte Ed25519 key, not a placeholder.
assert.equal(
  Buffer.from(FEED_PUBLIC_ED_KEY_BASE64, 'base64').length,
  32,
  'FEED_PUBLIC_ED_KEY_BASE64 must decode to a 32-byte Ed25519 public key',
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
const feedUrl = new URL(FEED_URL);
assert.equal(feedUrl.protocol, 'https:', 'the feed must be HTTPS');
assert.equal(feedUrl.search, '', 'the feed URL must carry no query — it must not identify who is asking');
assert.equal(feedUrl.hash, '', 'the feed URL must carry no fragment');
assert.equal(feedUrl.username, '', 'the feed URL must carry no credentials');
assert.equal(feedUrl.password, '', 'the feed URL must carry no credentials');

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
  assert.doesNotMatch(xml, /sparkle:edSignature/, 'no enclosure signature attribute without a real release');
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
  `signature block verifies against the app's public key (${verdict.length} bytes signed); ` +
  'silent-failure guards (duplicate/non-increasing build, missing signature) hold',
);
