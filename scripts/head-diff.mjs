#!/usr/bin/env node
// Search-facing head diff for design releases.
// Snapshot every built page's search signals (title, meta, canonical,
// JSON-LD, internal links), then compare a later build against it.
// A redesign may change markup and CSS freely; it must not drop any of these.
//
//   node scripts/head-diff.mjs snapshot <file.json>   # from dist/
//   node scripts/head-diff.mjs compare  <file.json>   # exit 1 on a loss
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const DIST = 'dist';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function signals(html) {
  const head = html.split(/<\/head>/i)[0];
  const meta = {};
  for (const tag of head.match(/<meta\s[^>]*>/gi) ?? []) {
    const key = attr(tag, 'name') ?? attr(tag, 'property');
    if (key && !key.startsWith('astro')) meta[key] = attr(tag, 'content') ?? '';
  }
  const canonical = (head.match(/<link\s[^>]*rel="canonical"[^>]*>/i) ?? [])[0];
  const jsonld = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => {
      try { return JSON.stringify(JSON.parse(m[1])); } catch { return m[1].trim(); }
    })
    .sort();
  const links = [...new Set(
    [...html.matchAll(/<a\s[^>]*href="(\/[^"#?]*)/gi)].map((m) => m[1]),
  )].sort();
  return {
    title: (head.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1]?.trim() ?? '',
    meta,
    canonical: canonical ? attr(canonical, 'href') : '',
    jsonld,
    links,
  };
}

function snapshot() {
  const pages = {};
  for (const f of walk(DIST).sort()) pages['/' + relative(DIST, f)] = signals(readFileSync(f, 'utf8'));
  return pages;
}

export function compare(before, after) {
  const losses = [];
  for (const [page, b] of Object.entries(before)) {
    const a = after[page];
    if (!a) { losses.push(`${page}: page no longer built`); continue; }
    if (a.title !== b.title) losses.push(`${page}: title changed`);
    if (a.canonical !== b.canonical) losses.push(`${page}: canonical changed`);
    for (const [k, v] of Object.entries(b.meta)) {
      if (!(k in a.meta)) losses.push(`${page}: meta ${k} dropped`);
      else if (a.meta[k] !== v && !/image/.test(k)) losses.push(`${page}: meta ${k} changed`);
    }
    for (const block of b.jsonld) {
      if (!a.jsonld.includes(block)) losses.push(`${page}: a JSON-LD block changed or dropped`);
    }
    for (const href of b.links) {
      if (!a.links.includes(href)) losses.push(`${page}: internal link ${href} dropped`);
    }
  }
  return losses;
}

const [mode, file] = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) {
  if (mode === 'snapshot' && file) {
    mkdirSync(dirname(file), { recursive: true });
    const pages = snapshot();
    writeFileSync(file, JSON.stringify(pages));
    console.log(`head-diff: ${Object.keys(pages).length} pages snapshotted to ${file}`);
  } else if (mode === 'compare' && file) {
    const losses = compare(JSON.parse(readFileSync(file, 'utf8')), snapshot());
    for (const l of losses.slice(0, 50)) console.log(`  ${l}`);
    console.log(`head-diff: ${losses.length} search-signal losses`);
    process.exit(losses.length ? 1 : 0);
  } else {
    console.error('usage: node scripts/head-diff.mjs snapshot|compare <file.json>');
    process.exit(2);
  }
}
