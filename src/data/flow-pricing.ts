// Flow's Base/Pro capability split — the website's rendering of the product
// lane's verified table. Every row below is a capability the SHIPPED binary
// places on that side of the line, not an intention.
//
// REVISED 2026-08-22 from the 09:55 PDT B11 report, which corrected the original
// 01:14 table in five rows after the operator walked the product lane through
// the split four times. Two of those rows had promised free what is actually
// paid, which is the direction that generates refund requests. This file is the
// 09:55 version; do NOT rebuild it from the 01:14 entry.
//
// THE GOVERNING RULE, and it settles most questions without a table lookup:
//
//     If a model runs, it is Pro.
//     The record of what a model did is Base to read, Pro to produce.
//
// That second clause is the part a feature list hides: Receipts and Evidence do
// not sit on one side. A Base user SEES receipts, timeline, evidence scores and
// guardrail enforcement, populated and permanent. What they cannot do is produce
// more of them. That asymmetry is the actual upgrade argument.
//
// WHY THIS FILE EXISTS SEPARATELY FROM commerce.ts: the Base/Pro split is a
// CAPABILITY axis, not a price axis. Base has no SKU, no price, no entitlement
// string and no webhook path, because Base is the ABSENCE of an entitlement —
// the state the app's one gate already produces. commerce.ts owns the two Pro
// SKUs; this file owns what each side can do.
//
// ONE GATE. The product lane verified there is exactly one permission seam in
// the whole product: `LicensedAgencyRunner`, a decorator over the AgencyRunner
// protocol, reading one mapping (`TrialTerm.isAgencyPermitted`). Everything past
// it is Pro; everything else is Base by construction. That is why this table can
// be published without becoming a maintenance liability: it is a rendering of one
// boolean, not a list of scattered decisions that could drift.
//
// TRIPWIRE: the product lane treats any change to their table as a website-lane
// NOTIFICATION, not an FYI, precisely because a published comparison table is a
// sharper tripwire than a prose brief. If a B11 entry moves a capability across
// the line, change it HERE and the page follows.

/** The promise the whole split is built around. Quoted from the product lane. */
export const FLOW_PROMISE = "Your documents are free forever. The AI is what you pay for.";

/** Verbatim from the app's own withdrawal notice, so the page reuses a sentence
 * the binary enforces rather than a marketing paraphrase of it. */
export const FLOW_WITHDRAWAL_NOTICE =
  "Your text wasn't checked. Subscribe to keep using Flow's AI features — your documents stay open and editable either way.";

/** The rule that settles most Base/Pro questions without a table lookup, and the
 * asymmetry that is the real upgrade argument. Quoted from the product lane's
 * 2026-08-22 09:55 B11 report. */
export const FLOW_SPLIT_RULE = "If a model runs, it is part of the subscription.";

/** The read/produce split, stated for a reader rather than for a table. */
export const FLOW_TASTER_NOTE =
  "Flow keeps a permanent record of what its AI did: the receipts, the timeline, the evidence scores. You can read all of it for free, forever, even if you never subscribe. Producing more of it is the part you pay for.";

export interface FlowCapability {
  label: string;
  note: string;
}

/** Base — Flow unlicensed. No trial, no expiry, no account, no SKU.
 * Verified by C1857, which does NOT read a flag: it exercises the real document
 * path with entitlement resolved to `.lapsed` and asserts open, edit, save,
 * search and export all still work. */
export const FLOW_BASE_CAPABILITIES: FlowCapability[] = [
  { label: "Markdown editor", note: "Full editing, GFM, tables, footnotes, code blocks, images" },
  { label: "Reader", note: "Rendered view of any document" },
  { label: "Vault search", note: "Full text across every folder you have opened" },
  // Semantic search is Apple's NL framework, with no model routing, so it costs
  // nothing to run and stays free. The product lane calls it a hook: it is a
  // reason not to switch to another free editor.
  { label: "Search by meaning", note: "Finds related notes, not just matching words" },
  { label: "Open, edit, save, export", note: "The whole document lifecycle" },
  { label: "Wiki links and navigation", note: "Links, backlinks, folder tree" },
  { label: "Tables, grid view, charts", note: "Including the chart gallery" },
  { label: "Multiple folders", note: "Add as many as you like" },
  { label: "Tabs, panes, split view", note: "The whole workspace" },
  { label: "Flow Guide", note: "The bundled 28 document guide, plus 13 assets and its updates" },
  { label: "Dictation", note: "Voice input into a document" },
  { label: "Themes and settings", note: "Everything in Settings" },
  { label: "App updates", note: "Never gated by a licence, even after you cancel" },
  // The four tasters. These are the READ half of the read/produce split: a Base
  // user inspects a full record of what the AI did, permanently, and cannot add
  // to it. Added 2026-08-22 per the 09:55 B11 report.
  { label: "Read every receipt", note: "What ran, where it ran, and what it cost" },
  { label: "Read the timeline", note: "The history of changes to a document" },
  { label: "Read evidence scores", note: "How a past AI run was judged" },
  { label: "Guardrails", note: "The shipped rules check your text with no model involved" },
];

