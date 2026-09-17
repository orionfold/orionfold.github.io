import {
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
const headers = {
  "Content-Type": "text/plain; charset=utf-8",
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
      const tokens = url.searchParams.getAll("token");
      if (tokens.length !== 1 || !TOKEN.test(tokens[0])) {
        return redirect("error");
      }
      // Supabase's shared domain serves GET HTML as plain text. Hand old email
      // links to the static site; only an explicit native form POST can confirm.
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${site}/flow/confirm/?token=${tokens[0]}`,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
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
      const tokens = new URLSearchParams(await readLimitedBody(request, 1024))
        .getAll("token");
      if (tokens.length !== 1 || !TOKEN.test(tokens[0])) {
        return redirect("error");
      }
      const token = tokens[0];
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
