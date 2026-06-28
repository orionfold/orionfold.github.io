# Magnet Page — `/become-ai-native-business/` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-focus, no-Stripe lead-magnet landing page at `/become-ai-native-business/` that email-gates the free PDF+EPUB of the AI Native Business book, delivers it on double-opt-in confirm, and lands the subscriber on a thank-you page that points to Orionfold Proof.

**Architecture:** Pure opt-in rail (no Stripe, no checkout). The magnet form reuses the existing `waitlist-signup` edge function with `offer=become-ai-native-business`. Delivery happens on confirm: `confirm-email` is extended so that, for this offer, it signs the already-in-bucket book files (logic extracted to a shared `_shared/book-files.ts` seam reused by `stripe-webhook`) and emails them, then redirects to a dedicated thanks page.

**Tech Stack:** Astro 5 (pages + content collections), Tailwind, Supabase Edge Functions (Deno), Resend (transactional email), Supabase Storage (`book-files` bucket).

## Global Constraints

- Work on `main` only — no branches/worktrees (memory: work-on-main-no-worktrees).
- Public repo = committing is publishing. No secrets, no PII, only `manav@orionfold.com` in tracked files. The publish-guard hook blocks secret-shaped writes and local-only file commits.
- Customer-facing copy: humanize, grade 3–5 English, glossed jargon, **no em-dashes**, no AI tells, **no hard line wraps in prose** (one paragraph = one line) for markdown content (memory: website-copy-style, markdown-review-in-obsidian).
- Verbatim canonical consent string everywhere a capture surface records consent: `By subscribing you agree to receive the AI For Everyone digest, one email a week, no more. You can unsubscribe any time. See our privacy policy.`
- Edge-fn dependency idiom: `https://esm.sh/<pkg>?target=deno`; Deno std from `https://deno.land/std@0.224.0/...`. Validate each edge fn locally with `deno check <file>`.
- Edge-fn tests are Deno tests: `deno test supabase/functions/_shared/<file>.test.ts`.
- Sitewide product counts (reconciled 2026-06-28): **15 software, 7 models, 3 books**. Use "15 tools / 7 models / 3 books, and the open-source Orionfold Proof engine" for any proof-point strip.
- Do NOT push or deploy — both are operator-gated. Live submit/confirm/delivery is verified post-deploy (CORS blocks localhost submit).

---

## Task 1: Extract the book-file signing + delivery-email seam (`_shared/book-files.ts`)

Pulls the book signing/email logic out of `stripe-webhook/index.ts` into a shared module so `confirm-email` can reuse the exact same path. No behavior change for the webhook.

**Files:**
- Create: `supabase/functions/_shared/book-files.ts`
- Create: `supabase/functions/_shared/book-files.test.ts`
- Modify: `supabase/functions/stripe-webhook/index.ts` (replace inline `BOOK_FILES_BUCKET`, `DOWNLOAD_TTL_SECONDS`, `brandedUrl`, `signBookFiles`, `bookEmailText`, and the Resend send in `sendBookEmail` with imports from the seam)

**Interfaces:**
- Produces:
  - `const BOOK_FILES_BUCKET = "book-files"`
  - `const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7`
  - `brandedUrl(signedUrl: string): string` — swaps the internal `SUPABASE_URL` host for the branded `https://orionfold.supabase.co` host (reads `Deno.env.get("SUPABASE_URL")`).
  - `type BookLink = { format: string; url: string }`
  - `signBookFiles(supabase: any, lookupKey: string): Promise<BookLink[]>` — lists `book-files/<lookupKey>`, signs every `.pdf`/`.epub`, returns branded links (empty array on list error or no files).
  - `bookEmailText(bookLabel: string, links: BookLink[]): string` — the purchase-delivery email body (unchanged copy).
  - `sendBookEmail(email: string, bookLabel: string, links: BookLink[]): Promise<void>` — posts to Resend (reads `RESEND_API_KEY`, throws if absent or non-OK).
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Write the failing test**

