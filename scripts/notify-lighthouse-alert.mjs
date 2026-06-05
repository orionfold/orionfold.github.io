// notify-lighthouse-alert.mjs (M5) — email the operator when a Lighthouse CI
// run fails its error-level budget assertions.
//
//   node scripts/notify-lighthouse-alert.mjs [path/to/assertion-results.json]
//
// Runs as the `if: failure()` step of .github/workflows/lighthouse.yml. Reads
// LHCI's assertion results, keeps level==="error" failures only (warns are
// advisory by design — see .lighthouserc.cjs), groups them by page route, and
// POSTs a plain-text digest to the `ops-alert` Supabase edge fn (which holds
// the Resend key; CI only holds OPS_ALERT_TOKEN).
//
// ALWAYS exits 0 — alerting must never make a red run redder or confuse
// triage. Every failure path logs and returns. DRY_RUN=1 prints the digest
// instead of POSTing.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal } from './lib/metrics.mjs';

const OPS_ALERT_URL = 'https://lgnmmcxvwdnusvfpguvf.supabase.co/functions/v1/ops-alert';
const MAX_LINES = 100; // ops-alert rejects > 100 lines; truncate below the cap

const file = resolve(process.cwd(), process.argv[2] ?? '.lighthouseci/assertion-results.json');

// LHCI serves pages on an ephemeral localhost port; map back to site routes
// (same mapping as scripts/summarize-lighthouse.mjs). /foo/index.html → /foo/
function routeOf(url) {
  try {
    const p = new URL(url).pathname.replace(/index\.html$/, '');
    return p === '' ? '/' : p;
  } catch {
    return url;
  }
}

// categories:performance arrives as auditId="categories" + auditProperty.
function assertionId(r) {
  return r.auditProperty ? `${r.auditId}:${r.auditProperty}` : (r.auditId ?? r.name);
}

async function main() {
  if (!existsSync(file)) {
    console.log(`[ops-alert] no assertion results at ${file} — nothing to report.`);
    return;
  }
  let results;
  try {
    results = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.log(`[ops-alert] could not parse ${file}: ${err.message}`);
    return;
  }
  const failures = (Array.isArray(results) ? results : []).filter(
    (r) => r.passed === false && r.level === 'error',
  );
  if (failures.length === 0) {
    console.log('[ops-alert] no error-level failures — nothing to report.');
    return;
  }

  const byRoute = new Map();
  for (const f of failures) {
    const route = routeOf(f.url);
    if (!byRoute.has(route)) byRoute.set(route, []);
    byRoute.get(route).push(f);
  }

  let lines = ['Lighthouse CI failed its error-level budgets.', ''];
  for (const [route, fails] of byRoute) {
    lines.push(`— ${route}`);
    for (const f of fails) {
      lines.push(`  ${assertionId(f)}: ${f.actual} (budget ${f.operator} ${f.expected})`);
    }
    lines.push('');
  }
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '(local run — no GitHub run URL)';
  lines.push(`Run: ${runUrl}`);

  if (lines.length > MAX_LINES) {
    lines = [...lines.slice(0, MAX_LINES - 2), '  … (truncated)', `Run: ${runUrl}`];
  }

  const subject = `Lighthouse budgets failed: ${failures.length} error${
    failures.length === 1 ? '' : 's'
  } on ${byRoute.size} page${byRoute.size === 1 ? '' : 's'}`;

  if (process.env.DRY_RUN) {
    console.log(`[ops-alert] DRY_RUN — would send:\nSubject: ${subject}\n\n${lines.join('\n')}`);
    return;
  }

  loadEnvLocal(); // CI provides the secret in env; local sends may use .env.local
  const token = process.env.OPS_ALERT_TOKEN;
  if (!token) {
    console.log('[ops-alert] OPS_ALERT_TOKEN not set — cannot send.');
    return;
  }
  try {
    const res = await fetch(OPS_ALERT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, lines }),
    });
    if (res.status === 202) {
      console.log('[ops-alert] alert email sent.');
    } else {
      console.log(`[ops-alert] ops-alert responded ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.log(`[ops-alert] send failed: ${err.message}`);
  }
}

main();
