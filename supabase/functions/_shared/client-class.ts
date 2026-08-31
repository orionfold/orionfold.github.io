// Client classification for checkout attribution (2026-08-31).
//
// WHY THIS EXISTS. Three live Checkout Sessions in one week expired with NOTHING
// filled in: no email, no country, no address, no customer. Stripe records the
// country the moment a real person touches the billing form, so all three left
// before typing a single character. Two carried an answer-engine `utm_source`
// (chatgpt.com, perplexity), which was initially read as "answer engines send
// buyers who then abandon checkout". That reading assumes a PERSON. An automated
// client - a crawler, a preview fetcher, or an AI agent driving a real browser -
// produces a byte-identical empty expired session, and the operator raised
// exactly that alternative.
//
// We could not tell the two apart, because nothing recorded WHAT asked for the
// session. This classifies the caller's User-Agent into a coarse bucket stored
// on the session metadata, so the next such session answers the question on its
// own instead of inviting a guess.
//
// DELIBERATE LIMITS:
//   * COARSE, NOT IDENTIFYING. We store a bucket ("bot", "browser", …) and a
//     short family label, never the raw UA string. The bucket is an analytics
//     signal about automation; it is not a person, a fingerprint, or a device id.
//   * A HINT, NOT A GATE. Nothing here blocks, rejects, or degrades a checkout.
//     A UA is self-reported and trivially spoofed, so a wrong guess must never
//     cost someone a purchase. Classification failure returns "unknown".
//   * HEADLESS IS NOT A VERDICT. `HeadlessChrome` marks automation honestly, but
//     a determined agent presents a stock browser UA. "browser" therefore means
//     "did not announce itself as automation", NOT "proven human". Read a
//     "browser" bucket together with the GA4 `begin_checkout` event: a Stripe
//     session with no matching GA4 event is the stronger automation signal,
//     because a real browser session fires both.

/** Coarse client buckets. Ordered from most to least certain about automation. */
export type ClientBucket =
  /** Self-declared crawler, spider, or scraper (googlebot, bingbot, gptbot, …). */
  | "bot"
  /** A known AI assistant / answer-engine fetcher (chatgpt-user, perplexitybot, …). */
  | "ai-agent"
  /** Browser automation that announces itself (headless, playwright, puppeteer). */
  | "headless"
  /** A scripted HTTP client, not a browser (curl, wget, python-requests, …). */
  | "http-client"
  /** Presents as an ordinary browser. NOT proof of a human - see note above. */
  | "browser"
  /** Absent or unparseable User-Agent. */
  | "unknown";

export interface ClientClass {
  bucket: ClientBucket;
  /** Short lowercase family label, e.g. "gptbot", "chrome", "curl". Never the raw UA. */
  family: string;
}

