// stripe-webhook — Stripe collects the money; this delivers the goods.
//
// Fulfillment is NEVER trusted to the success_url redirect (a user can hit it
// without paying, or close the tab before it loads). Stripe POSTs signed events
// here; we verify the signature against the RAW body, then act:
//   checkout.session.completed  book    → email time-limited signed PDF+EPUB links
//                               sponsor → persist customer + subscription + tier
//   invoice.paid                sponsor renewal succeeded → keep active
//   invoice.payment_failed      → mark past_due (Stripe Billing handles dunning)
//   customer.subscription.updated → sync tier / status / period
//   customer.subscription.deleted → revoke (active = false)
//
// Auth is the Stripe signature, not a JWT — so this function runs with
// verify_jwt = false (see supabase/config.toml). See STRIPE-HANDOFF.md §5.

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import {
  getCatalogItem,
  licenseFamilyForLookupKey,
  licenseProductForLookupKey,
  STRIPE_API_VERSION,
} from "../_shared/catalog.ts";
import type { LicenseProductDescriptor } from "../_shared/catalog.ts";
import { publicKeyFromSeed, signLicense, verifyLicense } from "../_shared/license.ts";
import {
  buildLicensePayload,
  licenseTerm,
  LICENSE_KEY_ID,
  LICENSE_SEATS,
} from "../_shared/license-payload.ts";
import { sendMetaPurchase } from "../_shared/meta-capi.ts";
import { BOOK_FILES_BUCKET, brandedUrl, sendBookEmail, signBookFiles } from "../_shared/book-files.ts";
import { footerForEmail } from "../_shared/email-footer.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

// Deno runs on Web Crypto (no Node `crypto`), so signature verification must be
// the ASYNC path with a SubtleCrypto provider. `constructEvent` (sync) throws here.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
// BOOK_FILES_BUCKET, DOWNLOAD_TTL_SECONDS, brandedUrl, signBookFiles,
// bookEmailText and sendBookEmail now live in ../_shared/book-files.ts so the
// free magnet rail (confirm-email) delivers through the same path.

// Private bucket for issued license files (both Arena Field Edition and Orionfold
// Proof — it's a generic, deny-all license store). The webhook uploads the signed
// license here and hands the buyer a signed URL their installer fetches (Arena's
// bootstrap REQUIRES OF_LICENSE_URL; Proof's `orionfold unlock --license-url` — in
// both cases the license is fetched over the URL, never a pre-placed file). The
// license id namespaces the path (OF-FE-… vs OF-PROOF-…), so the two never
// collide. 7-day TTL because the email link has no on-demand re-mint
// yet (entitlement-fetch / task f restores short-TTL); "reply for a fresh link"
// is the v1 fallback. The license is signed claims, not the moat (weights stay
// on HF for v1), so a long-lived URL is low risk.
const LICENSE_FILES_BUCKET = "field-edition";
const LICENSE_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

// The prod Ed25519 seed (base64) that signs real Arena Field Edition licenses.
// Set as a Supabase secret; pairs with the pubkey Spark embeds in TRUSTED_KEYS.
// Absent in non-prod → fulfillLicense records the sale but does not issue.
const LICENSE_SIGNING_SEED_ENV = "LICENSE_SIGNING_SEED_B64";

// Each licensed product draws license ids from its OWN Postgres sequence (via a
// service_role-only SECURITY DEFINER rpc — supabase-js can't call nextval
// directly). Keyed by the descriptor's `product` so adding a product is a data
// change here, not another ternary arm; an unmapped product throws in
// issueAndDeliverLicense rather than silently inheriting Arena's OF-FE- ids.
const LICENSE_ID_RPC: Record<string, string> = {
  "arena-field-edition": "next_fe_license_id",
  "orionfold-proof": "next_proof_license_id",
  "orionfold-relay": "next_relay_license_id",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** A Stripe field may be a bare id string or an expanded object; get the id. */
function asId(ref: unknown): string | null {
  if (typeof ref === "string") return ref;
  if (ref && typeof ref === "object" && "id" in ref) {
    return String((ref as { id: unknown }).id);
  }
  return null;
}

// WS#16-P1: the ad UTMs (+ gclid) that create-checkout-session stamped onto the
// Checkout Session metadata (from the landing-page capture) round-trip here into
// the `purchases` row, so a paid SALE attributes back to its ad tranche via the
// marketing purchases-export poller (relay #13). Each is nullable — organic
// purchases carry none. Meta cookies (fbp/fbc/fbclid) are NOT persisted; they
// flow to CAPI off session.metadata directly.
const PURCHASE_ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
] as const;

