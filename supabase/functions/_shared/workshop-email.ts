export type WorkshopEmailKind = "initial" | "reaccess" | "refund";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

export function workshopEmailContent(kind: WorkshopEmailKind, link: string) {
  const safeLink = escapeHtml(link);
  if (kind === "refund") {
    return {
      subject: "Confirm your Relay Operator Workshop refund",
      text: `Confirm your refund request within one hour:\n\n${link}\n\nYour access remains active until Stripe confirms the refund.`,
      html: `<p>Confirm your refund request within one hour:</p><p><a href="${safeLink}">Confirm refund</a></p><p>Your access remains active until Stripe confirms the refund.</p>`,
    };
  }
  const fresh = kind === "reaccess" ? "fresh " : "";
  return {
    subject: kind === "initial"
      ? "Your Relay Operator Workshop is ready"
      : "Your fresh Relay Operator Workshop link",
    text: `Your ${fresh}private workshop link works for seven days:\n\n${link}\n\nYou can request another link automatically from the workshop access page.`,
    html: `<p>Your ${fresh}private workshop link works for seven days:</p><p><a href="${safeLink}">Open the workshop</a></p><p>You can request another link automatically from the workshop access page.</p>`,
  };
}

export async function sendWorkshopEmail(args: {
  apiKey: string;
  from: string;
  replyTo?: string;
  to: string;
  kind: WorkshopEmailKind;
  link: string;
  idempotencyKey: string;
  apiUrl?: string;
  fetcher?: typeof fetch;
}): Promise<void> {
  if (!args.apiKey) throw new Error("RESEND_API_KEY is required");
  const content = workshopEmailContent(args.kind, args.link);
  const response = await (args.fetcher ?? fetch)(args.apiUrl ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": args.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from: args.from,
      reply_to: args.replyTo ?? "manav@orionfold.com",
      to: [args.to],
      ...content,
    }),
  });
  if (!response.ok) throw new Error(`transactional email failed (${response.status})`);
}
