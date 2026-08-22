// Claim values — how a licence reaches the Mac app in the seconds after
// checkout, without the buyer hand-importing a `.json` file from an email.
//
// TWO PATHS, AND THE ORDERING IS THE WHOLE DESIGN (website lane, 2026-08-22,
// operator decision after weighing the product lane's three options):
//
//   FLOOR  the app polls `flow-license-refresh` with the checkout session id
//          until the licence row exists. Always works. Survives a phone
//          checkout, a browser that blocks scheme handoffs, and a dismissed
//          "Open Flow?" dialog.
//   FAST   Stripe's success page opens the app's URL scheme carrying a claim,
//          and the app is licensed on arrival: no switching, no waiting state.
//
// The fast path sits ON TOP of the floor rather than instead of it. If the deep
// link fires, the licence is there instantly. If it does not, the app is already
// polling and the buyer never learns anything went wrong. That ordering is why
// the deep link can ship in a later build without changing this contract: the
// server hands back a session either way.
//
// WHY A CLAIM VALUE AND NOT THE SESSION ID ITSELF ON THE DEEP LINK. A URL scheme
// is claimable by any app on the machine — register the same scheme twice and
// macOS picks one, not necessarily ours. So whatever rides that channel must be
// worth almost nothing if intercepted. A claim value is therefore:
//
//   * SINGLE USE      — redeemed once, then dead. A replay gets nothing.
//   * SHORT LIVED     — minutes, not days. See CLAIM_TTL_SECONDS.
//   * SESSION BOUND   — it only ever yields the licence for the one checkout
//                       that minted it, so it cannot be pointed at another.
//   * NOT A CREDENTIAL— it does not authenticate anybody. It names one purchase.
//
// The session id alone is a poor fit for the deep link: it is not secret, it is
// visible in the browser URL bar on the success page, and it never expires. It
// is exactly right for POLLING, where the caller is the app that just started
// the checkout, and exactly wrong for a channel another app can claim.
import { createHash, randomBytes } from "node:crypto";

/** How long a claim may be redeemed after checkout completes.
 *
 * Fifteen minutes is chosen against the failure it must survive: Stripe's
 * webhook has to write the licence row before the claim is redeemed, and a
 * webhook retry after a transient failure can take minutes. A window of sixty
 * seconds would turn a recoverable webhook delay into a buyer holding a receipt
 * and no licence. */
export const CLAIM_TTL_SECONDS = 15 * 60;

/** The URL scheme the app will register for the fast path.
 *
 * NOT YET REGISTERED IN THE APP as of 2026-08-22 (verified: no CFBundleURLTypes
 * in App/Info.plist and no onOpenURL handler anywhere in the product). It lives
 * here so the server half is ready and both lanes name the same string.
 *
 * Publishing a scheme is the genuinely hard-to-reverse part: once a shipped
 * binary claims it, links in the wild expect it to keep working. Registering it
 * is only an Info.plist entry. */
export const FLOW_URL_SCHEME = "orionfold-flow";

/** The query parameter the claim rides on in the deep link. */
export const CLAIM_QUERY_PARAM = "token";

/** Mint a claim. Returns the raw value (goes to the buyer, once) and its digest
 * (goes to the database).
 *
 * ONLY THE DIGEST IS STORED. A stolen database dump then yields nothing
 * redeemable, the same reasoning that keeps password hashes out of plaintext.
 * The raw value exists only in the success URL. */
export function mintClaim(): { claim: string; digest: string } {
  // 32 bytes from the platform CSPRNG. base64url so it survives a URL without
  // percent-encoding, which keeps the deep link readable in a browser bar.
  const claim = randomBytes(32).toString("base64url");
  return { claim, digest: digestClaim(claim) };
}

/** Digest a claim for storage and lookup. SHA-256 is right here and bcrypt is
 * not: this is a 256-bit random value, not a human-chosen secret, so there is no
 * dictionary to slow down and nothing for a work factor to buy. */
export function digestClaim(claim: string): string {
  return createHash("sha256").update(claim).digest("hex");
}

/** Pull a claim out of a request body, accepting either spelling for the same
 * reason `licenseFromBody` does. */
export function claimFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const raw = b[`claim_${CLAIM_QUERY_PARAM}`] ?? b.claim ?? null;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/** Pull a Stripe checkout session id out of a request body. */
export function sessionIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const raw = b.session_id ?? b.sessionId ?? null;
  if (typeof raw !== "string" || raw.length === 0) return null;
  // Stripe checkout session ids are `cs_` prefixed. Refusing anything else is a
  // cheap way to keep this parameter from being pointed at other identifiers.
  return raw.startsWith("cs_") ? raw : null;
}

/** True once a claim is past its window. Expiry is checked against the stored
 * timestamp rather than trusted from the caller. */
export function claimIsExpired(mintedAtIso: string | null, nowMs = Date.now()): boolean {
  if (!mintedAtIso) return false;
  const mintedAt = Date.parse(mintedAtIso);
  if (Number.isNaN(mintedAt)) return true;
  return nowMs - mintedAt > CLAIM_TTL_SECONDS * 1000;
}

/** The deep link handed to the browser after checkout. */
export function claimDeepLink(claim: string): string {
  const query = `${CLAIM_QUERY_PARAM}=${encodeURIComponent(claim)}`;
  return `${FLOW_URL_SCHEME}://licence?${query}`;
}