// Matched in order; the FIRST hit wins, so the most specific patterns lead.
// Each entry is [bucket, family, pattern]. Patterns are lowercase substrings or
// regexes tested against the lowercased UA.
const RULES: Array<[ClientBucket, string, RegExp]> = [
  // AI assistants and answer engines first: several send a UA that ALSO contains
  // a generic "bot" token, and the specific attribution is the whole point here.
  ["ai-agent", "gptbot", /gptbot/],
  ["ai-agent", "chatgpt-user", /chatgpt-user/],
  ["ai-agent", "oai-searchbot", /oai-searchbot/],
  ["ai-agent", "perplexity", /perplexity/],
  ["ai-agent", "claudebot", /claudebot|claude-web|anthropic-ai/],
  ["ai-agent", "google-extended", /google-extended/],
  ["ai-agent", "bytespider", /bytespider/],
  ["ai-agent", "ccbot", /ccbot/],
  ["ai-agent", "cohere", /cohere-ai/],
  ["ai-agent", "applebot-extended", /applebot-extended/],

  // Browser automation that identifies itself honestly.
  ["headless", "headless-chrome", /headlesschrome/],
  ["headless", "playwright", /playwright/],
  ["headless", "puppeteer", /puppeteer/],
  ["headless", "selenium", /selenium|webdriver/],
  ["headless", "phantomjs", /phantomjs/],

  // Scripted HTTP clients - never a person at a keyboard.
  ["http-client", "curl", /^curl\/|\bcurl\//],
  ["http-client", "wget", /\bwget\//],
  ["http-client", "python", /python-requests|python-urllib|aiohttp|httpx/],
  ["http-client", "node", /node-fetch|axios|undici|got\//],
  ["http-client", "java", /okhttp|apache-httpclient|java\//],
  ["http-client", "go", /go-http-client/],
  ["http-client", "ruby", /ruby|faraday/],
  ["http-client", "php", /guzzle|php\//],

  // Generic self-declared crawlers.
  ["bot", "googlebot", /googlebot/],
  ["bot", "bingbot", /bingbot|msnbot/],
  ["bot", "duckduckbot", /duckduckbot/],
  ["bot", "yandexbot", /yandex/],
  ["bot", "baiduspider", /baiduspider/],
  ["bot", "ahrefs", /ahrefsbot/],
  ["bot", "semrush", /semrushbot/],
  ["bot", "facebook", /facebookexternalhit|facebookcatalog/],
  ["bot", "twitter", /twitterbot/],
  ["bot", "slack", /slackbot|slack-imgproxy/],
  ["bot", "discord", /discordbot/],
  ["bot", "linkedin", /linkedinbot/],
  ["bot", "whatsapp", /whatsapp/],
  ["bot", "telegram", /telegrambot/],
  ["bot", "uptime", /uptimerobot|pingdom|statuscake|betteruptime/],
  ["bot", "lighthouse", /lighthouse|chrome-lighthouse|pagespeed/],
  // Catch-all LAST among bots so specific names above always win.
  ["bot", "generic-bot", /\bbot\b|crawler|spider|scraper|fetcher|monitoring/],

  // Ordinary browsers. Order matters: every one of these contains "safari" or
  // "mozilla", and Edge/Chrome both contain "chrome".
  ["browser", "edge", /\bedg(e|a|ios)?\//],
  ["browser", "opera", /\bopr\/|opera/],
  ["browser", "samsung", /samsungbrowser/],
  ["browser", "firefox", /firefox\/|\bfxios\//],
  ["browser", "chrome", /\bchrome\/|\bcrios\//],
  ["browser", "safari", /\bsafari\//],
];

/**
 * Classify a User-Agent string into a coarse automation bucket.
 *
 * Returns `{bucket: "unknown", family: "none"}` for an absent or empty UA, and
 * `{bucket: "unknown", family: "unrecognized"}` for a UA we could not place -
 * the two are distinguished because an ABSENT UA is itself a strong automation
 * hint (every real browser sends one), while an unrecognized one usually means
 * a browser or client we simply have no rule for yet.
 */
export function classifyUserAgent(ua: string | null | undefined): ClientClass {
  if (!ua || !ua.trim()) return { bucket: "unknown", family: "none" };
  const s = ua.toLowerCase();
  for (const [bucket, family, pattern] of RULES) {
    if (pattern.test(s)) return { bucket, family };
  }
  return { bucket: "unknown", family: "unrecognized" };
}

/**
 * Build the metadata keys recorded on a Stripe Checkout Session.
 *
 * Two keys, both coarse and both safe to read in the Stripe dashboard:
 *   client_bucket - the automation bucket
 *   client_family - the short family label
 *
 * Stripe caps a metadata VALUE at 500 chars; these are far shorter. We add two
 * keys to a map that already holds up to ~12, well inside Stripe's 50-key limit.
 */
export function clientMetadata(ua: string | null | undefined): Record<string, string> {
  const { bucket, family } = classifyUserAgent(ua);
  return { client_bucket: bucket, client_family: family };
}