function attributionColumns(
  metadata: Stripe.Metadata | null | undefined,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of PURCHASE_ATTRIBUTION_KEYS) {
    out[key] = metadata?.[key] ?? null;
  }
  return out;
}

/** API 2026-04-22 moved the subscription ref onto invoice.parent; fall back to legacy. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // deno-lint-ignore no-explicit-any
  const inv = invoice as any;
  return (
    asId(inv.parent?.subscription_details?.subscription) ??
    asId(inv.subscription) ??
    asId(inv.lines?.data?.[0]?.parent?.subscription_item_details?.subscription)
  );
}

/** current_period_end moved onto the subscription item in recent API versions. */
function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  // deno-lint-ignore no-explicit-any
  const s = sub as any;
  const epoch = s.items?.data?.[0]?.current_period_end ?? s.current_period_end;
  return typeof epoch === "number" ? new Date(epoch * 1000).toISOString() : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // RAW body — any reserialization (e.g. req.json()) breaks the HMAC.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Signature verification failed:", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Other event types are acknowledged but not acted on.
        break;
    }
  } catch (err) {
    // Log and 500 so Stripe retries (the handlers are idempotent, so a retry is safe).
    console.error(`Handler error for ${event.type}:`, err);
    return new Response("Handler error", { status: 500 });
  }

  // Acknowledge fast.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ---------------------------------------------------------------------------
// checkout.session.completed — the first fulfillment touchpoint for both kinds.
// ---------------------------------------------------------------------------
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Dispatch on the catalog KIND, not the Checkout mode: both sponsor and the
  // Arena Field Edition renewal are subscription mode, and both book and the
  // Field Edition one-time/founding are payment mode. Kind is the unambiguous key.
  const kind = getCatalogItem(session.metadata?.lookup_key ?? "")?.kind ?? session.metadata?.kind;
  if (kind === "sponsor") {
    await fulfillSponsor(session);
  } else if (kind === "license") {
    await fulfillLicense(session);
  } else {
    await fulfillBook(session);
  }
}

