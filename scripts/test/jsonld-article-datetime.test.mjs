import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Rich Results Test on the live launch story (2026-08-29) reported all four of
// its non-critical notes as one defect: BlogPosting datePublished/dateModified
// were date-only ("Invalid datetime value", "missing a timezone"). Every
// Article-shaped JSON-LD on the site now emits the full ISO datetime. The OG
// `article:` meta keeps the plain date on purpose; this test only reads the
// schema objects.
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

const schemaPages = {
  'src/pages/story/[slug]/index.astro': /const blogPostingSchema = \{[\s\S]*?datePublished: dateTime,\s*dateModified: dateTime,/,
  'src/pages/receipts/[slug]/index.astro': /datePublished: dateTime,\s*dateModified: dateTime,/,
  'src/pages/letter/[slug]/index.astro': /datePublished: dateTime,\s*dateModified: dateTime,/,
  'src/pages/relay/memos/[slug]/index.astro': /datePublished: date\.toISOString\(\),/,
};

for (const [file, re] of Object.entries(schemaPages)) {
  const src = read(file);
  assert.match(src, re, `${file}: Article JSON-LD dates must be the full ISO datetime`);
  // Only the schema objects are inspected; the Layout `article=` prop (OG meta)
  // keeps the plain date and is allowed to reference dateIso.
  const schemaBlocks = src.match(/const \w+Schema = \{[\s\S]*?\n\};/g) ?? [];
  assert.ok(schemaBlocks.length > 0, `${file}: at least one JSON-LD schema object`);
  for (const block of schemaBlocks) {
    assert.doesNotMatch(block, /dateIso|slice\(0, 10\)/, `${file}: a JSON-LD date field slid back to a date-only value`);
  }
}
for (const file of ['src/pages/story/[slug]/index.astro', 'src/pages/receipts/[slug]/index.astro', 'src/pages/letter/[slug]/index.astro']) {
  assert.match(read(file), /const dateTime = date\.toISOString\(\);/, `${file}: dateTime is the untruncated ISO string`);
}
console.log('jsonld-article-datetime: ok');
