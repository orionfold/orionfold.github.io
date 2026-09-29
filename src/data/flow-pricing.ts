// Website presentation of Product's Flow capability contract (2.0 add-ons).
// Markdown stays free; Pro enables AI; Import and Publish are separate add-ons.
// Product owns enforcement, checkout and billing. B11 reports drive copy updates.

/** Website summary of the Product-owned Markdown, Pro and add-on split. */
export const FLOW_PROMISE = "Your Markdown stays free. Pro and its add-ons extend what you can do.";

/** Verbatim from the app's own withdrawal notice, so the page reuses a sentence
 * the binary enforces rather than a marketing paraphrase of it. */
export const FLOW_WITHDRAWAL_NOTICE =
  "Your text wasn't checked. Subscribe to keep using Flow's AI features — your documents stay open and editable either way.";

/** Product 2.0 capability split; add-ons require the Pro subscription. */
export const FLOW_SPLIT_RULE = "AI work needs Flow Pro. Import and Publish are separate add-ons that need Pro.";

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
 * search and Markdown saving all still work. */
export const FLOW_BASE_CAPABILITIES: FlowCapability[] = [
  { label: "Markdown editor", note: "Full editing, GFM, tables, footnotes, code blocks, images" },
  { label: "Reader", note: "Rendered view of any document" },
  { label: "Vault search", note: "Full text across every folder you have opened" },
  // Semantic search is Apple's NL framework, with no model routing, so it costs
  // nothing to run and stays free. The product lane calls it a hook: it is a
  // reason not to switch to another free editor.
  { label: "Search by meaning", note: "Finds related notes, not just matching words" },
  { label: "Open, edit and save Markdown", note: "Your files stay in your own folders" },
  { label: "Wiki links and navigation", note: "Links, backlinks, folder tree" },
  { label: "Tables, grid view, charts", note: "Including the chart gallery" },
  { label: "Multiple folders", note: "Add as many as you like" },
  { label: "Tabs, panes, split view", note: "The whole workspace" },
  { label: "Flow Guide", note: "The bundled 58 document guide, plus 24 assets, including seven Living Document folders and its updates" },
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

/** Website wording follows the approved plan-wide terms. Product owns the
 * equivalent checkout and transactional-email wording. */
export const FLOW_ADDONS = [
  { name: "Flow Import", description: "Import Word, Excel, PowerPoint and PDF into Markdown." },
  { name: "Flow Publish", description: "Publish PDF, GitHub Pages, EPUB, Word, Excel and PowerPoint." },
];
export const FLOW_ADDON_TERMS = "Each add-on is $10/month or $96/year per seat and needs Flow Pro. Add or remove it in Flow’s Billing settings. Cancelling Pro also ends its add-ons.";
export const FLOW_TRIAL_TERMS = "Try every paid feature, including Import and Publish, free for 10 Pro Days. Subscribe when you're ready.";
export const FLOW_CANCEL_TERMS =
  "Billed every month, or every year on the annual plan, until you cancel. " +
  "Cancel anytime in Flow, Settings ▸ Billing ▸ Manage Plan. " +
  "Your plan stays on until the paid period ends. No refunds, except where the law requires.";

/** What Pro does NOT take away when it lapses. Each line is enforced, not
 * promised: the product lane verified them by exercising the document path with
 * the trial backdated, not by reading a flag. */
export const FLOW_LAPSE_FACTS: string[] = [
  "No document locks and no read only mode",
  "Markdown editing and saving stay free; Import and Publish need their add-ons",
  "Your files stay plain Markdown in your own folders",
  "App updates keep arriving, including security fixes",
];

// Permanent download object maintained by Product; Website never edits it per release.
export const FLOW_DMG_URL = "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/Orionfold-Flow.dmg";

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
export const FLOW_DOWNLOAD_CAPTION = "For Mac OS. Base is free forever. 10 Pro days included. No credit card to use.";
