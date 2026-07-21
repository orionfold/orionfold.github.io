// The single, shared sign-off for every customer-facing Orionfold email. CAN-SPAM
// requires a postal address + a clear opt-out. As of Phase-1 (relay #9) the opt-out
// is a tokenized one-click unsubscribe link, resolved per recipient. Keeping it here
// means the address + link shape live in ONE place and can never drift. EMAIL_FOOTER
// stays as the fallback for any no-email context (or if minting fails): a send must
// never be blocked, and the reply-to-opt-out line is still compliant. Voice:
// humanize, grade 3-5, no em-dashes. Only email we print is manav@orionfold.com.

import { getOrMintToken } from "./email-tokens.ts";
import {
  ORIONFOLD_LEGAL_NAME,
  ORIONFOLD_POSTAL_ADDRESS,
} from "./legal-identity.ts";

export const UNSUB_BASE = "https://orionfold.com/unsubscribe";

export const EMAIL_FOOTER = `--
Orionfold
https://orionfold.com

${ORIONFOLD_LEGAL_NAME} · ${ORIONFOLD_POSTAL_ADDRESS}
Prefer not to hear from me? Reply and I'll close the loop, no follow-ups.
`;

export function footerFor(token: string): string {
  return `--
Orionfold
https://orionfold.com

${ORIONFOLD_LEGAL_NAME} · ${ORIONFOLD_POSTAL_ADDRESS}
Prefer not to hear from me? Unsubscribe in one click:
${UNSUB_BASE}?t=${token}
`;
}

export async function footerForEmail(supabase: any, email: string): Promise<string> {
  try {
    const token = await getOrMintToken(supabase, email);
    return footerFor(token);
  } catch (err) {
    console.error("footerForEmail: token mint failed, using reply-opt-out fallback:", err);
    return EMAIL_FOOTER;
  }
}
