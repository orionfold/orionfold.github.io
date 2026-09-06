import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type AlertEmail,
  createFlowEnterpriseHandler,
  type HandlerDependencies,
} from "./handler.ts";
import type { FlowEnterpriseInsert, SaveResult } from "./contract.ts";

const requestId = "db70013f-7d40-43ae-9852-b19fe121eb31";
const body = {
  requestId,
  name: "Grace Hopper",
  email: "grace@example.test",
  company: "Compiler Works",
  requirements:
    "A governed document workflow for a distributed engineering team.",
  licenses: 75,
  heardAbout: "Search",
  website: "",
};

function request(
  value: unknown = body,
  init: { method?: string; origin?: string; contentType?: string } = {},
): Request {
  return new Request("https://functions.example.test/flow-enterprise-request", {
    method: init.method ?? "POST",
    headers: {
      Origin: init.origin ?? "https://staging.example.test",
      "Content-Type": init.contentType ?? "application/json",
    },
    body: init.method === "GET" || init.method === "OPTIONS"
      ? undefined
      : JSON.stringify(value),
  });
}

function harness(overrides: Partial<HandlerDependencies> = {}) {
  const saved: FlowEnterpriseInsert[] = [];
  const emails: AlertEmail[] = [];
  const updates: unknown[] = [];
  let io = 0;
  const deps: HandlerDependencies = {
    enabled: () => true,
    allowedOrigins: () => ["https://staging.example.test"],
    corsHeaders: (req) => ({
      "Access-Control-Allow-Origin": req.headers.get("origin") ??
        "https://staging.example.test",
    }),
    requestFingerprint: async () => "fingerprint",
    hashPayload: async () => "same-payload",
    saveEnquiry: async (record): Promise<SaveResult> => {
      io++;
      saved.push(record);
      return {
        kind: "created",
        record: {
          id: "row-1",
          requestId,
          payloadHash: "same-payload",
          alertStatus: "pending",
          alertAttemptedAt: null,
          alertRequiresManualReview: false,
        },
      };
    },
    updateAlert: async (_id, values) => {
      io++;
      updates.push(values);
      return true;
    },
    sendAlert: async (email) => {
      io++;
      emails.push(email);
      return "provider-message-1";
    },
    now: () => "2026-09-06T12:00:00.000Z",
    ...overrides,
  };
  return {
    handler: createFlowEnterpriseHandler(deps),
    saved,
    emails,
    updates,
    io: () => io,
  };
}

Deno.test("rejects a foreign origin before database or provider IO", async () => {
  const test = harness();
  const response = await test.handler(
    request(body, { origin: "https://foreign.example.test" }),
  );
  assertEquals(response.status, 403);
  assertEquals(test.io(), 0);
});

Deno.test("is default-disabled and rejects methods and content types strictly", async () => {
  const disabled = harness({ enabled: () => false });
  assertEquals((await disabled.handler(request())).status, 503);
  assertEquals(disabled.io(), 0);

  const active = harness();
  assertEquals(
    (await active.handler(request(undefined, { method: "GET" }))).status,
    405,
  );
  assertEquals(
    (await active.handler(request(body, { contentType: "text/plain" }))).status,
    415,
  );
  assertEquals(active.io(), 0);
});

Deno.test("rejects malformed and oversized JSON before persistence", async () => {
  const test = harness();
  const malformed = new Request(
    "https://functions.example.test/flow-enterprise-request",
    {
      method: "POST",
      headers: {
        Origin: "https://staging.example.test",
        "Content-Type": "application/json",
      },
      body: "{",
    },
  );
  assertEquals((await test.handler(malformed)).status, 400);
  const oversized = request({ ...body, requirements: "x".repeat(33_000) });
  assertEquals((await test.handler(oversized)).status, 413);
  assertEquals(test.io(), 0);
});

Deno.test("honeypot returns a minimal decoy receipt without IO", async () => {
  const test = harness();
  const response = await test.handler(request({ ...body, website: "bot" }));
  assertEquals(response.status, 202);
  assertEquals(await response.json(), {
    success: true,
    requestId,
    notificationStatus: "pending",
  });
  assertEquals(test.io(), 0);
});

Deno.test("persists before alert and returns only the minimal sent receipt", async () => {
  const order: string[] = [];
  const test = harness({
    saveEnquiry: async () => {
      order.push("save");
      return {
        kind: "created",
        record: {
          id: "row-1",
          requestId,
          payloadHash: "same-payload",
          alertStatus: "pending",
          alertAttemptedAt: null,
          alertRequiresManualReview: false,
        },
      };
    },
    sendAlert: async () => {
      order.push("alert");
      return "provider-message-1";
    },
  });
  const response = await test.handler(request());
  assertEquals(response.status, 200);
  assertEquals(order, ["save", "alert"]);
  assertEquals(await response.json(), {
    success: true,
    requestId,
    notificationStatus: "sent",
  });
  assertEquals(test.saved.length, 0);
});

