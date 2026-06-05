// M4 — local health dashboard generator (spec §7).
//
//   node scripts/build-dashboard.mjs          (or: npm run dashboard)
//   node scripts/build-dashboard.mjs --open   (also open it in the browser, macOS)
//
// Reads the dated JSON snapshots the M3 fetchers leave in audit-reports/metrics/
// and emits ONE self-contained HTML page (all CSS inline, no JS, no CDN) to
// audit-reports/dashboard.html — session-report style. The whole audit-reports/
// tree is git-ignored, so admin metrics never reach the public Pages site.
//
// Panels (spec §7): Uptime · Commerce health · Field CWV · Lighthouse trend ·
// Cloudflare stats · SEO/AEO health. Every panel degrades gracefully: a missing
// source renders a "no snapshot yet" note, an unavailable dataset (CrUX 404,
// RUM dashboard-only) renders its own `reason` string, not an error.
//
// Filenames pair by date (<source>-YYYY-MM-DD.json) so the latest file is the
// current reading and the full series is a trend — the code handles N days even
// when only one exists. Plain Node, zero deps (a future cron can run it bare).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { METRICS_DIR, today } from './lib/metrics.mjs';

// ── load every snapshot, grouped by source, sorted oldest→newest ────────────
function loadSnapshots() {
  let names = [];
  try {
    names = readdirSync(METRICS_DIR);
  } catch {
    return {};
  }
  const bySource = {};
  for (const name of names) {
    const m = name.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.json$/);
    if (!m) continue;
    const [, source, date] = m;
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(METRICS_DIR, name), 'utf8'));
    } catch {
      continue;
    }
    (bySource[source] ||= []).push({ date, data });
  }
  for (const source of Object.keys(bySource)) {
    bySource[source].sort((a, b) => a.date.localeCompare(b.date));
  }
  return bySource;
}

const snaps = loadSnapshots();
const latest = (source) => {
  const series = snaps[source];
  return series && series.length ? series[series.length - 1] : null;
};

// ── tiny formatting + html helpers ──────────────────────────────────────────
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const num = (n) => n.toLocaleString('en-US');
const kb = (bytes) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;
const ms = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);

