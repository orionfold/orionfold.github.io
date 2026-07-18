# Multi-site Stats Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing stats/audit tooling so it tracks ainative.business alongside orionfold.com at full parity (Cloudflare edge, GA4, GSC, Lighthouse), driven by a small sites registry.

**Architecture:** Add a `scripts/lib/sites.mjs` registry as the single source of truth for the two sites' identifiers. Make the metric-file writer, the dashboard loader, and the Cloudflare/CrUX fetchers loop over that registry. orionfold stays the default site and keeps its bare `<source>-<date>.json` filenames (zero migration, unbroken trends); ainative gets a `-ainative` segment. The dashboard renderer groups its data panels per site. GA4/GSC/ainative-Lighthouse stay manual Claude-in-Chrome captures (the Workspace org blocks those APIs), so the `seo-aeo-audit` skill's roundtrip gains a per-site loop.

**Tech Stack:** Plain Node ESM (`"type": "module"`, no deps — a future CI cron must run these without `npm install`). Cloudflare GraphQL Analytics API. CrUX REST API. The M7 dashboard (loopback Node http server + a browser-safe pure renderer).

## Global Constraints

- **Zero new dependencies.** Every script runs on plain Node ESM; no `import` of anything not already in the repo. (`scripts/lib/metrics.mjs` header rule.)
- **`scripts/lib/dashboard-render.mjs` must have NO Node imports** — it is served to the browser as an ES module AND imported in Node. Everything is a pure function of the payload. (file header rule.)
- **No `style="` attributes in rendered HTML** — the dashboard CSP is `style-src 'self'`; inline styles break it. Use existing CSS classes.
- **orionfold is the default site:** default-site snapshots keep the bare `<source>-<date>.json` name with NO site segment. Only non-default sites get a `-<sitekey>` segment. Existing bare files must keep loading as orionfold.
- **Per-site isolation:** each fetcher wraps each site in its own try/catch; one site's failure never aborts another. Record a per-site error field, never throw out of the loop.
- **No secrets in tracked files / no PII.** Zone ids and GA4 property ids are identifiers (fine to inline in the registry). The CF API token stays only in `.env.local`. (`public-repo-boundary`.)
- **Keep the two skill copies byte-identical:** any edit to `.claude/skills/seo-aeo-audit/**` is mirrored to `.agents/skills/seo-aeo-audit/**`.
- **Confirmed identifiers (verified live 2026-06-27):** orionfold CF zone `3512c8e3c458c154d8eb47598b1d2846`, GA4 `a395553282p538751483`, GSC `sc-domain:orionfold.com`. ainative CF zone `506ad3d8f352887fd33766b0858f41f6`, GSC `sc-domain:ainative.business`, GA4 = unknown until first roundtrip (ships as `TBD-first-run`). Both zones are on the one account; the existing `CLOUDFLARE_API_TOKEN` reads both.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/lib/sites.mjs` | **new** — `SITES` registry + helpers (`DEFAULT_SITE`, `siteByKey`, `metricSiteSegment`). The single source of truth for site identifiers. |
| `scripts/lib/metrics.mjs` | `writeMetric(source, data, siteKey?)` gains an optional site segment. |
| `scripts/lib/dashboard-data.mjs` | `loadSnapshots()` parses an optional site segment and tags each entry with `site`. |
| `scripts/fetch-cloudflare.mjs` | extract `fetchZone(token, zoneId)`, loop the registry, write per-site. |
| `scripts/fetch-crux.mjs` | loop the registry per origin, write per-site. |
| `scripts/lib/dashboard-render.mjs` | `latest(source, site)`; render the four data panels once per site under a site header. |
| `.claude/skills/seo-aeo-audit/SKILL.md` + `.agents/` mirror | reframe to "the sites in the registry"; per-site roundtrip + ainative-Lighthouse capture. |
| `.claude/skills/seo-aeo-audit/references/analytics-roundtrip.md` + mirror | per-site GA4/GSC/Lighthouse capture loop + ainative file schema. |

---

## Task 1: Sites registry

**Files:**
- Create: `scripts/lib/sites.mjs`
- Test: `scripts/lib/sites.selfcheck.mjs` (temporary assertion script, deleted in Step 5)

**Interfaces:**
- Produces:
  - `SITES` — ordered array of `{ key, domain, isDefault?, cfZoneId, ga4, gsc, lighthouseUrl }`.
  - `DEFAULT_SITE` — the `SITES` entry with `isDefault: true`.
  - `siteByKey(key) → site | null`.
  - `metricSiteSegment(siteKey) → '' for the default site, '-<siteKey>' otherwise`. This is the one function that encodes the bare-vs-suffixed filename rule; everything else calls it.

- [ ] **Step 1: Write the failing self-check**

Create `scripts/lib/sites.selfcheck.mjs`:

```js
import assert from 'node:assert/strict';
import { SITES, DEFAULT_SITE, siteByKey, metricSiteSegment } from './sites.mjs';

// registry shape
assert.equal(SITES.length, 2, 'two sites');
assert.equal(DEFAULT_SITE.key, 'orionfold', 'orionfold is default');
assert.equal(SITES.filter((s) => s.isDefault).length, 1, 'exactly one default');

// confirmed identifiers (Global Constraints)
const of = siteByKey('orionfold');
const ai = siteByKey('ainative');
assert.equal(of.cfZoneId, '3512c8e3c458c154d8eb47598b1d2846');
assert.equal(ai.cfZoneId, '506ad3d8f352887fd33766b0858f41f6');
assert.equal(ai.gsc, 'sc-domain:ainative.business');
assert.equal(siteByKey('nope'), null, 'unknown key → null');

// the filename rule: default = bare, others = suffixed
assert.equal(metricSiteSegment('orionfold'), '', 'default site → no segment');
assert.equal(metricSiteSegment('ainative'), '-ainative', 'non-default → -key');

