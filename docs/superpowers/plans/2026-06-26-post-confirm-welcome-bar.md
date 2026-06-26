# Post-confirm welcome bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the easy-to-miss floating success toast with a prominent, full-width, session-persistent welcome bar that drives a freshly-confirmed subscriber toward `/proof/`.

**Architecture:** Reshape the single existing component `src/components/ui/ConfirmBanner.astro` to render two markup blocks — a new full-width normal-flow success bar (`?confirmed=1`) and the existing floating toast (`already` / `error`). A pre-paint inline script picks which to reveal, using two `sessionStorage` keys so the bar survives the URL clean and reloads until dismissed.

**Tech Stack:** Astro component (no framework island), inline vanilla `<script>`, Tailwind v4 utility classes with the project DS accent triad, `sessionStorage`.

## Global Constraints

- Work on `main` only — no branches/worktrees (operator rule).
- Copy: grade 3–5 English, no em-dashes, no AI tells (website-copy-style).
- CTA colors MUST use the DS accent triad `bg-accent` / `text-accent-text` / `hover:bg-accent-hover` — never hardcoded `text-white` on accent (WCAG, 2026-06-22 CTA-alignment rule).
- Theme-aware: must resolve in both light and dark (`html[data-theme="dark"]`).
- Only one code file changes: `src/components/ui/ConfirmBanner.astro`. No edits to `index.astro`, edge functions, catalog, or funnel.
- No automated test layer — presentational, verified in-browser on `http://localhost:4321/`.
- `npm run build` must stay clean (expect 68 pages).

---

### Task 1: Reshape ConfirmBanner into a two-block component (success bar + toast)

**Files:**
- Modify: `src/components/ui/ConfirmBanner.astro` (full rewrite of markup + script)

**Interfaces:**
- Consumes: nothing new. Component is already mounted once in `src/pages/index.astro:22` between `<Nav />` and `<main>` — keep that mount point (do NOT edit index.astro).
- Produces: the `?confirmed=` landing UI. Contract with the confirm-email edge function is unchanged: it still redirects to `/?confirmed=1` | `=already` | `=error&error=...`.

**Behavior contract (from spec):**
- Success (`?confirmed=1`): full-width normal-flow bar under the nav, pushes hero down. Welcome line + "See the proof →" CTA → `/proof/` + dismiss ✕.
- Persistence: `sessionStorage['of-confirm-welcome']='1'` set on first `=1`; bar re-shows on every homepage load while that is set AND `sessionStorage['of-confirm-welcome-dismissed']!=='1'`. ✕ and CTA-click both set the dismissed key.
- URL clean kept (`history.replaceState` to pathname).
- `already` / `error`: unchanged floating toast (`already` auto-dismiss 8s; `error` red dot, manual dismiss). Not persisted.
- Nothing renders when no param and no persisted flag.

- [ ] **Step 1: Rewrite the component markup**

Replace the entire contents of `src/components/ui/ConfirmBanner.astro` with the markup below. Two sibling blocks: the new success bar (normal flow, `hidden` by default) and the existing toast (floating, `hidden` by default).

