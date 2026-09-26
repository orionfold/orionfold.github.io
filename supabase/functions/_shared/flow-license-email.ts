// The licence email a Flow subscriber receives after checkout.
//
// Flow shipped without an entry in the webhook's LICENSE_EMAIL_TEXT map, so a
// Flow buyer fell through to Arena's copy: "set it up on your DGX Spark", the
// Arena install command, and a 12-month update promise. None of that is true for
// Flow. Found 2026-09-25 (ops ledger 2314); the operator approved the terms
// wording below the same night (ops ledger 2326).
//
// The terms sentences are the operator's approved wording, verbatim, including
// the cancel location (approved 2026-09-25 23:38, ops ledger 2338). They make no
// claim about how long the licence lasts.
import { getCatalogItem } from "./catalog.ts";

const FLOW_ANNUAL_LABEL = getCatalogItem("license_orionfold_flow_annual")?.label;

/** "month" or "year", from the label the catalog gives each Flow price. */
export function flowRenewalPeriod(productLabel: string): "month" | "year" {
  return productLabel === FLOW_ANNUAL_LABEL ? "year" : "month";
}

/** The approved subscription terms, for the plan this email is about. */
export function flowSubscriptionTerms(period: "month" | "year"): string {
  return `Flow Pro renews every ${period} until you cancel. ` +
    "Cancel anytime in Flow, Settings ▸ Billing ▸ Manage\u00a0Plan…; " +
    "Flow Pro stays on until the end of the period you've paid for. " +
    "Subscription payments are not refunded, except where the law requires it.";
}

/** Hard-wrap a paragraph to the width the rest of the licence emails use. */
export function wrapText(paragraph: string, width = 64): string {
  const lines: string[] = [];
  let line = "";
  // Breaks only on ordinary spaces, so a UI label joined with a no-break space
  // ("Manage\u00a0Plan…") never splits across two lines.
  for (const word of paragraph.split(/[ \t\n\r]+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

export function flowLicenseEmailText(
  productLabel: string,
  licenseId: string,
  installUrl: string,
  footer: string,
): string {
  // Every prose paragraph is wrapped by the same function, so a longer licence
  // number or plan name can never push a line past the width. The link and the
  // footer are left as they are: a wrapped URL stops being clickable.
  const prose = (paragraph: string) => wrapText(paragraph);
  return [
    prose(`Thank you for subscribing to ${productLabel}.`),
    prose(`Your license number is ${licenseId}. Your license file is attached to this email. Keep it somewhere safe.`),
    prose('Flow picks up your license by itself after checkout. If it did not, open Flow, choose "Add Licence…", and pick the attached file.'),
    prose("If the attachment is missing, this private link downloads the same file. It works for 7 days:"),
    installUrl,
    prose(`About your subscription: ${flowSubscriptionTerms(flowRenewalPeriod(productLabel))}`),
    prose("If you have a question, just reply to this email."),
    footer,
  ].join("\n\n");
}
