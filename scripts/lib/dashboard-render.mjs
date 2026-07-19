// M7 — pure renderer: assemble() payload → HTML strings (spec §4a/§4c).
// ⚠ NO Node imports allowed in this file: dashboard-server.mjs serves it to
// the browser as an ES module, and the static build imports it in Node.
// Everything is a pure function of the payload.

export function renderBody(payload) {
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
  // a source's series for one site, oldest→newest (for sparkline trends).
  const seriesFor = (source, site) =>
    (snaps[source] || []).filter((s) => (s.site || 'orionfold') === site);
  const todayStr = payload.generatedAt.slice(0, 10);

  // ── period-over-period deltas (WoW / MoM) ───────────────────────────────────
  // Snapshots are irregular (not daily), so for a target window we pick the
  // NEWEST snapshot on-or-before (latestDate − window + slack). The slack lets a
  // snapshot a couple days short still serve as a baseline; the real day-gap is
  // labelled so a "WoW" off a 9-day-old snapshot is never silently misleading.
  // Returns null when no snapshot falls in range (MoM has no baseline until the
  // archive reaches back far enough — the badge then reads "n/a").
  const dayGap = (a, b) =>
    Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
  const WINDOWS = { WoW: { days: 7, slack: 2 }, MoM: { days: 30, slack: 5 } };
  function priorSnap(series, latestDate, win) {
    const { days, slack } = WINDOWS[win];
    const target = Date.parse(`${latestDate}T00:00:00Z`) - days * 86400000;
    const floor = target - slack * 86400000;
    const ceil = target + slack * 86400000;
    // newest snapshot whose date sits within [target−slack, target+slack] and is
    // strictly older than the latest (never compare a snapshot to itself).
    let best = null;
    for (const s of series) {
      if (s.date >= latestDate) continue;
      const t = Date.parse(`${s.date}T00:00:00Z`);
      if (t < floor || t > ceil) continue;
      if (!best || s.date > best.date) best = s;
    }
    return best;
  }
  // Format one delta badge: arrow + signed change + window, colored by whether
  // the change is good (▲ green when higher-is-better, etc.). `fmt` renders the
  // magnitude (num by default; pass a pct/point formatter for rates). `prior`
  // is null when no baseline exists → "n/a" badge (greyed, no arrow).
  function deltaBadge(curr, prior, win, { lowerIsBetter = false, fmt = num, gapDays = null } = {}) {
    if (prior == null || typeof curr !== 'number' || Number.isNaN(curr)) {
      return `<span class="delta na" data-tip-head="${win}" data-tip-lines="${esc(JSON.stringify(['no baseline snapshot in range yet']))}">n/a ${win}</span>`;
    }
    const diff = curr - prior;
    const gapNote = gapDays != null && Math.abs(gapDays - WINDOWS[win].days) > 0 ? ` (${gapDays}d)` : '';
    if (diff === 0) {
      return `<span class="delta flat">▬ 0 ${win}${gapNote}</span>`;
    }
    const up = diff > 0;
    const good = lowerIsBetter ? !up : up;
    const cls = good ? 'up' : 'down';
    const arrow = up ? '▲' : '▼';
    const mag = fmt(Math.abs(diff));
    return `<span class="delta ${cls}" data-tip-head="${win} change" data-tip-lines="${esc(JSON.stringify([`now: ${fmt(curr)}`, `then: ${fmt(prior)}`, `baseline ${gapDays != null ? gapDays + 'd' : '~' + WINDOWS[win].days + 'd'} ago`]))}">${arrow} ${up ? '+' : '−'}${mag} ${win}</span>`;
  }
  // Both windows for one metric, as a single inline run of badges. `pickPrior`
  // maps a prior snapshot's data → the comparable scalar (mirrors how `curr` was
  // derived from the latest snapshot).
  function deltas(series, latestDate, curr, pickPrior, opts = {}) {
    return ['WoW', 'MoM']
      .map((win) => {
        const p = priorSnap(series, latestDate, win);
        const priorVal = p ? pickPrior(p.data) : null;
        return deltaBadge(curr, priorVal == null ? null : priorVal, win, {
          ...opts,
          gapDays: p ? dayGap(latestDate, p.date) : null,
        });
      })
      .join(' ');
  }
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

  // A panel whose body is ONLY an empty/placeholder note collapses to a
  // title-only card (operator ask: "collapse empty cards to just titles").
  // empty() tags its output with EMPTY_MARK; panel() detects a body that is
  // nothing but one marked placeholder and stamps the card `.collapsed`.
  const EMPTY_MARK = 'data-empty="1"';
  function panel(title, sub, bodyHtml, statusDot) {
    const dot = statusDot ? `<span class="dot ${statusDot}"></span>` : '';
    const idx = String(++panelIndex).padStart(2, '0');
    const isEmpty = bodyHtml.includes(EMPTY_MARK);
    const cls = isEmpty ? 'panel collapsed' : 'panel';
    // collapsed cards drop the body entirely (title-only); the placeholder
    // reason rides the header sub-line so the "why empty" is never lost.
    const collapsedSub = isEmpty
      ? (sub ? sub : 'no data yet')
      : sub;
    return `<section class="${cls}">
    <header>
      <div class="phead"><span class="pidx">${idx}</span><h2>${dot}${esc(title)}</h2></div>
      ${collapsedSub ? `<p class="sub">${collapsedSub}</p>` : ''}
    </header>
    ${isEmpty ? '' : bodyHtml}
  </section>`;
  }

  const empty = (msg) => `<p class="muted" ${EMPTY_MARK}>${esc(msg)}</p>`;

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
  function fieldCwvPanel(site) {
    const cf = latest('cloudflare', site);
    const crux = latest('crux', site);
    // M-polish (b): while BOTH sources are known-unavailable (CrUX gates on
    // traffic volume, CF RUM is dashboard-only — not in token scope), collapse
    // the two notes into one compact row. Partial availability falls through
    // to the per-source blocks below.
    const cfF = cf?.data.fieldCWV;
    const cruxFf = crux?.data.formFactors;
    const cfAvail = !!cfF?.available;
    const cruxAvail = !!(cruxFf && Object.values(cruxFf).some((x) => x.available));
    if (cfF && cruxFf && !cfAvail && !cruxAvail) {
      const cruxReason = Object.values(cruxFf)[0]?.reason || 'no field data';
      // no field data on either free source → collapse to a title-only card.
      const body = `<div class="note" ${EMPTY_MARK}><p class="muted small"><strong>No field data yet</strong> — CF RUM: ${esc(cfF.reason)} · CrUX: ${esc(cruxReason)}</p></div>`;
      return panel('Field CWV (real users)', 'no field data — fills as traffic grows', body, 'amber');
    }
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
  function lighthousePanel(site) {
    const snap = latest('lighthouse', site);
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
    const runSeries = seriesFor('lighthouse', site).filter((s) => {
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
    // WoW/MoM on the min-scores — compared against prior DISTINCT runs (same
    // dedup as the trend), so a re-summary of today's run never fakes a delta.
    // Re-key each run by the date it was MEASURED (runFetchTime), not the
    // snapshot write date, so the window math lines up with the run timeline.
    // Scores are 0–1 fractions; show the change in whole Lighthouse points.
    const runByMeasureDate = runSeries.map((s) => ({
      ...s,
      date: s.data.runFetchTime?.slice(0, 10) || s.date,
    }));
    const lhScoreDelta = (curr, pick) =>
      deltas(runByMeasureDate, runDate, curr, (data) => pick(data), {
        fmt: (v) => String(Math.round(v * 100)),
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
      <div class="kpi"><span class="big ${cat(m.performance)}">${Math.round((m.performance ?? 0) * 100)}</span><span class="lbl">min perf</span><span class="kpi-deltas">${lhScoreDelta(m.performance ?? 0, (d) => d?.minScores?.performance)}</span></div>
      <div class="kpi"><span class="big ${cat(m.accessibility)}">${Math.round((m.accessibility ?? 0) * 100)}</span><span class="lbl">min a11y</span><span class="kpi-deltas">${lhScoreDelta(m.accessibility ?? 0, (d) => d?.minScores?.accessibility)}</span></div>
      <div class="kpi"><span class="big ${cat(m.seo)}">${Math.round((m.seo ?? 0) * 100)}</span><span class="lbl">min SEO</span><span class="kpi-deltas">${lhScoreDelta(m.seo ?? 0, (d) => d?.minScores?.seo)}</span></div>
      <div class="kpi"><span class="big">${perfTrend}</span><span class="lbl">perf trend</span></div>
    </div>
    <div class="tscroll"><table class="dense"><thead><tr><th class="rt">Route</th><th class="right">Perf</th><th class="right">A11y</th><th class="right">LCP</th><th class="right">CLS</th><th class="right">TBT</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="muted small">SEO is 100 and best-practices a uniform 79 (third-party GA4/Ads cookies — a known floor, not a regression) on every page, so both are omitted here; their floors are in the KPIs above. Mobile, devtools-throttled, median-of-3. Lab data only refreshes when <span class="mono">npm run lhci</span> reruns locally — the CI run's results stay in GitHub.</p>`;
    const worst = Math.min(m.performance ?? 1, m.accessibility ?? 1, m.seo ?? 1);
    return panel('Lighthouse (lab)', sub, body, worst >= 0.9 ? 'green' : worst >= 0.8 ? 'amber' : 'red');
  }

  // ── Cloudflare stats (edge traffic + cache) ─────────────────────────────────
  function cloudflarePanel(site) {
    const snap = latest('cloudflare', site);
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
    const bar = `<svg viewBox="0 0 100 14" width="100%" height="14" preserveAspectRatio="none">${segs}</svg>`;
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

  // staleness in whole days for a manual snapshot (GA4/GSC rot the fastest).
  const staleDays = (snap) =>
    Math.round((Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${snap.date}T00:00:00Z`)) / 86400000);

  // ── Search (GSC) — the EARNED-DISCOVERY engine (indexing → impressions → clicks)
  // Split out from the old combined SEO panel so search visibility is never
  // conflated with GA4 traffic (which is paid-dominated). See the GA4 panel below.
  function seoPanel(site) {
    const gsc = latest('gsc', site);
    if (!gsc) {
      return panel(
        'Search (GSC)',
        'manual GSC capture pending',
        `<div class="note" ${EMPTY_MARK}><p class="muted small">No <span class="mono">gsc-&lt;date&gt;.json</span> dropped yet. Capture via Claude-in-Chrome and save into <span class="mono">audit-reports/metrics/</span>; this panel renders it on the next build. Tracked as "manual capture pending", never an error.</p></div>`,
        'grey',
      );
    }
    const g = gsc.data;
    const idx = g.indexed ?? null;
    const notIdx = g.notIndexed ?? null;
    const indexingBehind = idx != null && notIdx != null && notIdx > idx;
    // headline KPIs: the indexing ratio (the leading discovery signal — ainative's
    // 20/201 vs orionfold's 42/14 is the whole story) + clicks/impressions/CTR.
    const ctr = g.ctr != null ? pct(g.ctr) : '—';
    const idxKpi =
      idx != null && notIdx != null
        ? `<div class="kpi"><span class="big ${indexingBehind ? 'bad' : 'ok'}">${esc(idx)}<span class="lbl-inline"> / ${esc(notIdx)}</span></span><span class="lbl">indexed / not indexed</span></div>`
        : '';
    const kpis = `<div class="kpis">
      ${idxKpi}
      <div class="kpi"><span class="big">${esc(g.clicks ?? '—')}</span><span class="lbl">clicks</span></div>
      <div class="kpi"><span class="big">${esc(g.impressions ?? '—')}</span><span class="lbl">impressions</span></div>
      <div class="kpi"><span class="big">${ctr}</span><span class="lbl">ctr</span></div>
      <div class="kpi"><span class="big">${esc(g.avgPosition ?? '—')}</span><span class="lbl">avg position</span></div>
    </div>`;
    const win = g.window ? `<p class="muted small">window: ${esc(g.window)}</p>` : '';
    const behindNote = indexingBehind
      ? `<p class="muted small">More pages sit outside the index than in it — a content/links/freshness backlog, not an error. Sitemap <span class="mono">&lt;lastmod&gt;</span> + JSON-LD + internal links are the proven levers.</p>`
      : '';
    // top indexing-error reasons (why pages aren't indexed). The fix that drives
    // indexing is a "Discovered/Crawled - currently not indexed" backlog (content/
    // links/freshness); "Alternate canonical"/"noindex"/"redirect" are CORRECT
    // exclusions, not errors — flag the actionable Google-systems reasons in amber.
    const reasons = Array.isArray(g.notIndexedReasons) ? g.notIndexedReasons : null;
    let reasonsBlock = '';
    if (reasons && reasons.length) {
      const isBacklog = (r) => /currently not indexed|server error|crawl/i.test(r.reason);
      const rows = reasons
        .filter((r) => (r.pages ?? 0) > 0)
        .sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0))
        .map((r) => {
          const warn = isBacklog(r) ? ' bad' : '';
          return `<tr><td>${esc(r.reason)}</td><td class="mono small muted">${esc(r.source || '')}</td><td class="right mono${warn}">${num(r.pages ?? 0)}</td></tr>`;
        })
        .join('');
      if (rows) {
        reasonsBlock = `<p class="muted small reasons-head">top reasons pages aren't indexed</p>
        <table class="small"><thead><tr><th>reason</th><th>source</th><th class="right">pages</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
    }
    const sub = `manual GSC capture · ${ageNote(gsc.date)}`;
    return panel('Search (GSC)', sub, kpis + win + behindNote + reasonsBlock, staleDays(gsc) > 7 || indexingBehind ? 'amber' : 'green');
  }

  // ── Traffic (GA4) — earned vs total, NEVER conflated ─────────────────────────
  // Promotes the high-signal metrics buried in the old combined panel to headline
  // KPIs: Organic Search sessions (the earned-traffic engine) + engagement rate
  // (traffic quality) + key events (leads) sit next to total sessions, so a paid
  // spike can't masquerade as growth. Channel mix + users/conversions follow.
  function ga4Panel(site) {
    const ga4 = latest('ga4', site);
    if (!ga4) {
      return panel(
        'Traffic (GA4)',
        'manual GA4 capture pending',
        `<div class="note" ${EMPTY_MARK}><p class="muted small">No <span class="mono">ga4-&lt;date&gt;.json</span> dropped yet. Capture via Claude-in-Chrome and save into <span class="mono">audit-reports/metrics/</span>; this panel renders it on the next build. Tracked as "manual capture pending", never an error.</p></div>`,
        'grey',
      );
    }
    const a = ga4.data;
    const productionScope = a.productionHostScope;
    const isOrionfold = site === 'orionfold';
    const isProductionScoped = !isOrionfold || (
      productionScope?.status === 'filtered'
      && productionScope?.dimension === 'Hostname'
      && productionScope?.matchType === 'exactly matches'
      && productionScope?.value === 'orionfold.com'
    );
    const scopeBlock = isOrionfold
      ? isProductionScoped
        ? `<div class="note"><strong>production host only</strong><p class="muted small"><span class="mono">Hostname exactly matches orionfold.com</span> · captured totals exclude localhost, preview and CI hosts.</p></div>`
        : `<div class="note alertnote"><strong>production-host scope missing</strong><p class="muted small">This snapshot is not confirmed production-only. Do not use its total, Direct share or aggregate engagement as real-user KPIs; the next authenticated capture must apply <span class="mono">Hostname exactly matches orionfold.com</span>.</p></div>`
      : '';
    const contamination = a.historicalContamination || (isOrionfold ? {
      window: '2026-06-21 → 2026-07-18',
      syntheticSessions: 1049,
      cohort: 'localhost Lighthouse / Moto G Power (2022)',
      disposition: 'annotated, not rewritten',
    } : null);
    const contaminationBlock = contamination
      ? `<div class="note"><strong>historical contamination · ${esc(contamination.window)}</strong><p class="muted small">${num(contamination.syntheticSessions)} synthetic sessions from ${esc(contamination.cohort)} · ${esc(contamination.disposition)}. Historical paid presence and Organic Search direction remain readable; historical total/Direct engagement does not.</p></div>`
      : '';
    const er = a.engagementRate != null ? pct(a.engagementRate) : '—';
    const org = a.organicSearchSessions;
    const orgEr = a.organicSearchEngagementRate != null ? ` <span class="lbl-inline">@ ${pct(a.organicSearchEngagementRate)} eng</span>` : '';
    const keyEvents = a.keyEvents ?? a.conversions;
    // earned-first KPI row: Organic Search leads (the engine that matters), then
    // total sessions, engagement rate, key events. Organic uses the blue data hue
    // (not status) to read as "the signal line", total stays neutral ink.
    const kpis = `<div class="kpis">
      ${
        org != null
          ? `<div class="kpi"><span class="big" style="color:var(--blue-ink)">${esc(org)}${orgEr}</span><span class="lbl">organic search sessions</span></div>`
          : ''
      }
      <div class="kpi"><span class="big">${esc(a.sessions ?? '—')}</span><span class="lbl">total sessions</span></div>
      <div class="kpi"><span class="big ${a.engagementRate >= 0.4 ? 'ok' : a.engagementRate >= 0.2 ? 'warn' : ''}">${er}</span><span class="lbl">engagement rate</span></div>
      <div class="kpi"><span class="big ${keyEvents > 0 ? 'ok' : ''}">${esc(keyEvents ?? '—')}</span><span class="lbl">key events (leads)</span></div>
    </div>`;
    // channel mix: which engine the sessions came from. Paid vs organic at a glance.
    const chans = a.sessionChannels && Object.keys(a.sessionChannels).length ? a.sessionChannels : null;
    let chanBlock = '';
    if (chans) {
      const totalCh = Object.values(chans).reduce((x, y) => x + y, 0) || 1;
      const isPaid = (k) => /paid/i.test(k);
      const isOrganic = (k) => /organic|referral|email/i.test(k);
      const rows = Object.entries(chans)
        .sort((x, y) => y[1] - x[1])
        .map(([k, v]) => {
          const tag = isPaid(k) ? 'paid' : isOrganic(k) ? 'earned' : 'direct';
          const cls = tag === 'paid' ? 'amber' : tag === 'earned' ? 'green' : 'grey';
          return `<tr><td><span class="pill ${cls}">${tag}</span></td><td>${esc(k)}</td><td class="right mono">${esc(v)}</td><td class="right mono muted">${((v / totalCh) * 100).toFixed(0)}%</td></tr>`;
        })
        .join('');
      chanBlock = `<div class="chanmix"><p class="muted small chanmix-head">channel mix (earned vs paid vs direct)</p>
        <table class="small"><thead><tr><th>type</th><th>channel</th><th class="right">sessions</th><th class="right">share</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    const detail = `<p class="muted small">users ${esc(a.users ?? '—')} · conversions ${esc(a.conversions ?? '—')}${
      a.avgEngagementTimeSec != null ? ` · avg engagement ${esc(a.avgEngagementTimeSec)}s` : ''
    }${a.window ? ` · window: ${esc(a.window)}` : ''}</p>`;
    const note = `<p class="muted small">Total sessions are paid-dominated when a campaign runs — read the <strong>organic search</strong> line for the earned trend, not the total. Key events = configured leads/conversions; <span class="mono">0</span> with paid off (or no events wired) is expected, not a leak.</p>`;
    // honest dot: amber if stale (>7d) or no engagement to speak of.
    const lowEng = a.engagementRate != null && a.engagementRate < 0.2;
    return panel('Traffic (GA4)', `manual GA4 capture · ${ageNote(ga4.date)}`, scopeBlock + contaminationBlock + kpis + chanBlock + detail + note, staleDays(ga4) > 7 || lowEng || !isProductionScoped ? 'amber' : 'green');
  }

  // ── CI / Deploy (gh, server-side cached — asOf is honest about it) ────────
  function ciPanel() {
    const ci = payload.ci;
    if (!ci || !ci.asOf) return panel('CI / Deploy', '', empty('CI status unavailable (server-side gh lookup disabled).'), 'grey');
    const NEUTRAL = ['cancelled', 'skipped', 'neutral'];
    const rows = ci.runs.map((r) => {
      if (!r.available) {
        return `<tr><td class="mono small">${esc(r.workflow)}</td><td colspan="3" class="muted small">no data — ${esc(r.reason)}</td></tr>`;
      }
      const cls = r.conclusion === 'success' ? 'green'
        : r.status !== 'completed' ? 'amber'
        : NEUTRAL.includes(r.conclusion) ? 'grey'
        : 'red';
      const label = r.status !== 'completed' ? r.status : r.conclusion;
      return `<tr>
        <td class="mono small">${esc(r.workflow)}</td>
        <td><span class="pill ${cls}">${esc(label)}</span></td>
        <td class="mono small">${esc((r.updatedAt || '').slice(0, 16).replace('T', ' '))}</td>
        <td class="right"><a href="${esc(r.url)}" target="_blank" rel="noopener">run ↗</a></td>
      </tr>`;
    }).join('');
    const anyBad = ci.runs.some((r) =>
      r.available && r.status === 'completed' && r.conclusion &&
      r.conclusion !== 'success' && !NEUTRAL.includes(r.conclusion));
    const jobsHtml = payload.jobs && Object.keys(payload.jobs).length
      ? Object.entries(payload.jobs).map(([k, j]) => {
          const cls = j.state === 'ok' ? 'green' : j.state === 'running' ? 'amber' : j.state === 'error' ? 'red' : 'grey';
          const when = j.finishedAt ? ` ${j.finishedAt.slice(11, 16)}` : '';
          return `<span class="pill ${cls}" title="${esc(j.error || '')}">${esc(k)}: ${esc(j.state)}${esc(when)}</span>`;
        }).join(' ')
      : '';
    const body = `<table><thead><tr><th>Workflow</th><th>State</th><th>Updated (UTC)</th><th class="right">Link</th></tr></thead><tbody>${rows}</tbody></table>
      ${jobsHtml ? `<p class="small jobs-line">admin jobs: ${jobsHtml}</p>` : ''}
      <p class="muted small">gh lookup cached server-side · as of ${esc(ci.asOf.slice(11, 19))} UTC (≤5 min; refreshes after admin jobs)</p>`;
    return panel('CI / Deploy', 'deploy.yml + lighthouse.yml', body, anyBad ? 'red' : 'green');
  }

  const sourcesList = ['betterstack', 'cloudflare', 'lighthouse', 'crux'];
  const newestDate = Object.keys(snaps)
    .flatMap((s) => snaps[s].map((x) => x.date))
    .sort()
    .pop();
  const freshnessHtml = siteList
    .map((site) =>
      sourcesList
        .map((s) => {
          // betterstack is orionfold-only; skip it for non-default sites.
          if (s === 'betterstack' && site !== 'orionfold') return '';
          const l = latest(s, site);
          return `<span class="fr">${esc(site === 'orionfold' ? s : site + ':' + s)} ${l ? ageNote(l.date) : '<span class="age stale">—</span>'}</span>`;
        })
        .join(''),
    )
    .join('');
  const genTs = payload.generatedAt.replace('T', ' ').slice(0, 16);

  // ════════════════════════════════════════════════════════════════════════════
  // Combined cross-property analytics + actionable growth insights.
  // Both are pure functions of the same snapshots the panels render — the bar
  // rolls the per-site numbers up; the insights apply fixed rules to them so the
  // narrative can never drift from the data (rule-based, recomputed every build).
  // ════════════════════════════════════════════════════════════════════════════

  // collect the latest GSC/GA4/Cloudflare/Better Stack reads per site, once.
  const siteData = siteList.map((site) => ({
    site,
    domain: latest('cloudflare', site)?.data.domain || (site === 'orionfold' ? 'orionfold.com' : site),
    gsc: latest('gsc', site)?.data || null,
    ga4: latest('ga4', site)?.data || null,
    cf: latest('cloudflare', site)?.data || null,
  }));
  const bs = latest('betterstack')?.data || null; // infra is orionfold-only
  const sumBy = (fn) => siteData.reduce((a, s) => a + (fn(s) || 0), 0);

  // Cross-property delta for a bar KPI: re-derive the same rollup off each site's
  // prior snapshot (per window) and sum. A window counts as having a baseline if
  // ANY contributing site has a prior snap in range; sites without one are simply
  // omitted from that window's prior-sum (their `null` reads as absent, matching
  // how `sumBy` already treats a missing latest value as 0). `source` is the
  // snapshot kind that carries the field (gsc / ga4 / cloudflare).
  const barDeltas = (source, curr, pick, opts = {}) =>
    ['WoW', 'MoM']
      .map((win) => {
        let priorSum = 0;
        let any = false;
        let gap = null;
        for (const sd of siteData) {
          const series = seriesFor(source, sd.site);
          const cur = latest(source, sd.site);
          if (!cur) continue;
          const p = priorSnap(series, cur.date, win);
          if (!p) continue;
          const v = pick(p.data);
          if (typeof v !== 'number' || Number.isNaN(v)) continue;
          priorSum += v;
          any = true;
          gap = gap == null ? dayGap(cur.date, p.date) : gap; // first site's gap is representative
        }
        return deltaBadge(curr, any ? priorSum : null, win, { ...opts, gapDays: gap });
      })
      .join(' ');

  // ── top analytics bar: combined KPIs across all properties ──────────────────
  function analyticsBar() {
    // search & traffic (earned)
    const clicks = sumBy((s) => s.gsc?.clicks);
    const impressions = sumBy((s) => s.gsc?.impressions);
    const organic = sumBy((s) => s.ga4?.organicSearchSessions);
    const indexed = sumBy((s) => s.gsc?.indexed);
    const notIndexed = sumBy((s) => s.gsc?.notIndexed);
    // engagement & conversions
    const sessions = sumBy((s) => s.ga4?.sessions);
    const keyEvents = sumBy((s) => s.ga4?.keyEvents ?? s.ga4?.conversions);
    // weighted overall engagement rate (engagedSessions / sessions across sites)
    const engaged = sumBy((s) => s.ga4?.engagedSessions);
    const engRate = sessions ? engaged / sessions : null;
    // discovered-not-indexed backlog (the actionable SEO gap)
    const backlog = siteData.reduce((a, s) => {
      const reasons = Array.isArray(s.gsc?.notIndexedReasons) ? s.gsc.notIndexedReasons : [];
      return a + reasons.filter((r) => /currently not indexed/i.test(r.reason)).reduce((x, r) => x + (r.pages || 0), 0);
    }, 0);
    // reliability & edge
    const reqs = sumBy((s) => s.cf?.last24h?.sampledRequests);
    const err4xx = sumBy((s) => s.cf?.last24h?.clientErrors);
    const err5xx = sumBy((s) => s.cf?.last24h?.serverErrors);
    const monUp = bs?.counts?.up ?? null;
    const monTotal = bs?.total ?? null;

    // per-site "currently not indexed" backlog picker (mirrors the rollup above)
    const pickBacklog = (data) => {
      const reasons = Array.isArray(data?.notIndexedReasons) ? data.notIndexedReasons : [];
      return reasons.filter((r) => /currently not indexed/i.test(r.reason)).reduce((x, r) => x + (r.pages || 0), 0);
    };

    const cell = (value, label, cls = '', delta = '') =>
      `<div class="bar-kpi"><span class="bar-val ${cls}">${value}</span><span class="bar-lbl">${esc(label)}</span>${delta ? `<span class="bar-deltas">${delta}</span>` : ''}</div>`;
    const grp = (title, cells) =>
      `<div class="bar-group"><span class="bar-group-title">${esc(title)}</span><div class="bar-cells">${cells.join('')}</div></div>`;

    const searchGrp = grp('Search & traffic', [
      cell(num(clicks), 'gsc clicks', '', barDeltas('gsc', clicks, (d) => d?.clicks)),
      cell(num(impressions), 'impressions', '', barDeltas('gsc', impressions, (d) => d?.impressions)),
      cell(num(organic), 'organic sessions', 'accent', barDeltas('ga4', organic, (d) => d?.organicSearchSessions)),
    ]);
    const engGrp = grp('Engagement', [
      cell(num(sessions), 'total sessions', '', barDeltas('ga4', sessions, (d) => d?.sessions)),
      cell(engRate != null ? pct(engRate) : '—', 'engagement rate', engRate >= 0.4 ? 'ok' : engRate >= 0.2 ? 'warn' : ''),
      cell(num(keyEvents), 'key events', keyEvents > 0 ? 'ok' : ''),
    ]);
    const idxGrp = grp('Indexing', [
      cell(num(indexed), 'indexed', 'ok', barDeltas('gsc', indexed, (d) => d?.indexed)),
      cell(num(notIndexed), 'not indexed', notIndexed > indexed ? 'bad' : '', barDeltas('gsc', notIndexed, (d) => d?.notIndexed, { lowerIsBetter: true })),
      cell(num(backlog), 'discovered backlog', backlog > 0 ? 'bad' : 'ok', barDeltas('gsc', backlog, pickBacklog, { lowerIsBetter: true })),
    ]);
    const relCells = [
      cell(num(reqs), 'edge req / 24h', '', barDeltas('cloudflare', reqs, (d) => d?.last24h?.sampledRequests)),
      cell(num(err4xx), '4xx errors', err4xx > 0 ? 'warn' : 'ok', barDeltas('cloudflare', err4xx, (d) => d?.last24h?.clientErrors, { lowerIsBetter: true })),
      cell(num(err5xx), '5xx errors', err5xx > 0 ? 'bad' : 'ok', barDeltas('cloudflare', err5xx, (d) => d?.last24h?.serverErrors, { lowerIsBetter: true })),
    ];
    if (monUp != null) relCells.unshift(cell(`${monUp}/${monTotal}`, 'monitors up', monUp === monTotal ? 'ok' : 'bad'));
    const relGrp = grp('Reliability & edge', relCells);

    return `<div class="analytics-bar">
      <div class="bar-head"><span class="bar-title">Combined analytics</span><span class="bar-sub">${esc(siteData.length)} properties · ${siteData.map((s) => esc(s.domain)).join(' + ')}</span></div>
      <div class="bar-groups">${searchGrp}${engGrp}${idxGrp}${relGrp}</div>
    </div>`;
  }

  // ── actionable growth insights: fixed rules over the live numbers ────────────
  // Each rule emits an insight only when the data triggers it, tagged by priority
  // (P0 act-now / P1 high-leverage / P2 polish) and the property it concerns.
  // The objective is GROWTH of the Orionfold properties — every insight names a
  // concrete next action, not just an observation.
  function growthInsights() {
    const out = [];
    const push = (priority, scope, title, action) => out.push({ priority, scope, title, action });

    for (const s of siteData) {
      const tag = s.domain;
      // indexing backlog — the #1 earned-discovery lever (playbook-proven)
      const reasons = Array.isArray(s.gsc?.notIndexedReasons) ? s.gsc.notIndexedReasons : [];
      const disc = reasons.find((r) => /discovered - currently not indexed/i.test(r.reason));
      const crawled = reasons.find((r) => /crawled - currently not indexed/i.test(r.reason));
      const backlog = (disc?.pages || 0) + (crawled?.pages || 0);
      if (backlog >= 20) {
        push('P0', tag,
          `${num(backlog)} pages discovered/crawled but not indexed`,
          `Google found these pages but won't index them — the classic content/links/freshness gap. Add internal links from indexed hubs (footer directory, catalog doorways), set real <span class="mono">&lt;lastmod&gt;</span> in the sitemap, and confirm each page has complete JSON-LD. This is the proven lever that drove orionfold 5→42 indexed.`);
      }
      // indexing ratio inverted
      if (s.gsc && s.gsc.notIndexed > s.gsc.indexed && backlog < 20) {
        push('P1', tag,
          `More pages excluded (${num(s.gsc.notIndexed)}) than indexed (${num(s.gsc.indexed)})`,
          `Review the exclusion reasons — if they're canonical/noindex/redirect they're correct housekeeping, but a high count can hide thin or duplicate pages worth consolidating or linking.`);
      }
      // low CTR despite impressions — title/meta intent problem
      if (s.gsc && s.gsc.impressions >= 200 && s.gsc.ctr != null && s.gsc.ctr < 0.02) {
        push('P1', tag,
          `High impressions (${num(s.gsc.impressions)}) but ${pct(s.gsc.ctr)} CTR`,
          `Pages are surfacing in search but not earning the click. Rewrite the highest-impression pages' <span class="mono">&lt;title&gt;</span> + meta description toward the query intent; weak avg position (${esc(s.gsc.avgPosition ?? '—')}) says they also need depth + internal links to climb.`);
      }
      // earned vs paid — organic engagement strength worth doubling down on
      if (s.ga4?.organicSearchEngagementRate != null && s.ga4.organicSearchEngagementRate >= 0.5 && (s.ga4.organicSearchSessions || 0) > 0) {
        push('P1', tag,
          `Organic search engages at ${pct(s.ga4.organicSearchEngagementRate)} — your best channel`,
          `Organic visitors are far more engaged than paid/direct. Grow this channel: publish more answer-first content on the queries already ranking, and interlink it. Earned traffic compounds where paid stops the moment spend stops.`);
      }
      // no key events configured/firing — the funnel can't measure conversion
      if (s.ga4 && (s.ga4.keyEvents ?? s.ga4.conversions ?? 0) === 0 && (s.ga4.sessions || 0) >= 100) {
        push('P1', tag,
          `${num(s.ga4.sessions)} sessions but 0 key events tracked`,
          `Traffic is arriving with no conversion measurement. Wire a key event (waitlist signup, lead form, purchase) in GA4 so growth can be tied to outcomes — otherwise sessions are a vanity number.`);
      }
      // 5xx on the edge — reliability gate on growth
      const w = s.cf?.last24h;
      if (w && (w.serverErrors || 0) > 0) {
        push('P0', tag,
          `${num(w.serverErrors)} server error(s) (5xx) on the edge`,
          `Real users (or crawlers) hit a broken response. Open the 5xx paths on the Cloudflare card and fix the origin — server errors suppress both rankings and conversions.`);
      }
    }
    // cross-property: field CWV still absent everywhere (leading indicator note)
    const anyFieldCwv = siteData.some((s) => s.cf?.fieldCWV?.available);
    if (!anyFieldCwv) {
      push('P2', 'all properties',
        'No field Core Web Vitals yet (CrUX below threshold)',
        'Real-user performance data appears only once traffic crosses Google\'s volume bar. Not a defect — watch for the first CrUX record as a leading indicator that a property is gaining real audience.');
    }
    // priority order for display
    const rank = { P0: 0, P1: 1, P2: 2 };
    out.sort((a, b) => rank[a.priority] - rank[b.priority]);
    return out;
  }

  function insightsPanel() {
    const insights = growthInsights();
    const prClass = { P0: 'red', P1: 'amber', P2: 'grey' };
    const rows = insights.length
      ? insights
          .map(
            (i) => `<li class="insight insight-${i.priority}">
        <div class="insight-top"><span class="pill ${prClass[i.priority]}">${i.priority}</span><span class="insight-title">${i.title}</span><span class="insight-scope">${esc(i.scope)}</span></div>
        <p class="insight-action">${i.action}</p>
      </li>`,
          )
          .join('')
      : '<li class="insight"><p class="muted">No actionable issues detected from the current snapshots — keep shipping content and re-run the capture to refresh.</p></li>';
    return `<section class="insights">
      <header class="insights-head">
        <h2>Growth insights</h2>
        <p class="sub">Actionable, data-derived next steps to grow the Orionfold properties · ${insights.length} item${insights.length === 1 ? '' : 's'}</p>
      </header>
      <ol class="insight-list">${rows}</ol>
    </section>`;
  }

  // ── one dense masonry; orionfold is the page, ainative is a tagged minority ──
  // Most cards are orionfold (this site) → they flow naturally as plain panels.
  // The few ainative cards are TAGGED + tinted (.ainative carries the chip + the
  // distinct background in CSS) and PINNED top-right (.pin-tr → grid cols 7-12,
  // grid-row:1) so the secondary site always sits in the top-right corner. The
  // packer then flows orionfold's panels around the pinned block via dense flow.
  const leftSite = siteList[0]; // orionfold (default site is always first)
  const rightSite = siteList[1]; // ainative (if present)

  // tag + tint + pin a panel as belonging to the secondary (ainative) site.
  const asAinative = (html, domain) =>
    html.replace(
      '<section class="panel',
      `<section data-site="ainative" class="panel ainative pin-tr`,
    ).replace(
      /<h2>(.*?)<\/h2>/,
      `<h2>$1<span class="site-tag">${esc(domain)}</span></h2>`,
    );

  // orionfold (this site): all data + infra panels flow as ordinary cards.
  // Search (GSC) + Traffic (GA4) are split — earned discovery vs traffic, never
  // conflated — and sit adjacent so the two engines read together.
  const mainParts = [
    lighthousePanel(leftSite),
    cloudflarePanel(leftSite),
    fieldCwvPanel(leftSite),
    seoPanel(leftSite),
    ga4Panel(leftSite),
    uptimePanel(),
    commercePanel(),
    ciPanel(),
  ];

  // ainative (secondary): tagged + tinted + pinned top-right.
  if (rightSite) {
    const domain = latest('cloudflare', rightSite)?.data.domain || rightSite;
    const aPanels = [
      cloudflarePanel(rightSite),
      seoPanel(rightSite),
      ga4Panel(rightSite),
      lighthousePanel(rightSite),
      fieldCwvPanel(rightSite),
    ].map((p) => asAinative(p, domain));
    // pinned panels render first so grid-auto-flow:dense places them top-right.
    mainParts.unshift(...aPanels);
  }

  return {
    metaHtml: `generated <b>${esc(genTs)}</b> utc<br>latest data <b>${esc(newestDate || 'none')}</b>`,
    freshnessHtml,
    // barHtml = combined cross-property KPI bar; insightsHtml = the growth
    // narrative. Both mount above the masonry grid (shell + static build).
    barHtml: analyticsBar(),
    insightsHtml: insightsPanel(),
    // mainHtml = the whole masonry: orionfold panels flow naturally; the tagged
    // ainative panels pin to the top-right. sideHtml kept empty for back-compat
    // with the shell's hidden #col-side mount.
    mainHtml: mainParts.join('\n      '),
    sideHtml: '',
  };
}
