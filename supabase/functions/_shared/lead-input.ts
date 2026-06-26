// A6 — evolvable lead payload parser (the future-proof seam).
//
// Splits IO from logic the same way license-payload.ts splits from license.ts:
// the edge function does Deno.serve + DB IO; THIS does pure validation/routing
// and is unit-tested without a server. Contract rules (forward-compatible):
//   - Never remove/rename a field; never make an optional field required.
//   - Known fields  -> typed columns.
//   - Unknown extras -> metadata JSONB (so a new front-end field needs NO redeploy).
//   - ip/user_agent are derived SERVER-SIDE from headers (body values are forgeable).
import { z } from "https://esm.sh/zod@3?target=deno";

export type LeadColumns = {
  email: string;
  offer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  consent_text: string | null;
  ip_address: string;
  user_agent: string;
};

export type ParseResult =
  | { ok: true; columns: LeadColumns; metadata: Record<string, unknown> }
  | { ok: false; error: string };

// Known top-level keys: the honeypot + every field that maps to a typed column.
// Anything NOT here is an "unknown extra" routed to metadata JSONB.
const KNOWN_KEYS = new Set([
  "email", "website",
  "offer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "referrer", "consent_text",
]);

const LeadInput = z.object({
  email: z.string().trim().email(),
  website: z.string().optional(), // honeypot
  offer: z.string().max(120).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  referrer: z.string().max(2048).optional(),
  consent_text: z.string().max(2000).optional(),
}).catchall(z.unknown());

export function isHoneypotTripped(body: unknown): boolean {
  return typeof body === "object" && body !== null &&
    typeof (body as Record<string, unknown>).website === "string" &&
    (body as Record<string, unknown>).website !== "";
}

export function parseLeadInput(body: unknown, headers: Headers): ParseResult {
  const parsed = LeadInput.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const d = parsed.data;

  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    "unknown";
  const userAgent = headers.get("user-agent") || "";

  const metadata: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (!KNOWN_KEYS.has(k)) metadata[k] = v;
  }

  return {
    ok: true,
    columns: {
      email: d.email.trim().toLowerCase(),
      offer: d.offer ?? null,
      utm_source: d.utm_source ?? null,
      utm_medium: d.utm_medium ?? null,
      utm_campaign: d.utm_campaign ?? null,
      utm_term: d.utm_term ?? null,
      utm_content: d.utm_content ?? null,
      referrer: d.referrer ?? null,
      consent_text: d.consent_text ?? null,
      ip_address: ip,
      user_agent: userAgent,
    },
    metadata,
  };
}
