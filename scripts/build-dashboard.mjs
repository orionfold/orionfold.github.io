// M4/M7 — static health-dashboard build: assemble() + renderBody() → ONE
// self-contained HTML page in git-ignored audit-reports/. The live server
// (dashboard-server.mjs) consumes the same two libs — keep all data/render
// logic THERE, in scripts/lib/, never here.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { METRICS_DIR } from './lib/metrics.mjs';
import { assemble } from './lib/dashboard-data.mjs';
import { renderBody } from './lib/dashboard-render.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const payload = assemble();
const body = renderBody(payload);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Orionfold · health telemetry</title>
<style>${readFileSync(resolve(__dirname, 'dashboard-web', 'styles.css'), 'utf8')}</style></head>
<body><div class="wrap">
  <header class="top">
    <div class="brand">
      <span class="star">&#10022;</span>
      <div><h1>Orionfold</h1><span class="tag">// health telemetry</span></div>
    </div>
    <div class="meta">${body.metaHtml}</div>
  </header>
  <div class="freshness">${body.freshnessHtml}</div>
  <div class="grid sites-grid">
    ${body.mainHtml}
  </div>
  <footer>local-only &middot; audit-reports/ is git-ignored &middot; refresh with <span class="mono">npm run metrics &amp;&amp; npm run dashboard</span></footer>
</div></body></html>`;

const outPath = resolve(METRICS_DIR, '..', 'dashboard.html');
writeFileSync(outPath, html);
const sourceCount = ['betterstack', 'cloudflare', 'lighthouse', 'crux'].filter((s) => payload.snaps[s]?.length).length;
const manual = payload.snaps.ga4?.length || payload.snaps.gsc?.length;
console.log(`dashboard → ${outPath}`);
console.log(`  ${sourceCount}/4 fetcher sources · latest data ${
  Object.keys(payload.snaps).flatMap((s) => payload.snaps[s].map((x) => x.date)).sort().pop() || 'none'
}${manual ? ' · manual GA4/GSC present' : ' · GA4/GSC manual pending'}`);

if (process.argv.includes('--open') && process.platform === 'darwin') {
  spawnSync('open', [outPath]);
}
