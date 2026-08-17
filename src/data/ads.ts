// Google Ads (AW) tag config — companion to the GA4 `G-` tag loaded in
// Layout.astro. Created for the 2026-Q2 Google Ads Search credit-ramp
// (account 683-585-5678). See MARKETING-HANDOFF.md for the full spec.
//
// These are PUBLIC client-side identifiers (same trust level as the GA4
// measurement id) — safe to ship in the static bundle. The `send_to` is the
// "Purchase" conversion action created in Google Ads (Conversion ID +
// Conversion label). If the operator ever rotates the action, this one file is
// the single place to update.

/** The Google Ads conversion ID, in Google-tag form (`AW-…`). */
export const GOOGLE_ADS_ID = 'AW-18188052159';

/**
 * `send_to` target for the "Purchase" conversion action
 * (`<conversion-id>/<conversion-label>`). Fired on a completed book purchase.
 * The action counts "Every" with different values per conversion, so always
 * pass the real `value` + `currency` (omitting value defaults it to $1).
 */
export const GOOGLE_ADS_PURCHASE_SEND_TO = 'AW-18188052159/_ievCN3Tm7YcEL_N3uBD';

/**
 * `send_to` target for a "Waitlist signup" conversion action, fired when a
 * subscriber CONFIRMS their double opt-in (not when they submit the form).
 *
 * Deliberately separate from the Purchase action above. A waitlist signup and a
 * book sale are different events with wildly different volumes and values;
 * pointing both at one action would teach Smart Bidding to chase whichever is
 * more frequent and quietly wreck bidding on the one that earns money.
 *
 * EMPTY until the operator creates the action in Google Ads (Tools ▸
 * Conversions ▸ New ▸ Website, category "Submit lead form", count ONE not
 * every, no value). Paste the `<conversion-id>/<conversion-label>` here and the
 * conversion starts firing on the next deploy. While empty, the confirmed-lead
 * GA4 event still fires and nothing errors, so a campaign can run on the GA4
 * key event alone until the native action exists.
 */
export const GOOGLE_ADS_LEAD_SEND_TO = '';
