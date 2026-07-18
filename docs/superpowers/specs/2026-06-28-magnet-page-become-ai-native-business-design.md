# Magnet page — `/become-ai-native-business/` (offer ladder, piece 1)

Date: 2026-06-28
Status: approved (design), magnet-first scope this session
Spec SSOT: `strategy/orionfold-website/_RELAY.md`, 2026-06-28 "NEW ASK: build the offer ladder" (byte-identical to `../../../../marketing/_SPECS/2026-06-28-235739_magnet-page-become-ai-native-business.md` §9 — that file does not sync to the strategy channel by design).

## Goal

Ship the funnel's missing intake valve: a single-focus landing page that email-gates the **free PDF+EPUB of the AI Native Business book**. Capture a confirmed (double-opt-in) subscriber into the "AI For Everyone" list, deliver the book on confirm, and land them on a thank-you page that carries the next ladder rung.

This session = **magnet-first**: the page + capture + delivery + confirmation-email copy. OUT of scope: the $55 tripwire Stripe SKU and the full welcome/nurture sequence (they slot in when the SKU lands).

## The two existing email rails (the interface we extend)

The codebase has two **separate** rails that never touch today:

1. **Opt-in list rail** — `waitlist-signup` inserts a `waitlist` row (`confirmed=false`) and sends the "please confirm" email (`_shared/confirmation-email.ts`, offer-keyed `OFFER_COPY`). The confirm link points at `confirm-email`, which flips `confirmed=true` and redirects to `/?confirmed=1`. **It delivers no files; the flow ends at confirm.**
2. **Paid file-delivery rail** — `create-checkout-session` → Stripe → `stripe-webhook` `fulfillBook()` lists `book-files/<lookup_key>/`, signs every PDF/EPUB (7-day signed URL, branded host), and emails them via `sendBookEmail()`.

The magnet needs **both at once**: capture into the list AND deliver the file — but on the FREE/opt-in rail, not Stripe.

## Delivery design — Option A (NO Stripe, NO checkout, NO card in the magnet flow)

The relay ask phrases delivery as "Stripe fulfilment at $0," but that was the marketing peer's mental model, not a requirement. **We deliberately keep Stripe entirely out of the magnet path** — forcing a visitor through a $0 Stripe checkout would add real friction (a card form, a Stripe redirect) for a free book, and a Stripe checkout is not the same as recorded double-opt-in consent. It would also contradict the spec's own explicit mandate to "capture via the existing `waitlist-signup` contract."

The magnet flow is purely the opt-in rail, zero payment surface:

```
magnet page → enter email → waitlist-signup (no Stripe, no card)
  → "please confirm" email → click confirm → confirm-email
  → signs the book files + emails PDF+EPUB → /become-ai-native-business/thanks/
```

The **intent** — free, delivered on double-opt-in confirm — is honored by delivering on the **list rail**:

