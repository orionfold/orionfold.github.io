/* Relay static demo — demo-mode bootstrap (classic, render-blocking).
 *
 * Injected as `<script src=".../relay-demo/boot.js">` into the <head> of every
 * captured Relay route, BEFORE the /_next chunks. Being a classic blocking script
 * it runs during parse, so window.fetch / window.EventSource are shimmed before any
 * client island hydrates and self-fetches. Sets window.__RELAY_DEMO__ = true.
 *
 * Option C: the surrounding HTML is the REAL Relay post-hydration DOM (captured from a
 * seeded dev server). This file shims ONLY the network layer so that captured UI stays
 * fully interactive offline — the "Support Row Triage" workflow run drives a real state
 * machine (execute → running → waiting → Inbox approval → approve → completed → ledger).
 *
 * Ported from the Orionfold Arena demo shim (proven ReadableStream SSE + DemoES lifecycle).
 * The pure route resolver (resolveFetch) + state factory (createDemoState) are exposed on
 * window.__RELAY_DEMO_INTERNALS__ so scripts/boot-shim.test.mjs can unit-test them.
 */
(function () {
  'use strict';

  // ---- theme (mirrors src/lib/theme.ts) -----------------------------------
  // The captured routes are frozen at data-theme="light". This block replicates
  // real Relay's applyTheme()/readClientTheme() so the demo self-themes from its
  // own bundled CSS (118 `.dark` selectors + the html.dark critical-CSS are
  // already in the capture). No re-capture, no image swap. See
  // change-request-theme-switcher.md and [[demo-self-themes-from-bundled-css]].
  var THEME_COOKIE = 'relay-theme';
  var LEGACY_THEME_COOKIE = 'ainative-theme';
  // Operator-set: the published demo defaults to dark (matches the dark-canon
  // /relay/ marketing page). Real Relay's DEFAULT_THEME is light; this default
  // applies ONLY when the visitor has no saved relay-theme.
  var DEMO_DEFAULT_THEME = 'dark';

  function isTheme(v) { return v === 'light' || v === 'dark'; }

  // Resolve the visitor's theme: localStorage then cookie (current key, then the
  // legacy ainative-theme key), falling back to the demo default.
  function readDemoTheme() {
    if (typeof document === 'undefined') return DEMO_DEFAULT_THEME;
    for (var i = 0; i < 2; i++) {
      var key = i === 0 ? THEME_COOKIE : LEGACY_THEME_COOKIE;
      try {
        var stored = localStorage.getItem(key);
        if (isTheme(stored)) return stored;
      } catch (e) { /* storage may be unavailable */ }
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + key + '=([^;]+)'));
      if (m && isTheme(m[1])) return m[1];
    }
    return DEMO_DEFAULT_THEME;
  }

  // Apply a theme everywhere real Relay does: the `dark` class, data-theme,
  // color-scheme, the root background-color (exact oklch values from theme.ts),
  // plus localStorage + cookie so a route change or re-visit keeps it.
  function applyDemoTheme(theme) {
    if (typeof document === 'undefined') return;
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.style.backgroundColor =
      theme === 'dark' ? 'oklch(0.14 0.02 250)' : 'oklch(0.985 0.004 250)';
    try { localStorage.setItem(THEME_COOKIE, theme); } catch (e) { /* ignore */ }
    document.cookie = THEME_COOKIE + '=' + theme + ';path=/;max-age=31536000;SameSite=Lax';
  }

  // ---- pure, testable core (no window/DOM refs) ---------------------------

  // Fresh mutable demo state. workflows/tasks are the live arrays the shim mutates;
  // approvals + logEvents drive the two SSE streams. Fields stay FLAT (shared across lanes)
  // so the Support Triage lane's shape is unchanged; per-lane progress is tracked in `lanes`.
  function createDemoState(fixtures) {
    var fx = fixtures || {};
    // Prefer the keyed machines map (schema v2); fall back to the single `machine` alias.
    var machines = fx.machines || (fx.machine ? { support_triage: fx.machine } : {});
    var wp = machines.web_publish;
    return {
      fixtures: fx,
      machines: machines,
      workflows: (fx.workflows || []).map(function (w) { return Object.assign({}, w); }),
      tasks: (fx.tasks || []).map(function (t) { return Object.assign({}, t); }),
      usageLedger: (fx.usageLedger || []).slice(),
      approvals: [],       // PendingApprovalPayload[] currently pending (drives approvals stream)
      logEvents: [],       // agentLogs rows emitted so far (drives logs stream)
      // Web Publish lane: the live deployments array the panel polls (GET /deployments).
      deployments: (wp && wp.initialDeployments ? wp.initialDeployments.slice() : []),
      // Row Trigger lane: the live rows array the table view reads (seed + any added row).
      rows: (function () {
        var rt = machines.row_trigger;
        return rt && rt.seededRows ? rt.seededRows.slice() : [];
      })(),
      // License/Pack lane: whether a license has been activated (community → licensed flip).
      licensed: false,
      // Per-lane progress flags. Support Triage keeps top-level ran/completed for back-compat
      // (the existing unit tests read state.completed); the other lanes use the `lanes` bag.
      ran: false,          // Support Triage: has the run been kicked off
      completed: false,    // Support Triage: has it been approved/completed
      lanes: {
        web_publish: { previewed: false, published: false },
        row_trigger: { fired: false },
        license_pack: { gated: false, licensed: false }
      }
    };
  }

  function pathOf(url) {
    try {
      var origin = (typeof location !== 'undefined' && location.origin) || 'http://demo.local';
      return (new URL(url, origin).pathname || '/').replace(/\/+$/, '') || '/';
    } catch (e) { return String(url).split('?')[0]; }
  }

  function queryOf(url, name) {
    try {
      var origin = (typeof location !== 'undefined' && location.origin) || 'http://demo.local';
      return new URL(url, origin).searchParams.get(name);
    } catch (e) { return null; }
  }

  // Emit the first N monitor events (as agentLogs rows) into state.logEvents.
  function pushLogsUpTo(state, machine, n) {
    var events = machine.monitorEvents || [];
    for (var i = 0; i < Math.min(n, events.length); i++) {
      var ev = events[i];
      var already = state.logEvents.some(function (l) { return l.id === ev.id; });
      if (!already) {
        // strip the cadence-only `t` field; emit the agentLogs wire row
        state.logEvents.push({ id: ev.id, taskId: ev.taskId, agentType: ev.agentType, event: ev.event, payload: ev.payload, timestamp: ev.timestamp });
      }
    }
  }

  // The core: given a request, return a plain descriptor the caller turns into a Response.
  // { kind:'json', body, status, emit } | { kind:'passthrough' }
  // Side effects (state mutation) happen here; the caller re-emits the named stream
  // (`emit`) and schedules time-driven transitions.
  function resolveFetch(url, method, body, state) {
    var path = pathOf(url);
    var m = (method || 'GET').toUpperCase();
    var fx = state.fixtures || {};
    var machine = fx.machine || {};

    function json(b, status, emit) { return { kind: 'json', body: b == null ? {} : b, status: status || 200, emit: emit || null }; }

    // ---- RSC client-navigation requests (?_rsc=…) ----
    // Next fires these on in-app router navigation (GET <route>?_rsc=hash, RSC:1 header).
    // Statically they would 404 to HTML. Return an empty 200 so navigation degrades to a
    // benign no-op rather than throwing; each demo route is its own captured full page.
    if (/[?&]_rsc=/.test(String(url))) {
      return { kind: 'json', body: {}, status: 200, emit: null, contentType: 'text/x-component' };
    }

    // ---- A. Global noise-neutralizers (fire on every page) ----
    // unread badge count
    if (path === '/api/notifications' && queryOf(url, 'countOnly')) {
      return json({ count: state.approvals.length });
    }
    // pending-approvals poll (GET — no POST route exists). Returns the live array.
    if (path === '/api/notifications/pending-approvals') {
      return json(state.approvals);
    }
    // instance identity — reflects the License lane's community → licensed flip. The demo
    // seed is unlicensed (Community); state.licensed goes true after the License lane activates.
    // GET /api/instance/identity has a discriminated licenseTag union (kind:"community" has no
    // other fields); the License lane fixture carries both variants.
    var lic = (state.machines || {}).license_pack;
    if (path === '/api/instance/identity') {
      var tag = state.licensed
        ? (lic ? lic.identityLicensed : { kind: 'licensed', label: 'Licensed' })
        : (lic ? lic.identityCommunity : { kind: 'community' });
      return json({ version: null, activeModel: null, licenseTag: tag });
    }
    // GET /api/license — the stored-license list; empty until the License lane activates.
    if (path === '/api/license' && m === 'GET') {
      return json({ licenses: state.licensed && lic ? [lic.licenseInfo] : [] });
    }
    // other instance/* stubs so gated islands stay on happy states
    if (path === '/api/instance' || /^\/api\/instance\//.test(path)) {
      return json({ status: 'active', licensed: state.licensed, demo: true });
    }
    if (/^\/api\/settings/.test(path)) {
      return json({ demo: true });
    }

    // ---- B. Slice data GETs (read-only, off the derived seed) ----
    if (path === '/api/workflows' && m === 'GET') {
      return json(state.workflows);
    }
    if (path === '/api/tasks' && m === 'GET') {
      return json(state.tasks);
    }

    // ---- C. Workflow Run state machine ----
    // POST /api/workflows/<id>/execute — kick off the run.
    var execMatch = path.match(/^\/api\/workflows\/([^/]+)\/execute$/);
    if (execMatch && m === 'POST') {
      var wfId = execMatch[1];
      var wf = state.workflows.find(function (w) { return w.id === wfId; });
      if (wf && wfId === machine.workflowId) {
        // running: liveTaskCount>0 → getWorkflowExecutionInfo → "running" + Stop button
        wf.status = 'active';
        wf.liveTaskCount = 1;
        wf.taskCount = (wf.taskCount || 0) + 1;
        state.ran = true;
        // the child task is already in the seeded tasks list — flip it to running.
        // (if a future machine spawns a brand-new task, add it here instead.)
        if (machine.childTask) {
          var existing = state.tasks.find(function (t) { return t.id === machine.childTask.id; });
          if (existing) existing.status = 'running';
          else state.tasks.unshift(Object.assign({}, machine.childTask, { status: 'running' }));
        }
        // first monitor events (trigger fired, classified)
        pushLogsUpTo(state, machine, 1);
      }
      return json({ status: 'started', workflowId: wfId }, 202, 'logs');
    }

    // POST /api/workflows/<id>/stop
    var stopMatch = path.match(/^\/api\/workflows\/([^/]+)\/stop$/);
    if (stopMatch && m === 'POST') {
      var swf = state.workflows.find(function (w) { return w.id === stopMatch[1]; });
      if (swf) { swf.status = 'failed'; swf.liveTaskCount = 0; }
      return json({ status: 'stopped', workflowId: stopMatch[1], cancelledTasks: 0 });
    }

    // POST /api/tasks/<id>/respond — the Inbox Approve action.
    var respondMatch = path.match(/^\/api\/tasks\/([^/]+)\/respond$/);
    if (respondMatch && m === 'POST') {
      var behavior = (body && body.behavior) || 'allow';
      if (behavior === 'allow' && !state.completed) {
        state.completed = true;
        // workflow → completed
        var cwf = state.workflows.find(function (w) { return w.id === machine.workflowId; });
        if (cwf) { cwf.status = 'completed'; cwf.liveTaskCount = 0; }
        // child task → completed
        var ct = state.tasks.find(function (t) { return machine.childTask && t.id === machine.childTask.id; });
        if (ct) ct.status = 'completed';
        // clear the approval (removes it from the stream + badge)
        state.approvals = state.approvals.filter(function (a) {
          return a.notificationId !== (machine.approval && machine.approval.notificationId);
        });
        // push the Cost & Usage ledger row
        if (machine.ledgerRow && !state.usageLedger.some(function (u) { return u.id === machine.ledgerRow.id; })) {
          state.usageLedger.push(machine.ledgerRow);
        }
        // final monitor events (approved, completed)
        pushLogsUpTo(state, machine, (machine.monitorEvents || []).length);
      }
      return json({ success: true }, 200, 'approvals');
    }

    // ---- D. Web Publish state machine (poll-driven, NO SSE) ----
    // The installed app id is a UUID unknown at derive time, so match by path SUFFIX
    // (/preview, /publish, /deployments, /site-settings) rather than exact app id.
    var wp = (state.machines || {}).web_publish;
    if (wp) {
      // GET /api/apps/<id>/deployments — the live history the panel polls (grows on publish).
      if (/^\/api\/apps\/[^/]+\/deployments$/.test(path) && m === 'GET') {
        return json(state.deployments.slice());
      }
      // POST /api/apps/<id>/preview — build a preview (201 + artifact descriptor).
      if (/^\/api\/apps\/[^/]+\/preview$/.test(path) && m === 'POST') {
        state.lanes.web_publish.previewed = true;
        return json(wp.preview.result, 201);
      }
      // GET /api/apps/<id>/preview?artifactId=… — status poll for an existing preview.
      if (/^\/api\/apps\/[^/]+\/preview$/.test(path) && m === 'GET') {
        return json(wp.preview.result);
      }
      // POST /api/apps/<id>/publish — 202 accepted; push the pending deployment row.
      // Caller schedules advancePublish() to walk pending → publishing → success.
      if (/^\/api\/apps\/[^/]+\/publish$/.test(path) && m === 'POST') {
        if (!state.deployments.some(function (d) { return d.id === wp.newDeployment.id; })) {
          state.deployments.unshift(Object.assign({}, wp.newDeployment));
        }
        state.lanes.web_publish.published = true;
        return { kind: 'json', body: { deployment: Object.assign({}, wp.newDeployment) }, status: 202, emit: 'publish' };
      }
      // GET/PUT /api/apps/<id>/site-settings — controls echo (theme/density/hero/accent/CTA).
      if (/^\/api\/apps\/[^/]+\/site-settings$/.test(path)) {
        return json({ settings: wp.generatorConfig, defaults: wp.generatorConfig, templates: [] });
      }
    }

    // ---- E. Row Trigger state machine (poll-free; ticker + coach only, NO SSE) ----
    // GET /api/tables/<id>       → {...table, columns:[...]}
    // GET /api/tables/<id>/rows  → bare array of row records (grows when the demo adds a row)
    // POST /api/tables/<id>/rows → 201 {ids,skipped}; fires the row_added trigger (async).
    var rt = (state.machines || {}).row_trigger;
    if (rt) {
      var rowsMatch = path.match(/^\/api\/tables\/([^/]+)\/rows$/);
      if (rowsMatch && m === 'GET') {
        return json(state.rows.slice());
      }
      if (rowsMatch && m === 'POST') {
        // append the demo's new row (idempotent) — the table view re-GETs and sees it
        if (!state.rows.some(function (r) { return r.id === rt.newRow.id; })) {
          state.rows.push(Object.assign({}, rt.newRow));
        }
        state.lanes.row_trigger.fired = true;
        // the trigger fires the shared triage workflow (real Path B: config.workflowId →
        // POST /api/workflows/<id>/execute). We surface it via the ticker (emit:'row_trigger').
        return { kind: 'json', body: rt.addRowsResult, status: 201, emit: 'row_trigger' };
      }
      // GET a single table record (render the table view header + columns)
      var tableMatch = path.match(/^\/api\/tables\/([^/]+)$/);
      if (tableMatch && m === 'GET' && tableMatch[1] === rt.tableId) {
        return json({ id: rt.tableId, name: rt.tableName, projectId: rt.projectId, columns: rt.columns });
      }
    }

    // ---- F. License / Pack state machine (gate → activate → success; NO SSE) ----
    // POST /api/packs/install {id} → 402 license_required while unlicensed; 200 after activate.
    // POST /api/license {envelope} → 200 StoredLicenseInfo; flips state.licensed → true.
    var lp = (state.machines || {}).license_pack;
    if (lp) {
      if ((path === '/api/packs/install' || path === '/api/packs/update') && m === 'POST') {
        if (!state.licensed) {
          state.lanes.license_pack.gated = true;
          return { kind: 'json', body: lp.gate.body, status: lp.gate.status, emit: 'license_gate' };
        }
        // licensed → the install/update succeeds
        return json(lp.installResult, 200);
      }
      // POST /api/license — activation. The demo does NOT verify a real Ed25519 signature;
      // it shims the success response and flips the lane to licensed.
      if (path === '/api/license' && m === 'POST') {
        state.licensed = true;
        state.lanes.license_pack.licensed = true;
        return { kind: 'json', body: lp.licenseInfo, status: 200, emit: 'license_activated' };
      }
    }

    // ---- G. Catch-alls ----
    if (/^\/api\//.test(path)) {
      return json(m === 'GET' ? {} : { ok: true, demo: true });
    }
    // static assets, _next chunks, fixtures.json → real network
    return { kind: 'passthrough' };
  }

  // Advance the run to the "waiting for approval" state: push the approval + the
  // approval-requested monitor event. Called by the caller ~2s after execute so the UI
  // shows running → waiting. Kept out of resolveFetch because it is time-driven.
  function advanceToWaiting(state) {
    var machine = (state.fixtures || {}).machine || {};
    var wf = state.workflows.find(function (w) { return w.id === machine.workflowId; });
    if (wf) {
      // waiting: active + liveTaskCount 0 + a waiting_approval step → "waiting" + Run button
      wf.liveTaskCount = 0;
      try {
        var def = JSON.parse(wf.definition || '{}');
        def._state = { stepStates: [{ status: 'waiting_approval' }] };
        wf.definition = JSON.stringify(def);
      } catch (e) {}
    }
    var ct = state.tasks.find(function (t) { return machine.childTask && t.id === machine.childTask.id; });
    if (ct) ct.status = 'waiting_for_human';
    if (machine.approval && !state.approvals.some(function (a) { return a.notificationId === machine.approval.notificationId; })) {
      state.approvals.push(machine.approval);
    }
    pushLogsUpTo(state, machine, 3); // trigger, classified, approval_requested
  }

  // Walk the just-pushed deployment row pending → publishing → success (poll-driven; the
  // panel re-GETs /deployments and sees the new status). `phase` selects the target status.
  // Called by the caller on a timer after publish; on success it also pushes the ledger row.
  function advancePublish(state, phase) {
    var wp = (state.machines || {}).web_publish;
    if (!wp) return;
    var row = state.deployments.find(function (d) { return d.id === wp.newDeployment.id; });
    if (!row) return;
    if (phase === 'publishing') {
      row.status = 'publishing';
    } else if (phase === 'success') {
      row.status = 'success';
      row.finishedAt = wp.newDeployment.finishedAt || row.startedAt;
      row.url = wp.newDeployment.url;
      row.finalUrl = wp.newDeployment.finalUrl;
      // push the Cost & Usage ledger row for the publish run (idempotent)
      if (wp.ledgerRow && !state.usageLedger.some(function (u) { return u.id === wp.ledgerRow.id; })) {
        state.usageLedger.push(wp.ledgerRow);
      }
    }
  }

  // Expose the pure core for unit tests (node:test loads this file in a vm with a stub global).
  var internals = { createDemoState: createDemoState, resolveFetch: resolveFetch, advanceToWaiting: advanceToWaiting, advancePublish: advancePublish, pathOf: pathOf, pushLogsUpTo: pushLogsUpTo, readDemoTheme: readDemoTheme, applyDemoTheme: applyDemoTheme, DEMO_DEFAULT_THEME: DEMO_DEFAULT_THEME };
  if (typeof globalThis !== 'undefined' && globalThis.__RELAY_DEMO_EXPORT_INTERNALS__) {
    globalThis.__RELAY_DEMO_INTERNALS_RESULT__ = internals;
    return; // test harness: skip browser wiring
  }
  if (typeof window !== 'undefined') window.__RELAY_DEMO_INTERNALS__ = internals;

  // Apply the resolved theme now (this is a render-blocking classic script in
  // <head>, before the /_next chunks), so a dark-default visitor never sees a
  // light flash. Runs only in a real browser — the test harness returned above.
  applyDemoTheme(readDemoTheme());

  // ---- browser wiring (skipped under the vm test harness) -----------------
  if (typeof window === 'undefined' || window.__RELAY_DEMO_BOOTED__) return;
  window.__RELAY_DEMO_BOOTED__ = true;
  window.__RELAY_DEMO__ = true;

  var self = document.currentScript && document.currentScript.src;
  var FIXTURE_URL = self ? self.replace(/boot\.js(\?.*)?$/, 'fixtures.json') : './fixtures.json';

  var state = createDemoState({});
  var approvalSubs = [];  // DemoES for /api/notifications/pending-approvals/stream
  var logSubs = [];       // DemoES for /api/logs/stream
  var WAIT_MS = 2000;     // running → waiting delay

  function emitApprovals() {
    var snap = JSON.stringify(state.approvals);
    approvalSubs.forEach(function (es) { try { es._emit('message', snap); } catch (e) {} });
  }
  function emitLogs() {
    // logs stream emits ONE object per frame; replay only rows not yet sent per subscriber
    logSubs.forEach(function (es) {
      state.logEvents.forEach(function (row) {
        if (!es._sent[row.id]) { es._sent[row.id] = true; try { es._emit('message', JSON.stringify(row)); } catch (e) {} }
      });
    });
  }

  function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj == null ? {} : obj), {
      status: status || 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    init = init || {};
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = (init.method || (input && input.method) || 'GET').toUpperCase();
    var body = {};
    try { body = init.body ? JSON.parse(init.body) : {}; } catch (e) { body = {}; }

    var r = resolveFetch(url, method, body, state);
    if (r.kind === 'passthrough') {
      return realFetch ? realFetch(input, init) : Promise.reject(new Error('no fetch'));
    }

    // Post-resolve time-driven effect for execute: after WAIT_MS, advance to waiting
    // (push approval + approval-requested log) and re-emit both streams.
    if (/\/api\/workflows\/[^/]+\/execute$/.test(pathOf(url)) && method === 'POST' && state.ran && !state._waitScheduled) {
      state._waitScheduled = true;
      setTimeout(function () { advanceToWaiting(state); emitApprovals(); emitLogs(); refreshCoach(); }, WAIT_MS);
    }
    // Post-resolve time-driven effect for publish (poll-driven, NO SSE): the pending
    // deployment row walks pending → publishing → success, exactly as the real background
    // runDeployment + the panel's /deployments poll would surface. The shim OWNS the state
    // walk (so any caller — including the verify gate — sees it); drivePublish owns the DOM.
    if (r.emit === 'publish' && !state._publishScheduled) {
      state._publishScheduled = true;
      setTimeout(function () { advancePublish(state, 'publishing'); }, 900);
      setTimeout(function () { advancePublish(state, 'success'); refreshCoach(); }, WAIT_MS);
    }
    if (r.emit === 'logs') emitLogs();
    if (r.emit === 'approvals') { emitApprovals(); emitLogs(); refreshCoach(); }
    // Row Trigger + License lanes are poll-free (ticker + coach only): the shim already
    // mutated lane state in resolveFetch; just re-render the coach so it advances a step.
    if (r.emit === 'row_trigger' || r.emit === 'license_gate' || r.emit === 'license_activated') {
      refreshCoach();
    }

    if (r.contentType) {
      return Promise.resolve(new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body || {}), {
        status: r.status || 200, headers: { 'Content-Type': r.contentType }
      }));
    }
    return Promise.resolve(jsonResponse(r.body, r.status));
  };

  // ---- EventSource shim ----------------------------------------------------
  var RealES = window.EventSource;
  function DemoES(url) {
    var u = String(url);
    var isApprovals = /\/api\/notifications\/pending-approvals\/stream/.test(u);
    var isLogs = /\/api\/logs\/stream/.test(u);
    if (!isApprovals && !isLogs) { if (RealES) return new RealES(url); }
    this.url = u; this.readyState = 1; this._l = {}; this._sent = {};
    var es = this;
    if (isApprovals) {
      approvalSubs.push(es);
      setTimeout(function () { try { es._emit('message', JSON.stringify(state.approvals)); } catch (e) {} }, 0);
      this._onclose = function () { approvalSubs = approvalSubs.filter(function (x) { return x !== es; }); };
    } else {
      logSubs.push(es);
      setTimeout(function () {
        state.logEvents.forEach(function (row) { es._sent[row.id] = true; try { es._emit('message', JSON.stringify(row)); } catch (e) {} });
      }, 0);
      this._onclose = function () { logSubs = logSubs.filter(function (x) { return x !== es; }); };
    }
  }
  DemoES.prototype.addEventListener = function (t, cb) { (this._l[t] = this._l[t] || []).push(cb); };
  DemoES.prototype.removeEventListener = function (t, cb) { this._l[t] = (this._l[t] || []).filter(function (f) { return f !== cb; }); };
  DemoES.prototype._emit = function (t, data) {
    var ev = { data: data };
    (this._l[t] || []).forEach(function (cb) { try { cb(ev); } catch (e) {} });
    if (t === 'message' && typeof this.onmessage === 'function') this.onmessage(ev);
  };
  DemoES.prototype.close = function () { this.readyState = 2; if (this._onclose) this._onclose(); };
  DemoES.CONNECTING = 0; DemoES.OPEN = 1; DemoES.CLOSED = 2;
  window.EventSource = DemoES;

  // ---- DEMO ribbon ---------------------------------------------------------
  function ribbon() {
    if (document.getElementById('relay-demo-ribbon')) return;
    var s = document.createElement('style');
    s.textContent = '#relay-demo-ribbon{position:fixed;bottom:0;left:0;right:0;z-index:2147483000;' +
      'font:500 12px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;background:#0d2229;color:#e7f2ef;' +
      'padding:8px 16px;text-align:center;box-shadow:0 -2px 14px rgba(0,0,0,.4)}' +
      '#relay-demo-ribbon strong{letter-spacing:.14em;margin-right:.5em}' +
      '#relay-demo-ribbon code{background:rgba(255,255,255,.14);padding:1px 6px;border-radius:4px}' +
      '#relay-demo-ribbon a{color:#8fe3d0;text-decoration:underline}';
    var el = document.createElement('div');
    el.id = 'relay-demo-ribbon'; el.setAttribute('role', 'note');
    el.innerHTML = '<strong>DEMO</strong> Synthetic data, static build — nothing here touches a real workspace. ' +
      'Install real Relay: <code>npx orionfold-relay</code>';
    document.head.appendChild(s);
    (document.body || document.documentElement).appendChild(el);
  }

  // ---- buy strip (live-gated per the publish contract) ---------------------
  function buyStrip() {
    var buy = (state.fixtures && state.fixtures.buy) || { live: false };
    if (document.getElementById('relay-demo-buy')) return;
    var el = document.createElement('div');
    el.id = 'relay-demo-buy';
    el.setAttribute('role', 'complementary');
    el.style.cssText = 'position:fixed;right:16px;bottom:44px;z-index:2147483000;max-width:320px;' +
      'background:#12343b;color:#e7f2ef;border:1px solid #1d4a53;border-radius:10px;padding:12px 14px;' +
      'font:500 13px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35)';
    if (buy.live && buy.url) {
      el.innerHTML = '<div style="margin-bottom:6px">Ready to run this for real?</div>' +
        '<a href="' + String(buy.url).replace(/"/g, '') + '" style="color:#8fe3d0;font-weight:600">Get Relay &#8599;</a>';
    } else {
      el.innerHTML = '<div style="margin-bottom:4px;font-weight:600">Relay opens at launch</div>' +
        '<div style="opacity:.85">' + (buy.note || 'Demo — buy opens at launch.') + '</div>';
    }
    (document.body || document.documentElement).appendChild(el);
  }

  // ---- theme switcher (light/dark toggle in the demo chrome) ---------------
  // A boot.js-owned control that flips the whole demo via applyDemoTheme(). It
  // operates on <html>, so every captured route re-themes consistently. The
  // button label + pressed state seed from the current resolved theme.
  function themeSwitcher() {
    if (document.getElementById('relay-demo-theme')) return;
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var btn = document.createElement('button');
    btn.id = 'relay-demo-theme';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle light or dark theme');
    // Sits above the ribbon, left of the buy strip; matches the dark chrome palette.
    btn.style.cssText = 'position:fixed;right:16px;bottom:calc(44px + 96px);z-index:2147483001;' +
      'width:40px;height:40px;border-radius:999px;border:1px solid #1d4a53;background:#12343b;' +
      'color:#e7f2ef;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.35);' +
      'display:flex;align-items:center;justify-content:center';
    function paint(theme) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.title = theme === 'dark' ? 'Dark theme (click for light)' : 'Light theme (click for dark)';
      btn.textContent = theme === 'dark' ? '☽' : '☀'; // moon / sun
    }
    paint(current);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyDemoTheme(next);
      paint(next);
    });
    (document.body || document.documentElement).appendChild(btn);
  }

  // ---- self-guiding coach: glow-guide + explainer callout ------------------
  // Dense product screens overwhelm a first-time visitor. The coach cuts through: a
  // pulsing "glow-guide" ring on the ONE next action, plus a floating explainer callout
  // that narrates what this screen is and what to do. Both are boot.js-owned so they work
  // without React hydration.
  function coachStyle() {
    if (document.getElementById('relay-demo-coach-style')) return;
    var s = document.createElement('style');
    s.id = 'relay-demo-coach-style';
    s.textContent =
      '@keyframes relay-coach-ping{0%{box-shadow:0 0 0 0 rgba(20,128,74,.55),0 0 0 2px rgba(20,128,74,.95)}' +
      '70%{box-shadow:0 0 0 14px rgba(20,128,74,0),0 0 0 2px rgba(20,128,74,.95)}' +
      '100%{box-shadow:0 0 0 0 rgba(20,128,74,0),0 0 0 2px rgba(20,128,74,.95)}}' +
      '.relay-demo-coach{animation:relay-coach-ping 1.5s ease-out infinite;border-radius:8px;position:relative;z-index:2}' +
      '#relay-demo-callout{position:fixed;z-index:2147482999;max-width:300px;background:#0d2229;color:#e7f2ef;' +
      'border:1px solid #1d4a53;border-radius:10px;padding:12px 30px 12px 14px;' + // pad-right for ✕
      'font:500 13px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 14px 44px rgba(0,0,0,.42);' +
      'transition:top .25s,left .25s,opacity .25s}' +
      '#relay-demo-callout .rc-dismiss{position:absolute;top:6px;right:6px;width:20px;height:20px;padding:0;' +
      'border:0;border-radius:6px;background:transparent;color:#8fe3d0;font-size:16px;line-height:20px;' +
      'cursor:pointer;opacity:.7;transition:opacity .15s,background .15s}' +
      '#relay-demo-callout .rc-dismiss:hover{opacity:1;background:rgba(143,227,208,.14)}' +
      '#relay-demo-callout .rc-step{font:600 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8fe3d0;margin-bottom:5px}' +
      '#relay-demo-callout .rc-title{font-weight:600;margin-bottom:3px}' +
      '#relay-demo-callout .rc-body{opacity:.9}' +
      '@keyframes relay-demo-rowin{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:translateY(0)}}' +
      '@media (prefers-reduced-motion:reduce){.relay-demo-coach{animation:none;outline:3px solid rgba(20,128,74,.95);outline-offset:2px}#relay-demo-callout{transition:none}tr[data-relay-demo-row]{animation:none}}';
    document.head.appendChild(s);
  }

  // Resolve the LANE whose coach owns the current route. Support Triage owns
  // /workflows,/inbox,/monitor; Web Publish owns /apps/*. Returns { machine, pageKey }.
  function activeLane() {
    var path = (location.pathname || '').replace(/\/+$/, '');
    var machines = state.machines || {};
    // Web Publish claims any /apps/* route (the installed app instance).
    if (/\/apps(\/|$)/.test(path) && machines.web_publish) {
      return { machine: machines.web_publish, key: 'web_publish', pageKey: 'apps' };
    }
    // Row Trigger claims any /tables/* route (the Support Queue table instance).
    if (/\/tables(\/|$)/.test(path) && machines.row_trigger) {
      return { machine: machines.row_trigger, key: 'row_trigger', pageKey: 'tables' };
    }
    // License/Pack claims the /packs gallery.
    if (/\/packs(\/|$)/.test(path) && machines.license_pack) {
      return { machine: machines.license_pack, key: 'license_pack', pageKey: 'packs' };
    }
    // Support Triage claims its three product surfaces.
    var support = machines.support_triage;
    if (support) {
      var seg = (path.split('/').pop() || '').toLowerCase();
      if (seg === 'workflows' || seg === 'inbox' || seg === 'monitor') {
        return { machine: support, key: 'support_triage', pageKey: seg };
      }
    }
    return null;
  }

  // The per-lane progress STATE string a coach step matches on ("", "previewed", "completed").
  function laneState(key) {
    if (key === 'support_triage') return state.completed ? 'completed' : '';
    if (key === 'web_publish') {
      var wp = state.lanes.web_publish;
      return wp.published ? 'completed' : (wp.previewed ? 'previewed' : '');
    }
    if (key === 'row_trigger') {
      return state.lanes.row_trigger.fired ? 'fired' : '';
    }
    if (key === 'license_pack') {
      var lpn = state.lanes.license_pack;
      return lpn.licensed ? 'licensed' : (lpn.gated ? 'gated' : '');
    }
    return '';
  }

  // Data-driven coach: pick the machine's coach[] row matching {page,state}, resolve its
  // targetLabel to a real button element. Copy lives in fixtures.json, not here.
  function coachScript() {
    var lane = activeLane();
    if (!lane) return null;
    var st = laneState(lane.key);
    var steps = lane.machine.coach || [];
    var chosen = null;
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].page === lane.pageKey && (steps[i].state || '') === st) { chosen = steps[i]; break; }
    }
    if (!chosen) return null;
    return {
      step: chosen.step,
      title: chosen.title,
      body: chosen.body,
      target: chosen.targetLabel ? findButton(chosen.targetLabel) : null
    };
  }
  // Find a button/link whose visible text matches a label (exact for "run", contains otherwise).
  function findButton(label) {
    var want = String(label || '').toLowerCase();
    var btns = [].slice.call(document.querySelectorAll('button, a'));
    for (var i = 0; i < btns.length; i++) {
      var txt = (btns[i].textContent || '').trim().toLowerCase();
      if (want === 'run' ? /^run$/.test(txt) : txt.indexOf(want) >= 0) return btns[i];
    }
    return null;
  }

  var coachEl = null, calloutEl = null;
  // The coach callouts help a first-time visitor once, but must be dismissable and
  // stay dismissed across routes/visits. The visitor clicks the ✕ → we persist a flag
  // and suppress ALL callouts + glow-guides for the rest of the session and future visits.
  var COACH_DISMISS_KEY = 'relay-demo-coach-dismissed';
  function coachDismissed() {
    try { return localStorage.getItem(COACH_DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismissCoach() {
    try { localStorage.setItem(COACH_DISMISS_KEY, '1'); } catch (e) {}
    clearCoach();
    if (calloutEl) { calloutEl.style.opacity = '0'; calloutEl.style.pointerEvents = 'none'; }
  }
  function clearCoach() {
    if (coachEl) { coachEl.classList.remove('relay-demo-coach'); coachEl = null; }
  }
  function ensureCallout() {
    if (calloutEl) return calloutEl;
    calloutEl = document.createElement('div');
    calloutEl.id = 'relay-demo-callout';
    calloutEl.setAttribute('role', 'note');
    // Delegated ✕-dismiss: the callout innerHTML is rewritten each refresh, so wire the
    // handler on the container once (it survives innerHTML swaps).
    calloutEl.addEventListener('click', function (e) {
      var x = e.target && e.target.closest ? e.target.closest('.rc-dismiss') : null;
      if (x) { e.preventDefault(); e.stopPropagation(); dismissCoach(); }
    });
    (document.body || document.documentElement).appendChild(calloutEl);
    return calloutEl;
  }
  function positionCallout(target) {
    var c = ensureCallout();
    if (target && target.getBoundingClientRect) {
      var r = target.getBoundingClientRect();
      var top = Math.min(window.innerHeight - 140, Math.max(12, r.bottom + 10));
      var left = Math.min(window.innerWidth - 316, Math.max(12, r.left));
      c.style.top = top + 'px'; c.style.left = left + 'px';
    } else {
      // no target → park top-right, clear of the bottom-right buy strip + approval popup
      c.style.top = '86px';
      c.style.left = (window.innerWidth - 332) + 'px';
    }
  }
  function refreshCoach() {
    clearCoach();
    if (coachDismissed()) { if (calloutEl) calloutEl.style.opacity = '0'; return; }
    var script = coachScript();
    if (!script) { if (calloutEl) calloutEl.style.opacity = '0'; return; }
    var c = ensureCallout();
    c.style.opacity = '1';
    c.style.pointerEvents = ''; // re-arm in case a prior state cleared it
    c.innerHTML =
      '<button type="button" class="rc-dismiss" aria-label="Dismiss tip">&#215;</button>' +
      '<div class="rc-step">' + esc(script.step) + '</div>' +
      '<div class="rc-title">' + esc(script.title) + '</div>' +
      '<div class="rc-body">' + esc(script.body) + '</div>';
    if (script.target) {
      coachEl = script.target;
      script.target.classList.add('relay-demo-coach');
    }
    positionCallout(script.target);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---- streaming activity ticker (Arena-style replay, no LLM call) ---------
  // The Arena demo fakes "live streaming" by replaying recorded events on their original
  // cadence (tokenize text, emit each unit N ms apart). We do the same for the run's agent
  // log: a floating "Live activity" panel types each monitor event line-by-line, then streams
  // the drafted reply token-by-token — the "watch the agent work" feel, 100% offline, no model.
  var tickerEl = null, tickerLog = null, tickerTimers = [];
  var DRAFT_REPLY =
    "Hi Priya — thanks for flagging the delay on order #BL-1048. I've reviewed our refund " +
    "policy and you're covered: I've approved a full refund, which will land in 3-5 business " +
    "days. Sorry for the hassle, and thanks for your patience.";

  function ensureTicker() {
    if (tickerEl) return tickerEl;
    tickerEl = document.createElement('div');
    tickerEl.id = 'relay-demo-ticker';
    tickerEl.setAttribute('role', 'log');
    tickerEl.setAttribute('aria-live', 'polite');
    tickerEl.style.cssText = 'position:fixed;left:16px;bottom:44px;z-index:2147482998;width:min(380px,calc(100vw - 32px));' +
      'background:#0b1a1f;color:#cfe6df;border:1px solid #1d4a53;border-radius:10px;overflow:hidden;' +
      'font:500 12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 14px 44px rgba(0,0,0,.45)';
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:7px;padding:8px 12px;background:#0d2229;border-bottom:1px solid #1d4a53;' +
      'font:600 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8fe3d0';
    head.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#14804a;box-shadow:0 0 0 0 rgba(20,128,74,.6);animation:relay-coach-ping 1.5s infinite"></span>Live activity';
    tickerLog = document.createElement('div');
    tickerLog.style.cssText = 'padding:10px 12px;max-height:180px;overflow:auto;white-space:pre-wrap';
    tickerEl.appendChild(head); tickerEl.appendChild(tickerLog);
    (document.body || document.documentElement).appendChild(tickerEl);
    return tickerEl;
  }
  function tickerLine(text, cls) {
    ensureTicker();
    var line = document.createElement('div');
    line.style.cssText = 'margin:2px 0' + (cls === 'muted' ? ';opacity:.6' : cls === 'ok' ? ';color:#7fe3c0' : '');
    line.textContent = text;
    tickerLog.appendChild(line);
    tickerLog.scrollTop = tickerLog.scrollHeight;
    return line;
  }
  function clearTicker() {
    tickerTimers.forEach(function (t) { clearTimeout(t); });
    tickerTimers = [];
    if (tickerEl) { try { tickerEl.remove(); } catch (e) {} tickerEl = null; tickerLog = null; }
  }
  // Type a string token-by-token into a line (Arena's tokenize-and-emit trick).
  function streamInto(line, text, unitMs, done) {
    var units = text.match(/\s+|\S+/g) || [];
    var i = 0;
    (function step() {
      if (i >= units.length) { if (done) done(); return; }
      line.textContent += units[i++];
      tickerLog.scrollTop = tickerLog.scrollHeight;
      tickerTimers.push(setTimeout(step, unitMs));
    })();
  }
  // Replay the run's monitor events on their recorded `t` cadence, then stream the reply.
  function streamRun(events) {
    clearTicker(); ensureTicker();
    var evs = (events && events.length) ? events : (((state.fixtures || {}).machine || {}).monitorEvents || []);
    evs.forEach(function (ev, idx) {
      tickerTimers.push(setTimeout(function () {
        var pending = tickerLine('› ' + ev.payload, 'muted');
        // resolve the "…" to a ✓ shortly after, for a working feel
        tickerTimers.push(setTimeout(function () {
          pending.style.opacity = '1';
          pending.textContent = (ev.event === 'completed' ? '✓ ' : '• ') + ev.payload;
          if (ev.event === 'completed') pending.style.color = '#7fe3c0';
          // after "approval_requested", stream the drafted reply as tokens
          if (ev.event === 'approval_requested') {
            var draft = tickerLine('', 'ok');
            draft.textContent = '  ↳ drafting reply: ';
            streamInto(draft, DRAFT_REPLY, 26);
          }
        }, 500));
      }, Math.max(idx * 300, ev.t || idx * 300)));
    });
  }

  // ---- interaction layer (DOM-driving) -------------------------------------
  // Relay's force-dynamic App Router pages embed an RSC flight payload that needs a running
  // `next start` server to complete hydration. Served statically (GitHub Pages) React never
  // attaches, so the captured buttons' native onClick handlers are inert. Since the demo must
  // still feel like the near-real app, boot.js OWNS the interaction: a delegated click handler
  // recognizes the real captured Run/Stop/Allow buttons and drives visible DOM transitions +
  // the network-shim state machine. The STRUCTURE stays 100% captured (can't drift); only the
  // click→state wiring is synthetic, anchored on the product's real DOM nodes.
  var MACHINE_NAME = 'Support Row Triage';

  function toast(msg) {
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:2147483001;' +
      'background:#0d2229;color:#e7f2ef;border:1px solid #1d4a53;border-radius:8px;padding:10px 16px;' +
      'font:500 13px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.4);' +
      'max-width:80vw;text-align:center';
    t.textContent = msg;
    (document.body || document.documentElement).appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 2200);
    setTimeout(function () { try { t.remove(); } catch (e) {} }, 2700);
  }

  // Find the card element (data-slot="card") that contains a given title string.
  function cardByTitle(title) {
    var titles = [].slice.call(document.querySelectorAll('[data-slot="card-title"]'));
    for (var i = 0; i < titles.length; i++) {
      if ((titles[i].textContent || '').trim().indexOf(title) >= 0) {
        var el = titles[i];
        while (el && el !== document.body) {
          if (el.getAttribute && el.getAttribute('data-slot') === 'card') return el;
          el = el.parentNode;
        }
        return titles[i].closest ? titles[i].closest('[data-slot="card"]') : null;
      }
    }
    return null;
  }

  // Rewrite the status badge inside a card to a new label (keeps the real badge styling).
  function setCardBadge(card, label) {
    if (!card) return;
    var badge = card.querySelector('[data-slot="badge"]');
    if (badge) {
      // replace only the trailing text node so any leading icon <svg> survives
      var replaced = false;
      for (var i = badge.childNodes.length - 1; i >= 0; i--) {
        var n = badge.childNodes[i];
        if (n.nodeType === 3 && (n.textContent || '').trim()) { n.textContent = ' ' + label; replaced = true; break; }
      }
      if (!replaced) badge.appendChild(document.createTextNode(' ' + label));
    }
  }

  // Swap a button's visible label (e.g. Run → Stop) within a card.
  function setButtonLabel(card, fromRe, toLabel) {
    if (!card) return null;
    var btns = [].slice.call(card.querySelectorAll('button, a'));
    for (var i = 0; i < btns.length; i++) {
      if (fromRe.test((btns[i].textContent || '').trim())) {
        // preserve any icon; rewrite the text node
        for (var j = btns[i].childNodes.length - 1; j >= 0; j--) {
          var n = btns[i].childNodes[j];
          if (n.nodeType === 3 && (n.textContent || '').trim()) { n.textContent = toLabel; return btns[i]; }
        }
        btns[i].appendChild(document.createTextNode(toLabel));
        return btns[i];
      }
    }
    return null;
  }

  // Drive the workflow run one step forward (running → waiting), mutating the real card.
  function driveRun() {
    var card = cardByTitle(MACHINE_NAME);
    // fire the shim so /api state + streams advance too
    fetch('/api/workflows/' + state.fixtures.machine.workflowId + '/execute', { method: 'POST' });
    setCardBadge(card, 'running');
    setButtonLabel(card, /^run$/i, 'Stop');
    toast('Support Row Triage started');
    // start the streaming activity ticker (agent working, no LLM call)
    var machine = state.fixtures.machine || {};
    streamRun((machine.monitorEvents || []).slice(0, 3)); // up to the approval-requested step
    setTimeout(function () {
      setCardBadge(card, 'waiting');
      toast('Waiting for human approval in Inbox');
      refreshCoach();
    }, WAIT_MS);
  }

  // Resolve the Inbox approval (Allow Once), mutating the real approval card.
  function driveApprove(clickedBtn) {
    var machine = state.fixtures.machine || {};
    fetch(machine.approve ? machine.approve.url : '/api/tasks/x/respond', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notificationId: machine.approve && machine.approve.notificationId, behavior: 'allow' })
    });
    // dim + stamp the approval card the button lives in
    var card = clickedBtn.closest ? (clickedBtn.closest('[data-slot="card"]') || clickedBtn.closest('li, article, div')) : null;
    if (card) {
      card.style.transition = 'opacity .3s';
      card.style.opacity = '0.55';
      var stamp = document.createElement('div');
      stamp.textContent = '✓ Approved — reply sent';
      stamp.style.cssText = 'margin-top:8px;color:#14804a;font-weight:600;font:600 13px ui-sans-serif,system-ui,sans-serif';
      card.appendChild(stamp);
    }
    toast('Reply approved — Support Row Triage completed');
    // reflect completion on the workflows card if present, and mark the machine done
    var wfCard = cardByTitle(MACHINE_NAME);
    setCardBadge(wfCard, 'completed');
    // finish the streaming ticker: send the reply + completion line
    ensureTicker();
    var sent = tickerLine('› sending approved reply…', 'muted');
    tickerTimers.push(setTimeout(function () {
      sent.style.opacity = '1'; sent.textContent = '✓ reply sent to customer';
      var doneEv = ((state.fixtures.machine || {}).monitorEvents || []).slice(-1)[0];
      tickerLine('✓ ' + (doneEv ? doneEv.payload : 'run completed'), 'ok');
    }, 700));
    refreshCoach();
  }

  // ---- Web Publish lane (DOM-driving) --------------------------------------
  // Preview → build a preview (POST /preview); the coach advances to the Publish step.
  function drivePreview(clickedBtn) {
    var wp = (state.machines || {}).web_publish; if (!wp) return;
    var appId = webPublishAppId();
    fetch('/api/apps/' + appId + '/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    state.lanes.web_publish.previewed = true;
    toast('Preview built from Web Sections');
    // stamp the preview action so a click visibly changes something
    if (clickedBtn) { setButtonLabel(clickedBtn.closest ? (clickedBtn.closest('button') ? clickedBtn : clickedBtn) : clickedBtn, /preview/i, 'Preview ✓'); }
    streamRun((wp.monitorEvents || []).slice(0, 1)); // "preview built" ticker line
    refreshCoach();
  }

  // Publish → POST /publish (202). The shim's fetch effect owns the deployment-status walk
  // (pending → publishing → success); this function owns the DOM presentation + ticker only.
  function drivePublish(clickedBtn) {
    var wp = (state.machines || {}).web_publish; if (!wp) return;
    var appId = webPublishAppId();
    fetch('/api/apps/' + appId + '/publish', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetId: wp.targetId })
    });
    state.lanes.web_publish.published = true;
    if (clickedBtn) setButtonLabel(clickedBtn, /publish/i, 'Publishing…');
    toast('Publishing to GitHub Pages…');
    streamRun((wp.monitorEvents || []).slice(1)); // ticker: publishing, deployed lines
    setTimeout(function () { refreshDeploymentCard('publishing'); }, 900);
    setTimeout(function () {
      if (clickedBtn) setButtonLabel(clickedBtn, /publishing…|publish/i, 'Published ✓');
      refreshDeploymentCard('success');
      toast('Deployment succeeded — site is live');
    }, WAIT_MS);
  }

  // Reflect the new deployment's status onto the captured deployment-history card, if present.
  function refreshDeploymentCard(status) {
    var card = cardByTitle('Deployment') || cardByTitle('Deployments') || cardByTitle('Publish');
    if (card) setCardBadge(card, status);
  }

  // The installed app id from the current /apps/<id> route (UUID, unknown at derive time).
  function webPublishAppId() {
    var mm = (location.pathname || '').match(/\/apps\/([^/]+)/);
    return mm ? mm[1] : 'demo';
  }

  // ---- Row Trigger lane (DOM-driving) --------------------------------------
  // Add row → POST /rows (201) fires the row_added trigger → the shared triage workflow runs.
  // The demo appends a visible row to the captured table and streams the trigger-fire ticker,
  // then the coach hands the visitor toward Inbox (the run this fires is Support Triage's).
  function driveAddRow(clickedBtn) {
    var rt = (state.machines || {}).row_trigger; if (!rt) return;
    fetch('/api/tables/' + rt.tableId + '/rows', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows: [{ data: JSON.parse(rt.newRow.data) }] })
    });
    state.lanes.row_trigger.fired = true;
    appendDemoTableRow(rt.newRow);
    if (clickedBtn) setButtonLabel(clickedBtn, /add row/i, 'Row added ✓');
    toast('Row added — trigger fired');
    streamRun((rt.monitorEvents || [])); // row_added, trigger_fired, run_started
    refreshCoach();
  }

  // Append a visible row to the captured table body so the add is tangible. Best-effort: find
  // the table, mirror its column order from the header, and inject a themed <tr>. If no <table>
  // is present (some table views render a grid), fall back to a toast-only confirmation.
  function appendDemoTableRow(row) {
    var data = {};
    try { data = JSON.parse(row.data); } catch (e) { data = {}; }
    var table = document.querySelector('table');
    var tbody = table && (table.querySelector('tbody') || table);
    if (!tbody) return; // grid layout — the toast + ticker already confirm it
    var headers = [].slice.call(table.querySelectorAll('thead th, thead td'))
      .map(function (th) { return (th.textContent || '').trim().toLowerCase(); });
    var rt = (state.machines || {}).row_trigger;
    var cols = (rt && rt.columns) || [];
    var tr = document.createElement('tr');
    tr.setAttribute('data-relay-demo-row', '1');
    tr.style.cssText = 'animation:relay-demo-rowin .5s ease;background:var(--surface-2,rgba(20,128,74,.06))';
    // Match header order when we can; otherwise fall back to the fixture column order.
    var order = headers.length ? headers : cols.map(function (c) { return (c.displayName || c.name).toLowerCase(); });
    for (var i = 0; i < order.length; i++) {
      var td = document.createElement('td');
      var col = cols.find(function (c) {
        return (c.displayName || '').toLowerCase() === order[i] || (c.name || '').toLowerCase() === order[i];
      });
      var val = col ? (data[col.name] != null ? String(data[col.name]) : '') : '';
      td.textContent = val;
      td.style.cssText = 'padding:8px 12px';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // ---- License / Pack lane (DOM-driving) -----------------------------------
  // Install → POST /install → 402 license_required (unlicensed). The coach advances to the
  // Activate step and we surface a lightweight activate control. Activate → POST /license flips
  // the lane to licensed; the retried install succeeds.
  function driveInstall(clickedBtn) {
    var lp = (state.machines || {}).license_pack; if (!lp) return;
    fetch('/api/packs/install', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: lp.packId })
    });
    if (state.licensed) {
      // already licensed → install succeeds
      state.lanes.license_pack.licensed = true;
      if (clickedBtn) setButtonLabel(clickedBtn, /install/i, 'Installed ✓');
      toast(lp.packName + ' installed');
      streamRun((lp.monitorEvents || []).slice(2));
      refreshCoach();
      return;
    }
    state.lanes.license_pack.gated = true;
    if (clickedBtn) setButtonLabel(clickedBtn, /install/i, 'License required');
    toast('Install blocked — license required (402)');
    streamRun((lp.monitorEvents || []).slice(0, 1)); // license_required line
    ensureActivateControl(clickedBtn);
    refreshCoach();
  }

  // Surface a demo "Activate license" control next to the gated Install button (the real 402
  // points the user at Settings → License; the demo inlines the activate step so the lane stays
  // on one screen). Clicking it drives the activation.
  function ensureActivateControl(nearBtn) {
    if (document.getElementById('relay-demo-activate')) return;
    var lp = (state.machines || {}).license_pack; if (!lp) return;
    var btn = document.createElement('button');
    btn.id = 'relay-demo-activate';
    btn.type = 'button';
    btn.textContent = 'Activate license';
    btn.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:6px 12px;' +
      'border-radius:8px;border:1px solid var(--color-primary,#14804a);background:var(--color-primary,#14804a);' +
      'color:#fff;font:600 13px ui-sans-serif,system-ui,sans-serif;cursor:pointer';
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); driveActivate(btn); }, true);
    var anchor = (nearBtn && nearBtn.parentNode) ? nearBtn.parentNode : document.body;
    if (nearBtn && nearBtn.nextSibling) anchor.insertBefore(btn, nearBtn.nextSibling);
    else anchor.appendChild(btn);
  }

  function driveActivate(activateBtn) {
    var lp = (state.machines || {}).license_pack; if (!lp) return;
    // POST /api/license — the shim flips state.licensed (no real Ed25519 verify in the demo).
    fetch('/api/license', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ envelope: { payload: 'demo', signature: 'demo' } })
    });
    state.licensed = true;
    state.lanes.license_pack.licensed = true;
    if (activateBtn) { activateBtn.textContent = 'Licensed ✓'; activateBtn.disabled = true; activateBtn.style.opacity = '0.7'; }
    toast('License activated — every paid pack unlocked');
    streamRun((lp.monitorEvents || []).slice(1)); // license_activated, installed
    // auto-complete the install now that we are licensed (reflect on the gated Install button)
    var installBtn = findButton('license required') || findButton('install');
    if (installBtn) setButtonLabel(installBtn, /license required|install/i, 'Installed ✓');
    refreshCoach();
  }

  // Captured guided controls are frozen in the product's INITIAL state, where some are
  // `disabled` (+ pointer-events:none) until a precondition (a preview, a selection) exists.
  // In the demo the guided lane owns these controls, so make them actionable: clear the
  // disabled attribute + restore pointer events on the lane's controls for the current route.
  // The STRUCTURE (button, label, styling) stays captured; only the demo's guided controls are
  // re-enabled so a visitor can drive the lane. Per-route so it only touches the active lane.
  function enableLaneControls() {
    var path = location.pathname || '';
    var machines = state.machines || {};
    var pattern = null;
    if (/\/apps(\/|$)/.test(path) && machines.web_publish) {
      pattern = /^(preview|publish( fresh| this preview)?|save controls)$/i;
    } else if (/\/tables(\/|$)/.test(path) && machines.row_trigger) {
      pattern = /^add row$/i;
    } else if (/\/packs(\/|$)/.test(path) && machines.license_pack) {
      pattern = /^install( pack)?$/i;
    }
    if (!pattern) return;
    var btns = [].slice.call(document.querySelectorAll('button'));
    for (var i = 0; i < btns.length; i++) {
      var txt = (btns[i].textContent || '').trim();
      if (pattern.test(txt)) {
        btns[i].disabled = false;
        btns[i].removeAttribute('disabled');
        btns[i].setAttribute('aria-disabled', 'false');
        btns[i].style.pointerEvents = 'auto';
        btns[i].style.opacity = '';
        btns[i].style.cursor = 'pointer';
      }
    }
  }

  function installInteractionLayer() {
    document.addEventListener('click', function (e) {
      var btn = e.target && (e.target.closest ? e.target.closest('button, a') : null);
      if (!btn) return;
      var label = (btn.textContent || '').trim();
      var aria = btn.getAttribute && (btn.getAttribute('aria-label') || '');
      var page = (location.pathname || '').replace(/\/+$/, '');

      // Inbox Allow/Approve → drive completion (works regardless of which page shows the approval)
      if (/^(allow once|always allow|approve)$/i.test(label) && !state.completed) {
        e.preventDefault(); e.stopPropagation();
        state.completed = true;
        driveApprove(btn);
        return;
      }
      // Workflows Run on the Support Row Triage card → drive the run
      if (/^run$/i.test(label) && /\/workflows$/.test(page) && !state.ran) {
        var card = btn.closest ? btn.closest('[data-slot="card"]') : null;
        if (card && (card.textContent || '').indexOf(MACHINE_NAME) >= 0) {
          e.preventDefault(); e.stopPropagation();
          state.ran = true;
          driveRun();
          return;
        }
      }
      // Web Publish lane (on /apps/*): Preview then Publish.
      if (/\/apps(\/|$)/.test(page) && (state.machines || {}).web_publish) {
        if (/^preview/i.test(label) && !state.lanes.web_publish.previewed) {
          e.preventDefault(); e.stopPropagation();
          drivePreview(btn);
          return;
        }
        // "Publish", "Publish fresh", "Publish this preview" — but not "Publisher"/"Published"
        if (/^publish( fresh| this preview)?$/i.test(label) && !state.lanes.web_publish.published) {
          e.preventDefault(); e.stopPropagation();
          drivePublish(btn);
          return;
        }
      }
      // Row Trigger lane (on /tables/*): Add row.
      if (/\/tables(\/|$)/.test(page) && (state.machines || {}).row_trigger) {
        if (/^add row$/i.test(label) && !state.lanes.row_trigger.fired) {
          e.preventDefault(); e.stopPropagation();
          driveAddRow(btn);
          return;
        }
      }
      // License/Pack lane (on /packs): Install (→ gate → activate).
      if (/\/packs(\/|$)/.test(page) && (state.machines || {}).license_pack) {
        // "Install" / "Install pack" — but not "Installed"/"Reinstall".
        if (/^install( pack)?$/i.test(label) && !state.lanes.license_pack.licensed) {
          e.preventDefault(); e.stopPropagation();
          driveInstall(btn);
          return;
        }
      }
      // Deny → benign toast (no state change)
      if (/^deny$/i.test(label) || /permission required/i.test(aria)) {
        // let it be; deny just closes in the real app — no-op here
      }
    }, true); // capture phase so we win before any (inert) React handler
  }

  // The captured "Permission required" approval toast (SECTION.fixed pinned bottom-right)
  // renders on EVERY page because that was the captured DOM state. Landing on the dashboard
  // with an approval modal already open reads as a stuck state, so we gate it: hidden on load;
  // shown when the visitor clicks the top-nav "Inbox" (approvals live there) OR is on the
  // /inbox route; hidden again on ANY other UI click; once an outside click closes it, it
  // STAYS closed (an Inbox click won't re-open it) — the close is a deliberate dismiss and
  // persists for the session (survives the full-page nav between static routes).
  var APPROVAL_CLOSED_KEY = 'relay-demo-approval-closed';
  function approvalIsClosed() {
    try { return sessionStorage.getItem(APPROVAL_CLOSED_KEY) === '1'; } catch (e) { return false; }
  }
  function markApprovalClosed() {
    try { sessionStorage.setItem(APPROVAL_CLOSED_KEY, '1'); } catch (e) {}
  }
  function approvalPopup() {
    var secs = document.querySelectorAll('section.fixed');
    for (var i = 0; i < secs.length; i++) {
      if (/Permission required/i.test(secs[i].textContent || '')) return secs[i];
    }
    return null;
  }
  function setApprovalPopup(show) {
    var el = approvalPopup();
    if (el) el.style.display = show ? '' : 'none';
  }
  function initApprovalGate() {
    // hide on load unless we're already on the Inbox route AND not stickily closed
    setApprovalPopup(/\/inbox\/?$/.test(location.pathname || '') && !approvalIsClosed());
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      var toInbox = a && /\/inbox\/?$/.test(a.getAttribute('href') || '');
      var pop = approvalPopup();
      // a click INSIDE the popup itself (Allow/Deny) is not an outside click.
      var insidePopup = pop && e.target && e.target.closest && e.target.closest('section.fixed') === pop;
      if (toInbox) { if (!approvalIsClosed()) setApprovalPopup(true); return; }
      if (insidePopup) return;
      markApprovalClosed();
      setApprovalPopup(false);
    }, true);
  }

  function onReady() {
    ribbon(); buyStrip(); themeSwitcher(); coachStyle(); installInteractionLayer();
    initApprovalGate(); // gate the captured permission popup: hidden on load, Inbox-only
    enableLaneControls(); // make the app route's guided Preview/Publish controls actionable
    setTimeout(refreshCoach, 900);
    // On /monitor, auto-replay the run's activity so the "watch it work" streaming is visible
    // even if the visitor lands here directly.
    if (/\/monitor\/?$/.test(location.pathname || '')) {
      setTimeout(function () { streamRun(); }, 1100);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady, { once: true });
  else onReady();

  // ---- load fixtures (async; shims read the mutable state.fixtures ref) -----
  (realFetch || fetch)(FIXTURE_URL)
    .then(function (r) { return r && r.ok ? r.json() : null; })
    .then(function (d) {
      if (d) {
        var fresh = createDemoState(d);
        state.fixtures = fresh.fixtures;
        state.machines = fresh.machines;     // keyed lane configs (was {} before fixtures load)
        state.workflows = fresh.workflows;
        state.tasks = fresh.tasks;
        state.usageLedger = fresh.usageLedger;
        state.deployments = fresh.deployments; // Web Publish lane's live deployment history
        state.rows = fresh.rows;               // Row Trigger lane's live table rows
        state.licensed = fresh.licensed;       // License lane's community/licensed flag
        state.lanes = fresh.lanes;             // per-lane progress flags
        window.__RELAY_DEMO_FIXTURES__ = d;
        enableLaneControls(); // machines now loaded — enable the app route's guided controls
        refreshCoach();
      }
    })
    .catch(function (e) { try { console.warn('[relay demo] fixtures load failed', e); } catch (x) {} });
})();
