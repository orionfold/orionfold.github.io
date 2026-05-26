// Refresh the committed roadmap snapshot (F2, spec §5). Pulls the live GitHub
// signals and rewrites src/lib/roadmap/snapshot.json — the offline/dev/CI-blip
// fallback the build uses when a live pull fails. Run it whenever the upstream
// project repo moves (the R3 roadmap-manage skill calls this too):
//
//   node scripts/refresh-roadmap-snapshot.mjs
//
// Runs on plain Node (no deps): it imports only signals.ts, which has no project
// imports, so Node's type stripping resolves it via the explicit .ts extension.
// Must run from the repo root (the snapshot path is resolved from process.cwd()).
import { refreshSnapshot } from '../src/lib/roadmap/signals.ts';

const signals = await refreshSnapshot();
console.log(
  `[roadmap] snapshot refreshed: fieldkit v${signals.fieldkit.version}, ` +
    `${signals.fieldkit.modules.length} modules, ${signals.fieldNotes.stages.length} stages, ` +
    `${signals.fieldNotes.articlesPublished} notes published (+${signals.fieldNotes.articlesUpcoming} upcoming).`,
);
