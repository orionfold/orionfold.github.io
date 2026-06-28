// The single, shared sign-off for every customer-facing Orionfold email.
//
// CAN-SPAM requires a valid physical postal address in commercial email, and we
// add a plain-language opt-out. Keeping it here (not copied into each builder)
// means the address lives in ONE place and can never drift between the confirm
// email, the book-delivery email, and the license emails. Every Resend body in
// these functions ends with EMAIL_FOOTER.
//
// Voice: humanize, grade 3-5, no em-dashes (website-copy-style). The postal
// address is the Orionfold LLC CAN-SPAM address (allowed in tracked files); the
// only email we ever print is manav@orionfold.com.

export const EMAIL_FOOTER = `--
Orionfold
https://orionfold.com

Orionfold LLC · 2108 N St Ste N, Sacramento, CA 95816
Prefer not to hear from me? Reply and I'll close the loop, no follow-ups.
`;
