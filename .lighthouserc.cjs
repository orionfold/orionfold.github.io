/**
 * Lighthouse CI config (M2 — lab perf). Audits the built `dist/` with a local
 * static server, mobile form factor, and DEVTOOLS (measured) throttling — not
 * the default `simulate`, which inflates LCP by tying it to TTI (see the
 * `chrome-mcp-perf-caveats` memory + the D2 baseline). The 6 URLs mirror the
 * D2 Cloudflare baseline so the lab trend lines up with the field numbers.
 *
 * Local run:   npm run lhci  (collect → upload → assert; upload BEFORE assert
 *              so audit-reports/lhci/ refreshes even on a red budget run —
 *              autorun would skip it)
 * CI:          .github/workflows/lighthouse.yml (separate from deploy.yml —
 *              never gates the prod deploy). Same three-step order.
 *
 * Budgets live in the `assert` block. They protect the two codified perf
 * invariants indirectly: a `data-animate` on an LCP-candidate element, or a
 * second eager image, both surface as an LCP regression that trips the ceiling.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      url: [
        'http://localhost/index.html',
        'http://localhost/sponsor/index.html',
        'http://localhost/dgx-spark/index.html',
        'http://localhost/software/index.html',
        'http://localhost/software/fieldkit/index.html',
        'http://localhost/books/ai-research-on-nvidia-dgx-spark/index.html',
      ],
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'devtools',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // G-042 defense in depth. The runtime hostname gate is the primary
        // control and prevents localhost/CI from creating analytics state at
        // all. These patterns keep Lighthouse independent of Google endpoints
        // even if a future source regression attempts a request.
        blockedUrlPatterns: [
          '*googletagmanager.com/*',
          '*google-analytics.com/*',
          '*googleadservices.com/*',
          '*doubleclick.net/*',
        ],
      },
    },
    assert: {
      // Per-tier budgets. assertMatrix applies EVERY matching entry, so the
      // catch-all ".*" sets the global guards and the two tier entries add the
      // perf-score + LCP ceilings that differ between text-LCP and image-LCP
      // pages. Category scores are the hard ("error") regression guards (more
      // stable than raw timings); single timing metrics are "warn".
      //
      // 🔴 Thresholds are calibrated to the GH-RUNNER medians (lighthouse.yml
      // runs 2026-06-03→06), NOT local numbers — CI hardware is ~2× slower, so
      // local devtools scores (98–99 fast tier) run far above these floors.
      // The original local-derived floors (0.9/0.8) made the workflow red from
      // its very first run. Baked into the baseline: the Meta Pixel (2026-06-03,
      // deliberate, Q2 ads test) costs ~0.05 perf / +100ms TBT sitewide and
      // dropped best-practices 79→61 (3p cookies). If the pixel is ever
      // removed, scores rise and these floors simply gain headroom.
      assertMatrix: [
        {
          // ── Global guards (every page) ──
          matchingUrlPattern: '.*',
          assertions: {
            'categories:seo': ['error', { minScore: 1.0 }], // all pages 100 — SEO is core to the site
            'categories:accessibility': ['warn', { minScore: 0.92 }], // currently 95–100
            'categories:best-practices': ['warn', { minScore: 0.55 }], // CI 61 uniform since Meta Pixel (was 79, GA4/Ads cookies)
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }], // Google's "good" boundary; home ~0.087 since the hero constellation (06-05)
            'total-blocking-time': ['warn', { maxNumericValue: 750 }], // CI 460–645ms (GA4+Ads+Meta 3p JS); a jump past 750 = real bloat
          },
        },
        {
          // ── Fast tier: text-LCP pages. CI medians 0.80–0.87; floor 0.75 keeps
          //    the data-animate-on-LCP net (that bug ties LCP to TTI and tanks
          //    the score far below any sane floor). ──
          matchingUrlPattern: '(localhost:\\d+/index\\.html|/sponsor/index\\.html|/dgx-spark/index\\.html)$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.75 }], // CI 0.80–0.87 (local 98–99)
            'largest-contentful-paint': ['warn', { maxNumericValue: 2800 }], // dgx-spark hero ~2.3s + headroom
          },
        },
        {
          // ── Image tier: poster/cover-LCP pages. Looser floors (image weight is
          //    a documented follow-up, not a regression). ──
          matchingUrlPattern: '(/software/index\\.html|/software/fieldkit/index\\.html|/books/ai-research-on-nvidia-dgx-spark/index\\.html)$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.65 }], // CI 0.70–0.78 (local 88–92)
            'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }], // 3.3–3.8s lab / 4.3s live
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './audit-reports/lhci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
