// Fetch real-user field Core Web Vitals from the Chrome UX Report (CrUX) API
// for EVERY site in the registry, writing a dated JSON per site into
// audit-reports/metrics/ (git-ignored) for the dashboard Field-CWV trend.
//
//   node scripts/fetch-crux.mjs
//
// Plain Node (no deps). Reads GOOGLE_CLOUD_API_KEY from env or .env.local. Origins
// come from scripts/lib/sites.mjs. Must run from the repo root.
//
// 🔴 Expected for a young/low-traffic origin: CrUX returns HTTP 404 "data not
// found" — NOT an error. The script records `available:false` per form factor and
// keeps going. Cloudflare Web Analytics is the primary field source until CrUX
// fills. Per-site isolation: one origin failing never aborts another.

import { loadEnvLocal, writeMetric } from './lib/metrics.mjs';
import { SITES } from './lib/sites.mjs';

const FORM_FACTORS = ['PHONE', 'DESKTOP'];
const ENDPOINT = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

loadEnvLocal();
const KEY = process.env.GOOGLE_CLOUD_API_KEY;
if (!KEY) {
  console.error('[crux] GOOGLE_CLOUD_API_KEY not set (env or .env.local) — aborting.');
  process.exit(1);
}

// CrUX reports each metric as a histogram + p75. p75 is the field "score".
function summarize(metrics) {
  const out = {};
  for (const [name, data] of Object.entries(metrics ?? {})) {
    if (data?.percentiles?.p75 !== undefined) out[name] = data.percentiles.p75;
  }
  return out;
}

async function fetchOrigin(origin) {
  const result = { source: 'crux', origin, fetchedAt: new Date().toISOString(), formFactors: {} };
  for (const formFactor of FORM_FACTORS) {
    const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, formFactor }),
    });
    if (res.status === 404) {
      result.formFactors[formFactor] = { available: false, reason: 'below CrUX reporting threshold (young/low-traffic origin)' };
      console.log(`[crux] ${origin} ${formFactor}: no field data yet (404 — below threshold).`);
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      console.error(`[crux] ${origin} ${formFactor}: HTTP ${res.status} — ${body.slice(0, 200)}`);
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
    console.log(`[crux] ${origin} ${formFactor}: ${Object.entries(p75).map(([k, v]) => `${k}=${v}`).join(', ') || '(no metrics)'}`);
  }
  return result;
}

for (const site of SITES) {
  const origin = `https://${site.domain}`;
  try {
    const result = await fetchOrigin(origin);
    result.site = site.key;
    result.domain = site.domain;
    const outPath = writeMetric('crux', result, site.key);
    console.log(`[crux] ${site.key} wrote ${outPath}`);
  } catch (e) {
    console.error(`[crux] ${site.key}: ${String(e.message ?? e)}`);
  }
}