console.log('OK sites.selfcheck');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/lib/sites.selfcheck.mjs`
Expected: FAIL — `Cannot find module './sites.mjs'` (or a thrown assertion once the file exists but is incomplete).

- [ ] **Step 3: Write `scripts/lib/sites.mjs`**

```js
// The site registry — single source of truth for the two tracked sites'
// identifiers, shared by the metrics fetchers and the dashboard. Zone ids and
// GA4 property ids are IDENTIFIERS, not secrets (useless without the account
// token / a logged-in session), so they live inline here — nothing about a site
// goes into .env.local except the shared CLOUDFLARE_API_TOKEN. Plain ESM, no deps.
//
// orionfold is the DEFAULT site: its snapshot files keep the bare
// `<source>-<date>.json` name (no migration, unbroken trends). Non-default sites
// get a `-<key>` segment via metricSiteSegment(). Verified identifiers live in
// the multi-site-stats spec (_SPECS/2026-06-27-150745_multi-site-stats-tracking-design.md).

export const SITES = [
  {
    key: 'orionfold',
    domain: 'orionfold.com',
    isDefault: true,
    cfZoneId: '3512c8e3c458c154d8eb47598b1d2846',
    ga4: 'a395553282p538751483',
    gsc: 'sc-domain:orionfold.com',
    lighthouseUrl: 'https://orionfold.com/',
  },
  {
    key: 'ainative',
    domain: 'ainative.business',
    cfZoneId: '506ad3d8f352887fd33766b0858f41f6',
    ga4: 'TBD-first-run', // read during the first seo-aeo-audit roundtrip, then fill in
    gsc: 'sc-domain:ainative.business',
    lighthouseUrl: 'https://ainative.business/',
  },
];

export const DEFAULT_SITE = SITES.find((s) => s.isDefault);

export function siteByKey(key) {
  return SITES.find((s) => s.key === key) ?? null;
}

// '' for the default site → bare `<source>-<date>.json`; '-<key>' otherwise.
// The ONE place the bare-vs-suffixed filename rule lives.
export function metricSiteSegment(siteKey) {
  return siteKey === DEFAULT_SITE.key ? '' : `-${siteKey}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node scripts/lib/sites.selfcheck.mjs`
Expected: `OK sites.selfcheck`

- [ ] **Step 5: Delete the self-check and commit**

```bash
rm scripts/lib/sites.selfcheck.mjs
git add scripts/lib/sites.mjs
git commit -m "feat(metrics): add multi-site registry (scripts/lib/sites.mjs)"
```

---

## Task 2: Site-aware metric filenames

**Files:**
- Modify: `scripts/lib/metrics.mjs` (the `writeMetric` function, ~lines 37-42)
- Test: `scripts/lib/metrics.selfcheck.mjs` (temporary, deleted in Step 5)

**Interfaces:**
- Consumes: `metricSiteSegment(siteKey)` from Task 1.
- Produces: `writeMetric(source, data, siteKey?) → outPath`. When `siteKey` is omitted or is the default site, the filename is `<source>-<date>.json` (unchanged). Otherwise `<source>-<siteKey>-<date>.json`. Return value is the absolute path written.

- [ ] **Step 1: Write the failing self-check**

Create `scripts/lib/metrics.selfcheck.mjs`:

```js
import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { writeMetric, today } from './metrics.mjs';

const d = today();

const bare = writeMetric('selfchecksrc', { ok: 1 });            // default → bare
const ai = writeMetric('selfchecksrc', { ok: 1 }, 'ainative');  // non-default → suffixed
const of = writeMetric('selfchecksrc', { ok: 1 }, 'orionfold'); // default explicitly → still bare

assert.equal(basename(bare), `selfchecksrc-${d}.json`);
assert.equal(basename(ai), `selfchecksrc-ainative-${d}.json`);
assert.equal(basename(of), `selfchecksrc-${d}.json`, 'explicit default still bare');

console.log('OK metrics.selfcheck');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/lib/metrics.selfcheck.mjs`
Expected: FAIL — assertion error on the `ainative` case (today `writeMetric` ignores the 3rd arg, so `basename(ai)` is still `selfchecksrc-${d}.json`).

- [ ] **Step 3: Modify `writeMetric` in `scripts/lib/metrics.mjs`**

Add the import at the top of the file (after the existing `node:path` import on line 8):

```js
import { metricSiteSegment } from './sites.mjs';
```

Replace the existing `writeMetric` (lines 37-42):

```js
// Write audit-reports/metrics/<source>[-<site>]-<date>.json (one snapshot per
// source per site per day; reruns overwrite the same day's file). The default
// site (orionfold) gets the bare `<source>-<date>.json` name — no migration,
// existing trends stay continuous. Returns the path written.
export function writeMetric(source, data, siteKey) {
  mkdirSync(METRICS_DIR, { recursive: true });
  const seg = siteKey ? metricSiteSegment(siteKey) : '';
  const outPath = resolve(METRICS_DIR, `${source}${seg}-${today()}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
  return outPath;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node scripts/lib/metrics.selfcheck.mjs`
Expected: `OK metrics.selfcheck`

- [ ] **Step 5: Delete the self-check + its scratch files, then commit**

```bash
rm scripts/lib/metrics.selfcheck.mjs audit-reports/metrics/selfchecksrc-*.json
git add scripts/lib/metrics.mjs
git commit -m "feat(metrics): writeMetric site segment (bare for default site)"
```

---

## Task 3: Site-aware snapshot loader

**Files:**
- Modify: `scripts/lib/dashboard-data.mjs` (the `loadSnapshots` function, lines 12-36)
- Test: `scripts/lib/dashboard-data.selfcheck.mjs` (temporary, deleted in Step 5)

**Interfaces:**
- Produces: `loadSnapshots()` returns `{ [source]: [{ date, site, data }, ...] }`, sorted oldest→newest within each source. The filename regex now accepts an optional `-<site>` segment between source and date; a bare filename resolves to `site: 'orionfold'`. The `site` allowlist is derived from the registry so an unknown segment is treated as part of the source name (back-compat: a hypothetical `my-source-2026-..` stays source `my-source`).

- [ ] **Step 1: Write the failing self-check**

Create `scripts/lib/dashboard-data.selfcheck.mjs`. This tests the pure regex/keying by exercising the real loader against temp files it writes into `METRICS_DIR`:

```js
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { METRICS_DIR } from './metrics.mjs';
import { loadSnapshotsForTest } from './dashboard-data.mjs';

const w = (name, obj) => {
  const p = resolve(METRICS_DIR, name);
  writeFileSync(p, JSON.stringify(obj));
  return p;
};
const files = [
  w('zztest-2026-06-27.json', { v: 'of-bare' }),
  w('zztest-ainative-2026-06-27.json', { v: 'ai' }),
  w('zztest-orionfold-2026-06-26.json', { v: 'of-explicit' }),
];

const snaps = loadSnapshotsForTest();
const series = snaps.zztest || [];
const bySite = Object.fromEntries(series.map((s) => [s.site + '@' + s.date, s.data.v]));

assert.equal(bySite['orionfold@2026-06-27'], 'of-bare', 'bare → orionfold');
assert.equal(bySite['ainative@2026-06-27'], 'ai', 'suffix → ainative');
assert.equal(bySite['orionfold@2026-06-26'], 'of-explicit', 'explicit orionfold segment');

files.forEach((p) => rmSync(p));
console.log('OK dashboard-data.selfcheck');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/lib/dashboard-data.selfcheck.mjs`
Expected: FAIL — `loadSnapshotsForTest is not a function` (not yet exported) and the old regex would key `zztest-ainative-...` under source `zztest-ainative`, not `zztest`.

- [ ] **Step 3: Modify `loadSnapshots` in `scripts/lib/dashboard-data.mjs`**

Add the registry import (after the existing `METRICS_DIR` import on line 9):

```js
import { SITES, DEFAULT_SITE } from './sites.mjs';
```

Replace the `loadSnapshots` function (lines 12-36) with:

```js
// Known non-default site keys — used to split an optional `-<site>` segment off
// the filename. Default-site files are bare, so the default key is NOT in this
// set (a bare file resolves to the default site).
const SITE_KEYS = SITES.map((s) => s.key).filter((k) => k !== DEFAULT_SITE.key);

// ── load every snapshot, grouped by source, tagged with site, oldest→newest ──
function loadSnapshots() {
  let names = [];
  try {
    names = readdirSync(METRICS_DIR);
  } catch {
    return {};
  }
  // Optional middle segment: only a KNOWN non-default site key splits off, so a
  // hyphenated source name (e.g. `metrics-index`) is never mis-split.
  const siteAlt = SITE_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`^(.+?)(?:-(${siteAlt}))?-(\\d{4}-\\d{2}-\\d{2})\\.json$`);
  const bySource = {};
  for (const name of names) {
    const m = name.match(re);
    if (!m) continue;
    const [, source, siteSeg, date] = m;
    const site = siteSeg || DEFAULT_SITE.key;
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(METRICS_DIR, name), 'utf8'));
    } catch {
      continue;
    }
    (bySource[source] ||= []).push({ date, site, data });
  }
  for (const source of Object.keys(bySource)) {
    bySource[source].sort((a, b) => a.date.localeCompare(b.date));
  }
  return bySource;
}