- Extract the signing logic (`signBookFiles` + `brandedUrl` + the book-delivery email body) out of `stripe-webhook/index.ts` into a shared **`_shared/book-files.ts`** seam (matches the codebase's pure-seam pattern: `lead-input.ts`, `confirmation-email.ts`, `license-payload.ts`). Both `stripe-webhook` and `confirm-email` import it. One signing path, no duplication.
- Extend **`confirm-email`** to (1) also `select` the row's `offer`, and (2) after flipping `confirmed=true`, branch: for `offer === "become-ai-native-business"`, sign `book-files/book_ai_native_business/*` and email the PDF+EPUB, then redirect to `/become-ai-native-business/thanks/`. All other offers keep the existing `/?confirmed=1` redirect unchanged.

Bucket verified 2026-06-28 (`supabase storage ls --experimental -r "ss:///book-files/book_ai_native_business/"`): contains `AI-Native-Business.pdf` + `AI-Native-Business.epub`. No URL to supply; signing is automatic by folder listing.

Failure stance: if signing returns zero files, still redirect to thanks (the subscriber is confirmed/on the list); log the miss. The book arrives by email; a missing file is an operator bucket fix, never a broken confirm.

## A12 carry-over (the last open A12 item)

Add a `become-ai-native-business` entry to `OFFER_COPY` in `_shared/confirmation-email.ts` — the "please confirm" pitch names **"AI For Everyone"** + the **one-email-a-week** cadence so the magnet and the list read as one funnel. Pure mapping, unit-testable. (This is the documented "add a row" extension.)

## The page — `src/pages/become-ai-native-business.astro`

- Composes `Layout` with a **logo-only header** (the Orionfold logo, clickable to home, for trust/branding) and **no nav links + no full footer** (operator decision 2026-06-28). This holds the 1:1 attention ratio — the only forward action is the email form — while still reading as a real Orionfold page. `Layout.astro` is a bare head+slot shell, so this is just composing a slim logo bar instead of the full `Nav`. A minimal privacy link sits with the consent note.
- Indexed (canonical self) — it is a real landing page we want discoverable for the offer; only the book *download* is gated, the web book stays open (G3 holds).
- Hero: existing `src/assets/book/ai-native-business-book.jpg` (eager LCP image, `priority` pattern; one eager image max per mobile-perf-hygiene).
- Structure (spec §5): headline → dek (the promise) → book cover + credibility strip → "What's in the book" (4 marketing-verbatim outcome bullets, relay §5.2) → the email-gate form → objection/trust block → consent note.
- Credibility strip proof-points: **"15 tools / 7 models / 3 books, and the open-source Orionfold Proof engine."** Counts reconciled 2026-06-28 to the live catalog ground truth (`software.length`=15; distinct non-dataset model slugs=7 = advisor, patent-strategist, securityllm, saul-7b-instruct, finance-chat, ii-medical-8b, kepler; books=3 — exactly what `CatalogShelf` renders). The old hardcoded "14 / 6" prose in `FieldEditionBox`/`FieldEditionBand`/the launch story was stale and has been corrected to 15/7 sitewide as part of this work.
- Capture: reuse `OfferSlot` → `WaitlistForm` with `offer="become-ai-native-business"`, `source="magnet-ai-native-business"`, verbatim canonical `consentText` (already the form default). `utm_*`/referrer auto-captured; GA4 key event fires. CORS: real submit only works on live `orionfold.com` (not localhost) — verify render/validation locally, trust the live-verified submit path.

## The thank-you page — `src/pages/become-ai-native-business/thanks.astro`

The confirm click is the highest-intent moment in the funnel — a dedicated thanks page captures it for the next rung (most conversion-friendly; also what the spec's "thank-you page + welcome email" language calls for).
- Confirms delivery ("Your book is on its way to your inbox").
- Single forward CTA → **Orionfold Proof** (`/proof/`, broad apply-AI audience) — the default funnel closure. This page becomes the home of the $55 tripwire when that SKU lands.
- `noindex` (post-confirm utility page).
- Does NOT show signed download URLs inline (avoids token-in-URL through the redirect); email is the delivery channel.

## Feeder link

One soft link on `/books/ai-native-business/` → the magnet page (no competing form). The ainative.business `/book` feeder is a different repo — relay note, not built here.

## Components / files touched

New:
- `src/pages/become-ai-native-business.astro`
- `src/pages/become-ai-native-business/thanks.astro`
- `supabase/functions/_shared/book-files.ts` (extracted signing + delivery-email seam)

Edited:
- `supabase/functions/_shared/confirmation-email.ts` (add `become-ai-native-business` OFFER_COPY)
- `supabase/functions/confirm-email/index.ts` (select offer; deliver + magnet redirect branch)
- `supabase/functions/stripe-webhook/index.ts` (import the extracted seam instead of inline copies)
- `src/pages/books/ai-native-business.astro` (one soft feeder link)

Already done (sitewide stat reconciliation, prerequisite of this work, 2026-06-28):
- `src/components/product/FieldEditionBox.astro`, `src/components/sections/FieldEditionBand.astro`, `src/content/story/the-lab-that-shipped-itself.md` (14→15 tools, 6→7 models; story heroAlt de-quoted so it doesn't pin stale numbers), `src/components/sections/CatalogShelf.astro` (stale "6 today" comment → "7 today").

## Verification

- `deno check` on the three edge functions.
- Unit-test the new `OFFER_COPY` entry + `copyFor` fallback (existing test file pattern).
- Astro build clean; render the magnet + thanks pages locally in-browser (both themes), confirm nav is suppressed and the form validates.
- Live submit + confirm + delivery is verified post-deploy (CORS blocks localhost). Deploy is operator-gated.

## Out of scope (this session)

$55 tripwire Stripe SKU; welcome/nurture sequence; ainative.business feeder. The thanks page is built to host the tripwire when it lands.
