// Enterprise adoption patterns for Orionfold Flow (moved out of flow.astro on
// 2026-08-20 so the overview can carry three cards and /flow/enterprise/ can
// carry all nine). Each card answers a question enterprise AI owners actually
// ask. "Today" marks behavior shipped and running now; "Direction"
// marks where the design is headed. Copy follows website-copy-style: plain
// words, no em dashes, no capability Flow does not have.

export interface EnterprisePattern {
  /** The question as an AI owner would ask it. */
  q: string;
  /** Short pattern name (card eyebrow). */
  k: string;
  /** The answer, inside the briefs' truth boundaries. */
  a: string;
  tag: 'Today' | 'Direction';
}

export const FLOW_ENTERPRISE: EnterprisePattern[] = [
  {
    q: 'How do we know which users need more AI and which need to cut back?',
    k: 'Allocation',
    a: 'Every action carries its own cost record. Local runs record no charge because none was owed. Billed runs record the observed charge, never an estimate. Spend becomes a per-person, per-action fact you can read, not a monthly surprise.',
    tag: 'Today',
  },
  {
    q: 'How do we control which documents AI may touch, and which AI may touch them?',
    k: 'Data classification',
    a: 'The folder is the classification. Flow only sees folders you open, and a document cannot reach outside its folder by naming a path. Four execution domains then decide where work may run: on the Mac, on your network, or in the cloud you already pay for.',
    tag: 'Today',
  },
  {
    q: 'How do we know who changed which part of a document, human or AI, and when?',
    k: 'Attribution',
    a: 'Text changes two ways only: an edit you typed, or a change you approved. Every AI change arrives as an exact diff with its own approval, and the receipt records what ran. Version history keeps that boundary readable later.',
    tag: 'Today',
  },
  {
    q: 'How do we apply guardrails at the source of knowledge work?',
    k: 'Guardrails',
    a: 'Checks run inside the document, at creation, as named rules with six honest states. An override never turns Failed into Passed. The decision is recorded and the failure stays visible. Rules live where the work happens, not in a policy PDF.',
    tag: 'Today',
  },
  {
    q: 'How do we compare the quality of one AI generation against another?',
    k: 'Evidence',
    a: 'Evidence is scored only where a measurement exists. A proofread reads "2 dimensions assessed, 3 need sources". A summary is deliberately not scored, because Flow refuses to print a number with no measurement behind it. When the same model writes and judges a change, the receipt says so.',
    tag: 'Today',
  },
  {
    q: 'How do we route each part of the work to the best model, provider, and place?',
    k: 'Routing',
    a: 'The domain is the decision; the provider is a detail. Long documents are improved part by part, so each part gets a right-sized run. A fallback that would leave your Mac stops and asks. Routing reads measured capability, never a vendor claim.',
    tag: 'Today',
  },
  {
    q: 'How do we curate structured value out of unstructured documents?',
    k: 'Curation',
    a: 'Convert Text to Table builds real structure from prose, and the review reports what was actually built, read from the proposed table itself, never from the model’s claim. The file stays plain Markdown, so the structure belongs to you.',
    tag: 'Today',
  },
  {
    q: 'How do we keep one system of record feeding many documents?',
    k: 'System of record',
    a: 'Plain files are the only authority. Search results carry anchors that are re-checked byte for byte before Flow highlights a passage, so a citation cannot silently drift. The index is disposable; your documents are the record.',
    tag: 'Today',
  },
  {
    q: 'How do we capture how our best people decide, without "big brother watching"?',
    k: 'Knowledge mining',
    a: 'The receipt is made by the worker, artifact by artifact, as a side effect of work they already wanted to do. They consent by name and get the trust benefit of the same record. That is the only capture a professional volunteers for.',
    tag: 'Direction',
  },
];

/** The three patterns the front doors tease; the page carries all nine. */
export const FLOW_ENTERPRISE_TEASER = FLOW_ENTERPRISE.filter((p) =>
  ['Data classification', 'Attribution', 'Knowledge mining'].includes(p.k),
);
