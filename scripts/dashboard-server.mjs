#!/usr/bin/env node
// M7 — live admin dashboard server (spec _SPECS/2026-06-06-144656-01_live-admin-dashboard.md §4b).
//
//   node scripts/dashboard-server.mjs [--port 8789] [--open] [--no-token]
//
// Loopback ONLY (hardcoded — no flag can change it; parent-spec hard rule:
// admin data never gets a public route). Per-launch token gates /api/*.
// /api/data runs assemble() fresh per request — files are truth, no cache.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WEB = resolve(__dirname, 'dashboard-web');
const DATA_MOD = resolve(__dirname, 'lib', 'dashboard-data.mjs');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx !== -1 ? Number(args[portIdx + 1]) : 8789;
const NO_TOKEN = args.includes('--no-token');
const HOST = '127.0.0.1';
const TOKEN = randomBytes(16).toString('hex');

function tokenOk(req) {
  if (NO_TOKEN) return true;
  const got = Buffer.from(String(req.headers['x-db-token'] || ''));
  const want = Buffer.from(TOKEN);
  return got.length === want.length && timingSafeEqual(got, want);
}

// hot-reload the data layer: stat its mtime per request, re-import on change
// via a cache-busting query — edits surface within one poll cycle (peer rule).
let dataMod = null;
let dataMtime = 0;
let loadingPromise = null;
async function getData() {
  const m = statSync(DATA_MOD).mtimeMs;
  if (!dataMod || m !== dataMtime) {
    if (!loadingPromise) {
      loadingPromise = import(pathToFileURL(DATA_MOD).href + `?t=${m}`)
        .then((mod) => { dataMod = mod; dataMtime = m; })
        .finally(() => { loadingPromise = null; });
    }
    await loadingPromise;
  }
  return dataMod;
}

// single-flight admin jobs (spec §4b): 409 while running; state rides /api/data
const jobs = {
  refresh: { state: 'idle', finishedAt: null, error: null },
  lhci: { state: 'idle', finishedAt: null, error: null },
};
const NPM = resolve(dirname(process.execPath), 'npm');
const JOB_CMDS = {
  refresh: [NPM, ['run', 'metrics']],
  lhci: [process.execPath, ['scripts/pull-lhci-artifact.mjs']],
};
function startJob(name) {
  if (jobs[name].state === 'running') return false;
  jobs[name] = { state: 'running', finishedAt: null, error: null };
  const [cmd, cmdArgs] = JOB_CMDS[name];
  const child = spawn(cmd, cmdArgs, { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
  let errTail = '';
  child.stderr.on('data', (d) => { errTail = (errTail + d).slice(-2000); });
  child.on('close', async (code) => {
    jobs[name] = {
      state: code === 0 ? 'ok' : 'error',
      finishedAt: new Date().toISOString(),
      error: code === 0 ? null : (errTail.trim().slice(-500) || `exit ${code}`),
    };
    try { (await getData()).dropCiCache(); } catch {} // fresh CI state after a job
  });
  child.on('error', (e) => {
    jobs[name] = { state: 'error', finishedAt: new Date().toISOString(), error: e.message };
  });
  return true;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:";

function send(res, status, body, headers = {}) {
  res.statusCodeSent = status;
  res.writeHead(status, { 'Content-Security-Policy': CSP, ...headers });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, `http://${HOST}`).pathname;
  try {
    if ((path === '/api/refresh' || path === '/api/lhci') && req.method === 'POST') {
      if (!tokenOk(req)) return send(res, 401, 'bad token');
      const name = path.slice(5); // 'refresh' | 'lhci'
      if (!startJob(name)) return send(res, 409, JSON.stringify({ job: name, state: 'running' }), { 'Content-Type': 'application/json' });
      return send(res, 202, JSON.stringify({ job: name, state: 'running' }), { 'Content-Type': 'application/json' });
    }
    if (path === '/api/data' && req.method === 'GET') {
      if (!tokenOk(req)) return send(res, 401, 'bad token');
      const { assemble } = await getData();
      const payload = assemble();
      payload.jobs = jobs;
      return send(res, 200, JSON.stringify(payload), {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
    }
    if (path === '/' || path === '/index.html') {
      const html = readFileSync(resolve(WEB, 'index.html'), 'utf8')
        .replace(/__DB_TOKEN__/g, NO_TOKEN ? '' : TOKEN);
      return send(res, 200, html, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
    }
    // static assets: dashboard-web/* plus the shared renderer module
    if (path === '/lib/dashboard-render.mjs') {
      return send(res, 200, readFileSync(resolve(__dirname, 'lib', 'dashboard-render.mjs')), {
        'Content-Type': MIME['.mjs'],
      });
    }
    if (/^\/[\w.-]+\.(js|mjs|css)$/.test(path)) {
      return send(res, 200, readFileSync(resolve(WEB, path.slice(1))), {
        'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      });
    }
    return send(res, 404, 'not found');
  } catch (e) {
    console.log(`[err] ${path} ${e.message}`); // path + message only, never payloads
    return send(res, 500, 'internal error');
  } finally {
    console.log(`${req.method} ${path} → ${res.statusCodeSent || 0}`); // path + status discipline
  }
});

server.listen(PORT, HOST, () => {
  console.log(`dashboard server → http://${HOST}:${PORT}/ (token ${NO_TOKEN ? 'DISABLED' : 'active'})`);
  if (process.argv.includes('--open') && process.platform === 'darwin') {
    spawnSync('open', [`http://${HOST}:${PORT}/`]);
  }
});
