// Snapshot Cloudflare edge analytics into audit-reports/metrics/ (git-ignored)
// for the M4 dashboard "Cloudflare stats" panel. M3 task, spec §7.
//
//   node scripts/fetch-cloudflare.mjs
//
// Reads CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID from the environment or
// .env.local. Plain Node, no deps. Run from the repo root.
//
// Two GraphQL datasets, because the free plan splits them:
//   1. httpRequests1dGroups  — completed-day totals (requests, bytes, cached,
//      threats, uniques). Multi-day range OK → the dashboard's traffic trend.
//      Empty until the zone has a full UTC day of proxied traffic behind it.
//   2. httpRequestsAdaptiveGroups — a single trailing day (the free plan caps
//      this dataset at a 1-day window) for the current cache-status breakdown,
//      which 1dGroups doesn't dimension by.
//
// 🔴 Real-user Core Web Vitals (rumPageloadEventsAdaptiveGroups) are NOT
// available to this token — Cloudflare Web Analytics RUM is dashboard-only on
// the free plan (confirmed D2/M1). The snapshot records that explicitly so the
// dashboard shows "read in the Cloudflare dashboard" rather than a blank panel.

import { loadEnvLocal, writeMetric, cfGraphql } from './lib/metrics.mjs';

loadEnvLocal();
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.CLOUDFLARE_ZONE_ID;
if (!TOKEN || !ZONE) {
  console.error('[cloudflare] CLOUDFLARE_API_TOKEN and/or CLOUDFLARE_ZONE_ID not set (env or .env.local) — aborting.');
  process.exit(1);
}

const now = new Date();
const isoDay = (d) => d.toISOString().slice(0, 10);
// Daily trend: the last 7 completed UTC days, [start, today).
const trendStart = isoDay(new Date(now.getTime() - 7 * 86400_000));
const trendEnd = isoDay(now);
// Adaptive window: exactly the trailing ~24h (free-plan max for this dataset).
const winEnd = now.toISOString();
const winStart = new Date(now.getTime() - 23 * 3600_000).toISOString();

const result = {
  source: 'cloudflare',
  zone: ZONE,
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

// 1. Daily trend (graceful if the young zone has no completed-day rows yet).
try {
  const data = await cfGraphql(
    TOKEN,
    `query($zone:String!,$start:Date!,$end:Date!){
      viewer{zones(filter:{zoneTag:$zone}){
        httpRequests1dGroups(limit:31,orderBy:[date_ASC],filter:{date_geq:$start,date_lt:$end}){
          dimensions{date}
          sum{requests bytes cachedRequests cachedBytes threats}
          uniq{uniques}
        }
      }}
    }`,
    { zone: ZONE, start: trendStart, end: trendEnd },
  );
  const rows = data.viewer.zones[0]?.httpRequests1dGroups ?? [];
  result.dailyTrend = rows.map((r) => {
    const reqs = r.sum.requests || 0;
    return {
      date: r.dimensions.date,
      requests: reqs,
      bytes: r.sum.bytes,
      cachedRequests: r.sum.cachedRequests,
      cachedBytes: r.sum.cachedBytes,
      threats: r.sum.threats,
      uniques: r.uniq.uniques,
      cacheHitRatio: reqs ? +(r.sum.cachedRequests / reqs).toFixed(4) : null,
    };
  });
} catch (e) {
  result.dailyTrendError = String(e.message ?? e);
  console.error(`[cloudflare] daily trend: ${result.dailyTrendError}`);
}

// 2. Trailing 24h: totals + cache-status breakdown. The adaptive dataset is
// sampled, so `count` is the sampled row count; sampleInterval ~= the inverse
// sample rate. We report count as the request estimate plus the breakdown.
try {
  const data = await cfGraphql(
    TOKEN,
    `query($zone:String!,$start:Time!,$end:Time!){
      viewer{zones(filter:{zoneTag:$zone}){
        totals:httpRequestsAdaptiveGroups(limit:1,filter:{datetime_geq:$start,datetime_lt:$end}){
          count sum{edgeResponseBytes} avg{sampleInterval}
        }
        byCache:httpRequestsAdaptiveGroups(limit:20,filter:{datetime_geq:$start,datetime_lt:$end}){
          count dimensions{cacheStatus}
        }
      }}
    }`,
    { zone: ZONE, start: winStart, end: winEnd },
  );
  const z = data.viewer.zones[0] ?? {};
  const totals = z.totals?.[0];
  const byCache = (z.byCache ?? []).map((r) => ({ status: r.dimensions.cacheStatus, count: r.count }));
  // Cache-hit ratio over CACHEABLE requests only: "dynamic" is HTML we
  // intentionally pass through (D2 cache rule), so excluding it avoids a
  // misleadingly low ratio.
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
  };
} catch (e) {
  result.last24hError = String(e.message ?? e);
  console.error(`[cloudflare] last24h: ${result.last24hError}`);
}

const outPath = writeMetric('cloudflare', result);
const t = result.last24h;
console.log(
  `[cloudflare] trend days=${result.dailyTrend.length}` +
    (t ? ` · 24h sampledReq=${t.sampledRequests} cacheHit(cacheable)=${t.cacheHitRatioCacheable ?? 'n/a'}` : ''),
);
console.log(`[cloudflare] wrote ${outPath}`);