```astro
---
// Post-confirmation landing UI. The confirm-email edge function redirects to
// /?confirmed=1 (success) | =already | =error&error=... Two render paths:
//   • success (=1)  -> a prominent full-width welcome BAR in normal flow that
//     reflows the hero down, is session-persistent (survives the URL clean +
//     reloads via sessionStorage), and drives the next action toward /proof/.
//   • already/error -> the original small floating TOAST (one-shot ack).
// Mounted once on the homepage (index.astro, between Nav and main), which is
// where the confirm link lands. Capture itself lives on /story (StorySubscribe).
---
<!-- SUCCESS BAR (=1): normal flow, pushes page down, session-persistent -->
<div id="confirm-bar" role="status" aria-live="polite" class="hidden border-b border-accent/30 bg-surface-raised">
  <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
    <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-text" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </span>
    <p class="flex-1 text-sm leading-snug text-text">
      <span class="font-semibold">You're in.</span> Welcome to the real build log.
    </p>
    <a
      id="confirm-bar-cta"
      href="/proof/"
      class="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover"
    >See the proof →</a>
    <button
      id="confirm-bar-close"
      type="button"
      aria-label="Dismiss"
      class="-mr-1 shrink-0 cursor-pointer rounded p-1 text-text-dim transition-colors hover:text-text"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </div>
</div>

<!-- TOAST (already/error): floating, one-shot ack (unchanged behavior) -->
<div
  id="confirm-toast"
  role="status"
  aria-live="polite"
  class="fixed inset-x-0 top-20 z-50 mx-auto hidden w-[calc(100%-2rem)] max-w-md px-0"
>
  <div class="flex items-start gap-3 rounded-xl border border-primary/30 bg-surface-raised px-4 py-3 shadow-lg">
    <span id="confirm-toast-dot" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
    <p id="confirm-toast-text" class="flex-1 font-mono text-xs leading-relaxed text-text"></p>
    <button
      id="confirm-toast-close"
      type="button"
      aria-label="Dismiss"
      class="-mr-1 -mt-1 shrink-0 cursor-pointer rounded p-1 text-text-dim transition-colors hover:text-text"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Append the controller script**

Append this `<script>` to the same file, after the markup. It runs pre-paint (Astro inlines component scripts in `<head>` by default via the bundler; this is synchronous and keyed on `location`, matching the no-FOUC theme pattern). It owns both paths.

```astro
<script>
  (function () {
    var WELCOME = 'of-confirm-welcome';
    var DISMISSED = 'of-confirm-welcome-dismissed';
    var params = new URLSearchParams(location.search);
    var state = params.get('confirmed');

    // --- Success bar: param OR persisted flag, unless dismissed this session ---
    if (state === '1') {
      try { sessionStorage.setItem(WELCOME, '1'); } catch (e) {}
      // Clean the URL so a reload/bookmark doesn't carry the param.
      history.replaceState({}, '', location.pathname);
    }
    var welcome = false, dismissed = false;
    try {
      welcome = sessionStorage.getItem(WELCOME) === '1';
      dismissed = sessionStorage.getItem(DISMISSED) === '1';
    } catch (e) {}

    if (welcome && !dismissed) {
      var bar = document.getElementById('confirm-bar');
      var barClose = document.getElementById('confirm-bar-close');
      var barCta = document.getElementById('confirm-bar-cta');
      if (bar) {
        bar.classList.remove('hidden');
        var markDismissed = function () { try { sessionStorage.setItem(DISMISSED, '1'); } catch (e) {} };
        barClose && barClose.addEventListener('click', function () { markDismissed(); bar.classList.add('hidden'); });
        // Taking the action also suppresses the bar on a same-session return.
        barCta && barCta.addEventListener('click', markDismissed);
      }
    }

    // --- Toast: one-shot ack for already/error (not persisted) ---
    if (state === 'already' || state === 'error') {
      var toast = document.getElementById('confirm-toast');
      var text = document.getElementById('confirm-toast-text');
      var dot = document.getElementById('confirm-toast-dot');
      var toastClose = document.getElementById('confirm-toast-close');
      if (toast && text) {
        var msg = '', isError = false;
        if (state === 'already') {
          msg = "You're already subscribed to our stories.";
        } else {
          msg = params.get('error') || "That link didn't work. Please try again.";
          isError = true;
        }
        text.textContent = msg;
        if (isError && dot) dot.classList.replace('bg-primary', 'bg-red-500');
        toast.classList.remove('hidden');
        var hide = function () { toast.classList.add('hidden'); };
        toastClose && toastClose.addEventListener('click', hide);
        if (!isError) setTimeout(hide, 8000);
      }
    }
  })();
</script>
```

- [ ] **Step 3: Build to verify it compiles clean**

Run: `npm run build`
Expected: completes with no errors; "68 page(s) built" (or current page count) in the output.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ConfirmBanner.astro
git commit -m "feat(funnel): prominent session-persistent post-confirm welcome bar (A6 follow-up)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: In-browser verification (both themes, full state matrix)

**Files:** none (verification only).

**Interfaces:**
- Consumes: the built/dev site on `http://localhost:4321/` and the reshaped `ConfirmBanner.astro` from Task 1.
- Produces: confirmation that every behavior in the spec's verification section holds.