// Test seam: lets the data self-check exercise the real loader.
export function loadSnapshotsForTest() {
  return loadSnapshots();
}
```

Note on the regex: when `siteAlt` is empty (no non-default sites) the group `(?:-()...)` would mis-behave, but the registry always has `ainative`, so `siteAlt` is non-empty. The `(.+?)` is lazy so with no site segment it still captures the full source before `-<date>`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node scripts/lib/dashboard-data.selfcheck.mjs`
Expected: `OK dashboard-data.selfcheck`

Also confirm an existing real bare file still loads (regression): there should be at least one `cloudflare-<date>.json` or `betterstack-<date>.json` already in `audit-reports/metrics/`. Run:

`node -e "import('./scripts/lib/dashboard-data.mjs').then(m=>{const s=m.loadSnapshotsForTest();for(const k of Object.keys(s))console.log(k, s[k].map(x=>x.site+'@'+x.date).join(' '))})"`
Expected: every existing source prints with `orionfold@<date>` entries (no `undefined` site).

- [ ] **Step 5: Delete the self-check and commit**

```bash
rm scripts/lib/dashboard-data.selfcheck.mjs
git add scripts/lib/dashboard-data.mjs
git commit -m "feat(dashboard): loadSnapshots tags each snapshot with its site"
```

---

## Task 4: Cloudflare fetcher loops the registry

**Files:**
- Modify: `scripts/fetch-cloudflare.mjs` (whole file — refactor body into `fetchZone()`, loop `SITES`)

**Interfaces:**
- Consumes: `SITES` from Task 1; `writeMetric(source, data, siteKey)` from Task 2; `loadEnvLocal`, `cfGraphql` (unchanged).
- Produces: one `cloudflare[-<site>]-<date>.json` per site, each with the SAME shape the old single-site file had (`source`, `zone`, `fetchedAt`, `dailyTrend`, `last24h`, `fieldCWV`, plus error fields). Adds a top-level `site` and `domain` field to each file for clarity.

- [ ] **Step 1: Refactor — wrap the existing query logic in `fetchZone(token, zoneId)`**