// Arena Field Edition license fulfillment (license-fulfillment Phase 2, task 1d).
// A-hybrid (OPEN-1 decided 2026-06-13): issue a TOKEN-LESS orionfold.license/v1
// file (claims + term only, no GHCR pull_token) signed with the prod Ed25519 seed,
// persist the entitlement to fe_entitlements (the CRM/lifecycle truth), and email
// the signed file + setup steps. Two planes are written: `purchases` (the raw sale
// — its row count also enforces the founding-25 cap in create-checkout-session) and
// `fe_entitlements` (the issued license). See arena-field-edition-license-workflow-v1.md.
//
// Note: a prod-signed license verifies on a box only once Spark embeds the prod
// pubkey + ships a fieldkit wheel; sign + store + deliver works now. Subsequent
// ANNUAL renewals arrive as invoice.paid on the subscription (not a new Checkout)
// and are a fast-follow (entitlement-fetch / lifecycle) — no buyer is in renewal
// at launch. The renewal SKU's FIRST checkout issues a standard 12-month license
// here so a paid renewal is never dropped.
async function fulfillLicense(session: Stripe.Checkout.Session) {
  const lookupKey = session.metadata?.lookup_key ?? "";
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const item = getCatalogItem(lookupKey);
  // The product descriptor (Arena or Proof) drives the signed claims + delivery.
  const descriptor = licenseProductForLookupKey(lookupKey);

  if (!item || item.kind !== "license" || !descriptor || !email) {
    console.error("License fulfillment skipped — missing lookup_key/product/email:", {
      lookupKey,
      hasDescriptor: Boolean(descriptor),
      hasEmail: Boolean(email),
    });
    return;
  }

  const supabase = supabaseAdmin();

  // 1. Record the raw sale FIRST. The session id is UNIQUE, so a webhook
  //    re-delivery hits 23505 and we stop here — never re-issuing a second
  //    license. This same `purchases` row is what the founding-cap counter in
  //    create-checkout-session counts, so it must always be written.
  const { error: insertError } = await supabase.from("purchases").insert({
    stripe_session_id: session.id,
    stripe_customer_id: asId(session.customer),
    lookup_key: lookupKey,
    email,
    amount_total: session.amount_total,
    currency: session.currency,
    roadmap_item: session.metadata?.roadmap_item ?? null,
    ...attributionColumns(session.metadata),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      console.log("Duplicate license checkout.session.completed, already recorded:", session.id);
      return;
    }
    throw insertError;
  }

  // 2. Sign + store + deliver. The prod seed gates real issuance: without it we
  //    keep the recorded sale (delivered=false) for manual hand-issue. We never
  //    throw out of here — a 500 makes Stripe retry into the 23505 guard above,
  //    which would never re-issue anyway, so a failed delivery just leaves the row
  //    delivered=false for the operator to re-issue by hand.
  const seedB64 = Deno.env.get(LICENSE_SIGNING_SEED_ENV);
  if (!seedB64) {
    console.error("LICENSE_SIGNING_SEED_B64 unset — license recorded, NOT issued:", session.id, lookupKey);
  } else {
    try {
      await issueAndDeliverLicense(supabase, session, { lookupKey, descriptor, email, item });
    } catch (err) {
      console.error("License issuance/delivery failed (recorded, delivered=false):", session.id, err);
    }
  }

  // Meta CAPI Purchase parity (same as book/sponsor) — isolated, never throws.
  await sendMetaPurchase({
    eventId: session.id,
    email,
    amountCents: session.amount_total,
    currency: session.currency,
    lookupKey,
    fbp: session.metadata?.fbp ?? null,
    fbc: session.metadata?.fbc ?? null,
    fbclid: session.metadata?.fbclid ?? null,
  });
}