> Dev server: check it's running (`/tmp/astro-dev-4321.log`); start with `npm run dev` if not. Sandbox curl cannot reach localhost — use the Chrome MCP browser.

- [ ] **Step 1: Success bar shows + reflows + URL cleans**

Navigate to `http://localhost:4321/?confirmed=1`.
Expected: a full-width bar appears directly under the nav, above the hero, pushing the hero down; it reads "You're in. Welcome to the real build log." with a "See the proof →" button and a ✕. URL bar shows `/` (param cleaned).

- [ ] **Step 2: Persistence across reload**

Reload `http://localhost:4321/` (no param).
Expected: the bar is still there (read from sessionStorage).

- [ ] **Step 3: Dismiss sticks**

Click ✕, then reload `/`.
Expected: bar gone after click; stays gone after reload (this session).

- [ ] **Step 4: CTA navigates and suppresses**

Open a fresh tab, visit `/?confirmed=1`, click "See the proof →".
Expected: lands on `/proof/`. Navigate back to `/` in the same tab/session.
Expected: bar does NOT reappear (CTA marked it dismissed).

- [ ] **Step 5: Toast states unchanged**

Visit `/?confirmed=already` → neutral floating toast at top-20, auto-dismisses ~8s, no Proof CTA.
Visit `/?confirmed=error&error=That+link+expired.` → floating toast with a red dot showing "That link expired.", manual dismiss only (no auto-dismiss).
Expected: both behave as the original toast; neither sets the welcome bar.

- [ ] **Step 6: Both themes legible**

With the success bar showing, toggle the nav theme switch Light ↔ Dark.
Expected: bar background, body text, and the CTA button all stay legible in both themes; the CTA is the resolved accent triad (dark-teal-on-cyan look in dark, white-on-cyan-or-accent in light) with no low-contrast white-on-bright-cyan. Check the browser console — no errors in any of the above.

- [ ] **Step 7: No commit**

Verification only. If a defect is found, fix in `ConfirmBanner.astro`, re-run `npm run build`, and amend or add a follow-up commit before proceeding.

---

## Self-Review

**1. Spec coverage:**
- Full-width normal-flow bar that reflows + sits under nav → Task 1 markup (`#confirm-bar` is a normal block; mounted between Nav and main). ✓
- Session-persistent via two sessionStorage keys → Task 1 Step 2 script. ✓
- URL clean kept → script `history.replaceState`. ✓
- Dismiss ✕ + CTA-click both suppress → script `markDismissed` on both. ✓
- Proof CTA → `href="/proof/"`. ✓
- `already`/`error` stay as toast, not persisted → second script block. ✓
- CLS guard / pre-paint → component script + `hidden` default. ✓
- Theme accent triad + a11y roles → markup classes + `role="status"`/`aria-live`/`aria-label`. ✓
- Copy grade 3–5, no em-dashes → "You're in. Welcome to the real build log." / "See the proof →". ✓
- Verification matrix → Task 2 all steps. ✓
- Out of scope (email body, A10) → not in plan. ✓

**2. Placeholder scan:** No TBD/TODO; all code blocks complete; verification gives exact URLs + expected outcomes. ✓

**3. Type/id consistency:** IDs match between markup and script — `confirm-bar`, `confirm-bar-close`, `confirm-bar-cta`, `confirm-toast`, `confirm-toast-text`, `confirm-toast-dot`, `confirm-toast-close`. sessionStorage keys `of-confirm-welcome` / `of-confirm-welcome-dismissed` consistent across spec and plan. ✓

## Note on CLS / pre-paint

Astro hoists and bundles component `<script>` tags; they are not inlined in `<head>` synchronously the way the theme no-FOUC init is (that one lives directly in `Layout.astro`). The bar therefore reveals on script execution, which is early but not strictly before first paint. Because the bar is the first flow element above the hero, the reflow is at the very top and visually reads as "the page loaded with a bar," not a jarring mid-content jump. If in-browser testing shows a visible jump, the fallback is to move the reveal logic into the `Layout.astro` no-FOUC inline script (keyed on `location` + sessionStorage) — note this option but do not implement unless the jump is observed.
