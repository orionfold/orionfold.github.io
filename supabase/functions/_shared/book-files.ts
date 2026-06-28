// Shared book-file delivery seam. Lists a book's folder in the private
// `book-files` Storage bucket, signs every PDF/EPUB it finds (7-day branded
// signed URLs), and sends the buyer-facing download email via Resend.
//
// Extracted from stripe-webhook/index.ts so BOTH the paid rail (stripe-webhook
// fulfillBook) and the FREE opt-in rail (confirm-email, for the
// become-ai-native-business magnet) deliver through one path — same signing,
// same branded host, same email body. Pure-mapping helpers (bookEmailText,
// brandedUrl) stay testable without a server; signBookFiles takes the supabase
// client so callers own client construction.

export const BOOK_FILES_BUCKET = "book-files";
export const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7; // 7-day signed download links

// Buyer-facing links use the branded vanity host, not the project-ref host that
// supabase-js builds from SUPABASE_URL. The signed token signs the object PATH
// (not the host), so the vanity domain serves the same file.
const PUBLIC_SUPABASE_URL = "https://orionfold.supabase.co";

export function brandedUrl(signedUrl: string): string {
  const internal = Deno.env.get("SUPABASE_URL");
  return internal ? signedUrl.replace(internal, PUBLIC_SUPABASE_URL) : signedUrl;
}

export type BookLink = { format: string; url: string };

/** List book-files/<lookupKey> and sign every PDF/EPUB found (filenames don't matter). */
export async function signBookFiles(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  lookupKey: string,
): Promise<BookLink[]> {
  const { data: files, error } = await supabase.storage
    .from(BOOK_FILES_BUCKET)
    .list(lookupKey);
  if (error || !files) {
    console.error("Storage list error:", error);
    return [];
  }

  const links: BookLink[] = [];
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

export function bookEmailText(bookLabel: string, links: BookLink[]): string {
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

export async function sendBookEmail(
  email: string,
  bookLabel: string,
  links: BookLink[],
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

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
