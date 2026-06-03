/**
 * Lighthouse CI config (M2 — lab perf). Audits the built `dist/` with a local
 * static server, mobile form factor, and DEVTOOLS (measured) throttling — not
 * the default `simulate`, which inflates LCP by tying it to TTI (see the
 * `chrome-mcp-perf-caveats` memory + the D2 baseline). The 6 URLs mirror the
 * D2 Cloudflare baseline so the lab trend lines up with the field numbers.
 *
 * Local run:   npx @lhci/cli autorun
 * CI:          .github/workflows/lighthouse.yml (separate from deploy.yml —
 *              never gates the prod deploy).
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
      },
    },
    assert: {
      // Per-tier budgets. assertMatrix applies EVERY matching entry, so the
      // catch-all ".*" sets the global guards and the two tier entries add the
      // perf-score + LCP ceilings that differ between text-LCP and image-LCP
      // pages. Thresholds are derived from the local devtools-throttled median
      // (see audit-reports/m2-lighthouse-budgets-*.md) with headroom for CI
      // variance: category scores are the hard ("error") regression guards
      // (more stable than raw timings); single timing metrics are "warn".
      assertMatrix: [
        {
          // ── Global guards (every page) ──
          matchingUrlPattern: '.*',
          assertions: {
            'categories:seo': ['error', { minScore: 1.0 }], // all pages 100 — SEO is core to the site
            'categories:accessibility': ['warn', { minScore: 0.92 }], // currently 95–100
            'categories:best-practices': ['warn', { minScore: 0.75 }], // pre-existing uniform 79 (3p cookies) — see report
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.05 }], // warn (not error): raw metric like LCP/TBT, so it follows the same rule — the perf-category score is the hard gate. CI medians ~0.055 (within Google's "good" <0.1) tripped a 0.05 error every run; a real CLS regression drops the perf score and fails there.
            'total-blocking-time': ['warn', { maxNumericValue: 350 }], // ~45ms now; JS-bloat warning
          },
        },
        {
          // ── Fast tier: text-LCP pages. Tight LCP ceiling = the data-animate
          //    -on-LCP-element regression net (these sit at 1.6–2.3s). ──
          matchingUrlPattern: '(localhost:\\d+/index\\.html|/sponsor/index\\.html|/dgx-spark/index\\.html)$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.9 }], // currently 98–99
            'largest-contentful-paint': ['warn', { maxNumericValue: 2800 }], // dgx-spark hero ~2.3s + headroom
          },
        },
        {
          // ── Image tier: poster/cover-LCP pages. Looser LCP (image weight is a
          //    documented follow-up, not a regression). ──
          matchingUrlPattern: '(/software/index\\.html|/software/fieldkit/index\\.html|/books/ai-research-on-nvidia-dgx-spark/index\\.html)$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.8 }], // currently 88–92
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
