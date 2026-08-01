# Project Memory

## browser-preview-operator-review

- When the operator asks to preview a local website in the browser, open the local URL directly in the operator's normal Chrome window, for example with `open http://127.0.0.1:4321/relay/`.
- Do not resize the browser preview viewport or use Playwright's synthetic viewport as the operator-facing preview. That makes the site appear tiny in the top-left of a maximized Chrome window.
- Use synthetic Playwright or Chrome DevTools viewport sizes only for explicit responsive QA, screenshots, or measurements, and say that it is a test viewport.
- For normal review, let Chrome use its existing maximized window edge to edge.

## authenticated-analytics-browser

- For GA4, Google Search Console, and Cloudflare dashboard work, use Codex Chrome browser mode with the operator's existing signed-in profile.
- Treat API or CLI access as a complementary evidence source, not a substitute for the authenticated dashboard when dashboard-only dimensions, reports, or controls are needed.
- Cloudflare edge/API checks may use the repository's existing read-only scripts and credentials; do not infer that Wrangler is installed or that API summaries are equivalent to Cloudflare Web Analytics real-user measurements.

## public-nomenclature-boundary

- Customer-visible copy must use Orionfold, product, and customer language. Never expose internal project machinery such as goal IDs (`G-###`), repository roles such as `Website`, private source/path names (`_ASSETS`, `_IDEAS`, `_SPECS`, `_FLOWS`), or terms such as `backlog`, `goal contract`, `launch-dark`, and `operator gate`.
- This boundary applies to local and development previews because they are the review source for future public copy. Translate internal state into customer-safe language such as `Orionfold`, `this page`, `preview`, `next supported Relay release`, and `before publication`.
- Protect website-owned presentation source with `scripts/test/public-copy-nomenclature.test.mjs`. Canonical product content remains source-owned; report upstream leaks through the product contract instead of repairing `_ASSETS` locally.
