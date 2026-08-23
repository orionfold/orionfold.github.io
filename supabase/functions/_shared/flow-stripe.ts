/** Flow's Stripe credential seam.
 *
 * Flow is tested end to end against the Stripe SANDBOX while the live rails for
 * books, sponsors, Relay and Proof keep running against the live account. Those
 * rails all read `STRIPE_SECRET_KEY`, and Supabase secrets are PROJECT-wide
 * rather than per-function, so pointing that one name at test credentials would
 * stop live fulfilment for every other product — a real book buyer would pay and
 * receive nothing.
 *
 * So Flow reads its OWN names and falls back to the shared ones when they are
 * unset. Two consequences worth stating, because both are load-bearing:
 *
 *  - Setting `STRIPE_FLOW_SECRET_KEY` moves ONLY Flow to the sandbox. No live
 *    rail is touched, and there is no window where anything live is in test mode.
 *  - Leaving it unset is a no-op: every Flow surface behaves exactly as it did
 *    before this seam existed. That is what makes this safe to deploy ahead of
 *    the credential.
 */

/** Flow's Stripe secret key, falling back to the shared live key when unset. */
export function flowStripeSecretKey(): string {
  return Deno.env.get("STRIPE_FLOW_SECRET_KEY")?.trim() ||
    Deno.env.get("STRIPE_SECRET_KEY")?.trim() || "";
}

/** Flow's webhook signing secret, falling back to the shared one when unset. */
export function flowWebhookSecret(): string {
  return Deno.env.get("STRIPE_FLOW_WEBHOOK_SECRET")?.trim() ||
    Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim() || "";
}

/** True when Flow is pointed at its own credential rather than the shared one.
 *
 * Used for LOGGING only. Never branch fulfilment on this: the mode is a property
 * of the key, and Stripe itself refuses a test event signed with a live secret.
 */
export function flowUsesDedicatedCredential(): boolean {
  return Boolean(Deno.env.get("STRIPE_FLOW_SECRET_KEY")?.trim());
}
