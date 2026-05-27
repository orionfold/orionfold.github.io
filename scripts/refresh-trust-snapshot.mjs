// Refresh the committed trust snapshot (P3, spec §5.6). Re-pulls the live
// HuggingFace download/like counts and re-reads the local book manifests, then
// rewrites src/lib/trust/snapshot.json — the offline/CI fallback the build uses
// when a live pull fails (and the only book-stats source on CI, where the book
// repos aren't checked out). Run it whenever the HF counts should be refreshed:
//
//   node scripts/refresh-trust-snapshot.mjs
//
// Runs on plain Node (no deps): it imports only source.ts, which has no project
// imports, so Node's type stripping resolves it via the explicit .ts extension.
// Must run from the repo root (the snapshot path resolves from process.cwd()),
// and from the author's machine (the book manifest paths are local).
import { refreshSnapshot } from '../src/lib/trust/source.ts';

const data = await refreshSnapshot();
const models = Object.entries(data.models)
  .map(([slug, m]) => `${slug}=${m.downloads}`)
  .join(', ');
const books = Object.entries(data.books)
  .map(([slug, b]) => `${slug}=${b.chapters}ch/${b.parts}pt`)
  .join(', ');
console.log(`[trust] snapshot refreshed (${data.generatedAt})`);
console.log(`  models (downloads · 30d): ${models}`);
console.log(`  books: ${books}`);
