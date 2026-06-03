// Summarize the latest Lighthouse CI run into audit-reports/metrics/
// (git-ignored) for the M4 dashboard "Lighthouse trend" panel. M3 task, spec §7.
//
//   node scripts/summarize-lighthouse.mjs
//
// Reads audit-reports/lhci/manifest.json (written by `npm run lhci` /
// .lighthouserc.cjs) and, for each URL's REPRESENTATIVE run (LHCI's median of 3
// — the stable one to trend), pulls the category scores plus the key Core Web
// Vitals / perf metrics from that run's report JSON. Plain Node, no deps. Run
// from the repo root. Exits 1 if no LHCI manifest exists yet.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { writeMetric } from './lib/metrics.mjs';

const MANIFEST = resolve(process.cwd(), 'audit-reports/lhci/manifest.json');
if (!existsSync(MANIFEST)) {
  console.error(`[lighthouse] no LHCI manifest at ${MANIFEST} — run \`npm run lhci\` first.`);
  process.exit(1);
}

// The LHCI server runs each page on an ephemeral localhost port; map that back
// to the real site route so dashboard keys match the live URLs. /foo/index.html
// → /foo/ ; /index.html → /.
function routeOf(url) {
  try {
    let p = new URL(url).pathname.replace(/index\.html$/, '');
    return p === '' ? '/' : p;
  } catch {
    return url;
  }
}

const METRIC_AUDITS = {
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  fcp: 'first-contentful-paint',
  si: 'speed-index',
  tti: 'interactive',
};

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const representative = manifest.filter((r) => r.isRepresentativeRun);

let newestFetchTime = null;
const pages = representative.map((run) => {
  const report = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
  const audits = report.audits ?? {};
  const metrics = {};
  for (const [key, id] of Object.entries(METRIC_AUDITS)) {
    const v = audits[id]?.numericValue;
    metrics[key] = v === undefined ? null : +v.toFixed(key === 'cls' ? 4 : 0);
  }
  if (report.fetchTime && (!newestFetchTime || report.fetchTime > newestFetchTime)) {
    newestFetchTime = report.fetchTime;
  }
  return {
    route: routeOf(run.url),
    scores: run.summary, // {performance, accessibility, best-practices, seo}
    metrics, // {lcp, cls, tbt, fcp, si, tti} — ms except cls (unitless)
  };
}).sort((a, b) => a.route.localeCompare(b.route));

// Site-wide minimums per category, so the dashboard can show one headline row
// and the spec's budget floors (perf, a11y, seo, best-practices) at a glance.
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];
const minScores = {};
for (const c of CATS) {
  const vals = pages.map((p) => p.scores?.[c]).filter((v) => typeof v === 'number');
  minScores[c] = vals.length ? Math.min(...vals) : null;
}

const result = {
  source: 'lighthouse',
  fetchedAt: new Date().toISOString(),
  runFetchTime: newestFetchTime, // when LHCI actually measured (vs. when summarized)
  formFactor: 'mobile',
  pageCount: pages.length,
  minScores,
  pages,
};

const outPath = writeMetric('lighthouse', result);
console.log(
  `[lighthouse] ${pages.length} pages · min ` +
    CATS.map((c) => `${c[0]}=${minScores[c] ?? 'n/a'}`).join(' '),
);
console.log(`[lighthouse] wrote ${outPath}`);
