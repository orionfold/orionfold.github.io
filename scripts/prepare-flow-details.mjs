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
  // ── Writing you approve: re-cut 2026-08-20 on the 0144 re-shoot ──
  // The capture is now 2560x1607 (was 2560x1400) and the review surface is a
  // decision surface: one fact row, single-row check pills, the proposed
  // document leading with the change highlighted, and the human-review gate
  // in the decision footer beside the button it unblocks. Every rect below
  // was measured on that frame; a re-capture needs them re-measured.
  {
    out: 'detail-proposal.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // Header, tabs, the "1 Check to resolve" pill, and the effect sentence.
    rect: { left: 1518, top: 174, width: 1035, height: 108 },
    note: 'What Flow proposes: the effect sentence, read out of the proposed bytes.',
  },
  {
    out: 'detail-checks.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // The fact row (permission, sources, evidence counts) and the check pills.
    rect: { left: 1518, top: 268, width: 1035, height: 128 },
    note: 'One fact row and three named checks as pills: Passed, Not required, Not checked.',
  },
  {
    out: 'detail-result.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // The proposed document, scrolled to the corrected clause, highlighted.
    rect: { left: 1518, top: 411, width: 1035, height: 357 },
    note: 'The result leads: the proposed document with the change highlighted.',
  },
  {
    out: 'detail-diff.webp',
    from: 'flow-writing-you-approve-shot.webp',
    // The decision footer: the human-review checkbox, "1 Check to resolve",
    // and Approve & Save DISABLED. The homepage band uses this crop under
    // "Nothing is saved until you approve it", so the disabled button must
    // stay whole; never re-cut it with the button enabled.
    rect: { left: 1518, top: 1478, width: 1035, height: 117 },
    note: 'The decision footer: Approve & Save stays disabled until you tick the box.',
  },
  // ── Expand with Sources (0131), captured 2026-08-20 on the dev build ──
  {
    out: 'detail-expand-hover.webp',
    from: 'flow-expand-hover-panel-shot.webp',
    rect: { left: 905, top: 168, width: 545, height: 256 },
    note: 'The Ex panel before the click: 99 words, under a cent estimated, Claude Haiku 4.5, Leaves this Mac, the deciding rule.',
  },
  {
    out: 'detail-expand-consent.webp',
    from: 'flow-expand-consent-shot.webp',
    rect: { left: 936, top: 497, width: 688, height: 485 },
    note: 'The consent sheet: destination, named sources with size, the estimate to the digit, read access only.',
  },
  {
    out: 'detail-expand-banner.webp',
    from: 'flow-expand-run-banner-shot.webp',
    rect: { left: 366, top: 165, width: 1088, height: 106 },
    note: 'The run banner mid-flight: three lookups narrated, pause and stop one click away.',
  },
  {
    out: 'detail-expand-bound.webp',
    from: 'flow-expand-bound-shot.webp',
    rect: { left: 366, top: 124, width: 1088, height: 82 },
    note: 'The honest ending: the run reached its limit of 12 lookups and changed nothing.',
  },
  {
    out: 'detail-expand-lookups.webp',
    from: 'flow-expand-run-card-shot.webp',
    rect: { left: 1953, top: 466, width: 600, height: 576 },
    note: 'The run card: every lookup in order with its query, what it retrieved, and how long it took.',
  },
  {
    out: 'detail-expand-saved.webp',
    from: 'flow-expand-saved-change-shot.webp',
    rect: { left: 1953, top: 1066, width: 600, height: 372 },
    note: 'Recorded cost with model and provider, and the saved change pinned to its before and after digests.',
  },
  {
    out: 'detail-domains.webp',
    from: 'flow-domains-shot.webp',
    // RE-CUT 2026-08-18: the domains capture was re-shot after 0080 landed
    // (the old pixels said "offered to Auto", a name retired that day, and
    // showed a settings rail without Smart Routing). Provider connections
    // also moved above Execution Domains, so the old rectangle now landed on
    // the wrong rows. This cut is the Local domain header with its switch,
    // the locality-and-cost line, and the three provider rows each reading
    // "offered to Smart Routing".
    rect: { left: 430, top: 286, width: 990, height: 284 },
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
  {
    out: 'detail-toolbar-preview.webp',
    from: 'flow-editor-toolbar-shot.webp',
    // The toolbar chapter's proof crop (2026-08-18). Starts at the human tools
    // rather than at the first monogram on purpose: the claim is that ONE strip
    // carries both vocabularies either side of a divider, and a cut that began
    // at "Pr" would show only the AI half and quietly lose it.
    // Runs to the full height of the hover panel so all THREE cells survive —
    // scope, cost, route. Any shorter cut drops the route line, which is the
    // cell that says the work stays on this Mac.
    rect: { left: 940, top: 110, width: 500, height: 275 },
    note: 'The strip plus Proofread\'s panel: scope, "No cost", and the route.',
  },
  {
    out: 'detail-toolbar-blocked.webp',
    from: 'flow-editor-toolbar-blocked-shot.webp',
    // The refusal, which is a different claim from the preview and needs its
    // own picture: the tool stays visible and disabled, the panel replaces cost
    // and route with the REASON, and the scope cell survives because it is
    // still true. Two monograms are greyed here against one in the preview.
    rect: { left: 940, top: 110, width: 500, height: 230 },
    note: 'A blocked tool naming its own reason: "Already contains a table".',
  },
  {
    out: 'detail-toolbar-armed.webp',
    from: 'flow-editor-toolbar-expanded-shot.webp',
    // The RESTING armed state, with no panel over it. The preview and blocked
    // crops both have a popover covering half the strip; this is the only cut
    // where the divider between the two tool vocabularies is fully visible,
    // which is the thing the tool-strip chapter actually claims. Four monograms
    // live, one greyed — a ready tool and an unavailable one, side by side.
    rect: { left: 935, top: 110, width: 520, height: 90 },
    note: 'The whole strip at rest: human tools, divider, five AI marks.',
  },
  {
    out: 'detail-toolbar-menu.webp',
    from: 'flow-editor-toolbar-agency-menu-shot.webp',
    // The macOS Agency menu. Carries two claims one picture: the SAME five
    // monograms as the in-document strip (they cannot drift, per the brief),
    // and the submenu arrows on exactly the two actions that take a parameter.
    // Includes the menu-bar row above the dropdown on purpose — cropping to the
    // list alone would lose that this is the system menu bar and not a popover.
    rect: { left: 470, top: 0, width: 330, height: 210 },
    note: 'The Agency menu: five actions, one keyboard shortcut, two submenus.',
  },
  {
    out: 'detail-benchmarks-rows.webp',
    from: 'flow-benchmarks-shot.webp',
    // RE-CUT 2026-08-18 for 0134 A2, which re-shot the screen: the A1 rectangle
    // now lands on different rows. Ranks 1 and 2, collapsed, each carrying its
    // Balanced score. Deliberately TWO rows: the claim is a comparison, and one
    // row alone is a number with nothing to weigh it against. The pair also
    // carries A2's real surprise, that the two models win different axes — rank
    // 1 is quickest to a first word, rank 2 is the faster reader.
    rect: { left: 417, top: 415, width: 997, height: 290 },
    note: 'Ranks 1 and 2 with their Balanced scores: quickest vs fastest reader.',
  },
  {
    out: 'detail-benchmarks-scoring.webp',
    from: 'flow-benchmarks-scoring-shot.webp',
    // A2's strongest picture, and the brief says to lead with it if only one can
    // run: both rows expanded, each showing standing x weight = contribution per
    // axis, and a Total that matches the collapsed score exactly. That match is
    // the point — BenchmarkScore stores no total, so the expansion cannot drift
    // from the number it explains. Both rows and not one, because the claim is
    // that the weighting RESOLVED a genuine trade-off between them.
    rect: { left: 424, top: 417, width: 731, height: 479 },
    note: 'Two scores decomposed: standing, weight, contribution, and a matching total.',
  },
  {
    out: 'detail-benchmarks-preset.webp',
    from: 'flow-benchmarks-shot.webp',
    // The one-row ranking control. Carries three claims in one cut: the three
    // presets, the active weighting stated inline with each metric's own colour,
    // and the omission in plain sight ("Not ranked: instruction-following").
    // Runs down to include that line on purpose — a weighting shown without what
    // it leaves out is the half of the picture that flatters.
    rect: { left: 417, top: 322, width: 997, height: 95 },
    note: 'The preset row: three presets, the live weights, and what is not ranked.',
  },
  {
    out: 'detail-benchmarks-machine.webp',
    from: 'flow-benchmarks-shot.webp',
    // The machine strip beside the title. A leaderboard of local models is
    // meaningless without the Mac it was measured on, so this crop is what makes
    // the ranking above it checkable rather than decorative. Re-cut for the A2
    // capture: the strip sits lower, and free disk now reads 194 GB, not 192.
    rect: { left: 940, top: 150, width: 520, height: 100 },
    note: 'The machine the ranking is OF: chip, memory, cores, free disk.',
  },
  {
    out: 'detail-benchmarks-method.webp',
    from: 'flow-benchmarks-shot.webp',
    // The head of the method section, which is written from live state rather
    // than canned. SHORTER THAN THE A1 CUT BY NECESSITY: the A2 capture pushed
    // this section down, and only its first two entries clear the window's
    // bottom edge. The "Published specification" line that made the A1 crop
    // valuable is BELOW THE FOLD in this shot and cannot be cut from it, so the
    // published-vs-measured bandwidth claim now travels in prose alone until a
    // taller capture exists. Do not extend this rectangle to chase that line:
    // top+height may not exceed 1400, and the script throws if it does.
    rect: { left: 417, top: 1240, width: 997, height: 158 },
    note: 'The method head: 5 of 5 measured, and the honest not-comparable note.',
  },
  {
    out: 'detail-run-cost.webp',
    from: 'flow-run-card-shot.webp',
    // The receipts trifecta in one cut (2026-08-19): the recorded cost WITH its
    // basis ("Billed by the provider"), then the model, provider, and locality
    // under it. The basis line is the payload — the brief's whole point is that
    // a recorded cost states where the number came from — so the cut must never
    // shrink to the dollar figure alone. Staged demonstration receipts; the
    // page copy that travels with this crop says so.
    rect: { left: 1772, top: 716, width: 780, height: 212 },
    note: 'Recorded cost with its basis, then the model, provider, and locality.',
  },
  {
    out: 'detail-run-checks.webp',
    from: 'flow-run-card-shot.webp',
    // Each check row carries TWO separate encodings — the stored outcome mark
    // ("Checked") and the rule's CURRENT consequence as a pill ("Stops the
    // change", "Warns you", "Needs your acknowledgment") — because what a rule
    // observed then and what it would do now are different facts. All three
    // rows, so all three pill severities are in frame.
    rect: { left: 1772, top: 412, width: 780, height: 180 },
    note: 'Three named checks: stored outcome marks beside current-consequence pills.',
  },
  {
    out: 'detail-run-binding.webp',
    from: 'flow-run-card-shot.webp',
    // The before/after content digests the change is bound to, with the
    // receipt's validity mark. Runs to the card's bottom so "Receipt valid" is
    // whole — the mark is what makes the digests evidence rather than decor.
    rect: { left: 1772, top: 940, width: 780, height: 148 },
    note: 'Binding: the exact before/after digests and the receipt validity mark.',
  },
  {
    out: 'detail-run-timeline.webp',
    from: 'flow-run-card-shot.webp',
    // The Receipts timeline with the run group open: one Run entry holding all
    // six recorded events, each row wearing its own "Receipt valid" mark.
    // Deliberately includes the "Document version saved" entry BELOW the group
    // — it is History-only and outside the run, which is what proves the group
    // is a boundary and not just a visual fold. Portrait, pairs with copy.
    rect: { left: 1290, top: 280, width: 480, height: 630 },
    note: 'One run as one timeline entry: six events, each with its validity mark.',
  },
  {
    out: 'detail-evidence-verdict.webp',
    from: 'flow-evidence-gallery-shot.webp',
    // The gallery's answer-first card (2026-08-19): the overall score beside
    // its meter, the +4 change since the verified baseline, the Assessed state,
    // and the assessment's own recorded reason in one strip. The +4 renders
    // only because the exact baseline revision resolved in History byte for
    // byte — never caption this as available on earlier builds.
    rect: { left: 1292, top: 238, width: 1260, height: 130 },
    note: 'The verdict first: 89/100, its meter, the +4 change, and the reason.',
  },
  {
    out: 'detail-evidence-dimensions.webp',
    from: 'flow-evidence-gallery-shot.webp',
    // The top row of the dimension gallery: two rubric dimensions as cards,
    // each with its score, meter, weight, coverage, uncertainty, and a
    // Show-rationale disclosure. TWO cards, not one — the claim is that every
    // dimension gets the same card, and a single card cannot show sameness.
    rect: { left: 1292, top: 492, width: 1260, height: 170 },
    note: 'Two dimension cards: score, weight, coverage, uncertainty, rationale.',
  },
  {
    out: 'detail-evidence-restson.webp',
    from: 'flow-evidence-gallery-shot.webp',
    // The "What this rests on" strip: rubric and reference freshness, the
    // Compared state (baseline verified in History), coverage, uncertainty,
    // and when it was recorded. This is the crop that makes the 89 checkable
    // rather than decorative, so it must keep all six cells.
    rect: { left: 1292, top: 996, width: 1260, height: 92 },
    note: 'What the score rests on: freshness, Compared, coverage, uncertainty, time.',
  },
  {
    out: 'detail-routing-decided.webp',
    from: 'flow-smart-routing-shot.webp',
    // The chapter's headline claim in one cut (2026-08-18): the Allow Smart
    // Routing switch and, under it, the sentence that names both the routed
    // model AND the rule that chose it. The rule name is the payload, so the
    // cut runs to the closing quote after "whole document" and no further.
    rect: { left: 405, top: 310, width: 740, height: 82 },
    note: 'The switch plus the sentence naming the model and its deciding rule.',
  },
  {
    out: 'detail-routing-rules.webp',
    from: 'flow-smart-routing-shot.webp',
    // The whole rulebook: the on-screen sentence "Rules decide in order; the
    // first one that matches applies.", four ordered rules with live counts,
    // the Deciding badge on rule 1, the orange no-model state on rule 4, and
    // the Add Rule / Duplicate to Edit controls. Deliberately ALL of it: the
    // claim is that the entire decision procedure fits on one screen.
    rect: { left: 405, top: 392, width: 1040, height: 290 },
    note: 'Four ordered rules, live counts, the Deciding badge, and the editors.',
  },
  {
    out: 'detail-routing-norule.webp',
    from: 'flow-smart-routing-shot.webp',
    // The honesty states, tighter than the full rulebook so the orange line is
    // read rather than noticed: rule 2's "Would try … first" (a speed rule
    // built from this Mac's own measurements) above rule 4's "No model
    // qualifies right now." Starts at rule 2 so the Deciding badge stays out;
    // that is the previous crop's claim, not this one's.
    rect: { left: 405, top: 502, width: 1040, height: 144 },
    note: 'A rule that admits nothing qualifies, in orange, instead of hiding.',
  },
  {
    out: 'detail-routing-providers.webp',
    from: 'flow-smart-routing-shot.webp',
    // The provider order below the rules: all eight providers listed with the
    // not-enabled ones labeled rather than hidden. Runs to the card's bottom
    // border so "Claude Code · Not enabled" is whole; a sliced last row reads
    // as truncation, and the claim is exactly that nothing is truncated.
    rect: { left: 405, top: 685, width: 1040, height: 290 },
    note: 'All eight providers in the user\'s order, the off ones labeled.',
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
