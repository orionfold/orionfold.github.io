// Magnet funnel contracts. Added 2026-08-15 for the operator-approved Flow tie:
// the free AI Native Business book is the entry, Flow is where the funnel lands.
// These assertions protect the parts that break QUIETLY if someone edits the copy
// or the wiring later:
//   1. the offer key that confirm-email matches to deliver the book,
//   2. the "book guides, Flow tools" narrative and its link out to /flow/,
//   3. the thank-you page staying a single Flow link with NO second capture and
//      no checkout (see the dead-end + retired-bundle reasoning in that file),
//   4. Flow copy staying inside its truth boundary (no pricing, no mechanism).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const magnet = read('src/pages/become-ai-native-business.astro');
const thanks = read('src/pages/become-ai-native-business/thanks.astro');

// ── The offer key: the single string the delivery rail matches on ──────────
// confirm-email routes on row.offer === "become-ai-native-business" to sign and
// send the book. Change this and the magnet silently stops delivering.
const confirmEmail = read('supabase/functions/confirm-email/index.ts');
assert.match(confirmEmail, /row\.offer === "become-ai-native-business"/, 'confirm-email must keep matching the magnet offer key');
assert.equal(
  (magnet.match(/offer="become-ai-native-business"/g) ?? []).length,
  2,
  'both magnet capture forms must carry the offer key confirm-email matches',
);
// The book is a gift on this rail: the delivery email must not thank a purchase.
assert.match(confirmEmail, /sendBookEmail\(row\.email, "AI Native Business", links, "free"\)/, 'the magnet delivers on the free rail');

// ── Capture parity with the Flow waitlist ──────────────────────────────────
// Both funnels use the same live double-opt-in component and the same panel
// treatment, so the magnet reads as part of the Flow system.
assert.match(magnet, /import WaitlistForm from '\.\.\/components\/ui\/WaitlistForm\.astro'/);
assert.equal((magnet.match(/Double opt-in/g) ?? []).length, 2, 'both magnet captures keep the Flow waitlist panel chrome');
assert.match(magnet, /consentText\s*=\s*\n?\s*'By subscribing you agree to receive the free book, Orionfold Flow development and launch updates/, 'recorded consent must name what the capture actually subscribes you to');
assert.doesNotMatch(magnet, /data-checkout=/, 'the magnet is a pure opt-in: no checkout on the capture page');

// ── The book-guides / Flow-tools tie ───────────────────────────────────────
assert.match(magnet, /id="flow-tie-heading"/, 'the book to Flow tie section must stay on the page');
assert.match(magnet, /The book shows you the shape\. Flow does the work with you\./);
assert.match(magnet, /The book guides/);
assert.match(magnet, /Flow tools the work/);
assert.match(magnet, /href="\/flow\/"/, 'the tie section must route to the Flow landing page');
assert.match(magnet, /What is Orionfold Flow\?/, 'the FAQ must answer the Flow question it now raises');

// ── The thank-you page: one forward step, no dead ends ─────────────────────
// Everyone here just confirmed, and waitlist-signup short-circuits an already
// confirmed email ("You're already on the list."), so a second capture form
// would read as a dead end and record nothing.
assert.doesNotMatch(thanks, /<WaitlistForm/, 'the thank-you page must not re-capture an already-confirmed subscriber');
assert.doesNotMatch(thanks, /data-checkout=/, 'the founding bundle checkout stays retired from the thank-you page');
assert.doesNotMatch(thanks, /wireCheckoutButtons/, 'no checkout wiring should survive on the thank-you page');
assert.match(thanks, /href="\/flow\/"/, 'the thank-you page forwards to Flow');
assert.match(thanks, /Meet the tool the book is about\./);
assert.match(thanks, /noindex/, 'the post-confirm utility page stays out of the index');

// ── Flow truth boundary ────────────────────────────────────────────────────
// These pages carry broad positioning plus the current in-development / Mac /
// freemium facts. Pricing and mechanism claims are not ours to make here.
for (const [name, source] of [['magnet', magnet], ['thanks', thanks]]) {
  assert.doesNotMatch(source, /\$\d+\s*(?:\/|per\s)/i, `${name}: no Flow price tiers exist yet, so none may be implied`);
  assert.doesNotMatch(source, /Apple Intelligence/, `${name}: Apple Intelligence was retired from Flow on 2026-08-14`);
}
// Em-dash rule (website-copy-style) applies to rendered copy, not code comments.
const renderedCopy = (source) =>
  source
    .replace(/^---[\s\S]*?\n---/, '')       // frontmatter
    .replace(/<!--[\s\S]*?-->/g, '')        // html comments
    .replace(/<style>[\s\S]*?<\/style>/g, '');
for (const [name, source] of [['magnet', magnet], ['thanks', thanks]]) {
  assert.doesNotMatch(renderedCopy(source), /—/, `${name}: rendered copy must not use em dashes`);
}

// ── The band engine must not claim these pages ─────────────────────────────
// /about/ and the thank-you both moved to Flow, and Flow is deliberately not a
// band product (the band sells a priced catalog family). The 'page' branch of
// strongProduct must therefore claim no slugs.
const bandForPage = read('src/lib/product/band-for-page.ts');
assert.doesNotMatch(bandForPage, /slug === 'about'/, "the about page no longer routes through the priced band");
assert.doesNotMatch(bandForPage, /slug === 'thanks'/, 'the thank-you page no longer routes through the priced band');
const about = read('src/pages/about.astro');
assert.doesNotMatch(about, /<ProductBand/, 'the about page renders its own Flow CTA, not a priced band');
assert.match(about, /id="about-flow-heading"/, 'the about page keeps its Flow CTA above the footer');
assert.match(about, /I do not write every note anymore\. I conduct\./, 'the Flow CTA leads with the line from the Limitless story');
assert.match(about, /assets\/story\/limitless-without-the-pill\/hero\.png/, 'the Flow CTA uses the Limitless creative');
assert.match(about, /href="\/story\/limitless-without-the-pill\/"/, 'the founder narrative links the Limitless story');

console.log('[magnet-flow-funnel] the free book captures like Flow, ties book to tool, and lands on Flow with no dead ends');
