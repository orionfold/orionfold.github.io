// "Why Flow" data points for the homepage and /flow/. Each is a verified or
// derived row from a published Flow 2.0 path walk (orionfold-flow articles,
// "Evidence" tables), linked to that path so a reader can check it. Never add
// an assumed or unknown row, a number from a held (draft) path, or a claim
// that a walk "ran overnight" or "took one press" (#775).

export interface WowPoint {
  id: string;
  value: string;
  /** One quotable line, grade 3–5 English. */
  line: string;
  /** The path it came from (content slug) and its label. */
  path: string;
  pathLabel: string;
  evidence: 'verified' | 'derived';
}

export const WOW: Record<string, WowPoint> = {
  brief43: { id: 'brief43', value: '43 s', line: 'A client brief with a source on every sentence, drafted on a MacBook.', path: 'recurring-client-brief', pathLabel: 'The recurring client brief', evidence: 'verified' },
  refresh: { id: 'refresh', value: '< 0.5 s', line: 'New month, new numbers. The “What changed” table redrew itself before the AI even started.', path: 'recurring-client-brief', pathLabel: 'The recurring client brief', evidence: 'verified' },
  cents: { id: 'cents', value: '~2¢', line: 'A month saved by running the brief on the Mac. You choose local to keep client files at home, not to save money.', path: 'recurring-client-brief', pathLabel: 'The recurring client brief', evidence: 'derived' },
  agent: { id: 'agent', value: '26.7 s', line: 'Codex proofread a pricing page. The file on disk did not change until we approved.', path: 'review-agents', pathLabel: 'Review what your agents wrote', evidence: 'verified' },
  tokens: { id: 'tokens', value: '21,831', line: 'Tokens an agent sent in to fix a 239-word page. Run it on the plan you already pay for, and read every edit first.', path: 'review-agents', pathLabel: 'Review what your agents wrote', evidence: 'verified' },
  watch: { id: 'watch', value: '1.6 s', line: 'Seven sources checked, three of them live web pages. On the next run, the Morning Briefing named the one that changed.', path: 'investor-update', pathLabel: 'The investor update and the watch', evidence: 'verified' },
  market: { id: 'market', value: '79 s', line: 'One line of question became 422 words about the market, with 11 of 13 sources cited.', path: 'investor-update', pathLabel: 'The investor update and the watch', evidence: 'verified' },
  figures: { id: 'figures', value: '25 of 25', line: 'Every figure in the AI draft matched its source file.', path: 'campaign-with-proof', pathLabel: 'Campaign with proof', evidence: 'verified' },
  footnotes: { id: 'footnotes', value: '12 of 12', line: 'Footnotes kept when Flow put the launch post into Spanish, in 15 seconds.', path: 'campaign-with-proof', pathLabel: 'Campaign with proof', evidence: 'verified' },
  proofread: { id: 'proofread', value: '~4 s', line: 'Four typos fixed in a repo’s spec, on the Mac. Only the two lines we approved changed.', path: 'docs-true-to-code', pathLabel: 'Docs that stay true to the code', evidence: 'verified' },
};
