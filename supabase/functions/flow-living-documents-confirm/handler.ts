import {
  CONSENT_TEXT,
  readLimitedBody,
  TOKEN,
} from "../flow-living-documents-signup/contract.ts";
export interface ConfirmDependencies {
  enabled(): boolean;
  site(): string;
  functionsBase(): string;
  hash(token: string): Promise<string>;
  confirm(tokenHash: string): Promise<boolean>;
}
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]!),
  );
}
const headers = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
export function createConfirmHandler(deps: ConfirmDependencies) {
  return async (request: Request): Promise<Response> => {
    let site: string;
    let endpoint: URL;
    try {
      site = deps.site();
      endpoint = new URL(
        `${deps.functionsBase()}/flow-living-documents-confirm`,
      );
    } catch {
      return new Response("Unavailable", { status: 503, headers });
    }
    const redirect = (state: string) =>
      new Response(null, {
        status: 303,
        headers: {
          Location:
            `${site}/manifesto/?living-documents-confirmed=${state}#email-updates`,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex",
        },
      });
    if (!deps.enabled()) {
      return new Response("Email confirmation is not available yet.", {
        status: 503,
        headers,
      });
    }
    const url = new URL(request.url);
    if (request.method === "GET") {
      const token = url.searchParams.get("token") || "";
      if (!TOKEN.test(token)) return redirect("error");
      // Opening an email link does not consume consent. The person confirms with POST.
      const html =
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your Flow updates</title><style>body{font-family:system-ui,sans-serif;max-width:34rem;margin:10vh auto;padding:24px;line-height:1.6;color:#172321;background:#f8faf9}h1{font-size:2.2rem;line-height:1.1}button{padding:15px 24px;border:0;border-radius:4px;background:#e5483b;color:#fff;font-size:1rem;font-weight:700;cursor:pointer}p{margin:24px 0}</style></head><body><h1>Keep the method close.</h1><p>${
          escape(CONSENT_TEXT)
        }</p><form method="post" action="${
          escape(endpoint.href)
        }"><input type="hidden" name="token" value="${token}"><button type="submit">Confirm subscription</button></form><p>Did not request this? Close this page. Nothing changes until you confirm.</p></body></html>`;
      return new Response(html, { status: 200, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== endpoint.origin && origin !== site) {
      return new Response("Unavailable", { status: 403, headers });
    }
    if (
      !request.headers.get("content-type")?.startsWith(
        "application/x-www-form-urlencoded",
      )
    ) return new Response("Unsupported request", { status: 415, headers });
    try {
      const token =
        new URLSearchParams(await readLimitedBody(request, 1024)).get(
          "token",
        ) || "";
      if (!TOKEN.test(token)) return redirect("error");
      return redirect(
        await deps.confirm(await deps.hash(token)) ? "1" : "error",
      );
    } catch {
      return new Response(
        "We could not confirm your subscription. Please retry.",
        { status: 503, headers },
      );
    }
  };
}
