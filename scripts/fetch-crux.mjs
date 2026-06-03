// Fetch real-user field Core Web Vitals from the Chrome UX Report (CrUX) API
// and write a dated JSON into audit-reports/metrics/ (git-ignored) for the M4
// dashboard trend. M2 task, spec §7 ("Field CWV").
//
//   node scripts/fetch-crux.mjs
//
// Runs on plain Node (no deps). Reads GOOGLE_CLOUD_API_KEY from the environment
// or, if unset, from .env.local in the repo root (the same key the build's
// CrUX/PSI calls use). Must run from the repo root.
//
// 🔴 Expected today: CrUX returns HTTP 404 "chrome ux report data not found"
// because orionfold.com is too young / low-traffic to clear CrUX's reporting
// threshold. That is NOT an error — the script records `available: false` and
// exits 0 so it slots cleanly into the dashboard. Cloudflare Web Analytics (D2)
// is the primary field-CWV source until CrUX fills; rerun this periodically and
// it will start returning data once traffic crosses the threshold.

import { loadEnvLocal, writeMetric } from './lib/metrics.mjs';

const ORIGIN = 'https://orionfold.com';
const FORM_FACTORS = ['PHONE', 'DESKTOP'];
const ENDPOINT = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

loadEnvLocal();
const KEY = process.env.GOOGLE_CLOUD_API_KEY;
if (!KEY) {
  console.error('[crux] GOOGLE_CLOUD_API_KEY not set (env or .env.local) — aborting.');
  process.exit(1);
}

// CrUX reports each metric as a histogram + a p75 value. p75 is the field
// "score" Google uses, so that's what the dashboard tracks.
function summarize(metrics) {
  const out = {};
  for (const [name, data] of Object.entries(metrics ?? {})) {
    if (data?.percentiles?.p75 !== undefined) out[name] = data.percentiles.p75;
  }
  return out;
}

const result = {
  source: 'crux',
  origin: ORIGIN,
  fetchedAt: new Date().toISOString(),
  formFactors: {},
};

for (const formFactor of FORM_FACTORS) {
  const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: ORIGIN, formFactor }),
  });

  if (res.status === 404) {
    result.formFactors[formFactor] = { available: false, reason: 'below CrUX reporting threshold (young/low-traffic origin)' };
    console.log(`[crux] ${formFactor}: no field data yet (404 — below threshold).`);
    continue;
  }
  if (!res.ok) {
    const body = await res.text();
    console.error(`[crux] ${formFactor}: HTTP ${res.status} — ${body.slice(0, 200)}`);
    result.formFactors[formFactor] = { available: false, reason: `HTTP ${res.status}` };
    continue;
  }

  const json = await res.json();
  const p75 = summarize(json?.record?.metrics);
  result.formFactors[formFactor] = {
    available: true,
    period: json?.record?.collectionPeriod ?? null,
    p75,
  };
  console.log(`[crux] ${formFactor}: ${Object.entries(p75).map(([k, v]) => `${k}=${v}`).join(', ') || '(no metrics)'}`);
}

const outPath = writeMetric('crux', result);
console.log(`[crux] wrote ${outPath}`);
