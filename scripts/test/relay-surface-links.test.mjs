import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';

const dist = new URL('../../dist/', import.meta.url).pathname;
const relayRoot = join(dist, 'relay');

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(path, files);
    else if (entry.name === 'index.html') files.push(path);
  }
  return files;
}

function targetExists(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = join(dist, decoded.replace(/^\//, ''));
  if (decoded.endsWith('/')) return existsSync(join(target, 'index.html'));
  if (extname(decoded)) return existsSync(target);
  return existsSync(target) || existsSync(join(target, 'index.html'));
}

const failures = [];
// The captured demo's boot layer canonicalizes inert source anchors at runtime;
// its static + behavioral verifier owns that contract. Crawl the Website-owned
// Relay landing, guide, API, memo, and Host documents here.
const pages = walkHtml(relayRoot).filter((file) => !relative(relayRoot, file).startsWith(`demo${sep}`));
for (const file of pages) {
  const routeDir = `/${relative(dist, dirname(file)).split(sep).join('/')}/`;
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(?:#|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    const url = new URL(href, `https://orionfold.com${routeDir}`);
    if (url.origin !== 'https://orionfold.com') continue;
    if (!targetExists(url.pathname)) failures.push(`${routeDir} -> ${url.pathname}`);
  }
}

assert.deepEqual([...new Set(failures)], [], 'Relay surface has broken local href targets');
console.log(`relay-surface-links: ${pages.length} built Relay pages have valid local href targets`);