// Build → sign → self-verify → persist → deliver → mark delivered. Throws on any
// failure; the caller records the sale first and swallows the throw (see above).
async function issueAndDeliverLicense(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  session: Stripe.Checkout.Session,
  ctx: {
    lookupKey: string;
    descriptor: LicenseProductDescriptor;
    email: string;
    item: { label: string };
  },
) {
  const seedB64 = Deno.env.get(LICENSE_SIGNING_SEED_ENV)!;

  // License id from the product's sequence — the only nextval path (supabase-js
  // can't call nextval directly). Each product draws from its own sequence:
  // Arena OF-FE-…, Proof OF-PROOF-…, Relay OF-RELAY-…. Keyed by product (not a
  // Proof-or-else ternary) so a new product must map explicitly — an unmapped
  // product throws here rather than silently minting Arena ids. Drawn AFTER the
  // purchase insert so retries don't burn ids.
  const idRpc = LICENSE_ID_RPC[ctx.descriptor.product];
  if (!idRpc) {
    throw new Error(`No license-id sequence mapped for product "${ctx.descriptor.product}"`);
  }
  const { data: licenseId, error: idError } = await supabase.rpc(idRpc);
  if (idError || typeof licenseId !== "string") {
    throw idError ?? new Error(`${idRpc} returned no id`);
  }

  // Term from the sale moment; provenance from the line item + the charge.
  const term = licenseTerm(session.created);
  const priceId = await sessionPriceId(session);
  const purchaseId = asId(session.payment_intent) ?? asId(session.subscription);
  const name = session.customer_details?.name ?? null;

  const payload = buildLicensePayload({
    licenseId,
    product: ctx.descriptor.product,
    tier: ctx.descriptor.tier,
    entitlements: ctx.descriptor.entitlements,
    edition: ctx.descriptor.edition, // undefined for Proof → omitted from payload
    issuedTo: { email: ctx.email, name },
    issuedAt: term.issuedAt,
    notBefore: term.notBefore,
    expiresAt: term.expiresAt,
    provenance: { stripe_purchase_id: purchaseId, stripe_price_id: priceId },
  });

  // Sign with the prod seed, then self-verify against the seed's OWN public key
  // before delivery — a corrupted/misconfigured seed must never ship a license
  // that silently fails on the customer's box.
  const signature = await signLicense(payload, seedB64, LICENSE_KEY_ID);
  const pub = await publicKeyFromSeed(seedB64);
  if (!(await verifyLicense(payload, signature.value, pub))) {
    throw new Error(`License self-verify FAILED for ${licenseId} — refusing to deliver`);
  }

  const licenseFile = { payload, signature };
  const fileText = JSON.stringify(licenseFile, null, 2);

  // Host the signed file + mint a download URL for the installer's OF_LICENSE_URL.
  const installUrl = await uploadAndSignLicense(supabase, licenseId, fileText);

  // Persist the issued entitlement (CRM/lifecycle truth). onConflict on the
  // unique session id keeps it idempotent. token_ref stays null (A-hybrid).
  const { error: entError } = await supabase.from("fe_entitlements").upsert(
    {
      license_id: licenseId,
      key_id: LICENSE_KEY_ID,
      product: ctx.descriptor.product,
      edition: ctx.descriptor.edition ?? null, // null for Proof (column now nullable)
      tier: ctx.descriptor.tier,
      seats: LICENSE_SEATS,
      email: ctx.email,
      issued_to_name: name,
      issued_to_org: null,
      stripe_session_id: session.id,
      stripe_customer_id: asId(session.customer),
      stripe_subscription_id: asId(session.subscription),
      stripe_price_id: priceId,
      status: "active",
      issued_at: term.issuedAt,
      not_before: term.notBefore,
      expires_at: term.expiresAt,
      token_ref: null,
    },
    { onConflict: "stripe_session_id" },
  );
  if (entError) throw entError;

  // Deliver: the install command (signed URL inlined) + the file as a backup copy.
  // The command + setup steps differ per product (Arena boots on the Spark via the
  // getarena bootstrap; Proof installs from PyPI and runs the built-in Advisor pack
  // immediately — the signed URL is for `orionfold unlock` of future, non-bundled packs).
  await sendLicenseEmail(ctx.email, ctx.item.label, licenseId, fileText, installUrl, ctx.descriptor.product);

  // Mark delivered on both planes.
  const now = new Date().toISOString();
  await supabase
    .from("fe_entitlements")
    .update({ delivered: true, delivered_at: now, updated_at: now })
    .eq("stripe_session_id", session.id);
  await supabase
    .from("purchases")
    .update({ delivered: true, delivered_at: now })
    .eq("stripe_session_id", session.id);

  console.log("License issued + delivered:", licenseId, ctx.lookupKey, ctx.email);
}

/**
 * Upload the signed license file to the private bucket and return a signed
 * download URL (branded host) for the installer's OF_LICENSE_URL. Throws on
 * failure so the caller leaves the sale delivered=false for manual re-issue.
 */
async function uploadAndSignLicense(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  licenseId: string,
  fileText: string,
): Promise<string> {
  const path = `licenses/${licenseId}.json`;

  const { error: uploadError } = await supabase.storage
    .from(LICENSE_FILES_BUCKET)
    .upload(path, new Blob([fileText], { type: "application/json" }), {
      contentType: "application/json",
      upsert: true, // a re-issue overwrites; the 23505 guard already blocks dupes
    });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(LICENSE_FILES_BUCKET)
    .createSignedUrl(path, LICENSE_URL_TTL_SECONDS);
  if (signError || !signed?.signedUrl) {
    throw signError ?? new Error(`createSignedUrl returned no url for ${path}`);
  }
  return brandedUrl(signed.signedUrl);
}

/** The Stripe price id charged on this session (for license provenance). */
async function sessionPriceId(session: Stripe.Checkout.Session): Promise<string | null> {
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    return items.data[0]?.price?.id ?? null;
  } catch (err) {
    console.error("listLineItems failed for", session.id, err);
    return null;
  }
}

