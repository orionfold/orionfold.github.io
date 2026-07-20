#!/usr/bin/env node
// Post-copy guard for the verbatim Relay demo mirror.
//
// The demo is a hands-on product surface, not a search landing-page cluster.
// It is intentionally absent from the sitemap but linked from every indexed
// Relay page, so sitemap exclusion alone cannot keep Google from indexing its
// 25 app-shell routes. Run this after every verbatim re-copy from Relay's
// _ASSETS/demo bundle. The transform is idempotent and fails if it cannot make
// every HTML page explicitly `noindex,follow`. Website's public-repo boundary
// also permits only manav@orionfold.com in tracked files, so inert sample email
// literals are de-addressed after Relay's own source privacy gate passes.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMO_ROOT = new URL('../public/relay/demo/', import.meta.url);
const ROBOTS_META = '<meta name="robots" content="noindex,follow">';
const ALLOWED_PUBLIC_EMAIL = 'manav@orionfold.com';
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt']);

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(path, files);
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function walkText(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkText(path, files);
    else {
      const dot = entry.name.lastIndexOf('.');
      const extension = dot >= 0 ? entry.name.slice(dot).toLowerCase() : '';
      if (TEXT_EXTENSIONS.has(extension)) files.push(path);
    }
  }
  return files;
}

export function scrubPublicEmails(text) {
  return text.replace(EMAIL, (email) => {
    if (email.toLowerCase() === ALLOWED_PUBLIC_EMAIL) return email;
    const [local, domain] = email.split('@');
    return `${local} [at] ${domain.replaceAll('.', ' [dot] ')}`;
  });
}

function scrubFile(path) {
  const original = readFileSync(path, 'utf8');
  const scrubbed = scrubPublicEmails(original);
  if (scrubbed !== original) writeFileSync(path, scrubbed);
  return scrubbed !== original;
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

function main() {
  const root = DEMO_ROOT.pathname;
  const textFiles = walkText(root);
  const scrubbed = textFiles.filter(scrubFile).length;
  const pages = walkHtml(root);
  if (pages.length === 0) throw new Error(`No HTML pages found under ${root}`);
  const changed = pages.filter(prepare).length;
  console.log(`[prepare-relay-demo] ${pages.length} pages protected; ${changed} noindex updates; ${scrubbed} sample-email scrubs`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
