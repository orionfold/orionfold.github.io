// Reply-based unsubscribe intent (B14). Decides whether an inbound reply is an
// opt-out, so a person who asks in words gets the same suppression row as a
// person who clicks the tokenized footer link.
//
// Why this is a shared module and not inline in the fn: the classifier is the
// only interesting logic in the whole path, it is pure, and it needs to be
// unit-lockable without a Resend payload or a DB. The fn stays a thin adapter.
//
// The two failure modes are NOT symmetric, and that asymmetry drives every rule
// below:
//   FALSE NEGATIVE - we miss an opt-out. Bad: a compliance failure, and the exact
//     thing B14 exists to stop. But it degrades to today's behavior (a human
//     notices and patches it by hand), so it is recoverable.
//   FALSE POSITIVE - we suppress someone who did NOT ask. Worse: suppression is
//     absolute and crosses every lane, and it is invisible to the person it hits.
//     They simply stop hearing from us and nobody finds out. There is no bounce,
//     no error, no complaint. It is silent and effectively permanent.
// So this leans toward precision, and anything ambiguous is escalated to a human
// rather than guessed at. `review` is a first-class outcome, not a fallback.

export type ReplyIntent = "unsubscribe" | "review" | "ignore";

// Quoted history is the single biggest false-positive source. Every nurture email
// we send carries the word "unsubscribe" in its own CAN-SPAM footer, so a plain
// "does the body contain 'unsubscribe'" check matches EVERY reply we ever get,
// including "thanks, this was useful". We therefore strip the quoted original
// before looking at anything.
//
// These markers are the common client conventions. This is deliberately
// conservative: over-trimming costs us a `review` (a human looks), while
// under-trimming risks a false positive (silent wrongful suppression).
const QUOTE_MARKERS: RegExp[] = [
  /^>/,                                          // standard quote prefix
  /^\s*On .+ wrote:\s*$/i,                       // Gmail / Apple Mail
  /^\s*-{2,}\s*Original Message\s*-{2,}\s*$/i,   // Outlook
  /^\s*_{5,}\s*$/,                               // Outlook divider
  /^\s*From:\s.+$/i,                             // forwarded/replied header block
  /^\s*Sent from my \w+/i,                       // signature boundary
  /^--\s*$/,                                     // RFC 3676 signature delimiter
];

// Return only the text the human actually typed, dropping quoted history and
// signature. Everything from the first quote marker onward is discarded.
export function stripQuotedReply(body: string): string {
  const out: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (QUOTE_MARKERS.some((re) => re.test(line))) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

// Unambiguous opt-out phrasings. These are matched against the human-typed text
// only (post-strip) and anchored to word boundaries so "unsubscribed from the
// other list" style prose does not trip them accidentally.
const OPT_OUT: RegExp[] = [
  /\bunsubscribe\b/i,
  /\bunsub\b/i,
  /\bopt[\s-]?out\b/i,
  /\bremove me\b/i,
  /\btake me off\b/i,
  /\bstop (?:emailing|sending|contacting)\b/i,
  /\bno more emails?\b/i,
  /\bdon'?t (?:email|contact) me\b/i,
  /\bstop\b/i,          // bare "STOP" - the SMS convention, common in email too
  /\bdelete my (?:data|details|info)/i,
];

// Phrasings that MIGHT be an opt-out but are too easy to read wrong. A reply
// saying "not interested right now" is a sales signal, not necessarily a legal
// opt-out - but it is also exactly how many people phrase one. We refuse to
// guess: these go to a human. Suppressing on these would be a false positive
// risk; ignoring them outright would be a compliance risk.
const AMBIGUOUS: RegExp[] = [
  /\bnot interested\b/i,
  /\bwrong (?:person|address|email)\b/i,
  /\bwho are you\b/i,
  /\bhow did you get my\b/i,
  /\bstop\b.{0,20}\bplease\b/i,
  /\bplease\b.{0,20}\bstop\b/i,
];

// An auto-reply is not a human decision. Out-of-office bouncing back a nurture
// email must never be read as an opt-out, even though the quoted footer below it
// contains the word "unsubscribe" - the quote-strip usually handles that, but
// these headers are the reliable signal and we check them first.
export function isAutoReply(headers: Record<string, string> = {}): boolean {
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = String(v).toLowerCase();

  if (h["auto-submitted"] && h["auto-submitted"] !== "no") return true;
  if (h["x-autoreply"] || h["x-autorespond"]) return true;
  if (h["precedence"] && ["bulk", "auto_reply", "junk"].includes(h["precedence"])) return true;
  if (h["x-auto-response-suppress"]) return true;
  return false;
}

export interface ReplyClassification {
  intent: ReplyIntent;
  // Which rule fired, for the ops trail. Never contains the reply text itself.
  matched: string | null;
}

// Classify an inbound reply. `subject` is included because a lot of real opt-outs
// arrive as a bare subject line ("Unsubscribe") with an empty body.
export function classifyReply(
  subject: string,
  body: string,
  headers: Record<string, string> = {},
): ReplyClassification {
  if (isAutoReply(headers)) return { intent: "ignore", matched: "auto-reply" };

  const human = stripQuotedReply(body ?? "");
  // Subject lines are not quoted history, so they are safe to read whole - but a
  // reply subject is usually just "Re: <our subject>", and our subject could say
  // anything. We only trust a subject that is SHORT and essentially only the
  // opt-out word, which is the real-world "bare Unsubscribe subject" case.
  const subjectClean = (subject ?? "").replace(/^\s*(re|fwd?)\s*:\s*/i, "").trim();
  const subjectIsBareOptOut = subjectClean.length <= 24 &&
    OPT_OUT.some((re) => re.test(subjectClean));

  if (subjectIsBareOptOut) return { intent: "unsubscribe", matched: "subject" };

  for (const re of OPT_OUT) {
    if (re.test(human)) return { intent: "unsubscribe", matched: re.source };
  }
  for (const re of AMBIGUOUS) {
    if (re.test(human)) return { intent: "review", matched: re.source };
  }

  // A reply we cannot read as anything in particular is just a reply - a real
  // conversation with a human. Not our business to act on.
  return { intent: "ignore", matched: null };
}
