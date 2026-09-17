import {
  readLimitedBody,
  TOKEN,
} from "../flow-living-documents-signup/contract.ts";
export interface ConfirmDependencies {
  enabled(): boolean;
  site(): string;
  functionsBase(): string;
  hash(token: string): Promise<string>;
  confirm(tokenHash: string): Promise<"confirmed" | "already" | "invalid">;
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
          Location: `${site}/?living-documents-confirmed=${state}`,
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
    // HEAD and explicit prefetch requests are not the recipient following a link.
    if (
      request.method === "HEAD" ||
      /prefetch/i.test(
        request.headers.get("Sec-Purpose") || request.headers.get("Purpose") ||
          "",
      )
    ) {
      return new Response(null, { status: 204, headers });
    }
    const confirm = async (token: string) => {
      const result = await deps.confirm(await deps.hash(token));
      return redirect(
        result === "confirmed"
          ? "1"
          : result === "already"
          ? "already"
          : "error",
      );
    };
    if (request.method === "GET") {
      const tokens = url.searchParams.getAll("token");
      if (tokens.length !== 1 || !TOKEN.test(tokens[0])) {
        return redirect("error");
      }
      // Following the email link is the second opt-in. The homepage acknowledges
      // the result in its existing dismissible bar, without another action.
      try {
        return await confirm(tokens[0]);
      } catch {
        return new Response(
          "Email confirmation is temporarily unavailable. Please try your email link again.",
          { status: 503, headers },
        );
      }
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
      return await confirm(token);
    } catch {
      return new Response(
        "We could not confirm your subscription. Please retry.",
        { status: 503, headers },
      );
    }
  };
}
