import {
  ACCEPTED_MESSAGE,
  parseSignup,
  readLimitedBody,
  type SignupInput,
} from "./contract.ts";
export interface SignupDependencies {
  enabled(): boolean;
  allowedOrigins(): string[];
  prepare(
    input: SignupInput,
    request: Request,
  ): Promise<{ result: string; claimVersion: number; token: string }>;
  suppressed(email: string): Promise<boolean>;
  deliver(input: SignupInput, token: string): Promise<string>;
  finish(
    requestId: string,
    claimVersion: number,
    providerId: string | null,
  ): Promise<boolean>;
}
export function createSignupHandler(deps: SignupDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin") || "";
    let allowed: string[];
    try {
      allowed = deps.allowedOrigins();
    } catch {
      return new Response("Unavailable", { status: 503 });
    }
    const headers = {
      "Access-Control-Allow-Origin": allowed.includes(origin)
        ? origin
        : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    };
    const reply = (status: number, body: Record<string, unknown>) =>
      new Response(JSON.stringify(body), { status, headers });
    if (!allowed.includes(origin)) {
      return reply(403, { error: "This request is unavailable." });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return reply(405, { error: "Method not allowed." });
    }
    if (!deps.enabled()) {
      return reply(503, { error: "Email updates are not available yet." });
    }
    if (
      !request.headers.get("content-type")?.toLowerCase().startsWith(
        "application/json",
      )
    ) return reply(415, { error: "Expected a JSON request." });
    let input: SignupInput | "honeypot" | null;
    try {
      input = parseSignup(JSON.parse(await readLimitedBody(request)));
    } catch {
      return reply(400, {
        error: "Please check your email and consent, then try again.",
      });
    }
    if (input === "honeypot") return reply(202, { message: ACCEPTED_MESSAGE });
    if (!input) {
      return reply(400, {
        error:
          "Please enter a valid email and confirm the updates you want to receive.",
      });
    }
    let claim: Awaited<ReturnType<SignupDependencies["prepare"]>>;
    try {
      claim = await deps.prepare(input, request);
    } catch {
      return reply(503, {
        error: "We could not save your request. Please try again.",
      });
    }
    if (claim.result === "accepted") {
      return reply(202, { message: ACCEPTED_MESSAGE });
    }
    if (claim.result === "rate_limited") {
      return reply(429, { error: "Please wait an hour before trying again." });
    }
    if (claim.result === "busy") {
      return reply(503, {
        error:
          "Your request is still being processed. Please retry in one minute.",
      });
    }
    if (claim.result === "expired" || claim.result === "conflict") {
      return reply(409, { error: "Please refresh this page and try again." });
    }
    if (
      claim.result !== "send" || !Number.isInteger(claim.claimVersion) ||
      claim.claimVersion < 1
    ) {
      return reply(503, {
        error: "We could not prepare the confirmation email. Please try again.",
      });
    }
    try {
      if (await deps.suppressed(input.email)) {
        await deps.finish(input.requestId, claim.claimVersion, null);
        return reply(202, { message: ACCEPTED_MESSAGE });
      }
      const providerId = await deps.deliver(input, claim.token);
      if (
        !providerId ||
        !(await deps.finish(input.requestId, claim.claimVersion, providerId))
      ) {
        return reply(503, {
          error:
            "We could not verify delivery of the confirmation email. Please retry in one minute.",
        });
      }
      return reply(202, { message: ACCEPTED_MESSAGE });
    } catch {
      try {
        await deps.finish(input.requestId, claim.claimVersion, null);
      } catch { /* Retry uses the same provider idempotency key and token. */ }
      return reply(502, {
        error:
          "We could not verify delivery of the confirmation email. Please retry in one minute.",
      });
    }
  };
}
