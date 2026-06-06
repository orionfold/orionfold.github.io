#!/usr/bin/env node
// M7 — live admin dashboard server (spec specs/2026-06-06-live-admin-dashboard.md §4b).
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
import { spawnSync } from 'node:child_process';

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
async function getData() {
  const m = statSync(DATA_MOD).mtimeMs;
  if (!dataMod || m !== dataMtime) {
    dataMod = await import(pathToFileURL(DATA_MOD).href + `?t=${m}`);
    dataMtime = m;
  }
  return dataMod;
}

// job-state stub — Task 5 replaces this with real single-flight plumbing.
const jobs = {};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:";

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Security-Policy': CSP, ...headers });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, `http://${HOST}`).pathname;
  try {
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
        .replace('__DB_TOKEN__', NO_TOKEN ? '' : TOKEN);
      return send(res, 200, html, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
    }
    // static assets: dashboard-web/* plus the shared renderer module
    if (path === '/lib/dashboard-render.mjs') {
      return send(res, 200, readFileSync(resolve(__dirname, 'lib', 'dashboard-render.mjs')), {
        'Content-Type': MIME['.mjs'],
      });
    }
    if (/^\/[\w.-]+\.(js|css)$/.test(path)) {
      return send(res, 200, readFileSync(resolve(WEB, path.slice(1))), {
        'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      });
    }
    return send(res, 404, 'not found');
  } catch (e) {
    console.log(`[err] ${path} ${e.message}`); // path + message only, never payloads
    return send(res, 500, 'internal error');
  } finally {
    console.log(`${req.method} ${path} → done`); // path + status discipline
  }
});

server.listen(PORT, HOST, () => {
  console.log(`dashboard server → http://${HOST}:${PORT}/ (token ${NO_TOKEN ? 'DISABLED' : 'active'})`);
  if (process.argv.includes('--open') && process.platform === 'darwin') {
    spawnSync('open', [`http://${HOST}:${PORT}/`]);
  }
});