Replace `scripts/fetch-cloudflare.mjs` entirely. The GraphQL queries and the result-shaping are **unchanged** — they move verbatim into a `fetchZone` function that takes a `zoneId` instead of the module-level `ZONE`, and the module now loops the registry:

```js
// Snapshot Cloudflare edge analytics into audit-reports/metrics/ (git-ignored)
// for the dashboard "Cloudflare stats" panel — now PER SITE (spec
// _SPECS/2026-06-27-150745_multi-site-stats-tracking-design.md).
//
//   node scripts/fetch-cloudflare.mjs
//
// Reads the shared CLOUDFLARE_API_TOKEN from the environment or .env.local, and
// the per-site zone ids from scripts/lib/sites.mjs (NOT the env — zone ids are
// identifiers, and the All-zones token reads every zone on the account). Loops
// every site in the registry; one site's failure never aborts the others. Plain
// Node, no deps. Run from the repo root.
//
// Two GraphQL datasets, because the free plan splits them:
//   1. httpRequests1dGroups  — completed-day totals → the daily traffic trend.
//   2. httpRequestsAdaptiveGroups — a single trailing day for the cache-status
//      breakdown, top error paths, and the 5xx/agent detail.
//
// 🔴 Real-user Core Web Vitals are NOT available to this token (Cloudflare Web
// Analytics RUM is dashboard-only on the free plan). Each snapshot records that
// explicitly so the dashboard shows "read in the Cloudflare dashboard".

import { loadEnvLocal, writeMetric, cfGraphql } from './lib/metrics.mjs';
import { SITES } from './lib/sites.mjs';

loadEnvLocal();
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!TOKEN) {
  console.error('[cloudflare] CLOUDFLARE_API_TOKEN not set (env or .env.local) — aborting.');
  process.exit(1);
}

const now = new Date();
const isoDay = (d) => d.toISOString().slice(0, 10);
const trendStart = isoDay(new Date(now.getTime() - 7 * 86400_000));
const trendEnd = isoDay(now);
const winEnd = now.toISOString();
const winStart = new Date(now.getTime() - 23 * 3600_000).toISOString();

async function fetchZone(token, zoneId) {
  const result = {
    source: 'cloudflare',
    zone: zoneId,
    fetchedAt: now.toISOString(),
    dailyTrend: [],
    dailyTrendError: null,
    last24h: null,
    last24hError: null,
    fieldCWV: {
      available: false,
      reason: 'Cloudflare Web Analytics RUM is dashboard-only on the free plan (no GraphQL/API scope). Read in dash → Analytics › Web Analytics.',
    },
  };

  // 1. Daily trend (graceful if a young zone has no completed-day rows yet).
  try {
    const data = await cfGraphql(
      token,
      `query($zone:String!,$start:Date!,$end:Date!){
        viewer{zones(filter:{zoneTag:$zone}){
          httpRequests1dGroups(limit:31,orderBy:[date_ASC],filter:{date_geq:$start,date_lt:$end}){
            dimensions{date}
            sum{requests bytes cachedRequests cachedBytes threats encryptedRequests
              responseStatusMap{edgeResponseStatus requests}}
            uniq{uniques}
          }
        }}
      }`,
      { zone: zoneId, start: trendStart, end: trendEnd },
    );
    const rows = data.viewer.zones[0]?.httpRequests1dGroups ?? [];
    result.dailyTrend = rows.map((r) => {
      const reqs = r.sum.requests || 0;
      const statusMap = r.sum.responseStatusMap ?? [];
      const inClass = (lo) =>
        statusMap
          .filter((s) => s.edgeResponseStatus >= lo && s.edgeResponseStatus < lo + 100)
          .reduce((a, s) => a + s.requests, 0);
      const clientErrors = inClass(400);
      const serverErrors = inClass(500);
      return {
        date: r.dimensions.date,
        requests: reqs,
        bytes: r.sum.bytes,
        cachedRequests: r.sum.cachedRequests,
        cachedBytes: r.sum.cachedBytes,
        threats: r.sum.threats,
        uniques: r.uniq.uniques,
        cacheHitRatio: reqs ? +(r.sum.cachedRequests / reqs).toFixed(4) : null,
        encryptedRequests: r.sum.encryptedRequests,
        encryptedRatio: reqs ? +((r.sum.encryptedRequests || 0) / reqs).toFixed(4) : null,
        clientErrors,
        serverErrors,
        clientErrorRatio: reqs ? +(clientErrors / reqs).toFixed(4) : null,
      };
    });
  } catch (e) {
    result.dailyTrendError = String(e.message ?? e);
    console.error(`[cloudflare] ${zoneId} daily trend: ${result.dailyTrendError}`);
  }

  // 2. Trailing 24h: totals + cache-status + status + top error paths.
  try {
    const data = await cfGraphql(
      token,
      `query($zone:String!,$start:Time!,$end:Time!){
        viewer{zones(filter:{zoneTag:$zone}){
          totals:httpRequestsAdaptiveGroups(limit:1,filter:{datetime_geq:$start,datetime_lt:$end}){
            count sum{edgeResponseBytes} avg{sampleInterval}
          }
          byCache:httpRequestsAdaptiveGroups(limit:20,filter:{datetime_geq:$start,datetime_lt:$end}){
            count dimensions{cacheStatus}
          }
          byStatus:httpRequestsAdaptiveGroups(limit:30,filter:{datetime_geq:$start,datetime_lt:$end}){
            count dimensions{edgeResponseStatus}
          }
          topErrorPaths:httpRequestsAdaptiveGroups(limit:8,orderBy:[count_DESC],
            filter:{datetime_geq:$start,datetime_lt:$end,edgeResponseStatus_geq:400}){
            count dimensions{edgeResponseStatus clientRequestPath}
          }
        }}
      }`,
      { zone: zoneId, start: winStart, end: winEnd },
    );
    const z = data.viewer.zones[0] ?? {};
    const totals = z.totals?.[0];
    const byCache = (z.byCache ?? []).map((r) => ({ status: r.dimensions.cacheStatus, count: r.count }));
    const byStatus = (z.byStatus ?? []).map((r) => ({ status: r.dimensions.edgeResponseStatus, count: r.count }));
    const sumClass = (lo) =>
      byStatus.filter((r) => r.status >= lo && r.status < lo + 100).reduce((a, r) => a + r.count, 0);
    const clientErrors = sumClass(400);
    const serverErrors = sumClass(500);
    const topErrorPaths = (z.topErrorPaths ?? []).map((r) => ({
      path: r.dimensions.clientRequestPath,
      status: r.dimensions.edgeResponseStatus,
      count: r.count,
    }));
    const hits = byCache.filter((r) => r.status === 'hit').reduce((a, r) => a + r.count, 0);
    const cacheable = byCache
      .filter((r) => r.status !== 'dynamic')
      .reduce((a, r) => a + r.count, 0);
    result.last24h = {
      window: { start: winStart, end: winEnd },
      sampledRequests: totals?.count ?? 0,
      edgeResponseBytes: totals?.sum?.edgeResponseBytes ?? 0,
      avgSampleInterval: totals?.avg?.sampleInterval ?? null,
      byCacheStatus: byCache.sort((a, b) => b.count - a.count),
      cacheHitRatioCacheable: cacheable ? +(hits / cacheable).toFixed(4) : null,
      byStatusClass: { '2xx': sumClass(200), '3xx': sumClass(300), '4xx': clientErrors, '5xx': serverErrors },
      clientErrors,
      serverErrors,
      clientErrorRatio: totals?.count ? +(clientErrors / totals.count).toFixed(4) : null,
      topErrorPaths,
    };
  } catch (e) {
    result.last24hError = String(e.message ?? e);
    console.error(`[cloudflare] ${zoneId} last24h: ${result.last24hError}`);
  }

  // 3. Error detail (separate try/catch so a missing dimension degrades cleanly).
  if (result.last24h) {
    try {
      const data = await cfGraphql(
        token,
        `query($zone:String!,$start:Time!,$end:Time!){
          viewer{zones(filter:{zoneTag:$zone}){
            serverErrorPaths:httpRequestsAdaptiveGroups(limit:10,orderBy:[count_DESC],
              filter:{datetime_geq:$start,datetime_lt:$end,edgeResponseStatus_geq:500}){
              count dimensions{edgeResponseStatus clientRequestPath userAgent}
            }
            topErrorAgents:httpRequestsAdaptiveGroups(limit:5,orderBy:[count_DESC],
              filter:{datetime_geq:$start,datetime_lt:$end,edgeResponseStatus_geq:400}){
              count dimensions{userAgent}
            }
          }}
        }`,
        { zone: zoneId, start: winStart, end: winEnd },
      );
      const z = data.viewer.zones[0] ?? {};
      result.last24h.serverErrorPaths = (z.serverErrorPaths ?? []).map((r) => ({
        path: r.dimensions.clientRequestPath,
        status: r.dimensions.edgeResponseStatus,
        userAgent: r.dimensions.userAgent,
        count: r.count,
      }));
      result.last24h.topErrorAgents = (z.topErrorAgents ?? []).map((r) => ({
        userAgent: r.dimensions.userAgent,
        count: r.count,
      }));
    } catch (e) {
      result.last24h.errorDetailError = String(e.message ?? e);
      console.error(`[cloudflare] ${zoneId} error detail: ${result.last24h.errorDetailError}`);
    }
  }

  return result;
}

let anyOk = false;
for (const site of SITES) {
  if (!site.cfZoneId) {
    console.error(`[cloudflare] ${site.key}: no cfZoneId in registry — skipping.`);
    continue;
  }
  try {
    const result = await fetchZone(TOKEN, site.cfZoneId);
    result.site = site.key;
    result.domain = site.domain;
    const outPath = writeMetric('cloudflare', result, site.key);
    const t = result.last24h;
    console.log(
      `[cloudflare] ${site.key} trend days=${result.dailyTrend.length}` +
        (t
          ? ` · 24h sampledReq=${t.sampledRequests} cacheHit(cacheable)=${t.cacheHitRatioCacheable ?? 'n/a'}` +
            ` 4xx=${t.clientErrors} 5xx=${t.serverErrors}`
          : ''),
    );
    console.log(`[cloudflare] ${site.key} wrote ${outPath}`);
    anyOk = true;
  } catch (e) {
    console.error(`[cloudflare] ${site.key}: ${String(e.message ?? e)}`);
  }
}

process.exit(anyOk ? 0 : 1);
```

