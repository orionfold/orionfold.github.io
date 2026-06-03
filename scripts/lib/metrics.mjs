// Shared, zero-dependency helpers for the M3 metrics fetchers (spec §7).
// Every fetcher reads tokens from .env.local (git-ignored) and writes a dated
// JSON snapshot into audit-reports/metrics/ (also git-ignored), which the M4
// dashboard reads as a time series. Plain Node, no deps — so a future GitHub
// Action cron (M5) can run these without an npm install.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Minimal .env.local loader: only fills keys not already in the environment, so
// an ambient env var (e.g. one a CI runner injects) always wins. Quotes are
// stripped. Silent if the file is missing — the caller checks for required keys.
export function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}

// The UTC date stamp (YYYY-MM-DD) all snapshots share, so the dashboard can pair
// a day's crux/cloudflare/betterstack/lighthouse files by filename.
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export const METRICS_DIR = resolve(process.cwd(), 'audit-reports/metrics');

// Write audit-reports/metrics/<source>-<date>.json (one snapshot per source per
// day; reruns overwrite the same day's file). Returns the path written.
export function writeMetric(source, data) {
  mkdirSync(METRICS_DIR, { recursive: true });
  const outPath = resolve(METRICS_DIR, `${source}-${today()}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
  return outPath;
}

// POST a Cloudflare GraphQL Analytics query and return parsed JSON. Throws on a
// transport error or a GraphQL `errors` array so callers can decide whether a
// given dataset being unavailable is fatal or a graceful "no data yet".
export async function cfGraphql(token, query, variables = {}) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Cloudflare GraphQL HTTP ${res.status}`);
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}
