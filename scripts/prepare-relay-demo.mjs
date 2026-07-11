#!/usr/bin/env node
// Post-copy guard for the verbatim Relay demo mirror.
//
// The demo is a hands-on product surface, not a search landing-page cluster.
// It is intentionally absent from the sitemap but linked from every indexed
// Relay page, so sitemap exclusion alone cannot keep Google from indexing its
// 25 app-shell routes. Run this after every verbatim re-copy from Relay's
// _ASSETS/demo bundle. The transform is idempotent and fails if it cannot make
// every HTML page explicitly `noindex,follow`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_ROOT = new URL('../public/relay/demo/', import.meta.url);
const ROBOTS_META = '<meta name="robots" content="noindex,follow">';

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(path, files);
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function prepare(path) {
  const original = readFileSync(path, 'utf8');
  let html = original;

  if (/<meta\s+name=["']robots["']/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']robots["'][^>]*>/i,
      ROBOTS_META,
    );
  } else if (/<meta\s+name=["']viewport["'][^>]*>/i.test(html)) {
    html = html.replace(
      /(<meta\s+name=["']viewport["'][^>]*>)/i,
      `$1${ROBOTS_META}`,
    );
  } else if (/<meta\s+charset=["'][^"']+["'][^>]*>/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["'][^"']+["'][^>]*>)/i,
      `$1${ROBOTS_META}`,
    );
  } else {
    throw new Error(`${path}: no stable <head> insertion anchor`);
  }

  const tags = html.match(/<meta\s+name=["']robots["'][^>]*>/gi) ?? [];
  if (tags.length !== 1 || !/content=["']noindex,follow["']/i.test(tags[0])) {
    throw new Error(`${path}: expected exactly one noindex,follow robots tag`);
  }
  if (html !== original) writeFileSync(path, html);
  return html !== original;
}

const pages = walkHtml(DEMO_ROOT.pathname);
if (pages.length === 0) throw new Error(`No HTML pages found under ${DEMO_ROOT.pathname}`);
const changed = pages.filter(prepare).length;
console.log(`[prepare-relay-demo] ${pages.length} pages protected; ${changed} changed`);