async function sendLicenseEmail(
  email: string,
  productLabel: string,
  licenseId: string,
  fileText: string,
  installUrl: string,
  product: string,
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  // Attach the signed file as a backup copy (UTF-8 base64 so unicode names
  // survive). The install itself uses the signed URL, not the attachment — both
  // products fetch the license over the signed URL (Arena's bootstrap requires
  // OF_LICENSE_URL; Proof's `orionfold unlock --license-url`), never a pre-placed
  // file.
  const fileB64 = encodeBase64(new TextEncoder().encode(fileText));

  // Product-specific fulfilment copy (each has a different install/unlock verb).
  // Keyed by product so a new product must supply its own template — an unmapped
  // product falls back to Arena's copy only as a last resort (should never happen
  // since fulfillLicense already gated on a known descriptor).
  const supabase = supabaseAdmin();
  const footer = await footerForEmail(supabase, email);
  const emailFor = LICENSE_EMAIL_TEXT[product] ?? arenaLicenseEmailText;
  const text = emailFor(productLabel, licenseId, installUrl, footer);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: `Your ${productLabel} license (${licenseId})`,
      text,
      attachments: [{ filename: "orionfold-license.json", content: fileB64 }],
    }),
  });

  if (!res.ok) {
    const resText = await res.text();
    console.error("Resend error:", res.status, resText);
    throw new Error(`Resend API error: ${res.status}`);
  }
}

function arenaLicenseEmailText(productLabel: string, licenseId: string, installUrl: string, footer: string): string {
  return `Thank you for buying ${productLabel}.

Your license number is ${licenseId}. Your license file is also
attached as a backup copy, so you always have it.

To set it up on your DGX Spark, run this one command. It has
your own private setup link, which works for 7 days:

curl -fsSL https://getarena.orionfold.com | OF_LICENSE_URL='${installUrl}' sh

That checks your license, installs everything, and brings Arena
up. Each time it starts it runs a quick check and writes a
receipt you can read.

If the link stops working before you install, just reply to this
email and we will send you a fresh one.

Your license keeps you up to date for 12 months.

${footer}`;
}

function proofLicenseEmailText(productLabel: string, licenseId: string, installUrl: string, footer: string): string {
  return `Thank you for buying ${productLabel}.

Your license number is ${licenseId}. Your license file is also
attached as a backup copy, so you always have it.

Install Orionfold Proof and open the cockpit:

uv tool install orionfold-proof
orionfold up

That opens the proof cockpit at http://localhost:8787. It runs
on your own machine and nothing leaves it.

You can start right away. The Advisor governance pack is built
in, so its dataset and a reference receipt are already there to
run the moment the cockpit opens. Pick it and press Run.

Later, when we ship a new pack you own, you add it with one
command. It checks your license over your own private link (it
works for 7 days), then installs the pack:

orionfold unlock <pack> --license-url='${installUrl}'

We will email you the download link for each new pack. If your
private link stops working before you add one, just reply to
this email and we will send you a fresh one.

Your license keeps you up to date for 12 months.

${footer}`;
}

function relayLicenseEmailText(productLabel: string, licenseId: string, installUrl: string, footer: string): string {
  return `Thank you for buying ${productLabel}.

Your license number is ${licenseId}. Keep the license file
attached to this email. Your private link below works for 7
days, but the attached file lasts, and you can add it any time
on any machine with:

relay license add <your-license-file>

Install Orionfold Relay:

npm i -g orionfold-relay

Then add the agency pack with this one command. It checks your
license over your own private link and installs the pack:

relay pack add relay-agency-pro --license-url='${installUrl}'

Your packs are yours forever. Renewal gets you the year's new
and updated packs and priority support.

If your private link stops working before you add the pack, just
reply to this email and we will send you a fresh one.

${footer}`;
}

// Product → fulfilment-email template. Add a product here (not another ternary
// arm) so the install/unlock verb stays product-correct.
const LICENSE_EMAIL_TEXT: Record<
  string,
  (productLabel: string, licenseId: string, installUrl: string, footer: string) => string
> = {
  "arena-field-edition": arenaLicenseEmailText,
  "orionfold-proof": proofLicenseEmailText,
  "orionfold-relay": relayLicenseEmailText,
};

