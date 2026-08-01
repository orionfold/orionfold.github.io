/**
 * Lighthouse CI config (M2 — lab perf). Audits the built `dist/` with a local
 * static server, mobile form factor, and DEVTOOLS (measured) throttling — not
 * the default `simulate`, which inflates LCP by tying it to TTI (see the
 * `chrome-mcp-perf-caveats` memory + the D2 baseline). The 8 URLs are the key
 * landing-page portfolio: home, four product hubs, books, story, and models.
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
        'http://localhost/flow/index.html',
        'http://localhost/arena/index.html',
        'http://localhost/relay/index.html',
        'http://localhost/proof/index.html',
        'http://localhost/books/index.html',
        'http://localhost/story/index.html',
        'http://localhost/models/index.html',
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
      // perf-score + LCP ceilings that differ between the tight home/discovery
      // tier and the product-hub tier. Category scores are the hard ("error") regression guards (more
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
            'categories:best-practices': ['warn', { minScore: 0.55 }], // retains the historical third-party floor; current local baseline is 100
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }], // Google's "good" boundary; home ~0.087 since the hero constellation (06-05)
            'total-blocking-time': ['warn', { maxNumericValue: 750 }], // CI 460–645ms (GA4+Ads+Meta 3p JS); a jump past 750 = real bloat
          },
        },
        {
          // ── Tight tier: homepage and discovery hubs. The 0.75 floor retains
          //    the data-animate-on-LCP net (that bug ties LCP to TTI and tanks
          //    the score far below any sane floor). Local 8-route baseline: 0.97–0.98. ──
          matchingUrlPattern: '(localhost:\\d+/index\\.html|/(books|story|models)/index\\.html)$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.75 }], // CI-proven guard retained until the new matrix has runner history
            'largest-contentful-paint': ['warn', { maxNumericValue: 2800 }], // new local baseline 1.99–2.25s + headroom
          },
        },
        {
          // ── Product tier: Flow, Arena, Relay, and Proof. Keep the historical
          //    image-heavy ceiling until the new matrix has runner history. ──
          matchingUrlPattern: '/(flow|arena|relay|proof)/index\\.html$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.65 }], // local 8-route baseline 0.97–0.98
            'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }], // new local baseline 1.82–2.14s; runner calibration pending
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
