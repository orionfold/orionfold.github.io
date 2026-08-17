// Cut the Flow "hero detail" crops out of the full-window development-build
// captures.
//
// Why this exists: every capture in src/assets/flow/shots/ is a whole 2560x1400
// Retina window with two document panes. Rendered into a page column that is
// ~700 CSS px wide, the ONE control a section is actually talking about (the
// Local domain toggle, the Checks list, the coverage line) lands at six to ten
// pixels tall. The reader is asked to take the claim on faith while looking at
// an illegible thumbnail. That is the opposite of proof.
//
// So each entry below names a rectangle in the ORIGINAL capture's coordinate
// space that contains exactly one feature, and nothing else. The crop ships at
// its native capture resolution (no upscaling ever — `withoutEnlargement`), so
// the detail is rendered at or above 1:1 and stays crisp on Retina.
//
// Rules for adding one:
//   * left/top/width/height are in the SOURCE capture's pixels (2560 wide).
//   * Crop to the feature plus a little breathing room. Do not include a second
//     feature: the whole point is one claim, one picture.
//   * The `alt` must describe what is legible IN THE CROP, not in the window it
//     came from.
//   * Re-run after any re-capture: `node scripts/prepare-flow-details.mjs`.
//     The rectangles are tied to the app's layout, so a UI change can silently
//     turn a crop into a slice of whitespace. Eyeball every output afterwards.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const shotsDir = path.resolve('src/assets/flow/shots');
const outDir = path.resolve('src/assets/flow/details');

/** @type {{out: string, from: string, rect: {left:number,top:number,width:number,height:number}, note: string}[]} */
const DETAILS = [
  {
    out: 'detail-checks.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // Stops above "Exact proposed diff": that header belongs to detail-diff,
    // and a crop that trails into the next feature stops being one claim.
    rect: { left: 380, top: 660, width: 830, height: 430 },
    note: 'Evidence rows, the three named checks, and the human-review gate.',
  },
  {
    out: 'detail-diff.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // Runs to x=1500 so "Approve & Save" is a whole button. This crop is the
    // homepage hero's proof image and its caption says nothing is saved until
    // you approve — a half-sliced Approve button undercuts exactly that line.
    rect: { left: 380, top: 1090, width: 1120, height: 290 },
    note: 'The exact proposed diff, with removed lines marked in red.',
  },
  {
    out: 'detail-proposal.webp',
    from: 'flow-writing-you-approve-shot.webp',
    rect: { left: 380, top: 255, width: 1010, height: 300 },
    note: 'What Flow proposes, its permission scope, and the content hashes.',
  },
  {
    out: 'detail-domains.webp',
    from: 'flow-domains-shot.webp',
    rect: { left: 400, top: 405, width: 1000, height: 400 },
    note: 'The Local execution domain: its switch, locality line, and providers.',
  },
  {
    out: 'detail-runtime-storage.webp',
    from: 'flow-runtime-models-shot.webp',
    rect: { left: 480, top: 760, width: 900, height: 340 },
    note: 'Downloaded models against the disk allowance, split from Shared.',
  },
  {
    out: 'detail-parts.webp',
    from: 'flow-long-documents-shot.webp',
    // Runs to x=2530 so the "1 Check to resolve" pill is whole; a half-clipped
    // badge reads as a rendering bug rather than a deliberate crop. Height stops
    // at the divider under the coverage line: 250 trailed into a sliced "What
    // Flow proposes" header, which is the next feature and a second claim.
    rect: { left: 1470, top: 150, width: 1060, height: 205 },
    note: 'Part chips and the plain-counts coverage line.',
  },
  {
    out: 'detail-grid.webp',
    from: 'flow-table-editor-shot.webp',
    // Runs to the pane edge so the Status column is whole. At 1090 the last
    // column was sliced, which reads as a broken table rather than a crop.
    rect: { left: 1460, top: 125, width: 1100, height: 420 },
    note: 'The spreadsheet grid over the same Markdown table, one cell selected.',
  },
  {
    out: 'detail-search.webp',
    from: 'flow-search-shot.webp',
    rect: { left: 10, top: 140, width: 350, height: 800 },
    note: 'The search column: query, result abstracts, and match reasons.',
  },
  {
    out: 'detail-resource-popover.webp',
    from: 'flow-resource-popover-shot.webp',
    // The homepage hero's proof crop (2026-08-16 re-capture). This is the one
    // picture that carries the whole "shows its work" claim at once: live
    // processor / memory / graphics with sparklines, per-process attribution
    // (Flow's own footprint vs the model's 19.1 GB), the token ledger, the
    // spend, and the model actually answering. Deliberately the FULL popover
    // rather than a tighter cut, because the claim is that all of it is in one
    // place — cropping to any single row would lose exactly that.
    rect: { left: 2044, top: 112, width: 382, height: 680 },
    note: 'The whole "What Flow is using" popover: usage, tokens, cost, model.',
  },
];

await import('node:fs/promises').then(({ mkdir }) => mkdir(outDir, { recursive: true }));

let written = 0;
for (const detail of DETAILS) {
  const input = path.join(shotsDir, detail.from);
  const meta = await sharp(input).metadata();
  const { left, top, width, height } = detail.rect;
  if (left + width > meta.width || top + height > meta.height) {
    throw new Error(
      `${detail.out}: rect ${left},${top} ${width}x${height} falls outside ${detail.from} (${meta.width}x${meta.height})`,
    );
  }
  const output = path.join(outDir, detail.out);
  await sharp(input)
    .extract(detail.rect)
    // Lossless: these are UI captures with hard type edges, and a detail crop
    // exists precisely so the type stays readable. Lossy webp at this zoom
    // fringes the antialiasing on 11px labels.
    .webp({ lossless: true, effort: 6 })
    .toFile(output);
  const bytes = (await stat(output)).size;
  written += 1;
  console.log(`${detail.out.padEnd(30)} ${width}x${height}  ${(bytes / 1024).toFixed(0)} KB  ← ${detail.from}`);
}

const orphans = (await readdir(outDir)).filter(
  (f) => f.endsWith('.webp') && !DETAILS.some((d) => d.out === f),
);
if (orphans.length) {
  console.log(`\nNote: ${orphans.length} file(s) in details/ are not produced by this script: ${orphans.join(', ')}`);
}
console.log(`\nPrepared ${written} Flow feature details.`);
