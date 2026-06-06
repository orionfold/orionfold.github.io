// M7 — pure renderer: assemble() payload → HTML strings (spec §4a/§4c).
// ⚠ NO Node imports allowed in this file: dashboard-server.mjs serves it to
// the browser as an ES module, and the static build imports it in Node.
// Everything is a pure function of the payload.

export function renderBody(payload) {
  const snaps = payload.snaps;
  const latest = (source) => {
    const series = snaps[source];
    return series && series.length ? series[series.length - 1] : null;
  };
  const todayStr = payload.generatedAt.slice(0, 10);
  let sparkSeq = 0;
  let panelIndex = 0;

  // ── tiny formatting + html helpers ──────────────────────────────────────────
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  const pct = (n) => `${(n * 100).toFixed(1)}%`;
  const num = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const kb = (bytes) =>
    bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;
  const ms = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);

  // staleness label for a snapshot date vs the run date
  function ageNote(date) {
    if (!date) return '';
    const days = Math.round(
      (Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000,
    );
    if (days <= 0) return `<span class="age fresh">today</span>`;
    return `<span class="age stale">${days}d old</span>`;
  }

  // inline-SVG sparkline from a numeric series (degrades to a dot for 1 point).
  // Token-driven colors + area fade. Carries data-tip-* for the live tooltip.
  function sparkline(values, { good, bad, lowerIsBetter, tipHead } = {}) {
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
    let color = 'var(--blue)';
    if (typeof good === 'number' && typeof bad === 'number') {
      color = lowerIsBetter
        ? last <= good ? 'var(--green)' : last <= bad ? 'var(--amber)' : 'var(--red)'
        : last >= good ? 'var(--green)' : last >= bad ? 'var(--amber)' : 'var(--red)';
    }
    const tip = `data-tip-head="${esc(tipHead || 'trend')}" data-tip-lines="${esc(JSON.stringify(pts.map((v, i) => 'point ' + (i + 1) + ': ' + v)))}"`;
    if (pts.length === 1) {
      return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${tip}><circle cx="${(w / 2).toFixed(1)}" cy="${y(pts[0]).toFixed(1)}" r="3.2" fill="${color}"/></svg>`;
    }
    const gid = `sg${++sparkSeq}`;
    const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${x(0).toFixed(1)},${h} ${line} ${x(pts.length - 1).toFixed(1)},${h}`;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${tip}><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polygon points="${area}" fill="url(#${gid})"/><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${line}"/><circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3.2" fill="${color}"/></svg>`;
  }

  function panel(title, sub, bodyHtml, statusDot) {
    const dot = statusDot ? `<span class="dot ${statusDot}"></span>` : '';
    const idx = String(++panelIndex).padStart(2, '0');
    return `<section class="panel">
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
      tipHead: 'up-count trend',
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
      tipHead: 'perf trend',
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
    const palette = { hit: 'var(--green)', revalidated: 'var(--teal)', miss: 'var(--amber)', expired: 'var(--amber)', dynamic: 'var(--blue)', none: 'var(--faint)' };
    let xAcc = 0;
    const segs = (w.byCacheStatus || []).map((c) => {
      const segW = (c.count / total) * 100;
      const rect = `<rect x="${xAcc.toFixed(2)}" y="0" width="${segW.toFixed(2)}" height="14" fill="${palette[c.status] || 'var(--border)'}" data-tip-head="cache: ${esc(c.status)}" data-tip-lines="${esc(JSON.stringify([num(c.count) + ' requests', ((c.count / total) * 100).toFixed(1) + '%']))}"><title>${esc(c.status)}: ${num(c.count)}</title></rect>`;
      xAcc += segW;
      return rect;
    }).join('');
    const bar = `<svg class="stack" viewBox="0 0 100 14" width="100%" height="14" preserveAspectRatio="none">${segs}</svg>`;
    const legend = (w.byCacheStatus || [])
      .map((c) => `<span class="lg"><svg class="sw" viewBox="0 0 9 9"><rect width="9" height="9" rx="2" fill="${palette[c.status] || 'var(--border)'}"/></svg>${esc(c.status)} ${num(c.count)}</span>`)
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
            `<tr><td class="mono">${esc(p.path)}</td><td class="mono bad">${esc(p.status)}</td><td class="mono clip-260">${esc(p.userAgent || '—')}</td><td class="right mono">${num(p.count)}</td></tr>`,
        )
        .join('');
      fiveXxBlock = `<div class="note alertnote"><strong>server errors (5xx) — sampled paths</strong>
      ${
        rows
          ? `<table class="small"><thead><tr><th>path</th><th>status</th><th>agent</th><th class="right">count</th></tr></thead><tbody>${rows}</tbody></table>`
          : `<p class="muted small">${esc(w.errorDetailError ? `path lookup failed: ${w.errorDetailError}` : 'paths not captured in this snapshot — rerun `npm run metrics` (older snapshot format, or the sampled rows aged out of the window)')}</p>`
      }
    </div>`;
    }
    const errPaths = (w.topErrorPaths || [])
      .map(
        (p) =>
          `<tr><td class="mono">${esc(p.path)}</td><td class="mono">${esc(p.status)}</td><td class="right mono">${num(p.count)}</td></tr>`,
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
          `<tr><td class="mono clip-420">${esc(a.userAgent || '(no user-agent)')}</td><td class="right mono">${num(a.count)}</td></tr>`,
      )
      .join('');
    const errBlock =
      w.clientErrors == null
        ? ''
        : `<details class="errors"><summary class="muted small">top error paths (4xx/5xx, sampled)${
            topShare != null && topPath ? ` — ${topShare}% is <span class="mono">${esc(topPath.path)}</span>` : ''
          }</summary>
          <table class="small"><thead><tr><th>path</th><th>status</th><th class="right">count</th></tr></thead>
          <tbody>${errPaths || '<tr><td colspan="3" class="muted">none in window</td></tr>'}</tbody></table>
          ${
            agentRows
              ? `<table class="small"><thead><tr><th>top error agents (who)</th><th class="right">count</th></tr></thead><tbody>${agentRows}</tbody></table>`
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
        : `<div class="kpi"><span class="big">${sparkline(trend.map((t) => t.requests), { tipHead: 'req / day' })}</span><span class="lbl">req / day</span></div>
      <div class="kpi"><span class="big">${sparkline(trend.map((t) => t.clientErrorRatio), { good: 0.05, bad: 0.15, lowerIsBetter: true, tipHead: '4xx ratio / day' })}</span><span class="lbl">4xx ratio / day</span></div>`;
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
        `<div class="note"><p class="muted small">No <span class="mono">ga4-&lt;date&gt;.json</span> / <span class="mono">gsc-&lt;date&gt;.json</span> dropped yet. Capture via Claude-in-Chrome and save into <span class="mono">audit-reports/metrics/</span>; this panel renders them on the next build. Tracked as "manual capture pending", never an error.</p></div>`,
        'grey',
      );
    }
    // every number carries its capture window — "clicks 0" over 3 days and over
    // 3 months are different signals — and the staleness badge is computed
    // (ageNote), never hardcoded fresh: manual captures are the likeliest to rot.
    const staleDays = (snap) =>
      Math.round((Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${snap.date}T00:00:00Z`)) / 86400000);
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

  const sourcesList = ['betterstack', 'cloudflare', 'lighthouse', 'crux'];
  const newestDate = Object.keys(snaps)
    .flatMap((s) => snaps[s].map((x) => x.date))
    .sort()
    .pop();
  const freshnessHtml = sourcesList
    .map((s) => {
      const l = latest(s);
      return `<span class="fr">${esc(s)} ${l ? ageNote(l.date) : '<span class="age stale">—</span>'}</span>`;
    })
    .join('');
  const genTs = payload.generatedAt.replace('T', ' ').slice(0, 16);

  return {
    metaHtml: `generated <b>${esc(genTs)}</b> utc<br>latest data <b>${esc(newestDate || 'none')}</b>`,
    freshnessHtml,
    mainHtml: [lighthousePanel(), cloudflarePanel(), fieldCwvPanel()].join('\n      '),
    sideHtml: [uptimePanel(), commercePanel(), seoPanel()].join('\n      '),
  };
}