- [ ] **Step 2: Run the fetcher against the live API**

Run: `node scripts/fetch-cloudflare.mjs`
Expected: two `[cloudflare] orionfold ...` and `[cloudflare] ainative ...` log blocks, each ending in `wrote .../cloudflare[-ainative]-<date>.json`. ainative's `trend days` may be lower if its zone is younger, but `4xx`/`5xx` and a non-error `last24h` should appear.

- [ ] **Step 3: Verify both files exist and ainative carries real data**

Run:
```bash
ls audit-reports/metrics/cloudflare-*.json
node -e "const f=require('fs');for(const s of['','-ainative']){const p='audit-reports/metrics/cloudflare'+s+'-'+new Date().toISOString().slice(0,10)+'.json';const d=JSON.parse(f.readFileSync(p));console.log(p, 'site='+d.site, 'trendDays='+d.dailyTrend.length, 'last24hErr='+d.last24hError)}"
```
Expected: both paths print; `site=orionfold` and `site=ainative` respectively; `last24hErr=null` for both (a non-null error here means the token can't read that zone — STOP and report, do not proceed).

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-cloudflare.mjs
git commit -m "feat(metrics): Cloudflare fetcher loops the sites registry (per-site files)"
```

---

## Task 5: CrUX fetcher loops the registry

**Files:**
- Modify: `scripts/fetch-crux.mjs` (whole file — loop `SITES` by origin)

**Interfaces:**
- Consumes: `SITES` from Task 1; `writeMetric(source, data, siteKey)` from Task 2.
- Produces: one `crux[-<site>]-<date>.json` per site, each with the SAME shape (`source`, `origin`, `fetchedAt`, `formFactors`) plus `site`/`domain`. Each origin derives from `https://<site.domain>`.

- [ ] **Step 1: Rewrite `scripts/fetch-crux.mjs` to loop the registry**

```js
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
```

- [ ] **Step 2: Run it**

Run: `node scripts/fetch-crux.mjs`
Expected: per-site log lines for both origins. Both likely report `404 — below threshold` (expected for low-traffic origins — NOT a failure); each ends `[crux] <site> wrote ...`.

- [ ] **Step 3: Verify both files exist**

Run: `ls audit-reports/metrics/crux-*.json`
Expected: `crux-<date>.json` and `crux-ainative-<date>.json`.

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-crux.mjs
git commit -m "feat(metrics): CrUX fetcher loops the sites registry (per-site origins)"
```

---

## Task 6: Dashboard renders data panels per site

**Files:**
- Modify: `scripts/lib/dashboard-render.mjs` (the `latest` helper lines 8-11; the four data-panel functions' `latest(...)` calls; the freshness list lines 466-476; the `mainHtml` mount line 482)

**Interfaces:**
- Consumes: `snaps[source]` entries now carry `.site` (Task 3); `SITES`, `DEFAULT_SITE` (Task 1) — but this file has NO Node imports, so it must receive sites via the payload, OR hardcode the per-site grouping from the data. **Approach:** derive the site list from the snapshots themselves (every site that appears in any series), defaulting to show the default site first. This keeps the renderer a pure function of the payload (no import) per the file's hard rule.
- Produces: `renderBody(payload)` returns the same `{ metaHtml, freshnessHtml, mainHtml, sideHtml }`; `mainHtml` now contains a per-site group (a site header + that site's Lighthouse/Cloudflare/Field-CWV panels).

- [ ] **Step 1: Make `latest` site-aware**

Replace lines 8-11 (`const latest = ...`):

```js
  const snaps = payload.snaps;
  // every site that appears in any series; default site ('orionfold') first.
  const siteSet = new Set();
  for (const src of Object.keys(snaps)) for (const e of snaps[src]) siteSet.add(e.site || 'orionfold');
  const siteList = [...siteSet].sort((a, b) => (a === 'orionfold' ? -1 : b === 'orionfold' ? 1 : a.localeCompare(b)));
  if (!siteList.length) siteList.push('orionfold');
  // latest snapshot for a source, optionally filtered to a site (default: any).
  const latest = (source, site) => {
    let series = snaps[source];
    if (!series || !series.length) return null;
    if (site) series = series.filter((s) => (s.site || 'orionfold') === site);
    return series.length ? series[series.length - 1] : null;
  };
```

- [ ] **Step 2: Thread `site` through the four data panels**

The four data-panel functions (`lighthousePanel`, `cloudflarePanel`, `fieldCwvPanel`, and `seoPanel`) call `latest('lighthouse')`, `latest('cloudflare')`, `latest('crux')`, `latest('ga4')`, `latest('gsc')` and read `snaps.cloudflare`/`snaps.lighthouse` directly for sparkline trends. Give each a `site` parameter and pass it through.

For each of these functions, change the signature `function cloudflarePanel() {` → `function cloudflarePanel(site) {`, and every `latest('X')` inside → `latest('X', site)`. For the direct trend reads (e.g. `snaps.cloudflare`, `snaps.lighthouse` inside sparkline calls), filter by site. Concretely, add this helper just after the `latest` definition:

```js
  // a source's series for one site, oldest→newest (for sparkline trends).
  const seriesFor = (source, site) =>
    (snaps[source] || []).filter((s) => (s.site || 'orionfold') === site);
```

Then inside `cloudflarePanel(site)` replace `snaps.cloudflare` reads (the daily-trend sparkline) with `seriesFor('cloudflare', site)`; inside `lighthousePanel(site)` replace `snaps.lighthouse` (the perf-trend series, ~line 204) with `seriesFor('lighthouse', site)`; inside `fieldCwvPanel(site)` replace `snaps.crux`/`snaps.cloudflare` reads with `seriesFor(...)`; inside `seoPanel(site)` replace `snaps.gsc`/`snaps.ga4` reads with `seriesFor(...)`.

Apply the same `, site` to each `latest(...)` call within those four functions. Do NOT touch `uptimePanel`, `commercePanel`, `ciPanel`, `todosPanel` — those stay single (orionfold infra).

- [ ] **Step 3: Mount the panels per site under a site header**

Replace the `mainHtml`/`sideHtml` lines (482-483) with a per-site grouping. `seoPanel` moves into the per-site main column (it is a per-site concern); the side column keeps the single infra panels:

```js
    mainHtml: siteList
      .map((site) => {
        const domain = (latest('cloudflare', site)?.data.domain) || (site === 'orionfold' ? 'orionfold.com' : site);
        return `<div class="site-group">
      <h2 class="site-head">${esc(domain)}</h2>
      ${[lighthousePanel(site), cloudflarePanel(site), fieldCwvPanel(site), seoPanel(site)].join('\n      ')}
    </div>`;
      })
      .join('\n      '),
    sideHtml: [uptimePanel(), commercePanel(), ciPanel(), todosPanel()].join('\n      '),
```

Note: `seoPanel` was previously in `sideHtml` — it is now per-site in `mainHtml`. Confirm `seoPanel` is defined with a `site` parameter (Step 2).

- [ ] **Step 4: Make the freshness footer site-aware**

Replace the freshness block (lines 466-476). Show each source per site:

```js
  const sourcesList = ['betterstack', 'cloudflare', 'lighthouse', 'crux'];
  const newestDate = Object.keys(snaps)
    .flatMap((s) => snaps[s].map((x) => x.date))
    .sort()
    .pop();
  const freshnessHtml = siteList
    .map((site) =>
      sourcesList
        .map((s) => {
          const l = latest(s, site);
          // betterstack is orionfold-only; skip it for non-default sites.
          if (s === 'betterstack' && site !== 'orionfold') return '';
          return `<span class="fr">${esc(site === 'orionfold' ? s : site + ':' + s)} ${l ? ageNote(l.date) : '<span class="age stale">—</span>'}</span>`;
        })
        .join(''),
    )
    .join('');
```

- [ ] **Step 5: Add the `.site-group` / `.site-head` styles**

The renderer can't use inline styles (CSP). Add classes to BOTH stylesheets the dashboard uses. The static build and the server both load `scripts/dashboard-web/styles.css`. Append to `scripts/dashboard-web/styles.css`:

```css
.site-group { margin-bottom: 1.5rem; }
.site-head {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.5rem 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
  color: var(--ink, #1f2937);
}
```

(If `build-dashboard.mjs` inlines a different stylesheet, append the same block there — check Step 6's build output for unstyled headers.)

- [ ] **Step 6: Build the static dashboard and verify both sites render**

Run: `npm run dashboard`
Expected: writes `audit-reports/dashboard.html` with no error.

Verify the HTML contains both site groups and orionfold's Cloudflare data still renders (regression):
```bash
grep -c 'site-head' audit-reports/dashboard.html        # expect 2
grep -o 'orionfold.com\|ainative.business' audit-reports/dashboard.html | sort -u   # expect both
```
Then open it and eyeball: `open audit-reports/dashboard.html`. Confirm orionfold's Lighthouse/Cloudflare panels show their existing data (trends unbroken) and an ainative group appears with its Cloudflare data + "pending"/"no data yet" for GA4/GSC/Lighthouse.

- [ ] **Step 7: Smoke-test the live server path**

Run: `node scripts/dashboard-server.mjs --no-token --port 8789 &` then `sleep 1 && curl -s localhost:8789/api/data | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=JSON.parse(s);const sites=new Set();for(const k of Object.keys(p.snaps))for(const e of p.snaps[k])sites.add(e.site);console.log('sites in payload:',[...sites])})"` then `kill %1`.
Expected: `sites in payload: [ 'orionfold', 'ainative' ]` (order may vary). Confirms the server's `assemble()` → renderer path carries both sites.

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/dashboard-render.mjs scripts/dashboard-web/styles.css
git commit -m "feat(dashboard): group data panels per site (orionfold + ainative)"
```

---

## Task 7: seo-aeo-audit skill — per-site roundtrip

**Files:**
- Modify: `.claude/skills/seo-aeo-audit/references/analytics-roundtrip.md`
- Modify: `.claude/skills/seo-aeo-audit/SKILL.md`
- Mirror both to `.agents/skills/seo-aeo-audit/` (byte-identical, per Global Constraints)

**Interfaces:**
- Consumes: the registry (`scripts/lib/sites.mjs`) as the list of sites to capture.
- Produces: updated skill docs instructing a per-site GA4/GSC/Lighthouse capture, with the site-suffixed file schema. No code; documentation only.

- [ ] **Step 1: Add the per-site capture loop to `analytics-roundtrip.md`**

In `.claude/skills/seo-aeo-audit/references/analytics-roundtrip.md`, replace the single-site framing with a per-site loop. Add this section near the top (after the "Ground rules" section) and update §3's file schema:

```markdown
## Sites to capture

Read the sites from `scripts/lib/sites.mjs`. For EACH site, do §1 (GSC), §2 (GA4),
and §4 (Lighthouse), persisting one file per site per source. The same Google login
switches both the GSC property and the GA4 property — no re-auth needed:

- **orionfold.com** — GSC `sc-domain:orionfold.com`, GA4 property `a395553282p538751483`. Files: bare (`ga4-<date>.json`, `gsc-<date>.json`, `lighthouse-<date>.json` for the live capture — note orionfold's Lighthouse normally comes from CI via `summarize-lighthouse.mjs`; only hand-drop a `lighthouse-<date>.json` if you ran a live audit and no CI summary exists for today).
- **ainative.business** — GSC `sc-domain:ainative.business`, GA4 property `<read it the first time, then record it in scripts/lib/sites.mjs replacing TBD-first-run>`. Files: `ga4-ainative-<date>.json`, `gsc-ainative-<date>.json`, `lighthouse-ainative-<date>.json`.

To switch GA4 property: use the property picker (top-left account/property selector). To switch GSC property: the property dropdown at the top-left of Search Console. ainative's Lighthouse comes ONLY from a live `mcp__chrome-devtools__lighthouse_audit` run against its `lighthouseUrl` (it is a separate GitHub Pages repo with its own CI — there is no local ainative LHCI artifact).
```

Update §3's filenames to note the suffix rule: "default site (orionfold) → bare `<source>-<date>.json`; ainative → `<source>-ainative-<date>.json`. The dashboard loader maps a bare filename to orionfold and a `-ainative` segment to ainative."

For the ainative Lighthouse capture, add the file schema:

```markdown
`lighthouse-ainative-YYYY-MM-DD.json` (live capture — mirrors the CI summary shape):
{
  "source": "lighthouse",
  "site": "ainative",
  "domain": "ainative.business",
  "capturedVia": "Claude-in-Chrome lighthouse_audit (live; ainative CI artifact not local)",
  "fetchedAt": "<ISO>",
  "runFetchTime": "<ISO of the audit>",
  "formFactor": "mobile",
  "pageCount": 1,
  "minScores": { "performance": 0, "accessibility": 0, "best-practices": 0, "seo": 0 },
  "pages": [ { "route": "/", "scores": { "performance": 0, "accessibility": 0, "best-practices": 0, "seo": 0 }, "metrics": { "lcp": 0, "cls": 0, "tbt": 0, "fcp": 0, "si": 0, "tti": 0 } } ]
}
```

(The `scores`/`metrics` keys MUST match `summarize-lighthouse.mjs`'s output so the dashboard's `lighthousePanel` renders the ainative capture identically. `scores` values are 0–1 fractions, `metrics` are ms except `cls`.)

- [ ] **Step 2: Reframe `SKILL.md` from one site to the registry**

In `.claude/skills/seo-aeo-audit/SKILL.md`: update the title/intro and Step 3 / Step 3b to say the audit covers "the sites in `scripts/lib/sites.mjs` (orionfold.com + ainative.business)". Keep the static-audit step (Step 1, `audit-static.mjs`) explicitly orionfold-only (it reads THIS repo's `dist/`; ainative's built HTML lives in the other repo — out of scope). Add a one-line note under Step 3b that `npm run metrics` now writes per-site Cloudflare + CrUX files automatically, and that GA4/GSC/ainative-Lighthouse are the manual per-site captures from §3 of the roundtrip reference.

- [ ] **Step 3: Verify no stale single-site claims remain**

Run: `grep -n "orionfold.com" .claude/skills/seo-aeo-audit/SKILL.md .claude/skills/seo-aeo-audit/references/analytics-roundtrip.md`
Expected: every remaining `orionfold.com` mention is either the orionfold site entry or a deliberately orionfold-only step (static audit, Better Stack). No mention implies the WHOLE audit is orionfold-only.

- [ ] **Step 4: Mirror to `.agents/` and verify byte-identical**

Run:
```bash
cp .claude/skills/seo-aeo-audit/SKILL.md .agents/skills/seo-aeo-audit/SKILL.md
cp .claude/skills/seo-aeo-audit/references/analytics-roundtrip.md .agents/skills/seo-aeo-audit/references/analytics-roundtrip.md
diff -r .claude/skills/seo-aeo-audit .agents/skills/seo-aeo-audit && echo "IDENTICAL"
```
Expected: `IDENTICAL` (no diff output).

- [ ] **Step 5: Commit**

Note: `.claude/` and `.agents/` are git-ignored (local-only per `claude-dir-local-only`), so this commit will be a no-op for tracked files. Run the commit anyway to capture any tracked changes; the skill edits persist on disk regardless.

```bash
git add -A
git commit -m "docs(seo-aeo-audit): per-site roundtrip for orionfold + ainative" || echo "nothing tracked to commit (skill dirs are local-only) — edits persist on disk"
```

---

## Task 8: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full metrics run**

Run: `npm run metrics`
Expected: the orchestrator runs all fetchers; the summary shows crux/betterstack/cloudflare/lighthouse; the cloudflare and crux sections each log BOTH `orionfold` and `ainative`. Exit 0.

- [ ] **Step 2: Confirm the day's per-site files**

Run: `ls audit-reports/metrics/ | grep "$(date -u +%F)"`
Expected to include: `cloudflare-<date>.json`, `cloudflare-ainative-<date>.json`, `crux-<date>.json`, `crux-ainative-<date>.json`, plus the bare `betterstack`/`lighthouse`/`index` files.

- [ ] **Step 3: Dashboard reflects both sites**

Run: `npm run dashboard && grep -c site-head audit-reports/dashboard.html`
Expected: `2`.

- [ ] **Step 4: Final commit (if any artifacts changed) and summary**

The metric files in `audit-reports/` are git-ignored — nothing to commit from a run. Confirm the working tree is clean of tracked changes:

Run: `git status --porcelain`
Expected: empty (all code already committed in Tasks 1-7; metrics + dashboard outputs are git-ignored).

---

## Self-Review

**Spec coverage:**
- Registry → Task 1. ✅
- File naming (bare default + suffix) → Task 2. ✅
- Loader site segment → Task 3. ✅
- CF fetcher loops registry → Task 4. ✅
- CrUX per origin → Task 5. ✅
- Lighthouse: orionfold CI path unchanged, ainative via live capture → Task 5 leaves `summarize-lighthouse.mjs` untouched (orionfold CI), Task 7 documents the ainative live-capture file. ✅
- Better Stack stays orionfold-only → Tasks 4/6 (not touched; renderer keeps it single). ✅
- Dashboard per-site grouping → Task 6. ✅
- Skill reframe + per-site roundtrip → Task 7. ✅
- Per-site isolation / error handling → built into Tasks 4, 5 (per-site try/catch, per-site error fields). ✅
- Open item (ainative GA4 id `TBD-first-run`) → in registry (Task 1) + roundtrip instruction to backfill it (Task 7). ✅
- Out of scope (no ainative Better Stack, no CI changes, no ainative static audit) → respected; called out in Tasks 6/7. ✅

**Placeholder scan:** No "TBD"/"add error handling" placeholders in steps — every code step has complete code; `TBD-first-run` is a deliberate, documented registry value, not a plan gap. ✅

**Type consistency:** `metricSiteSegment` (Task 1) consumed by `writeMetric` (Task 2). `writeMetric(source, data, siteKey)` signature used identically in Tasks 4/5. `loadSnapshots` entries gain `.site` (Task 3), consumed by `latest(source, site)` and `seriesFor(source, site)` (Task 6). ainative `lighthouse-ainative` file schema (Task 7) mirrors `summarize-lighthouse.mjs`'s `scores`/`metrics` shape consumed by `lighthousePanel` (Task 6). ✅