// staleness label for a snapshot date vs the run date
function ageNote(date) {
  if (!date) return '';
  const days = Math.round(
    (Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000,
  );
  if (days <= 0) return `<span class="age fresh">today</span>`;
  return `<span class="age stale">${days}d old</span>`;
}

// inline-SVG sparkline from a numeric series (degrades to a glowing dot for 1
// point). Phosphor palette + soft glow + area fade, to read like a CRT trace.
let sparkSeq = 0;
function sparkline(values, { good, bad, lowerIsBetter } = {}) {
  const pts = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!pts.length) return '';
  const w = 132;
  const h = 30;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i) => (pts.length === 1 ? w / 2 : (i / (pts.length - 1)) * w);
  const y = (v) => h - 4 - ((v - min) / span) * (h - 8);
  const last = pts[pts.length - 1];
  let color = '#5cc8ff';
  if (typeof good === 'number' && typeof bad === 'number') {
    color = lowerIsBetter
      ? last <= good ? '#3fe08f' : last <= bad ? '#f5b544' : '#ff5a6a'
      : last >= good ? '#3fe08f' : last >= bad ? '#f5b544' : '#ff5a6a';
  }
  const glow = `filter:drop-shadow(0 0 3px ${color}aa)`;
  if (pts.length === 1) {
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="${glow}"><circle cx="${(w / 2).toFixed(1)}" cy="${y(pts[0]).toFixed(1)}" r="3.2" fill="${color}"/></svg>`;
  }
  const gid = `sg${++sparkSeq}`;
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0).toFixed(1)},${h} ${line} ${x(pts.length - 1).toFixed(1)},${h}`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="${glow}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polygon points="${area}" fill="url(#${gid})"/><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${line}"/><circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3.2" fill="${color}"/></svg>`;
}

let panelIndex = 0;
function panel(title, sub, bodyHtml, statusDot) {
  const dot = statusDot ? `<span class="dot ${statusDot}"></span>` : '';
  const idx = String(++panelIndex).padStart(2, '0');
  return `<section class="panel" style="animation-delay:${panelIndex * 70}ms">
    <header>
      <div class="phead"><span class="pidx">${idx}</span><h2>${dot}${esc(title)}</h2></div>
      ${sub ? `<p class="sub">${sub}</p>` : ''}
    </header>
    ${bodyHtml}
  </section>`;
}

const empty = (msg) => `<p class="muted">${esc(msg)}</p>`;

// ── Uptime panel (Better Stack) ─────────────────────────────────────────────
function uptimePanel() {
  const snap = latest('betterstack');
  if (!snap) return panel('Uptime', '', empty('No Better Stack snapshot yet — run `npm run metrics`.'), 'grey');
  const d = snap.data;
  const allUp = d.allUp;
  const sub = `${d.total} monitors · ${ageNote(snap.date)} · ${esc(snap.data.fetchedAt?.slice(11, 16) || '')} UTC`;
  // separate the public canaries from the edge functions (commerce panel owns the fns)
  const canaries = (d.monitors || []).filter((m) => !m.url.includes('/functions/v1/'));
  const rows = canaries
    .map(
      (m) => `<tr>
        <td><span class="dot ${m.status === 'up' ? 'green' : 'red'}"></span>${esc(m.name)}</td>
        <td class="mono small">${m.expectedKeyword ? `kw “${esc(m.expectedKeyword)}”` : 'status'}</td>
        <td class="right ${m.status === 'up' ? 'ok' : 'bad'}">${esc(m.status)}</td>
      </tr>`,
    )
    .join('');
  const trend = sparkline((snaps.betterstack || []).map((s) => s.data.counts?.up ?? 0), {
    good: d.total,
    bad: d.total - 1,
  });
  const body = `
    <div class="kpis">
      <div class="kpi"><span class="big ${allUp ? 'ok' : 'bad'}">${d.counts?.up ?? 0}/${d.total}</span><span class="lbl">monitors up</span></div>
      <div class="kpi"><span class="big">${trend}</span><span class="lbl">up-count trend</span></div>
    </div>
    <table><thead><tr><th>Public canary</th><th>Check</th><th class="right">State</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  return panel('Uptime', sub, body, allUp ? 'green' : 'red');
}

// ── Commerce health (edge functions + Stripe) ───────────────────────────────
function commercePanel() {
  const snap = latest('betterstack');
  if (!snap) return panel('Commerce health', '', empty('No monitor snapshot yet.'), 'grey');
  const fns = (snap.data.monitors || []).filter((m) => m.url.includes('/functions/v1/'));
  const fnsUp = fns.filter((m) => m.status === 'up').length;
  const rows = fns
    .map(
      (m) => `<tr>
        <td><span class="dot ${m.status === 'up' ? 'green' : 'red'}"></span>${esc(m.name.replace(/^fn /, ''))}</td>
        <td class="right ${m.status === 'up' ? 'ok' : 'bad'}">${esc(m.status)}</td>
      </tr>`,
    )
    .join('');
  const sub = `${fns.length} Supabase edge functions · ${ageNote(snap.date)}`;
  const body = `
    <div class="kpis">
      <div class="kpi"><span class="big ${fnsUp === fns.length ? 'ok' : 'bad'}">${fnsUp}/${fns.length}</span><span class="lbl">edge fns alive</span></div>
    </div>
    <table><thead><tr><th>Function</th><th class="right">State</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="muted small">Stripe runs on live account <span class="mono">acct_1Tb6kWCvvdlrCOHr</span>. Revenue/charge figures have no programmatic fetcher (read in the Stripe dashboard); a “405” on a function = alive (refuses GET), a real checkout is verified by the live e2e runbook.</p>`;
  return panel('Commerce health', sub, body, fnsUp === fns.length ? 'green' : 'red');
}

// ── Field CWV (Cloudflare RUM + CrUX) ───────────────────────────────────────
function fieldCwvPanel() {
  const cf = latest('cloudflare');
  const crux = latest('crux');
  const blocks = [];
  if (cf?.data.fieldCWV) {
    const f = cf.data.fieldCWV;
    if (f.available) {
      blocks.push(
        `<div class="kpi-row"><strong>Cloudflare RUM</strong> — LCP ${esc(f.lcp ?? '—')} · CLS ${esc(f.cls ?? '—')} · INP ${esc(f.inp ?? '—')}</div>`,
      );
    } else {
      blocks.push(`<div class="note"><strong>Cloudflare Web Analytics RUM</strong><p class="muted small">${esc(f.reason)}</p></div>`);
    }
  }
  if (crux?.data.formFactors) {
    const ff = crux.data.formFactors;
    const anyAvail = Object.values(ff).some((x) => x.available);
    if (anyAvail) {
      const rows = Object.entries(ff)
        .filter(([, v]) => v.available)
        .map(([k, v]) => `<div class="kpi-row"><strong>CrUX ${esc(k)}</strong> — LCP p75 ${esc(v.lcp?.p75 ?? '—')} · CLS p75 ${esc(v.cls?.p75 ?? '—')} · INP p75 ${esc(v.inp?.p75 ?? '—')}</div>`)
        .join('');
      blocks.push(rows);
    } else {
      const reason = Object.values(ff)[0]?.reason || 'no field data';
      blocks.push(`<div class="note"><strong>Google CrUX</strong><p class="muted small">${esc(reason)}</p></div>`);
    }
  }
  if (!blocks.length) return panel('Field CWV', '', empty('No field-CWV snapshot yet.'), 'grey');
  const live = (cf?.data.fieldCWV?.available || crux?.data.formFactors && Object.values(crux.data.formFactors).some((x) => x.available));
  return panel(
    'Field CWV (real users)',
    'Fills as traffic grows — both free sources gate on volume',
    blocks.join(''),
    live ? 'green' : 'amber',
  );
}

// ── Lighthouse trend (lab) ──────────────────────────────────────────────────
function lighthousePanel() {
  const snap = latest('lighthouse');
  if (!snap) return panel('Lighthouse (lab)', '', empty('No Lighthouse-CI summary yet.'), 'grey');
  const d = snap.data;
  // Freshness must track when LHCI actually MEASURED (runFetchTime), not when
  // `npm run metrics` last re-summarized the same run — a re-summary is not new
  // lab data, and a "today" badge on a days-old run hides perf regressions.
  const runDate = d.runFetchTime?.slice(0, 10) || snap.date;
  const sub = `${d.pageCount} pages · ${esc(d.formFactor)} · run ${esc(d.runFetchTime?.slice(0, 16).replace('T', ' ') || '')} ${ageNote(runDate)}`;
  const cat = (v) => (v >= 0.9 ? 'ok' : v >= 0.8 ? 'warn' : 'bad');
  const lcpCat = (v) => (v <= 2500 ? 'ok' : v <= 4000 ? 'warn' : 'bad');
  // perf trend across DISTINCT runs — snapshots that re-summarize the same
  // runFetchTime collapse to one point, so the trace never fakes stability.
  const seenRuns = new Set();
  const runSeries = (snaps.lighthouse || []).filter((s) => {
    const key = s.data.runFetchTime || s.date;
    if (seenRuns.has(key)) return false;
    seenRuns.add(key);
    return true;
  });
  const perfTrend = sparkline(runSeries.map((s) => s.data.minScores?.performance ?? 0), {
    good: 0.9,
    bad: 0.8,
  });
  const rows = (d.pages || [])
    .map((p) => {
      const s = p.scores;
      const mtr = p.metrics || {};
      return `<tr>
        <td class="rt">${esc(p.route)}</td>
        <td class="right ${cat(s.performance)}">${Math.round(s.performance * 100)}</td>
        <td class="right ${cat(s.accessibility)}">${Math.round(s.accessibility * 100)}</td>
        <td class="right nw ${lcpCat(mtr.lcp)}">${ms(mtr.lcp)}</td>
        <td class="right nw">${(mtr.cls ?? 0).toFixed(3)}</td>
        <td class="right nw">${ms(mtr.tbt)}</td>
      </tr>`;
    })
    .join('');
  const m = d.minScores || {};
  const body = `
    <div class="kpis">
      <div class="kpi"><span class="big ${cat(m.performance)}">${Math.round((m.performance ?? 0) * 100)}</span><span class="lbl">min perf</span></div>
      <div class="kpi"><span class="big ${cat(m.accessibility)}">${Math.round((m.accessibility ?? 0) * 100)}</span><span class="lbl">min a11y</span></div>
      <div class="kpi"><span class="big ${cat(m.seo)}">${Math.round((m.seo ?? 0) * 100)}</span><span class="lbl">min SEO</span></div>
      <div class="kpi"><span class="big">${perfTrend}</span><span class="lbl">perf trend</span></div>
    </div>
    <div class="tscroll"><table class="dense"><thead><tr><th class="rt">Route</th><th class="right">Perf</th><th class="right">A11y</th><th class="right">LCP</th><th class="right">CLS</th><th class="right">TBT</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="muted small">SEO is 100 and best-practices a uniform 79 (third-party GA4/Ads cookies — a known floor, not a regression) on every page, so both are omitted here; their floors are in the KPIs above. Mobile, devtools-throttled, median-of-3. Lab data only refreshes when <span class="mono">npm run lhci</span> reruns locally — the CI run's results stay in GitHub.</p>`;
  const worst = Math.min(m.performance ?? 1, m.accessibility ?? 1, m.seo ?? 1);
  return panel('Lighthouse (lab)', sub, body, worst >= 0.9 ? 'green' : worst >= 0.8 ? 'amber' : 'red');
}

// ── Cloudflare stats (edge traffic + cache) ─────────────────────────────────
function cloudflarePanel() {
  const snap = latest('cloudflare');
  if (!snap) return panel('Cloudflare edge', '', empty('No Cloudflare snapshot yet.'), 'grey');
  const d = snap.data;
  const w = d.last24h;
  if (!w) {
    return panel('Cloudflare edge', ageNote(snap.date), empty(d.last24hError || 'No 24h window data.'), 'amber');
  }
  const sub = `last 24h · sampled ${num(w.sampledRequests)} req · ${ageNote(snap.date)}`;
  const total = (w.byCacheStatus || []).reduce((a, b) => a + b.count, 0) || 1;
  const palette = { hit: '#3fe08f', revalidated: '#2bb6a8', miss: '#f5b544', expired: '#e8b84b', dynamic: '#5470a8', none: '#54607a' };
  const bar = (w.byCacheStatus || [])
    .map((c) => `<span class="seg" style="width:${((c.count / total) * 100).toFixed(1)}%;background:${palette[c.status] || '#cbd5e1'}" title="${esc(c.status)}: ${num(c.count)}"></span>`)
    .join('');
  const legend = (w.byCacheStatus || [])
    .map((c) => `<span class="lg"><span class="sw" style="background:${palette[c.status] || '#cbd5e1'}"></span>${esc(c.status)} ${num(c.count)}</span>`)
    .join('');
  const hit = w.cacheHitRatioCacheable ?? 0;
  // Errors: 4xx (client errors — bad URLs, mostly bot probes on a static site)
  // colored by share of sampled requests; ANY 5xx (server errors) is red.
  const errRatio = w.clientErrorRatio ?? 0;
  // 5xx paths render ALWAYS-VISIBLE (never behind the disclosure): the red
  // "server errors" KPI must be answerable in the same glance that raised it —
  // a lone 5xx never ranks in the count-ordered top paths next to 404 noise.
  let fiveXxBlock = '';
  if ((w.serverErrors ?? 0) > 0) {
    const rows = (w.serverErrorPaths || [])
      .map(
        (p) =>
          `<tr><td class="mono">${esc(p.path)}</td><td class="mono bad">${esc(p.status)}</td><td class="mono" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.userAgent || '—')}</td><td class="mono" style="text-align:right">${num(p.count)}</td></tr>`,
      )
      .join('');
    fiveXxBlock = `<div class="note alertnote"><strong>server errors (5xx) — sampled paths</strong>
      ${
        rows
          ? `<table class="small"><thead><tr><th>path</th><th>status</th><th>agent</th><th style="text-align:right">count</th></tr></thead><tbody>${rows}</tbody></table>`
          : `<p class="muted small">${esc(w.errorDetailError ? `path lookup failed: ${w.errorDetailError}` : 'paths not captured in this snapshot — rerun `npm run metrics` (older snapshot format, or the sampled rows aged out of the window)')}</p>`
      }
    </div>`;
  }
  const errPaths = (w.topErrorPaths || [])
    .map(
      (p) =>
        `<tr><td class="mono">${esc(p.path)}</td><td class="mono">${esc(p.status)}</td><td class="mono" style="text-align:right">${num(p.count)}</td></tr>`,
    )
    .join('');
  // share of 4xx concentrated in the top path: "one noisy path" vs "broad
  // breakage" is the first triage fork, so pre-answer it in the summary line.
  const topPath = (w.topErrorPaths || [])[0];
  const topShare =
    topPath && w.clientErrors ? Math.round((topPath.count / w.clientErrors) * 100) : null;
  const agentRows = (w.topErrorAgents || [])
    .map(
      (a) =>
        `<tr><td class="mono" style="max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.userAgent || '(no user-agent)')}</td><td class="mono" style="text-align:right">${num(a.count)}</td></tr>`,
    )
    .join('');
  const errBlock =
    w.clientErrors == null
      ? ''
      : `<details class="errors"><summary class="muted small">top error paths (4xx/5xx, sampled)${
          topShare != null && topPath ? ` — ${topShare}% is <span class="mono">${esc(topPath.path)}</span>` : ''
        }</summary>
          <table class="small"><thead><tr><th>path</th><th>status</th><th style="text-align:right">count</th></tr></thead>
          <tbody>${errPaths || '<tr><td colspan="3" class="muted">none in window</td></tr>'}</tbody></table>
          ${
            agentRows
              ? `<table class="small" style="margin-top:8px"><thead><tr><th>top error agents (who)</th><th style="text-align:right">count</th></tr></thead><tbody>${agentRows}</tbody></table>`
              : ''
          }
        </details>`;
  // per-UTC-day trend from the SAME snapshot (the fetcher keeps the last 7
  // completed days) — a day-over-day 4xx spike (e.g. 88→1070) must be visible
  // here, not only inside the raw JSON.
  const trend = d.dailyTrend || [];
  const trendKpis =
    trend.length < 2
      ? ''
      : `<div class="kpi"><span class="big">${sparkline(trend.map((t) => t.requests))}</span><span class="lbl">req / day</span></div>
      <div class="kpi"><span class="big">${sparkline(trend.map((t) => t.clientErrorRatio), { good: 0.05, bad: 0.15, lowerIsBetter: true })}</span><span class="lbl">4xx ratio / day</span></div>`;
  const body = `
    <div class="kpis">
      <div class="kpi"><span class="big">${num(w.sampledRequests)}</span><span class="lbl">sampled req / 24h</span></div>
      <div class="kpi"><span class="big">${kb(w.edgeResponseBytes)}</span><span class="lbl">edge bytes served</span></div>
      <div class="kpi"><span class="big ${hit >= 0.7 ? 'ok' : hit >= 0.4 ? 'warn' : 'bad'}">${pct(hit)}</span><span class="lbl">cacheable hit ratio</span></div>
      ${
        w.clientErrors == null
          ? ''
          : `<div class="kpi"><span class="big ${errRatio < 0.05 ? 'ok' : errRatio < 0.15 ? 'warn' : 'bad'}">${num(w.clientErrors)}</span><span class="lbl">client errors 4xx (${pct(errRatio)})</span></div>
      <div class="kpi"><span class="big ${(w.serverErrors ?? 0) === 0 ? 'ok' : 'bad'}">${num(w.serverErrors ?? 0)}</span><span class="lbl">server errors 5xx</span></div>`
      }
      ${trendKpis}
    </div>
    <div class="stack">${bar}</div>
    <div class="legend">${legend}</div>
    ${fiveXxBlock}
    ${errBlock}
    <p class="muted small">Most requests are HTML (served <span class="mono">dynamic</span> by design — the apex page stays uncached); only static <span class="mono">/_astro/*</span> assets are cacheable, so the hit ratio reflects asset reuse, not page caching. On a 4xx spike, open the paths/agents above first: probe paths (<span class="mono">/wp-admin</span>, <span class="mono">/.env</span>…) are bot noise, but one path at high volume is a real client to identify; any 5xx is real. RUM CWV is dashboard-only on the free plan.</p>`;
  return panel('Cloudflare edge', sub, body, (w.serverErrors ?? 0) > 0 ? 'amber' : 'green');
}

// ── SEO / AEO health (manual GA4 + GSC drops) ───────────────────────────────
function seoPanel() {
  const ga4 = latest('ga4');
  const gsc = latest('gsc');
  if (!ga4 && !gsc) {
    return panel(
      'SEO / AEO health',
      'manual capture (Workspace org blocks the GA4/GSC APIs)',
      `<div class="note"><p class="muted small">No <span class="mono">ga4-&lt;date&gt;.json</span> / <span class="mono">gsc-&lt;date&gt;.json</span> dropped yet. Capture via Claude-in-Chrome and save into <span class="mono">audit-reports/metrics/</span>; this panel renders them on the next build. Tracked as “manual capture pending”, never an error.</p></div>`,
      'grey',
    );
  }
  // every number carries its capture window — "clicks 0" over 3 days and over
  // 3 months are different signals — and the staleness badge is computed
  // (ageNote), never hardcoded fresh: manual captures are the likeliest to rot.
  const staleDays = (snap) =>
    Math.round((Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${snap.date}T00:00:00Z`)) / 86400000);
  const parts = [];
  if (gsc) {
    const g = gsc.data;
    const idx = g.indexed ?? null;
    const notIdx = g.notIndexed ?? null;
    const idxStr =
      idx != null && notIdx != null
        ? `indexed <span class="${notIdx > idx ? 'warn' : 'ok'}">${esc(idx)}</span> / not ${esc(notIdx)}`
        : `indexed ${esc(idx ?? '—')}`;
    parts.push(`<div class="kpi-row"><strong>GSC</strong> — ${idxStr} · clicks ${esc(g.clicks ?? '—')} · impressions ${esc(g.impressions ?? '—')} · avg pos ${esc(g.avgPosition ?? '—')} ${ageNote(gsc.date)}${
      g.window ? `<br><span class="muted small">window: ${esc(g.window)}</span>` : ''
    }</div>`);
  }
  if (ga4) {
    const a = ga4.data;
    parts.push(`<div class="kpi-row"><strong>GA4</strong> — users ${esc(a.users ?? '—')} · sessions ${esc(a.sessions ?? '—')} · conversions ${esc(a.conversions ?? '—')} ${ageNote(ga4.date)}${
      a.window ? `<br><span class="muted small">window: ${esc(a.window)}</span>` : ''
    }</div>`);
  }
  // honest dot: amber when a capture is over a week old or more pages sit
  // outside the index than in it — neither is failure, both deserve attention.
  const indexingBehind =
    gsc?.data.indexed != null && gsc?.data.notIndexed != null && gsc.data.notIndexed > gsc.data.indexed;
  const anyStale = [gsc, ga4].filter(Boolean).some((s) => staleDays(s) > 7);
  return panel('SEO / AEO health', 'manual GA4/GSC capture', parts.join(''), anyStale || indexingBehind ? 'amber' : 'green');
}

// ── shell ────────────────────────────────────────────────────────────────────
const sources = Object.keys(snaps);
const newestDate = sources
  .flatMap((s) => snaps[s].map((x) => x.date))
  .sort()
  .pop();
const freshness = ['betterstack', 'cloudflare', 'lighthouse', 'crux']
  .map((s) => {
    const l = latest(s);
    return `<span class="fr">${esc(s)} ${l ? ageNote(l.date) : '<span class="age stale">—</span>'}</span>`;
  })
  .join('');

const genTs = new Date().toISOString().replace('T', ' ').slice(0, 16);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Orionfold · health telemetry</title>
<style>
  :root{
    --bg:#080b12;--panel-a:rgba(146,180,255,.05);--panel-b:rgba(146,180,255,.014);
    --line:rgba(130,165,225,.16);--line-strong:rgba(130,165,225,.32);
    --ink:#e8eef8;--muted:#8492ab;--faint:#5b6880;
    --signal:#3fe08f;--warn:#f5b544;--alert:#ff5a6a;--accent:#5cc8ff;--gold:#e8b84b;
    --mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Code",Menlo,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  html{background:var(--bg)}
  body{margin:0;color:var(--ink);font:14px/1.55 var(--sans);background:var(--bg);-webkit-font-smoothing:antialiased}
  /* deep-space backdrop: nebula glows, then a static starfield, behind everything */
  body::before{content:"";position:fixed;inset:0;z-index:-2;pointer-events:none;
    background:
      radial-gradient(900px 600px at 12% -10%,rgba(92,200,255,.10),transparent 60%),
      radial-gradient(820px 600px at 100% 0%,rgba(120,90,220,.08),transparent 55%),
      radial-gradient(760px 760px at 50% 122%,rgba(63,224,143,.05),transparent 60%)}
  body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55;
    background-image:
      radial-gradient(1.2px 1.2px at 8% 18%,rgba(255,255,255,.7),transparent),
      radial-gradient(1px 1px at 23% 64%,rgba(255,255,255,.45),transparent),
      radial-gradient(1.4px 1.4px at 41% 12%,rgba(200,225,255,.6),transparent),
      radial-gradient(1px 1px at 57% 78%,rgba(255,255,255,.4),transparent),
      radial-gradient(1.2px 1.2px at 69% 28%,rgba(255,255,255,.55),transparent),
      radial-gradient(1px 1px at 82% 52%,rgba(220,235,255,.5),transparent),
      radial-gradient(1.3px 1.3px at 91% 84%,rgba(255,255,255,.45),transparent),
      radial-gradient(1px 1px at 34% 92%,rgba(255,255,255,.35),transparent),
      radial-gradient(1px 1px at 15% 40%,rgba(255,255,255,.3),transparent),
      radial-gradient(1.6px 1.6px at 77% 8%,rgba(232,184,75,.55),transparent)}
  .wrap{max-width:1280px;margin:0 auto;padding:40px 24px 72px}
  /* masthead */
  .top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid var(--line)}
  .brand{display:flex;align-items:center;gap:14px}
  .brand .star{font-size:26px;color:var(--gold);text-shadow:0 0 14px rgba(232,184,75,.6);line-height:1}
  .brand h1{margin:0;font:600 21px/1 var(--sans);letter-spacing:.34em;text-transform:uppercase}
  .brand .tag{display:block;margin-top:6px;font:500 11px/1 var(--mono);letter-spacing:.22em;color:var(--accent);text-transform:uppercase}
  .meta{font:500 11px/1.75 var(--mono);letter-spacing:.1em;color:var(--muted);text-align:right;text-transform:uppercase}
  .meta b{color:var(--ink);font-weight:600}
  .freshness{display:flex;flex-wrap:wrap;gap:18px;margin:16px 0 26px;font:500 11px/1 var(--mono);letter-spacing:.08em;color:var(--faint);text-transform:uppercase}
  .freshness .fr{display:flex;align-items:center;gap:7px}
  /* two independent flex column-stacks: a wide MAIN (data-heavy panels that want
     width) beside a narrow SIDE (compact KPI panels). No cross-column row
     alignment → packs densely with no stranded whitespace. Wraps to one column
     on narrow screens. */
  .grid{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .col{display:flex;flex-direction:column;gap:16px;min-width:0}
  .col.main{flex:1.6 1 520px}
  .col.side{flex:1 1 320px}
  .panel{position:relative;background:linear-gradient(180deg,var(--panel-a),var(--panel-b));border:1px solid var(--line);border-radius:10px;padding:18px 18px 20px;opacity:0;animation:rise .5s ease forwards}
  .panel::before{content:"";position:absolute;left:18px;right:18px;top:0;height:1px;background:linear-gradient(90deg,transparent,var(--line-strong),transparent)}
  .panel:hover{border-color:var(--line-strong)}
  @keyframes rise{to{opacity:1}}
  @media (prefers-reduced-motion:reduce){.panel{animation:none;opacity:1}}
  .panel header{margin-bottom:14px}
  .phead{display:flex;align-items:center;gap:10px}
  .pidx{font:600 11px/1 var(--mono);color:var(--faint);letter-spacing:.1em}
  .panel h2{margin:0;font:600 12px/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;display:flex;align-items:center;gap:9px}
  .panel .sub{margin:8px 0 0;color:var(--muted);font:500 11px/1.5 var(--mono);letter-spacing:.03em}
  /* status dots glow like signal lamps */
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:0 0 auto}
  .dot.green{background:var(--signal);box-shadow:0 0 8px var(--signal)}
  .dot.red{background:var(--alert);box-shadow:0 0 8px var(--alert)}
  .dot.amber{background:var(--warn);box-shadow:0 0 8px var(--warn)}
  .dot.grey{background:var(--faint);box-shadow:0 0 6px rgba(91,104,128,.6)}
  /* kpis */
  .kpis{display:flex;flex-wrap:wrap;gap:22px;margin:2px 0 16px}
  .kpi{display:flex;flex-direction:column;gap:5px}
  .kpi .big{font:600 25px/1 var(--mono);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
  .kpi .lbl{font:500 10px/1 var(--mono);color:var(--faint);text-transform:uppercase;letter-spacing:.12em}
  .kpi-row{padding:8px 0;border-bottom:1px solid var(--line);font:13px/1.5 var(--sans)}
  .kpi-row:last-child{border-bottom:0}
  .kpi-row strong{font:600 11px/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--accent);margin-right:6px}
  /* tables */
  table{width:100%;border-collapse:collapse;font:13px/1.4 var(--sans);font-variant-numeric:tabular-nums}
  th{text-align:left;color:var(--faint);font:600 10px/1 var(--mono);text-transform:uppercase;letter-spacing:.1em;padding:7px 9px;border-bottom:1px solid var(--line-strong)}
  td{padding:7px 9px;border-bottom:1px solid var(--line)}
  tr:last-child td{border-bottom:0}
  tbody tr:hover td{background:rgba(146,180,255,.045)}
  .right{text-align:right;font-family:var(--mono)}
  .nw{white-space:nowrap}
  .tscroll{overflow-x:auto}
  table.dense{table-layout:fixed;width:100%}
  table.dense th,table.dense td{padding:6px 6px;font-size:11.5px}
  details.errors{margin:10px 0 2px}
  details.errors summary{cursor:pointer;user-select:none}
  details.errors table{margin-top:6px}
  details.errors td{font-size:11.5px;padding:5px 9px}
  td.rt,th.rt{width:40%;font-family:var(--mono);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mono{font-family:var(--mono)}.small{font-size:12px}
  td .dot{margin-right:8px}
  .ok{color:var(--signal)}.warn{color:var(--warn)}.bad{color:var(--alert);font-weight:600}
  .big.ok{text-shadow:0 0 16px rgba(63,224,143,.4)}
  .big.bad{text-shadow:0 0 16px rgba(255,90,106,.4)}
  .big.warn{text-shadow:0 0 16px rgba(245,181,68,.35)}
  .muted{color:var(--muted)}
  .note{background:rgba(146,180,255,.03);border:1px solid var(--line);border-left:2px solid var(--line-strong);border-radius:6px;padding:11px 13px;margin:8px 0}
  .note strong{font:600 11px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}
  /* 5xx strip: alert-red signal lamp — visible without any interaction */
  .note.alertnote{background:rgba(255,90,106,.05);border-color:rgba(255,90,106,.25);border-left:2px solid var(--alert)}
  .note.alertnote strong{color:var(--alert);text-shadow:0 0 10px rgba(255,90,106,.35)}
  .note.alertnote table{margin-top:8px}
  .note.alertnote td{font-size:11.5px;padding:5px 9px}
  .age{font:600 10px/1 var(--mono);padding:3px 7px;border-radius:4px;letter-spacing:.04em;text-transform:uppercase}
  .age.fresh{background:rgba(63,224,143,.12);color:var(--signal)}
  .age.stale{background:rgba(245,181,68,.12);color:var(--warn)}
  .spark{vertical-align:middle}
  /* cache-status stacked bar */
  .stack{display:flex;height:16px;border-radius:5px;overflow:hidden;margin:6px 0 12px;border:1px solid var(--line)}
  .stack .seg{display:block;height:100%}
  .legend{display:flex;flex-wrap:wrap;gap:13px;font:500 10px/1 var(--mono);letter-spacing:.05em;color:var(--muted);text-transform:uppercase}
  .legend .lg{display:flex;align-items:center;gap:6px}
  .legend .sw{width:9px;height:9px;border-radius:2px;display:inline-block}
  footer{margin-top:34px;padding-top:16px;border-top:1px solid var(--line);color:var(--faint);font:500 11px/1.6 var(--mono);letter-spacing:.06em;text-align:center}
  footer .mono{color:var(--muted)}
</style></head>
<body><div class="wrap">
  <header class="top">
    <div class="brand">
      <span class="star">&#10022;</span>
      <div><h1>Orionfold</h1><span class="tag">// health telemetry</span></div>
    </div>
    <div class="meta">generated <b>${esc(genTs)}</b> utc<br>latest data <b>${esc(newestDate || 'none')}</b></div>
  </header>
  <div class="freshness">${freshness}</div>
  <div class="grid">
    <div class="col main">
      ${lighthousePanel()}
      ${cloudflarePanel()}
      ${fieldCwvPanel()}
    </div>
    <div class="col side">
      ${uptimePanel()}
      ${commercePanel()}
      ${seoPanel()}
    </div>
  </div>
  <footer>local-only &middot; audit-reports/ is git-ignored &middot; refresh with <span class="mono">npm run metrics &amp;&amp; npm run dashboard</span></footer>
</div></body></html>`;

const outPath = resolve(METRICS_DIR, '..', 'dashboard.html');
writeFileSync(outPath, html);
const sourceCount = ['betterstack', 'cloudflare', 'lighthouse', 'crux'].filter((s) => latest(s)).length;
console.log(`dashboard → ${outPath}`);
console.log(`  ${sourceCount}/4 fetcher sources · latest data ${newestDate || 'none'}${latest('ga4') || latest('gsc') ? ' · manual GA4/GSC present' : ' · GA4/GSC manual pending'}`);

if (process.argv.includes('--open') && process.platform === 'darwin') {
  spawnSync('open', [outPath]);
}