Deno.test("uses a stable operator-only idempotency key and reply-to", async () => {
  const test = harness();
  await test.handler(request());
  assertEquals(test.emails.length, 1);
  assertEquals(test.emails[0].idempotencyKey, `flow-enterprise-${requestId}`);
  assertEquals(test.emails[0].replyTo, "grace@example.test");
  assertEquals(test.emails[0].to, "manav@orionfold.com");
  assertEquals(
    (test.updates[1] as { alertProviderId: string }).alertProviderId,
    "provider-message-1",
  );
});

Deno.test("a concurrent sent state prevents a second provider call", async () => {
  const test = harness({ updateAlert: async () => false });
  const response = await test.handler(request());
  assertEquals(response.status, 200);
  assertEquals((await response.json()).notificationStatus, "sent");
  assertEquals(test.emails.length, 0);
});

Deno.test("same-payload replay is idempotent and different payload conflicts", async () => {
  const replay = harness({
    saveEnquiry: async () => ({
      kind: "existing",
      record: {
        id: "row-1",
        requestId,
        payloadHash: "same-payload",
        alertStatus: "sent",
        alertAttemptedAt: "2026-09-06T11:00:00.000Z",
        alertRequiresManualReview: false,
      },
    }),
  });
  assertEquals((await replay.handler(request())).status, 200);
  assertEquals(replay.emails.length, 0);

  const conflict = harness({
    saveEnquiry: async () => ({
      kind: "existing",
      record: {
        id: "row-1",
        requestId,
        payloadHash: "different",
        alertStatus: "sent",
        alertAttemptedAt: "2026-09-06T11:00:00.000Z",
        alertRequiresManualReview: false,
      },
    }),
  });
  const response = await conflict.handler(request());
  assertEquals(response.status, 409);
  assertStringIncludes((await response.json()).error, "different details");
  assertEquals(conflict.emails.length, 0);
});

Deno.test("rate limit fails closed before provider delivery", async () => {
  const test = harness({ saveEnquiry: async () => ({ kind: "rate_limited" }) });
  const response = await test.handler(request());
  assertEquals(response.status, 429);
  assertEquals(test.emails.length, 0);
});

Deno.test("provider failure preserves the saved lead and returns pending", async () => {
  const test = harness({
    sendAlert: async () => {
      throw Object.assign(new Error("private provider detail"), {
        code: "provider_down",
      });
    },
  });
  const response = await test.handler(request());
  assertEquals(response.status, 202);
  assertEquals((await response.json()).notificationStatus, "pending");
  assertEquals(test.saved.length, 1);
  assertEquals(test.updates.length, 2);
  assertEquals(
    (test.updates[1] as { alertStatus: string }).alertStatus,
    "failed",
  );
});

Deno.test("an uncertain alert older than 23 hours is held for manual review", async () => {
  const test = harness({
    saveEnquiry: async () => ({
      kind: "existing",
      record: {
        id: "row-1",
        requestId,
        payloadHash: "same-payload",
        alertStatus: "pending",
        alertAttemptedAt: "2026-09-05T12:00:00.000Z",
        alertRequiresManualReview: false,
      },
    }),
  });
  const response = await test.handler(request());
  assertEquals(response.status, 202);
  assertEquals(test.emails.length, 0);
  assertEquals(test.updates.length, 1);
  assertEquals(
    (test.updates[0] as { alertRequiresManualReview: boolean })
      .alertRequiresManualReview,
    true,
  );
});

Deno.test("a retry preserves the first attempt time instead of extending the dedupe window", async () => {
  const firstAttempt = "2026-09-05T14:00:00.000Z";
  const test = harness({
    saveEnquiry: async () => ({
      kind: "existing",
      record: {
        id: "row-1",
        requestId,
        payloadHash: "same-payload",
        alertStatus: "failed",
        alertAttemptedAt: firstAttempt,
        alertRequiresManualReview: false,
      },
    }),
  });
  const response = await test.handler(request());
  assertEquals(response.status, 200);
  assertEquals(
    (test.updates[0] as { alertAttemptedAt: string }).alertAttemptedAt,
    firstAttempt,
  );
});

Deno.test("t0 uncertainty may retry at 22 hours but not replay at 44 hours", async () => {
  const firstAttempt = "2026-09-05T12:00:00.000Z";
  let currentTime = "2026-09-06T10:00:00.000Z";
  let sends = 0;
  const test = harness({
    now: () => currentTime,
    saveEnquiry: async () => ({
      kind: "existing",
      record: {
        id: "row-1",
        requestId,
        payloadHash: "same-payload",
        alertStatus: "failed",
        alertAttemptedAt: firstAttempt,
        alertRequiresManualReview: false,
      },
    }),
    sendAlert: async () => {
      sends++;
      throw Object.assign(new Error("uncertain provider outcome"), {
        code: "provider_uncertain",
      });
    },
  });

  assertEquals((await test.handler(request())).status, 202);
  assertEquals(sends, 1);
  currentTime = "2026-09-07T08:00:00.000Z";
  assertEquals((await test.handler(request())).status, 202);
  assertEquals(sends, 1);
  assertEquals(
    (test.updates.at(-1) as { alertRequiresManualReview: boolean })
      .alertRequiresManualReview,
    true,
  );
});
