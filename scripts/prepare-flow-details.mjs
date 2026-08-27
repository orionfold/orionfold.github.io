// Cut the Flow "hero detail" crops out of the full-window product captures.
//
// Why this exists: every capture in src/assets/flow/shots/ is a whole Retina
// window with two document panes. Rendered into a page column that is ~700 CSS
// px wide, the ONE control a section is actually talking about (the Local
// domain toggle, the Checks list, the coverage line) lands at six to ten pixels
// tall. The reader is asked to take the claim on faith while looking at an
// illegible thumbnail. That is the opposite of proof.
//
// So each entry below names a rectangle in the ORIGINAL capture's coordinate
// space that contains exactly one feature, and nothing else. The crop ships at
// its native capture resolution (no upscaling ever — `withoutEnlargement`), so
// the detail is rendered at or above 1:1 and stays crisp on Retina.
//
// Re-measured 2026-08-26 (G-120) on the installed-release evidence set: the
// frames are native 3238x2032 captures of build 1255 (v1.5) synced by
// scripts/sync-flow-docs-shots.mjs, whose provenance lives in
// src/data/flow-shot-sources.json. Two crops still cut from held development-
// build captures because the release set has no frame for them yet (a long
// document with its parts line; the editor toolbar in its blocked state) — both
// are named in the manifest's held rows with the gap the product lane owes.
//
// Rules for adding one:
//   * left/top/width/height are in the SOURCE capture's pixels (3238 wide).
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
  // ── Writing you approve: the Review Changes pane on the proofread run ──
  // agency/proofread-review: the operator's own first document, proofread by
  // Qwen3.5-35B on Flow Runtime, waiting on a person. Every element the old
  // five crops showed exists on this one frame, so all five cut from it.
  {
    out: 'detail-proposal.webp',
    from: 'agency-proofread-review.webp',
    // Title row (Proposed / Exact changes, "1 Check to resolve") + the effect
    // sentence "Correct spelling and grammar in the selected text".
    rect: { left: 1900, top: 195, width: 1320, height: 130 },
    note: 'What Flow proposes: the effect sentence, read out of the proposed bytes.',
  },
  {
    out: 'detail-checks.webp',
    from: 'agency-proofread-review.webp',
    // The fact row (Edit this document only · No external action · No Sources ·
    // 2 assessed · 1 unresolved) and the three named check pills.
    rect: { left: 1900, top: 320, width: 1320, height: 110 },
    note: 'One fact row and three named checks as pills: Passed, Not required, Not checked.',
  },
  {
    out: 'detail-result.webp',
    from: 'agency-proofread-review.webp',
    // The proposed document with every corrected passage highlighted.
    rect: { left: 1900, top: 520, width: 1320, height: 520 },
    note: 'The result leads: the proposed document with the changes highlighted.',
  },
  {
    out: 'detail-diff.webp',
    from: 'agency-proofread-review.webp',
    // The decision footer: "I have reviewed this change", "1 Check to resolve",
    // Reject · Later · Approve & Save DISABLED. The homepage band uses this
    // crop under "Nothing is saved until you approve it".
    rect: { left: 1900, top: 1870, width: 1320, height: 162 },
    note: 'The decision footer: Approve & Save stays disabled until you tick the box.',
  },

  // ── Expand with Sources: the whole loop on the release build ──
  {
    out: 'detail-expand-hover.webp',
    from: 'agency-expand-with-sources-estimate.webp',
    // The Ex panel before the click: 25 words selection, <$0.01 estimated from
    // Flow price table v2, Claude Opus 5, Leaves this Mac.
    rect: { left: 1310, top: 260, width: 570, height: 295 },
    note: 'The Ex panel before the click: words, estimate, model, and that it leaves this Mac.',
  },
  {
    out: 'detail-expand-consent.webp',
    from: 'agency-leaves-this-mac-consent.webp',
    // The consent sheet, a separate window in the frame, whole: Destination
    // Anthropic, the included source with its size, the estimate to the digit,
    // read access only, Cancel / Allow Once.
    rect: { left: 1090, top: 635, width: 1070, height: 770 },
    note: 'The consent sheet: destination, named source with size, the estimate to the digit, read access only, Allow Once.',
  },
  {
    out: 'detail-expand-banner.webp',
    from: 'agency-expand-in-flight.webp',
    // The run banner mid-flight: what it could not fetch and why, two folder
    // searches narrated, Anthropic | claude-opus-5, pause and stop.
    rect: { left: 540, top: 180, width: 1340, height: 180 },
    note: 'The run banner mid-flight: lookups narrated, pause and stop one click away.',
  },
  {
    out: 'detail-expand-bound.webp',
    from: 'agency-expand-landed-receipt.webp',
    // The honest lookup: "Couldn't fetch en.wikipedia.org — this run keeps to
    // your own folders", marked Refused in the receipt.
    rect: { left: 2580, top: 930, width: 640, height: 90 },
    note: 'The honest ending of a lookup: the web fetch refused, the run kept to your folders.',
  },
  {
    out: 'detail-expand-lookups.webp',
    from: 'agency-expand-landed-receipt.webp',
    // Lookups in order: the document read, each folder search with what it
    // retrieved and how long it took, and the refused fetch.
    rect: { left: 2580, top: 630, width: 640, height: 580 },
    note: 'The run card: every lookup in order with its query, what it retrieved, and how long it took.',
  },
  {
    out: 'detail-expand-saved.webp',
    from: 'agency-expand-landed-receipt.webp',
    // Cost: recorded 0.121375 USD priced from the cost table, claude-opus-5,
    // anthropic, ran on Cloud. A real hosted charge.
    rect: { left: 2580, top: 1740, width: 640, height: 292 },
    note: 'Recorded cost with its basis, then the model, the provider, and where it ran.',
  },

  // ── Models and runtime ──
  {
    out: 'detail-domains.webp',
    from: 'settings-models.webp',
    // Build 1382 (Settings redesigned): the Local execution domain as a band
    // between hairlines — its switch, "Stays on this Mac · Free — it runs on
    // hardware you have", and the three providers with their model pickers.
    rect: { left: 560, top: 985, width: 1320, height: 350 },
    note: 'The Local execution domain: its switch, locality line, and providers.',
  },
  {
    out: 'detail-runtime-storage.webp',
    from: 'first-launch-flow-runtime-model-imported.webp',
    // Downloaded (Qwen3.5-35B-A3B-4bit, 20.42 GB of 50 GB used, 50 GB limit)
    // split from Shared (served from Ollama and LM Studio folders, nothing copied).
    rect: { left: 2100, top: 530, width: 980, height: 600 },
    note: 'Downloaded models against the disk allowance, split from Shared.',
  },
  {
    out: 'detail-resource-popover.webp',
    from: 'first-launch-what-flow-is-using-popover.webp',
    // The whole "What Flow is using" popover: CPU, Memory, GPU 98% of this
    // whole Mac, Flow's own share, tokens and spend this session and all time.
    rect: { left: 2590, top: 95, width: 580, height: 930 },
    note: 'The whole "What Flow is using" popover: usage, tokens, cost, model.',
  },
  {
    out: 'detail-benchmarks-rows.webp',
    from: 'first-launch-benchmarks-all-measured.webp',
    // Ranks 1 and 2 with time to first word, reading speed, fit, and Score of
    // 100 for Balanced, each stamped with when it was measured.
    rect: { left: 1980, top: 770, width: 1060, height: 400 },
    note: 'Ranks 1 and 2 with their Balanced scores: quickest vs fastest reader.',
  },
  {
    out: 'detail-benchmarks-machine.webp',
    from: 'first-launch-benchmarks-all-measured.webp',
    // The machine the ranking is OF: MacBook Pro 14" 2023, Apple M3 Max,
    // 36 GB, 30 GPU cores, 113 GB free.
    rect: { left: 1940, top: 390, width: 1100, height: 90 },
    note: 'The machine the ranking is OF: chip, memory, cores, free disk.',
  },
  {
    out: 'detail-routing-decided.webp',
    from: 'settings-smart-routing.webp',
    // Build 1382: the switch plus "Smart Routing would use advisor-gguf-q8_0.
    // Decided by the rule "Stays on this Mac"."
    rect: { left: 560, top: 370, width: 1330, height: 110 },
    note: 'The switch plus the sentence naming the model and its deciding rule.',
  },
  {
    out: 'detail-routing-rules.webp',
    from: 'settings-smart-routing.webp',
    // Build 1382: three ordered rules, live counts (11 of 14 models qualify),
    // the Deciding badge, Add Rule. The open rule-template menu below the
    // block is excluded on purpose.
    rect: { left: 560, top: 485, width: 1330, height: 300 },
    note: 'Ordered rules, live counts, the Deciding badge, and Add Rule.',
  },

  // ── Documents and files ──
  {
    out: 'detail-chart-line.webp',
    from: 'first-launch-chart-landed-receipts.webp',
    // The approved chart in the document: claim-led title, the pilot phase
    // highlighted, labelled bars, and the "Fee table" source line.
    rect: { left: 1920, top: 690, width: 1280, height: 880 },
    note: 'A chart fence drawn in place: title, highlighted series, source line.',
  },
  {
    out: 'detail-chart-gallery.webp',
    from: 'editor-chart-editor-ask-and-review.webp',
    // Build 1382 chart editor, left pane: Chart · Gantt chart by type, the
    // description line, the Ask field, "Chart ready — Review the suggested
    // changes", Revert / Apply, and the drawing. The encoding pickers and the
    // Chart text row below (and #288) are excluded.
    rect: { left: 540, top: 190, width: 1350, height: 720 },
    note: 'The chart editor: choose the type, ask Flow to change it, review the drawing.',
  },
  {
    out: 'detail-chart-flowchart.webp',
    from: 'guide-document-gallery-project-plan-both-panes.webp',
    // The Phases flowchart drawn in place under its heading.
    rect: { left: 1930, top: 950, width: 1280, height: 360 },
    note: 'A mermaid fence drawn in place in the document.',
  },
  {
    out: 'detail-grid.webp',
    from: 'editor-table-editor-annual-operating-review.webp',
    // The table editor: R5:C1 named in the reference bar, the grid with one
    // cell selected. Cut before the Q3 column so the pane edge (#289) is out.
    rect: { left: 1900, top: 190, width: 1060, height: 470 },
    note: 'The spreadsheet grid over the same Markdown table, one cell selected.',
  },
  {
    out: 'detail-search.webp',
    from: 'search-best-results-and-hit.webp',
    // Three results in the sidebar column: title, abstract, folder-qualified
    // path, and the match reason (Text · Line n / Related · Lines). Starts
    // below the query so no tail of an earlier result strays in; stops above
    // the rows that carry #278 and #279.
    rect: { left: 20, top: 520, width: 480, height: 670 },
    note: 'The search column: result abstracts, paths, and match reasons.',
  },
  {
    out: 'detail-gallery-words.webp',
    from: 'editor-image-editor-press-release-draft.webp',
    // The two typed fields: Alt text filled, Title showing its placeholder.
    rect: { left: 1900, top: 1080, width: 1330, height: 130 },
    note: 'The two typed fields: Alt text filled, Title showing its placeholder.',
  },
  {
    out: 'detail-gallery-collection.webp',
    from: 'editor-image-editor-press-release-draft.webp',
    // "In this document" with the current picture marked, then the assets
    // folder's first row with file names.
    rect: { left: 1900, top: 1230, width: 1330, height: 570 },
    note: 'The collection: the document first, then the folder, every file named.',
  },

  // ── Agency toolbar ──
  {
    out: 'detail-toolbar-preview.webp',
    from: 'agency-proofread-estimate.webp',
    // Build 1382 strip (bold · italic · size · Insert Image · Insert Chart ·
    // dictation · the seven agency marks) plus the Proofread estimate: 1159
    // words · whole document, No cost · Free — it runs on hardware you have,
    // advisor-gguf-q8_0 · Stays on this Mac · Decided by the rule. The shot
    // is frame-cropped to the document pane (see the manifest), so these
    // coordinates are in the cropped frame, which starts at x = 0.
    rect: { left: 880, top: 185, width: 1000, height: 390 },
    note: 'The strip plus Proofread\'s estimate: scope, cost, model, locality.',
  },
  {
    out: 'detail-toolbar-blocked.webp',
    // HELD: no release frame shows the blocked state yet (manifest gap).
    from: 'flow-editor-toolbar-blocked-shot.webp',
    rect: { left: 940, top: 110, width: 500, height: 230 },
    note: 'A blocked tool naming its own reason: "Already contains a table".',
  },

  // ── Your files ──
  {
    out: 'detail-add-folder.webp',
    from: 'files-add-folder-sheet.webp',
    // The Add Folder sheet's file pane: "Choose one or more folders of
    // Markdown files", the location picker on Flow Projects with its .md files
    // and assets folder, Cancel / Open Folder. The Finder sidebar to its left
    // (the operator's own favourites) is excluded on purpose. Request 3 of the
    // 20:53 gap list.
    rect: { left: 1490, top: 300, width: 1480, height: 900 },
    note: 'Add Folder: choose one or more folders of Markdown files; Flow sees only what you open.',
  },

  // ── Long documents ──
  {
    out: 'detail-parts.webp',
    // HELD: no release frame shows a multi-part review yet (manifest gap).
    from: 'flow-long-documents-shot.webp',
    rect: { left: 1470, top: 150, width: 1060, height: 205 },
    note: 'Part chips and the plain-counts coverage line.',
  },

  // ── Receipts ──
  {
    out: 'detail-run-cost.webp',
    from: 'agency-expand-landed-receipt.webp',
    // Same block as detail-expand-saved: the category cover for Receipts.
    rect: { left: 2580, top: 1740, width: 640, height: 292 },
    note: 'Recorded cost with its basis, then the model, provider, and locality.',
  },
  {
    out: 'detail-run-checks.webp',
    from: 'agency-expand-landed-receipt.webp',
    // Three named checks: Human review · Needs your acknowledgment · Checked;
    // Citations resolve · Stops the change · Checked; References are current ·
    // Warns you · Not required.
    rect: { left: 2580, top: 1250, width: 640, height: 320 },
    note: 'Three named checks: stored outcome marks beside current-consequence pills.',
  },
  {
    out: 'detail-run-binding.webp',
    from: 'first-launch-receipt-run-detail.webp',
    // Saved change: "This run's approved change is pinned to the exact saved
    // document", the before and after digests, Receipt valid.
    rect: { left: 1220, top: 1410, width: 660, height: 280 },
    note: 'Binding: the exact before/after digests and the receipt validity mark.',
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
