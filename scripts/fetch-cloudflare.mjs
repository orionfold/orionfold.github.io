// Snapshot Cloudflare edge analytics into audit-reports/metrics/ (git-ignored)
// for the dashboard "Cloudflare stats" panel — now PER SITE (spec
// specs/2026-06-27-multi-site-stats-tracking-design.md).
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