```ts
// supabase/functions/_shared/book-files.test.ts
// Unit lock for the shared book-file seam. signBookFiles is exercised against a
// fake supabase Storage client (no network); bookEmailText/brandedUrl are pure.
// Run: deno test supabase/functions/_shared/book-files.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bookEmailText, signBookFiles } from "./book-files.ts";

// Fake Storage client: .from(bucket).list(prefix) and .createSignedUrl(path, ttl).
function fakeSupabase(files: Array<{ name: string }>) {
  return {
    storage: {
      from(_bucket: string) {
        return {
          list(_prefix: string) {
            return Promise.resolve({ data: files, error: null });
          },
          createSignedUrl(path: string, _ttl: number) {
            return Promise.resolve({
              data: { signedUrl: `https://orionfold.supabase.co/storage/v1/object/sign/${path}?token=x` },
              error: null,
            });
          },
        };
      },
    },
  };
}

Deno.test("signBookFiles signs only pdf/epub, labels formats", async () => {
  const sb = fakeSupabase([
    { name: "AI-Native-Business.pdf" },
    { name: "AI-Native-Business.epub" },
    { name: "cover.png" },
  ]);
  const links = await signBookFiles(sb, "book_ai_native_business");
  assertEquals(links.length, 2);
  assertEquals(links.map((l) => l.format).sort(), ["EPUB", "PDF"]);
  assert(links.every((l) => l.url.includes("book_ai_native_business/")));
});

Deno.test("signBookFiles returns [] on list error", async () => {
  const sb = {
    storage: {
      from() {
        return { list() { return Promise.resolve({ data: null, error: { message: "boom" } }); } };
      },
    },
  };
  const links = await signBookFiles(sb, "book_ai_native_business");
  assertEquals(links, []);
});

