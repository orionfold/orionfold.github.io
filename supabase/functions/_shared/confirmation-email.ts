// A6 follow-up — offer-aware double-opt-in confirmation copy (the pure seam).
//
// Same split as lead-input.ts / license-payload.ts: the edge function does
// Deno.serve + Resend IO; THIS does pure offer -> {subject, body} mapping and
// is unit-tested without a server. Contract rules (forward-compatible):
//   - An unknown or null `offer` falls back to the story-subscription copy
//     (the historical default) so a new front-end offer never sends a broken
//     or empty email — same fail-safe stance as lead-input's .catchall.
//   - Add a new offer by adding a row to OFFER_COPY; no other change needed.
//   - Voice: humanize, grade 3-5, no em-dashes, no AI tells (website-copy-style).

export type ConfirmationEmail = { subject: string; text: string };

type OfferCopy = {
  subject: string;
  // The two pitch lines between "You're almost in." and the confirm link.
  // Keep each line short and concrete; describe what they'll actually receive.
  pitch: string;
};

// Story subscription = the historical default (offer null / "story" / unknown).
const DEFAULT_COPY: OfferCopy = {
  subject: "One click to get Orionfold stories",
  pitch:
    `You're almost in. Confirm your email and we'll send you
our stories.

Each one is a short, honest note from building Orionfold
in public. What we shipped, what broke, and what we
learned along the way. No spam, just the real build log.`,
};

// Named offers map to their own copy. The front end passes these strings as the
// `offer` field (see OfferSlot.astro callers): proof-playbook, founder-letter.
const OFFER_COPY: Record<string, OfferCopy> = {
  "proof-playbook": {
    subject: "One click to get the Proof playbook",
    pitch:
      `You're almost in. Confirm your email and we'll send you
the Proof playbook.

It's the short, honest guide to running our AI on your own
box and checking the receipts yourself. The same tests we
run, so you can prove which AI you can trust. No spam.`,
  },
  "founder-letter": {
    subject: "One click to get the founder letter",
    pitch:
      `You're almost in. Confirm your email and we'll send you
the next founder letter.

It's a monthly note from Manav on where AI is really
heading and what it means for owning your own stack.
One letter a month, no spam.`,
  },
  "become-ai-native-business": {
    subject: "One click for your free AI Native Business book",
    pitch:
      `You're almost in. Confirm your email and we'll send you
the free AI Native Business book, in PDF and EPUB, so you
can read it on any device.

You'll also join the AI For Everyone digest. One email a
week, no more, and you can leave any time.`,
  },
};

function copyFor(offer: string | null | undefined): OfferCopy {
  if (!offer) return DEFAULT_COPY;
  return OFFER_COPY[offer] ?? DEFAULT_COPY;
}

export function confirmationEmail(
  confirmUrl: string,
  offer: string | null | undefined,
): ConfirmationEmail {
  const { subject, pitch } = copyFor(offer);
  const text = `Hi,

${pitch}

Confirm your email:

${confirmUrl}

This link expires in 7 days. If you didn't sign up, ignore
this email.

--
Orionfold
https://orionfold.com
`;
  return { subject, text };
}
