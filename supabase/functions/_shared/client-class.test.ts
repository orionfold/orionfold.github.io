// Unit lock: checkout client classification (2026-08-31).
//
// The regression bar here is the INVERSE of reply-intent's. Nothing this module
// returns blocks a checkout, so a false positive costs an analytics label, not a
// sale. What actually matters is that the buckets stay HONEST:
//   1. A real browser must never be labelled automation - that would manufacture
//      the very "it was a bot" conclusion this code exists to test, which is
//      worse than the ambiguity it replaces.
//   2. A self-declared AI fetcher must be caught, because answering the operator's
//      question is the entire purpose.
//   3. An absent UA must stay distinguishable from an unrecognized one.
//
// Run: deno test supabase/functions/_shared/client-class.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyUserAgent, clientMetadata } from "./client-class.ts";

// --- Real browser UAs must classify as "browser" (the load-bearing cases) ---

Deno.test("Safari on macOS is a browser", () => {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "safari" });
});

Deno.test("Chrome on macOS is a browser, not Safari (both UAs say Safari)", () => {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "chrome" });
});

Deno.test("Edge is edge, not chrome (its UA contains both)", () => {
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "edge" });
});

Deno.test("Firefox is a browser", () => {
  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:129.0) Gecko/20100101 Firefox/129.0";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "firefox" });
});

Deno.test("Safari on iPhone is a browser", () => {
  const ua =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "safari" });
});

Deno.test("Chrome on Android is a browser", () => {
  const ua =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
  assertEquals(classifyUserAgent(ua), { bucket: "browser", family: "chrome" });
});

// --- AI assistants and answer engines: the reason this module exists ---

Deno.test("ChatGPT's user-initiated fetcher is an ai-agent", () => {
  const ua =
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot";
  assertEquals(classifyUserAgent(ua), { bucket: "ai-agent", family: "chatgpt-user" });
});

Deno.test("GPTBot is an ai-agent, not a generic bot", () => {
  const ua = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot";
  assertEquals(classifyUserAgent(ua), { bucket: "ai-agent", family: "gptbot" });
});

Deno.test("PerplexityBot is an ai-agent - it names the second answer engine in our data", () => {
  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PerplexityBot/1.0; +https://perplexity.ai/perplexitybot";
  assertEquals(classifyUserAgent(ua), { bucket: "ai-agent", family: "perplexity" });
});

Deno.test("ClaudeBot is an ai-agent", () => {
  const ua = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +claudebot@anthropic.com";
  assertEquals(classifyUserAgent(ua), { bucket: "ai-agent", family: "claudebot" });
});

Deno.test("an ai-agent UA containing the word 'bot' is NOT downgraded to generic-bot", () => {
  // GPTBot, PerplexityBot and ClaudeBot all contain the bare token "bot". If the
  // generic catch-all were ordered before them, every answer engine would collapse
  // into one unusable bucket and the operator's question would stay unanswered.
  for (const ua of ["GPTBot/1.1", "PerplexityBot/1.0", "ClaudeBot/1.0"]) {
    assertEquals(classifyUserAgent(ua).bucket, "ai-agent", ua);
  }
});

// --- Browser automation ---

Deno.test("headless Chrome is headless, not a browser", () => {
  const ua =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/128.0.0.0 Safari/537.36";
  assertEquals(classifyUserAgent(ua), { bucket: "headless", family: "headless-chrome" });
});

Deno.test("Playwright is headless", () => {
  assertEquals(classifyUserAgent("Mozilla/5.0 playwright/1.47").bucket, "headless");
});

// --- Scripted HTTP clients ---

Deno.test("curl is an http-client", () => {
  assertEquals(classifyUserAgent("curl/8.7.1"), { bucket: "http-client", family: "curl" });
});

Deno.test("python-requests is an http-client", () => {
  assertEquals(classifyUserAgent("python-requests/2.32.3"), { bucket: "http-client", family: "python" });
});

Deno.test("Go's default client is an http-client", () => {
  assertEquals(classifyUserAgent("Go-http-client/2.0"), { bucket: "http-client", family: "go" });
});

// --- Generic crawlers and link unfurlers ---

Deno.test("Googlebot is a bot", () => {
  const ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  assertEquals(classifyUserAgent(ua), { bucket: "bot", family: "googlebot" });
});

Deno.test("a link unfurler is a bot", () => {
  assertEquals(classifyUserAgent("facebookexternalhit/1.1").bucket, "bot");
  assertEquals(classifyUserAgent("Slackbot-LinkExpanding 1.0").bucket, "bot");
});

Deno.test("an unknown crawler falls back to generic-bot", () => {
  assertEquals(classifyUserAgent("Mozilla/5.0 (compatible; SomeNewCrawler/3.0)"), {
    bucket: "bot",
    family: "generic-bot",
  });
});

// --- The unknown cases, kept distinguishable on purpose ---

Deno.test("an ABSENT user-agent is unknown/none - itself an automation hint", () => {
  // Every real browser sends a UA. Its absence is meaningful, so it must not be
  // conflated with a UA we simply have no rule for.
  assertEquals(classifyUserAgent(null), { bucket: "unknown", family: "none" });
  assertEquals(classifyUserAgent(undefined), { bucket: "unknown", family: "none" });
  assertEquals(classifyUserAgent(""), { bucket: "unknown", family: "none" });
  assertEquals(classifyUserAgent("   "), { bucket: "unknown", family: "none" });
});

Deno.test("an unrecognized user-agent is unknown/unrecognized, NOT a bot", () => {
  // Guessing "bot" for anything unfamiliar would fabricate the conclusion under
  // test. An unplaceable UA is an admission of ignorance, not a verdict.
  assertEquals(classifyUserAgent("SomeFutureBrowser/1.0"), {
    bucket: "unknown",
    family: "unrecognized",
  });
});

// --- The metadata shape actually written to Stripe ---

Deno.test("clientMetadata emits exactly the two coarse keys, never the raw UA", () => {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
  const md = clientMetadata(ua);
  assertEquals(md, { client_bucket: "browser", client_family: "chrome" });
  // The raw UA must never reach Stripe metadata - it is far more identifying
  // than the bucket, and we only need the bucket to answer the question.
  assertEquals(Object.values(md).some((v) => v.includes("Mozilla")), false);
});

Deno.test("clientMetadata always returns both keys, even with no user-agent", () => {
  // The webhook and any later audit read these keys unconditionally; an absent
  // key would be indistinguishable from an old session written before this shipped.
  assertEquals(clientMetadata(null), { client_bucket: "unknown", client_family: "none" });
});

Deno.test("every metadata value stays well inside Stripe's 500-char cap", () => {
  const long = "Mozilla/5.0 " + "x".repeat(5000);
  for (const v of Object.values(clientMetadata(long))) {
    assertEquals(v.length < 100, true, `value too long: ${v.length}`);
  }
});
