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
import { getCatalogItem, STRIPE_API_VERSION } from "../_shared/catalog.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

// Deno runs on Web Crypto (no Node `crypto`), so signature verification must be
// the ASYNC path with a SubtleCrypto provider. `constructEvent` (sync) throws here.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const BOOK_FILES_BUCKET = "book-files";
const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7; // 7-day signed download links

// Buyer-facing download links use the branded vanity host, not the project-ref
// host that supabase-js builds from SUPABASE_URL. The signed token signs the
// object PATH (not the host), so the vanity domain serves the same file — same
// idiom the live waitlist fn uses for its confirm links.
const PUBLIC_SUPABASE_URL = "https://orionfold.supabase.co";

function brandedUrl(signedUrl: string): string {
  const internal = Deno.env.get("SUPABASE_URL");
  return internal ? signedUrl.replace(internal, PUBLIC_SUPABASE_URL) : signedUrl;
}

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
  if (session.mode === "subscription") {
    await fulfillSponsor(session);
  } else {
    await fulfillBook(session);
  }
}

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
}

/** List book-files/<lookupKey> and sign every PDF/EPUB found (filenames don't matter). */
async function signBookFiles(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  lookupKey: string,
): Promise<Array<{ format: string; url: string }>> {
  const { data: files, error } = await supabase.storage
    .from(BOOK_FILES_BUCKET)
    .list(lookupKey);
  if (error || !files) {
    console.error("Storage list error:", error);
    return [];
  }

  const links: Array<{ format: string; url: string }> = [];
  for (const file of files as Array<{ name: string }>) {
    const lower = file.name.toLowerCase();
    const format = lower.endsWith(".pdf") ? "PDF" : lower.endsWith(".epub") ? "EPUB" : null;
    if (!format) continue;

    const { data: signed, error: signError } = await supabase.storage
      .from(BOOK_FILES_BUCKET)
      .createSignedUrl(`${lookupKey}/${file.name}`, DOWNLOAD_TTL_SECONDS);
    if (signError || !signed?.signedUrl) {
      console.error("Sign error for", file.name, signError);
      continue;
    }
    links.push({ format, url: brandedUrl(signed.signedUrl) });
  }
  return links;
}

async function sendBookEmail(
  email: string,
  bookLabel: string,
  links: Array<{ format: string; url: string }>,
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold Studio <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: `Your copy of ${bookLabel} is ready`,
      text: bookEmailText(bookLabel, links),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    throw new Error(`Resend API error: ${res.status}`);
  }
}

function bookEmailText(bookLabel: string, links: Array<{ format: string; url: string }>): string {
  const downloads = links.map((l) => `${l.format}:\n${l.url}`).join("\n\n");
  return `Thank you for buying ${bookLabel}.

Here are your download links. You get both the PDF and the
EPUB, so you can read on any device.

${downloads}

These links work for 7 days. Save the files to your device
once you download them. Reply to this email if you hit any
trouble and we will help.

--
Orionfold
https://orionfold.com
`;
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