async function fulfillBook(session: Stripe.Checkout.Session) {
  const lookupKey = session.metadata?.lookup_key ?? "";
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const item = getCatalogItem(lookupKey);

  if (!item || item.kind !== "book" || !email) {
    console.error("Book fulfillment skipped — missing lookup_key/email:", {
      lookupKey,
      hasEmail: Boolean(email),
    });
    return;
  }

  const supabase = supabaseAdmin();

  // Idempotency guard: the session id is UNIQUE. A duplicate insert (webhook
  // re-delivery) hits 23505 → we've already fulfilled, so don't email twice.
  const { error: insertError } = await supabase.from("purchases").insert({
    stripe_session_id: session.id,
    stripe_customer_id: asId(session.customer),
    lookup_key: lookupKey,
    email,
    amount_total: session.amount_total,
    currency: session.currency,
    roadmap_item: session.metadata?.roadmap_item ?? null,
    ...attributionColumns(session.metadata),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      console.log("Duplicate checkout.session.completed, already fulfilled:", session.id);
      return;
    }
    throw insertError;
  }

  const links = await signBookFiles(supabase, lookupKey);
  if (links.length === 0) {
    // The purchase is recorded (delivered=false); operator uploads files then re-delivers.
    console.error(`No files in ${BOOK_FILES_BUCKET}/${lookupKey} — book not delivered for`, session.id);
    return;
  }

  await sendBookEmail(email, item.label, links);

  await supabase
    .from("purchases")
    .update({ delivered: true, delivered_at: new Date().toISOString() })
    .eq("stripe_session_id", session.id);

  // Meta CAPI Purchase (2026-Q2 Meta Ads book test) — server-side twin of the
  // /thanks Pixel event, deduped on the session id. Placed AFTER the insert's
  // idempotency guard so webhook re-deliveries don't double-send, and isolated
  // so an ads-attribution hiccup can never affect fulfillment (it never throws).
  await sendMetaPurchase({
    eventId: session.id,
    email,
    amountCents: session.amount_total,
    currency: session.currency,
    lookupKey,
    fbp: session.metadata?.fbp ?? null,
    fbc: session.metadata?.fbc ?? null,
    fbclid: session.metadata?.fbclid ?? null,
  });
}

// ---------------------------------------------------------------------------
// Sponsor lifecycle.
// ---------------------------------------------------------------------------
async function fulfillSponsor(session: Stripe.Checkout.Session) {
  const subscriptionId = asId(session.subscription);
  const customerId = asId(session.customer);
  if (!subscriptionId || !customerId) {
    console.error("Sponsor fulfillment skipped — no subscription/customer on session", session.id);
    return;
  }

  const email = session.customer_details?.email ?? session.customer_email ?? null;

  // Upsert on the unique subscription id so a re-delivered event is a no-op update.
  const { error } = await supabaseAdmin()
    .from("sponsors")
    .upsert(
      {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        email,
        tier: session.metadata?.tier ?? null,
        lookup_key: session.metadata?.lookup_key ?? null,
        status: "active",
        active: true,
        roadmap_item: session.metadata?.roadmap_item ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  if (error) throw error;
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return; // not a subscription invoice
  const { error } = await supabaseAdmin()
    .from("sponsors")
    .update({ status: "active", active: true, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) throw error;
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  // Keep `active` true through Stripe Billing's retry/dunning; flip status so the
  // operator can nudge the sponsor to the portal. subscription.deleted revokes access.
  const { error } = await supabaseAdmin()
    .from("sponsors")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) throw error;
}

async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  const tier = sub.metadata?.tier ?? sub.items?.data?.[0]?.price?.lookup_key?.replace("sponsor_", "") ?? null;
  const lookupKey = sub.metadata?.lookup_key ?? sub.items?.data?.[0]?.price?.lookup_key ?? null;
  const active = sub.status === "active" || sub.status === "trialing";

  const { error } = await supabaseAdmin()
    .from("sponsors")
    .update({
      tier,
      lookup_key: lookupKey,
      status: sub.status,
      active,
      current_period_end: subscriptionPeriodEnd(sub),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);
  if (error) throw error;
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const { error } = await supabaseAdmin()
    .from("sponsors")
    .update({ status: "canceled", active: false, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);
  if (error) throw error;
}