/** Pro — Base plus everything past the gate.
 * The local-model row is the line most likely to be got wrong in copy: the gate
 * sits ABOVE the runner protocol, so Ollama, MLX and llama.cpp are behind it
 * equally. "Bring your own model and it's free" is FALSE and must not ship. What
 * a subscriber pays for is Flow's agency layer — routing, tools, approvals,
 * receipts, guardrails — not the tokens. */
export const FLOW_PRO_CAPABILITIES: FlowCapability[] = [
  { label: "Everything in Base", note: "Pro adds to Base, it does not replace it" },
  { label: "All AI features", note: "Everything that sends text to a model" },
  { label: "Proofread, rewrite, summarise", note: "And the other agency actions" },
  { label: "Agentic runs", note: "Tool use, approvals and receipts" },
  { label: "Hosted providers", note: "Anthropic, OpenAI, and the rest, on your own key" },
  { label: "Local model routing", note: "Ollama, MLX, llama.cpp. Also part of Pro" },
  // Flow Runtime is Flow's own invention. It spends no tokens, but inventing,
  // provisioning and supporting it is real marginal cost, so it is Pro.
  { label: "Flow Runtime", note: "Flow's own model runtime, built in" },
  // Smart Routing is a shipped, named subsystem (RoutingRules.swift). It was
  // missing from the 01:14 table.
  { label: "Smart Routing", note: "Your rules pick the model, and the screen names the rule that decided" },
  // Flow Quick ("the global hotkey assistant") was REMOVED 2026-08-22 on the
  // product lane's 15:43 B11: it is withdrawn from the first paid release
  // (`68638ba`) and cannot be reached in a shipped build, so listing it as a Pro
  // capability would sell a feature a subscriber cannot use. Its claim-ledger row
  // moved to "Avoid without new evidence" rather than being deleted, because the
  // feature still exists in source and restoring it is one flag — so restore this
  // line only against a NEW product-lane entry saying it ships, never by reading
  // the source. Guarded in scripts/test/flow-flagship-surface.test.mjs.
  // The PRODUCE half of the split. Reading these is Base; making new ones is Pro.
  { label: "Produce new receipts", note: "Approving an AI change is what writes one" },
  { label: "Generate new evidence", note: "Running a fresh evaluation is an AI run" },
];

/** What Pro does NOT take away when it lapses. Each line is enforced, not
 * promised: the product lane verified them by exercising the document path with
 * the trial backdated, not by reading a flag. */
export const FLOW_LAPSE_FACTS: string[] = [
  "No document locks and no read only mode",
  "No export wall and no watermark",
  "Your files stay plain Markdown in your own folders",
  "App updates keep arriving, including security fixes",
];

// ── The download ──────────────────────────────────────────────────────────
// PLACEHOLDER. There is no public Flow DMG yet: no release has shipped with a
// moving CFBundleVersion, the appcast at /flow/appcast.xml is deliberately empty,
// and the DMGs cannot live in this public repo (GitHub rejects >100MB), so they
// need an operator-created public bucket.
//
// This constant exists so every Download CTA on the site reads from ONE place and
// the whole launched layout can be rehearsed locally. It is deliberately obvious
// rather than plausible, so it cannot be mistaken for a working link, and a test
// asserts it still contains PLACEHOLDER — that guard is what must be replaced
// before release, not merely the URL.
export const FLOW_DMG_URL = "https://PLACEHOLDER.invalid/flow/Flow.dmg";

/** True when the download URL is no longer the placeholder.
 *
 * OPERATOR DECISION 2026-08-22 20:47: the surfaces no longer branch on this —
 * every Download button is a live link regardless. Kept as the one place that
 * can still tell whether FLOW_DMG_URL points at a real host. */
export const FLOW_DOWNLOAD_READY = !FLOW_DMG_URL.includes("PLACEHOLDER");

/** Minimum macOS the signed build targets. Verified against the app's
 * deployment target before release. Kept for the FAQ answer, which is the place
 * a specific version genuinely helps a reader. */
export const FLOW_SYSTEM_REQUIREMENT = "macOS 26 or later, Apple silicon or Intel";

/** The line under every Download button. Three facts a reader wants before they
 * click: what it runs on, that clicking costs nothing, and what they get.
 *
 * THE NUMBER IS DELIBERATE AND CHECKED. 10 is the grant the app enforces
 * (ProDayGrant.installDays == 10, set by the operator 2026-08-22 08:11 and
 * verified by the product lane). It is expected to RISE, so it lives here as one
 * constant rather than being typed into each surface.
 *
 * "Included" not "free trial", and no countdown: a Pro Day is spent only on a
 * day the reader actually invokes AI, so "10 days" would be false. */
export const FLOW_DOWNLOAD_CAPTION = "Apple Mac. 10 Pro Days included. No credit card to use.";