Deno.test("bookEmailText includes both links and is em-dash free", () => {
  const text = bookEmailText("AI Native Business", [
    { format: "PDF", url: "https://x/p.pdf" },
    { format: "EPUB", url: "https://x/e.epub" },
  ]);
  assert(text.includes("AI Native Business"));
  assert(text.includes("https://x/p.pdf"));
  assert(text.includes("https://x/e.epub"));
  assert(!text.includes("—"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test supabase/functions/_shared/book-files.test.ts`
Expected: FAIL — module `./book-files.ts` not found.

- [ ] **Step 3: Create the seam**

```ts
// supabase/functions/_shared/book-files.ts
// Shared book-file delivery seam. Lists a book's folder in the private
// `book-files` Storage bucket, signs every PDF/EPUB it finds (7-day branded
// signed URLs), and sends the buyer-facing download email via Resend.
//
// Extracted from stripe-webhook/index.ts so BOTH the paid rail (stripe-webhook
// fulfillBook) and the FREE opt-in rail (confirm-email, for the
// become-ai-native-business magnet) deliver through one path — same signing,
// same branded host, same email body. Pure-mapping helpers (bookEmailText,
// brandedUrl) stay testable without a server; signBookFiles takes the supabase
// client so callers own client construction.

export const BOOK_FILES_BUCKET = "book-files";
export const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7; // 7-day signed download links

// Buyer-facing links use the branded vanity host, not the project-ref host that
// supabase-js builds from SUPABASE_URL. The signed token signs the object PATH
// (not the host), so the vanity domain serves the same file.
const PUBLIC_SUPABASE_URL = "https://orionfold.supabase.co";

export function brandedUrl(signedUrl: string): string {
  const internal = Deno.env.get("SUPABASE_URL");
  return internal ? signedUrl.replace(internal, PUBLIC_SUPABASE_URL) : signedUrl;
}

export type BookLink = { format: string; url: string };

/** List book-files/<lookupKey> and sign every PDF/EPUB found (filenames don't matter). */
export async function signBookFiles(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  lookupKey: string,
): Promise<BookLink[]> {
  const { data: files, error } = await supabase.storage
    .from(BOOK_FILES_BUCKET)
    .list(lookupKey);
  if (error || !files) {
    console.error("Storage list error:", error);
    return [];
  }

  const links: BookLink[] = [];
  for (const file of files as Array<{ name: string }>) {
    const lower = file.name.toLowerCase();
    const format = lower.endsWith(".pdf") ? "PDF" : lower.endsWith(".epub") ? "EPUB" : null;
    if (!format) continue;

    const { data: signed, error: signError } = await supabase.storage
      .from(BOOK_FILES_BUCKET)
      .createSignedUrl(`${lookupKey}/${file.name}`, DOWNLOAD_TTL_SECONDS);
    if (signError || !signed?.signedUrl) {
      console.error("Sign error for", file.name, signError);
      continue;
    }
    links.push({ format, url: brandedUrl(signed.signedUrl) });
  }
  return links;
}

export function bookEmailText(bookLabel: string, links: BookLink[]): string {
  const downloads = links.map((l) => `${l.format}:\n${l.url}`).join("\n\n");
  return `Thank you for buying ${bookLabel}.

Here are your download links. You get both the PDF and the
EPUB, so you can read on any device.

${downloads}

These links work for 7 days. Save the files to your device
once you download them. Reply to this email if you hit any
trouble and we will help.

--
Orionfold
https://orionfold.com
`;
}

export async function sendBookEmail(
  email: string,
  bookLabel: string,
  links: BookLink[],
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: `Your copy of ${bookLabel} is ready`,
      text: bookEmailText(bookLabel, links),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    throw new Error(`Resend API error: ${res.status}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test supabase/functions/_shared/book-files.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Rewire stripe-webhook to import the seam**

In `supabase/functions/stripe-webhook/index.ts`:
- Add the import near the other `_shared` imports:
```ts
import { sendBookEmail, signBookFiles } from "../_shared/book-files.ts";
```
- Delete the now-duplicated declarations: the `BOOK_FILES_BUCKET` const, the `DOWNLOAD_TTL_SECONDS` const, the `PUBLIC_SUPABASE_URL` const **only if unused elsewhere** (it is referenced by `brandedUrl`; if `brandedUrl` is used elsewhere in the file keep it — verify with a grep), the `brandedUrl` function, the `signBookFiles` function, the `bookEmailText` function, and the `sendBookEmail` function.
- Before deleting `brandedUrl`/`PUBLIC_SUPABASE_URL`, run `grep -n "brandedUrl\|PUBLIC_SUPABASE_URL" supabase/functions/stripe-webhook/index.ts`. If license fulfillment also calls `brandedUrl`, export it from the seam (it already is) and import it too, then delete the local copy; otherwise leave license-only helpers untouched. Only remove what is now imported.
- `fulfillBook` keeps calling `signBookFiles(supabase, lookupKey)` and `sendBookEmail(email, item.label, links)` unchanged — they now resolve to the imported versions.

- [ ] **Step 6: Verify the webhook still type-checks**

Run: `cd supabase/functions/stripe-webhook && deno check index.ts`
Expected: no errors. (If `brandedUrl`/`PUBLIC_SUPABASE_URL` is reported unused, remove the leftover local copy.)

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/book-files.ts supabase/functions/_shared/book-files.test.ts supabase/functions/stripe-webhook/index.ts
git commit -m "refactor(edge): extract book-file signing+delivery into _shared/book-files seam"
```

---

## Task 2: Add the magnet's confirmation copy (A12 carry-over)

Adds the `become-ai-native-business` entry to the offer-aware "please confirm" email so it names "AI For Everyone" and the one-email-a-week cadence. This is the last open A12 item.

**Files:**
- Modify: `supabase/functions/_shared/confirmation-email.ts` (add one `OFFER_COPY` row)
- Modify: `supabase/functions/_shared/confirmation-email.test.ts` (add a test for the new offer)

**Interfaces:**
- Consumes: `confirmationEmail(confirmUrl, offer)` (existing).
- Produces: a new mapped offer key `"become-ai-native-business"`.

- [ ] **Step 1: Write the failing test**

Append to `supabase/functions/_shared/confirmation-email.test.ts`:
```ts
Deno.test("become-ai-native-business offer names the AI For Everyone list + cadence", () => {
  const e = confirmationEmail(URL, "become-ai-native-business");
  assertEquals(e.subject, "One click for your free AI Native Business book");
  assert(e.text.includes("AI Native Business"));
  assert(e.text.includes("AI For Everyone"));
  assert(e.text.includes("one email a week"));
  assert(!e.text.includes("our stories"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test supabase/functions/_shared/confirmation-email.test.ts`
Expected: FAIL — falls back to the default story copy, so subject/`AI For Everyone` assertions fail.

- [ ] **Step 3: Add the OFFER_COPY entry**

In `supabase/functions/_shared/confirmation-email.ts`, add to the `OFFER_COPY` object:
```ts
  "become-ai-native-business": {
    subject: "One click for your free AI Native Business book",
    pitch:
      `You're almost in. Confirm your email and we'll send you
the free AI Native Business book, in PDF and EPUB, so you
can read it on any device.

You'll also join the AI For Everyone digest. One email a
week, no more, and you can leave any time.`,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test supabase/functions/_shared/confirmation-email.test.ts`
Expected: PASS (all tests, including the new one and the "every variant keeps the shared scaffold" loop — note that loop iterates a fixed list, so the em-dash guard already covers the new copy style; the new copy contains no em-dashes).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/confirmation-email.ts supabase/functions/_shared/confirmation-email.test.ts
git commit -m "feat(edge): AI For Everyone confirm copy for the become-ai-native-business magnet"
```

---

## Task 3: Deliver the book on confirm (extend `confirm-email`)

After the opt-in is confirmed, for the magnet offer, sign the book files and email them, then redirect to the magnet thanks page. All other offers keep the existing `/?confirmed=1` redirect.

**Files:**
- Modify: `supabase/functions/confirm-email/index.ts`

**Interfaces:**
- Consumes: `signBookFiles`, `sendBookEmail` from `_shared/book-files.ts` (Task 1).
- Produces: new redirect target `https://orionfold.com/become-ai-native-business/thanks/` for the magnet offer.

- [ ] **Step 1: Add imports**

At the top of `supabase/functions/confirm-email/index.ts`, add:
```ts
import { sendBookEmail, signBookFiles } from "../_shared/book-files.ts";
```

- [ ] **Step 2: Select the offer + email on the confirmation lookup**

Change the select so the row carries `offer` and `email` (email is already selected). Replace:
```ts
      .select("id, email, confirmed")
```
with:
```ts
      .select("id, email, confirmed, offer")
```

- [ ] **Step 3: Deliver the book before the success redirect**

Replace the final success block:
```ts
    return redirect("confirmed=1");
```
with:
```ts
    // Magnet delivery: the become-ai-native-business opt-in gates the free book.
    // On confirm, sign the already-uploaded PDF+EPUB and email them, then land
    // the subscriber on the magnet thank-you page. Delivery never blocks the
    // confirm: a signing/email failure is logged, the subscriber stays
    // confirmed, and they still reach the thanks page (the email is the channel;
    // a missing file is an operator bucket fix). All other offers are unchanged.
    if (row.offer === "become-ai-native-business") {
      try {
        const links = await signBookFiles(supabase, "book_ai_native_business");
        if (links.length > 0) {
          await sendBookEmail(row.email, "AI Native Business", links);
        } else {
          console.error("Magnet confirm: no files in book-files/book_ai_native_business");
        }
      } catch (deliverErr) {
        console.error("Magnet confirm: book delivery failed:", deliverErr);
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${SITE}/become-ai-native-business/thanks/` },
      });
    }

    return redirect("confirmed=1");
```

- [ ] **Step 4: Type-check the function**

Run: `cd supabase/functions/confirm-email && deno check index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/confirm-email/index.ts
git commit -m "feat(edge): deliver the free book on magnet opt-in confirm"
```

---

## Task 4: The magnet landing page

The single-focus, logo-only-header landing page that captures the email.

**Files:**
- Create: `src/pages/become-ai-native-business.astro`

**Interfaces:**
- Consumes: `Layout` (head+slot shell), `BrandMark` (logo), `WaitlistForm` (capture), the book cover asset.
- Produces: route `/become-ai-native-business/`.

- [ ] **Step 1: Create the page**

```astro
---
// Lead magnet — gates the free AI Native Business book behind a double-opt-in
// email capture. NO Stripe, NO checkout: a pure waitlist-signup opt-in with
// offer=become-ai-native-business; the book is delivered by confirm-email on
// confirm (see supabase/functions/confirm-email). Logo-only header + no footer
// = a 1:1 attention ratio (one action: enter email). The web book stays open
// and indexed; only the download is gated.
import Layout from '../layouts/Layout.astro';
import BrandMark from '../components/ui/BrandMark.astro';
import WaitlistForm from '../components/ui/WaitlistForm.astro';
import { Image } from 'astro:assets';
import bookCover from '../assets/book/ai-native-business-book.jpg';

const consentText =
  'By subscribing you agree to receive the AI For Everyone digest, one email a week, no more. You can unsubscribe any time. See our privacy policy.';
const privacyNote = consentText.replace(' See our privacy policy.', '');

// What's in the book — marketing-finalized outcome bullets (relay 2026-06-28 §5.2).
const insideBullets = [
  'How an AI-native company is actually structured: the shift from a hierarchy of people to an organization that runs on intelligence.',
  'Where AI does the work, not just the talking: how to refine your data, build your own tools, reuse what works, and put models to the test.',
  'How the pieces hold together at scale: institutional memory so nothing is relearned, agents that coordinate, and a governance layer you can trust.',
  'Where this is all heading: world models, systems that build their own systems, and what an AI-native business looks like a few years out.',
];

const title = 'Get the free AI Native Business book · Orionfold';
const description =
  'Read the AI Native Business book free. Enter your email and we send the PDF and EPUB, plus one short email a week on building with private AI.';
---
<Layout title={title} description={description} ogImage="/og/ai-native-business.jpg">
  <header class="px-6 py-5">
    <a href="/" class="group inline-flex items-center gap-1.5 text-text transition-colors hover:text-primary" aria-label="Orionfold home">
      <BrandMark size={32} class="h-8 w-8" />
      <span class="text-2xl font-semibold tracking-tight leading-none">
        <span class="text-text">Orion</span><span class="text-primary">fold</span>
      </span>
    </a>
  </header>

  <main class="mx-auto max-w-5xl px-6 pb-24 pt-6">
    <div class="grid items-center gap-12 md:grid-cols-2">
      <!-- Left: the offer + capture -->
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.18em] text-primary">Free book</p>
        <h1 class="mt-4 leading-tight" style="font-size: clamp(2rem, 5vw, 3rem);">
          Become an AI-native business.
        </h1>
        <p class="mt-5 max-w-md text-lg leading-relaxed text-text-muted">
          The full book, free. Enter your email and we send you the PDF and the
          EPUB, so you can read it on any device.
        </p>

        <div class="mt-8">
          <WaitlistForm
            id="magnet-ainb"
            source="magnet-ai-native-business"
            offer="become-ai-native-business"
            buttonText="Send me the book"
            successMessage="Check your inbox to confirm, then your book is on the way."
            consentText={consentText}
          />
          <p class="mt-4 max-w-sm text-xs leading-relaxed text-text-dim">
            {privacyNote}{' '}
            <a class="underline underline-offset-2 hover:text-text-muted" href="/privacy/">See our privacy policy.</a>
          </p>
        </div>

        <p class="mt-8 text-sm text-text-dim">
          Built by one team running private AI on hardware they own: 15 tools, 7
          models, 3 books, and the open-source Orionfold Proof engine.
        </p>
      </div>

      <!-- Right: the cover + what's inside -->
      <div>
        <Image
          src={bookCover}
          alt="AI Native Business book cover"
          width={420}
          height={560}
          class="mx-auto w-full max-w-xs rounded-xl border border-border shadow-2xl"
          loading="eager"
          fetchpriority="high"
        />
        <div class="mt-10">
          <h2 class="text-lg font-semibold">What's in the book</h2>
          <ul class="mt-4 space-y-3">
            {insideBullets.map((b) => (
              <li class="flex gap-3 text-sm leading-relaxed text-text-muted">
                <svg class="mt-1 shrink-0 text-primary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p class="mt-4 text-sm text-text-dim">Written to be read in about two hours, then kept as a working reference.</p>
        </div>
      </div>
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build emits the route**

Run: `npm run build 2>&1 | grep -i "become-ai-native"`
Expected: the page appears in the built page list (e.g. `/become-ai-native-business/index.html`). If `og/ai-native-business.jpg` is not a valid OG path, drop the `ogImage` prop (the Layout default applies) — confirm by checking `src/pages/og/[slug].jpg.ts` maps the `ai-native-business` slug (it does).

- [ ] **Step 3: Verify in-browser locally (both themes)**

Start/确认 dev server on `http://localhost:4321/become-ai-native-business/` and check via the Chrome MCP browser (curl can't reach localhost): logo-only header (no nav links, no footer), cover renders, form present, light + dark both legible. The submit will CORS-fail from localhost — that is expected; only render/validation is verified here.

- [ ] **Step 4: Commit**

```bash
git add src/pages/become-ai-native-business.astro
git commit -m "feat(magnet): become-ai-native-business landing page (logo-only, no Stripe)"
```

---

## Task 4b: Fire the GA4 lead event on magnet capture

The spec requires firing "the existing GA4 key event" on capture. Verified during planning: `WaitlistForm` currently fires NO GA4 event on submit (it only POSTs + shows a message). So we wire a standard GA4 `generate_lead` event, gated to fire only when an `offer` is set, so existing offer-less forms (homepage hero, footer) keep their current behavior. Uses the same global `gtag` shim pattern as `src/lib/conversion.ts`.

**Files:**
- Modify: `src/components/ui/WaitlistForm.astro` (fire `generate_lead` in the success branch of the submit handler)

**Interfaces:**
- Consumes: the global `window.gtag` shim installed by `Layout.astro`.
- Produces: a `generate_lead` GA4 event with `{ offer, source }` params on successful magnet (offer-bearing) submits.

- [ ] **Step 1: Add the event in the success path**

In `src/components/ui/WaitlistForm.astro`, inside the submit handler, in the block that runs after a successful (`res.ok`) response — i.e. right where `showSuccess(...)` is called (the `else`/`data.message`/`data.already_confirmed` branch group) — fire the event once on success. Replace this block:
```js
        if (data.already_confirmed) {
          showSuccess("You're already on the list.");
        } else if (data.message) {
          showSuccess(data.message);
        } else {
          showSuccess(successMessage);
        }
```
with:
```js
        if (data.already_confirmed) {
          showSuccess("You're already on the list.");
        } else if (data.message) {
          showSuccess(data.message);
        } else {
          showSuccess(successMessage);
        }
        // GA4 lead key event — only for named-offer captures (magnet, offer
        // slots), so offer-less forms (homepage hero, footer) are unchanged.
        // Uses the global gtag shim from Layout.astro (no-op if gtag absent).
        if (offer && typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { offer, source });
        }
```

Note: `offer` and `source` are already in scope (they are destructured props rendered into the client script via the component frontmatter — confirm they are referenced as the same identifiers the existing payload uses: the payload already reads `offer` and `source`, so they are in scope).

- [ ] **Step 2: Verify build + type**

Run: `npm run build 2>&1 | tail -3`
Expected: build completes (the inline script is plain JS; `window.gtag` is loosely typed).

- [ ] **Step 3: Verify the event fires locally**

On `http://localhost:4321/become-ai-native-business/` via the Chrome MCP browser, submit will CORS-fail (no `res.ok`), so the event will NOT fire locally — that is expected. Instead, confirm the code path by reading the built JS, or defer the live check to post-deploy (submit a real magnet opt-in and confirm `generate_lead` in GA4 DebugView). Mark this as a post-deploy verification, not a local gate.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/WaitlistForm.astro
git commit -m "feat(funnel): fire GA4 generate_lead on named-offer waitlist captures"
```

---

## Task 5: The thank-you page

Where the confirm redirect lands. Confirms delivery and carries the single forward CTA to Proof. Becomes the home of the $55 tripwire later.

**Files:**
- Create: `src/pages/become-ai-native-business/thanks.astro`

**Interfaces:**
- Consumes: `Layout`, `BrandMark`.
- Produces: route `/become-ai-native-business/thanks/` (the confirm-email redirect target from Task 3).

- [ ] **Step 1: Create the page**

```astro
---
// Magnet thank-you. confirm-email redirects here after a become-ai-native-business
// opt-in is confirmed and the book email is sent. noindex (post-confirm utility).
// Single forward CTA to Orionfold Proof = the default funnel closure; this page
// is also where the $55 founding-reader bundle slots in once that SKU lands.
import Layout from '../../layouts/Layout.astro';
import BrandMark from '../../components/ui/BrandMark.astro';
---
<Layout title="Your book is on the way · Orionfold" description="Your free AI Native Business book is on its way to your inbox." noindex>
  <header class="px-6 py-5">
    <a href="/" class="group inline-flex items-center gap-1.5 text-text transition-colors hover:text-primary" aria-label="Orionfold home">
      <BrandMark size={32} class="h-8 w-8" />
      <span class="text-2xl font-semibold tracking-tight leading-none">
        <span class="text-text">Orion</span><span class="text-primary">fold</span>
      </span>
    </a>
  </header>

  <main class="mx-auto max-w-xl px-6 py-20 text-center">
    <p class="font-mono text-xs uppercase tracking-[0.18em] text-primary">You're in</p>
    <h1 class="mt-4 leading-tight" style="font-size: clamp(1.8rem, 4.5vw, 2.6rem);">
      Your book is on the way.
    </h1>
    <p class="mx-auto mt-5 max-w-md text-lg leading-relaxed text-text-muted">
      Check your inbox for the PDF and EPUB. The links work for seven days, so
      save the files once you grab them.
    </p>

    <div class="mt-12 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-10">
      <h2 class="text-xl font-semibold">Want to prove which AI you can trust?</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
        Orionfold Proof runs the same tests we run, on your own machine, and
        gives you a receipt you can check. See how a small local model can beat
        the big paid ones at the task that matters to you.
      </p>
      <a
        href="/proof/"
        class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-surface transition-opacity hover:opacity-90"
        data-astro-prefetch
      >
        See Orionfold Proof
      </a>
    </div>

    <p class="mt-10 text-sm text-text-dim">
      Didn't get the email? Check spam, or <a class="underline underline-offset-2 hover:text-text-muted" href="/become-ai-native-business/">request it again</a>.
    </p>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build emits the route**

Run: `npm run build 2>&1 | grep -i "become-ai-native-business/thanks"`
Expected: `/become-ai-native-business/thanks/index.html` in the built list.

- [ ] **Step 3: Verify in-browser locally**

`http://localhost:4321/become-ai-native-business/thanks/` via the Chrome MCP browser: confirms-delivery copy + the Proof CTA render, both themes legible, CTA links to `/proof/`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/become-ai-native-business/thanks.astro
git commit -m "feat(magnet): post-confirm thank-you page with forward CTA to Proof"
```

---

## Task 6: The feeder link on the book page

One soft link from the AI Native Business book detail page to the magnet. No competing form.

**Files:**
- Modify: `src/content/products/books/ai-native-business.md` (append a soft link line to the body)

**Interfaces:**
- Consumes: nothing.
- Produces: an in-body link `/become-ai-native-business/` rendered by `<Content />` on `/books/ai-native-business/`.

- [ ] **Step 1: Append the feeder line**

At the end of `src/content/products/books/ai-native-business.md` body (after the existing prose, before any trailing frontmatter-only content — markdown body only), add a single paragraph (no hard wrap):
```markdown
Want to read it first? You can [get the full book free](/become-ai-native-business/), in PDF and EPUB, and decide for yourself.
```

- [ ] **Step 2: Verify build + link renders**

Run: `npm run build 2>&1 | tail -3`
Expected: build completes. Then confirm via the Chrome MCP browser that `/books/ai-native-business/` shows the new link pointing at `/become-ai-native-business/`.

- [ ] **Step 3: Commit**

```bash
git add src/content/products/books/ai-native-business.md
git commit -m "feat(magnet): soft feeder link from the book page to the free-book magnet"
```

---

## Task 7: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: All edge-fn unit tests pass**

Run:
```bash
deno test supabase/functions/_shared/book-files.test.ts
deno test supabase/functions/_shared/confirmation-email.test.ts
```
Expected: all PASS.

- [ ] **Step 2: All three edited edge fns type-check**

Run:
```bash
cd supabase/functions/_shared && deno check book-files.ts confirmation-email.ts
cd ../confirm-email && deno check index.ts
cd ../stripe-webhook && deno check index.ts
```
Expected: no errors.

- [ ] **Step 3: Site build is clean**

Run: `npm run build 2>&1 | tail -5`
Expected: `[build] Complete!`, both new routes present, no errors.

- [ ] **Step 4: In-browser smoke (both themes)**

Via the Chrome MCP browser on `localhost:4321`: magnet page (logo-only header, cover, form), thanks page (Proof CTA), and the book-page feeder link. Confirm no nav/footer on the two magnet pages and both themes legible.

- [ ] **Step 5: Final note for the operator**

Summarize what is built and what remains operator-gated:
- Deploy the three edge functions (code-only redeploy, NO `--no-verify-jwt`):
  `supabase functions deploy book-files` is NOT needed (it is a `_shared` module, bundled into its importers); deploy the importers:
  `supabase functions deploy stripe-webhook --project-ref lgnmmcxvwdnusvfpguvf`
  `supabase functions deploy confirm-email --project-ref lgnmmcxvwdnusvfpguvf`
  (`waitlist-signup` is unchanged — no redeploy needed for it, but its confirmation copy comes from the shared module which `waitlist-signup` imports, so redeploy `waitlist-signup` too for the new "AI For Everyone" confirm copy: `supabase functions deploy waitlist-signup --project-ref lgnmmcxvwdnusvfpguvf`).
- Push `main` to deploy the pages (operator-gated).
- Post-deploy: live submit → confirm → confirm the book email arrives with both formats; run the existing seo-aeo / Rich Results checks if desired.

---

## Self-Review

**Spec coverage:**
- Magnet page (no Stripe, suppressed nav, capture via waitlist-signup, canonical consent, GA4 via WaitlistForm, utm via WaitlistForm) → Task 4. ✓
- Delivery on double-opt-in confirm → Task 3 (+ seam Task 1). ✓
- A12 carry-over (AI For Everyone + cadence in confirm copy) → Task 2. ✓
- Thank-you page + forward CTA to Proof → Task 5. ✓
- Feeder link on the book page → Task 6. ✓
- Logo-only header (operator decision) → Tasks 4 & 5. ✓
- 15/7/3 counts → already done pre-plan + used in Task 4 proof-point line. ✓
- Out of scope ($55 SKU, nurture, ainative feeder) → not planned, noted. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `signBookFiles(supabase, lookupKey)` and `sendBookEmail(email, label, links)` and `BookLink` are defined in Task 1 and consumed with the same signatures in Tasks 1 (webhook) and 3 (confirm-email). `offer` select string matches the row field used in the branch. ✓

**GA4 key event — resolved:** verified during planning that `WaitlistForm` fires NO GA4 event today, so the spec's "fire the existing GA4 key event" is implemented fresh in Task 4b (`generate_lead`, gated on `offer`). Covered. ✓
