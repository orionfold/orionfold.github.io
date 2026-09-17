import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ACCEPTED_MESSAGE,
  canonicalPayload,
  confirmationEmail,
  confirmationUrl,
  CONSENT_TEXT,
  LEGACY_CONSENT_TEXT,
  OFFER,
  parseSignup,
  type SignupInput,
  SOURCE,
} from "./contract.ts";
import { createSignupHandler, type SignupDependencies } from "./handler.ts";
const email = ["reader", "example.test"].join("@");
const input = {
  requestId: "11111111-1111-4111-8111-111111111111",
  email,
  offer: OFFER,
  consent_text: CONSENT_TEXT,
  consent_accepted: true,
  source: SOURCE,
  attribution: { utm_campaign: "living" },
};
function request(body: unknown = input, origin = "https://orionfold.com") {
  return new Request(
    "https://service.test/functions/v1/flow-living-documents-signup",
    {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
function setup(overrides: Partial<SignupDependencies> = {}) {
  const calls: string[] = [];
  const deps: SignupDependencies = {
    enabled: () => true,
    allowedOrigins: () => ["https://orionfold.com"],
    prepare: async () => {
      calls.push("prepare");
      return { result: "send", claimVersion: 1, token: "a".repeat(64) };
    },
    suppressed: async () => false,
    deliver: async () => {
      calls.push("deliver");
      return "provider-receipt";
    },
    finish: async () => {
      calls.push("finish");
      return true;
    },
    ...overrides,
  };
  return { handler: createSignupHandler(deps), calls };
}
Deno.test("exact affirmative permission and known source are required; unrecognized metadata is discarded", () => {
  const parsed = parseSignup({
    ...input,
    email: email.toUpperCase(),
    metadata: { admin: true },
    attribution: {
      utm_campaign: "living",
      consent: "forged",
      utm_source: "bad\nfield",
    },
  }) as SignupInput;
  assertEquals(parsed.email, email);
  assertEquals(parsed.attribution, { utm_campaign: "living" });
  assertEquals(
    Object.keys(parsed).sort(),
    [
      "attribution",
      "consent_accepted",
      "consent_text",
      "email",
      "offer",
      "requestId",
      "source",
    ].sort(),
  );
  for (
    const patch of [
      { consent_accepted: false },
      { consent_accepted: "true" },
      { consent_text: "old permission" },
      { source: "flow-waitlist" },
      { offer: "flow-waitlist" },
      { requestId: "x" },
      { email: "invalid" },
    ]
  ) assertEquals(parseSignup({ ...input, ...patch }), null);
  assertEquals(
    canonicalPayload(parsed),
    canonicalPayload({ ...parsed, attribution: { ...parsed.attribution } }),
  );
});
Deno.test("origin and activation reject before storage or provider IO", async () => {
  for (const disabled of [false, true]) {
    const { handler, calls } = setup({ enabled: () => !disabled });
    assertEquals(
      (await handler(
        request(
          input,
          disabled ? "https://orionfold.com" : "https://evil.test",
        ),
      )).status,
      disabled ? 503 : 403,
    );
    assertEquals(calls, []);
  }
});
Deno.test("invalid body and consent do not write; honeypot uses same generic acknowledgement", async () => {
  const { handler, calls } = setup();
  assertEquals(
    (await handler(request({ ...input, consent_accepted: false }))).status,
    400,
  );
  const response = await handler(request({ ...input, website: "bot" }));
  assertEquals(response.status, 202);
  assertEquals((await response.json()).message, ACCEPTED_MESSAGE);
  assertEquals(calls, []);
  const huge = request({ ...input, padding: "x".repeat(9000) });
  assertEquals((await handler(huge)).status, 400);
  assertEquals(calls, []);
});
Deno.test("success is acknowledged only after provider and durable delivery receipts", async () => {
  const { handler, calls } = setup();
  const response = await handler(request());
  assertEquals(response.status, 202);
  assertEquals((await response.json()).message, ACCEPTED_MESSAGE);
  assertEquals(calls, ["prepare", "deliver", "finish"]);
});
Deno.test("already confirmed, suppressed and prior completed requests share a non-enumerating response", async () => {
  const { handler, calls } = setup({
    prepare: async () => ({ result: "accepted", claimVersion: 0, token: "" }),
  });
  const response = await handler(request());
  assertEquals(response.status, 202);
  assertEquals(await response.json(), { message: ACCEPTED_MESSAGE });
  assertEquals(calls, []);
});
Deno.test("suppression appearing after reservation prevents provider delivery", async () => {
  const { handler, calls } = setup({ suppressed: async () => true });
  assertEquals((await handler(request())).status, 202);
  assert(!calls.includes("deliver"));
});
Deno.test("database preparation failure does not send or claim email delivery", async () => {
  const { handler, calls } = setup({
    prepare: async () => {
      throw new Error("db");
    },
  });
  const response = await handler(request());
  assertEquals(response.status, 503);
  assertEquals(calls, []);
  assert(!(await response.text()).includes(ACCEPTED_MESSAGE));
});
Deno.test("provider rejection and uncertain delivery receipts remain retryable errors", async () => {
  for (
    const overrides of [{
      deliver: async () => {
        throw new Error("provider");
      },
    }, {
      deliver: async () => "",
    }, { finish: async () => false }]
  ) {
    const { handler } = setup(overrides);
    const response = await handler(request());
    assert([502, 503].includes(response.status));
    assert((await response.text()).includes("could not verify delivery"));
  }
});
Deno.test("transactional rate, lease and idempotency results never reach provider", async () => {
  for (
    const [result, status] of [["rate_limited", 429], ["busy", 503], [
      "expired",
      409,
    ], ["conflict", 409]] as const
  ) {
    const { handler, calls } = setup({
      prepare: async () => ({ result, claimVersion: 0, token: "" }),
    });
    assertEquals((await handler(request())).status, status);
    assertEquals(calls, []);
  }
});
Deno.test("unavailable suppression snapshot cannot deliver a confirmation", async () => {
  const { handler, calls } = setup({
    suppressed: async () => {
      throw new Error("suppression unavailable");
    },
  });
  assertEquals((await handler(request())).status, 502);
  assert(!calls.includes("deliver"));
});

Deno.test("current and legacy consent remain verbatim in storage input, payload identity and email", () => {
  const url = "https://service.test/confirm?token=" + "a".repeat(64);
  const footer = "Test unsubscribe footer";
  const parsedInputs: SignupInput[] = [];
  for (const consent of [CONSENT_TEXT, LEGACY_CONSENT_TEXT]) {
    const parsed = parseSignup({ ...input, consent_text: consent });
    assert(parsed !== null && parsed !== "honeypot");
    assertEquals(parsed.consent_text, consent);
    const message = confirmationEmail(url, footer, parsed.consent_text);
    assertEquals(
      message.subject,
      "Confirm your Flow updates and AI Native Newsletter",
    );
    assertEquals(
      message.text,
      `Confirm the email updates you requested:\n\n${consent}\n\nOpen this link, then select Confirm subscription:\n${url}\n\nThe link expires in seven days. If you did not request this, you can ignore this email.\n\n${footer}`,
    );
    parsedInputs.push(parsed);
  }
  assert(
    canonicalPayload(parsedInputs[0]) !== canonicalPayload(parsedInputs[1]),
  );
  assertEquals(
    canonicalPayload(parsedInputs[1]),
    JSON.stringify({
      email,
      offer: OFFER,
      consent: LEGACY_CONSENT_TEXT,
      source: SOURCE,
      attribution: { utm_campaign: "living" },
    }),
    "the legacy canonical payload remains byte-identical for retry hashes",
  );
  assertEquals(
    parseSignup({ ...input, consent_text: CONSENT_TEXT + " " }),
    null,
  );
  assertEquals(
    parseSignup({
      ...input,
      consent_text: LEGACY_CONSENT_TEXT + " More emails.",
    }),
    null,
  );
});

Deno.test("old and new retries deliver the exact permission accepted by each request", async () => {
  for (const consent of [LEGACY_CONSENT_TEXT, CONSENT_TEXT]) {
    const prepared: string[] = [];
    const delivered: string[] = [];
    const { handler } = setup({
      prepare: async (parsed) => {
        prepared.push(canonicalPayload(parsed));
        return {
          result: "send",
          claimVersion: prepared.length,
          token: "a".repeat(64),
        };
      },
      deliver: async (parsed, token) => {
        delivered.push(
          confirmationEmail(
            confirmationUrl(
              {
                site: "https://orionfold.com",
                functionsBase: "https://service.test/functions/v1",
              },
              token,
              parsed.consent_text,
            ),
            "Test footer",
            parsed.consent_text,
          ).text,
        );
        if (delivered.length === 1) {
          throw new Error("uncertain provider response");
        }
        return "provider-receipt";
      },
    });
    const body = { ...input, consent_text: consent };
    assertEquals((await handler(request(body))).status, 502);
    assertEquals((await handler(request(body))).status, 202);
    assertEquals(prepared.length, 2);
    assertEquals(prepared[0], prepared[1]);
    assertEquals(delivered[0], delivered[1]);
    assert(delivered[1].includes(consent));
  }
});

Deno.test("legacy retry links remain byte-identical while new Jobs links use the site's HTML confirmation page", () => {
  const token = "b".repeat(64);
  const environment = {
    site: "https://orionfold.com",
    functionsBase: "https://orionfold.supabase.co/functions/v1",
  };
  const oldUrl =
    `https://orionfold.supabase.co/functions/v1/flow-living-documents-confirm?token=${token}`;
  assertEquals(
    confirmationUrl(environment, token, LEGACY_CONSENT_TEXT),
    oldUrl,
  );
  assertEquals(
    confirmationUrl(environment, token, CONSENT_TEXT),
    `https://orionfold.com/flow/confirm/?token=${token}`,
  );
  const oldEmail = confirmationEmail(
    oldUrl,
    "Stable footer",
    LEGACY_CONSENT_TEXT,
  );
  assertEquals(
    confirmationEmail(
      confirmationUrl(environment, token, LEGACY_CONSENT_TEXT),
      "Stable footer",
      LEGACY_CONSENT_TEXT,
    ),
    oldEmail,
  );
  assertEquals(
    confirmationUrl(
      {
        site: "https://stage.example.test",
        functionsBase: "https://stage-service.example.test/functions/v1",
      },
      token,
      CONSENT_TEXT,
    ),
    `https://stage.example.test/flow/confirm/?token=${token}`,
  );
});
