import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CONSENT_TEXT,
  OFFER,
  SOURCE,
} from "../flow-living-documents-signup/contract.ts";
import {
  afterCursor,
  type Cursor,
  cursorFilter,
  encodeCursor,
  mapReceipt,
  parseCursor,
  parseLimit,
  timestampKey,
} from "./contract.ts";
import { createExportHandler, type ExportDependencies } from "./handler.ts";
const fixtureCredential = "local-export-test-credential";
const stamp = "2026-09-06T19:20:40.123456+00:00";
function row(number: number, updated = stamp) {
  return {
    id: `11111111-1111-4111-8111-${String(number).padStart(12, "0")}`,
    email: `reader-${number}` + String.fromCharCode(64) + "example.invalid",
    offer: OFFER,
    consent_text: CONSENT_TEXT,
    source: SOURCE,
    requested_at: "2026-09-06T18:00:00+00:00",
    confirmed_at: updated,
    updated_at: updated,
  };
}
function request(params = "", credential = fixtureCredential) {
  return new Request(
    "https://service.test/functions/v1/flow-living-documents-export" + params,
    { headers: { Authorization: "Bearer " + credential } },
  );
}
function fixture(
  records: Record<string, unknown>[] = [],
  overrides: Partial<ExportDependencies> = {},
) {
  const reads: Cursor[] = [];
  let suppressedReads = 0;
  const deps: ExportDependencies = {
    expectedCredential: () => fixtureCredential,
    readReceipts: async (cursor, limit) => {
      if (cursor) reads.push(cursor);
      return records.filter((value) =>
        value.offer === OFFER && value.consent_text === CONSENT_TEXT &&
        value.confirmed_at &&
        afterCursor(value as ReturnType<typeof row>, cursor)
      ).slice(0, limit);
    },
    readSuppressions: async () => {
      suppressedReads++;
      return new Set();
    },
    ...overrides,
  };
  return {
    handler: createExportHandler(deps),
    reads,
    get suppressionReads() {
      return suppressedReads;
    },
  };
}
Deno.test("missing or incorrect auth cannot read receipt or suppression data", async () => {
  let calls = 0;
  const f = fixture([], {
    readReceipts: async () => {
      calls++;
      return [];
    },
  });
  for (
    const req of [
      request("", "wrong"),
      new Request("https://service.test/export"),
    ]
  ) assertEquals((await f.handler(req)).status, 401);
  assertEquals(calls, 0);
  assertEquals(f.suppressionReads, 0);
});
Deno.test("export is GET-only, private and non-cacheable", async () => {
  const f = fixture();
  assertEquals(
    (await f.handler(
      new Request("https://service.test/export", { method: "POST" }),
    )).status,
    405,
  );
  const response = await f.handler(request());
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), null);
  assertEquals(await response.json(), { rows: [], next_cursor: null });
});
Deno.test("tuple cursor preserves microseconds and orders tied timestamps by ID", () => {
  const a = row(1);
  const b = row(2);
  const cursor = parseCursor(encodeCursor(a))!;
  assertEquals(cursor.updated_at, stamp);
  assert(afterCursor(b, cursor));
  assert(!afterCursor(a, cursor));
  assert(afterCursor(row(1, "2026-09-06T19:20:40.123457+00:00"), cursor));
  assertEquals(
    timestampKey("2026-09-06T19:20:40.1Z"),
    "2026-09-06T19:20:40.100000",
  );
  assertEquals(
    cursorFilter(cursor),
    `updated_at.gt.${stamp},and(updated_at.eq.${stamp},id.gt.${a.id})`,
  );
});
Deno.test("invalid cursors and query grammar are rejected before DB reads", async () => {
  const f = fixture([row(1)]);
  const invalid = [
    encodeCursor({ updated_at: "not-a-date", id: row(1).id }),
    encodeCursor({ updated_at: stamp, id: "x),id.gt.a" }),
    "%%%",
    btoa(
      JSON.stringify({
        v: 1,
        updated_at: stamp,
        id: row(1).id,
        extra: "ignored",
      }),
    ),
  ];
  for (const cursor of invalid) {
    assertEquals(
      (await f.handler(request("?cursor=" + encodeURIComponent(cursor))))
        .status,
      400,
    );
  }
  for (const value of ["0", "-1", "501", "1.2", "10000", "1foo"]) {
    assertThrows(() => parseLimit(value));
  }
  assertEquals(parseLimit(null), 200);
  assertEquals(parseLimit("500"), 500);
  assertEquals(timestampKey("2026-02-31T01:00:00Z"), null);
  assertEquals(f.reads.length, 0);
});
Deno.test("cursor ties, page replay and exhaustion do not lose or duplicate identities", async () => {
  const f = fixture([
    row(1),
    row(2),
    row(3, "2026-09-06T19:20:40.123457+00:00"),
  ]);
  const first = await (await f.handler(request("?limit=1"))).json();
  assertEquals(first.rows[0].id, row(1).id);
  const secondRequest = request("?limit=1&cursor=" + first.next_cursor);
  const second = await (await f.handler(secondRequest)).json();
  assertEquals(second.rows[0].id, row(2).id);
  const replay =
    await (await f.handler(request("?limit=1&cursor=" + first.next_cursor)))
      .json();
  assertEquals(replay, second);
  const third =
    await (await f.handler(request("?limit=1&cursor=" + second.next_cursor)))
      .json();
  assertEquals(third.rows[0].id, row(3).id);
  const end = await (await f.handler(request("?cursor=" + third.next_cursor)))
    .json();
  assertEquals(end, { rows: [], next_cursor: null });
});
Deno.test("later confirmation on an existing identity is discovered by updated time", async () => {
  const earlier = row(1);
  const existing: Record<string, unknown> = { ...row(2), confirmed_at: null };
  const records = [earlier, existing];
  const f = fixture(records);
  const initial = await (await f.handler(request())).json();
  assertEquals(initial.rows.length, 1);
  existing.confirmed_at = "2026-09-06T20:00:00.000001+00:00";
  existing.updated_at = existing.confirmed_at;
  const next =
    await (await f.handler(request("?cursor=" + initial.next_cursor))).json();
  assertEquals(next.rows.length, 1);
  assertEquals(next.rows[0].id, existing.id);
  assertEquals(next.rows[0].confirmed_at, existing.confirmed_at);
});
Deno.test("suppression precedence is explicit and private implementation fields never export", async () => {
  const receipt = {
    ...row(1),
    confirmation_token_hash: "private",
    request_fingerprint: "private",
    provider_id: "private",
    attribution: { gclid: "private" },
    metadata: { secret: "private" },
  };
  const f = fixture([receipt], {
    readSuppressions: async () => new Set([receipt.email]),
  });
  const response = await (await f.handler(request())).json();
  assertEquals(response.rows[0].suppressed, true);
  assertEquals(response.rows[0].double_optin, "confirmed");
  assertEquals(
    Object.keys(response.rows[0]).sort(),
    [
      "id",
      "email",
      "offer",
      "consent_text",
      "source",
      "requested_at",
      "confirmed_at",
      "updated_at",
      "double_optin",
      "suppressed",
    ].sort(),
  );
  assert(!JSON.stringify(response).includes("private"));
  assert(!("mailable" in response.rows[0]));
});
Deno.test("pending and legacy scopes cannot be mapped as the new receipt", () => {
  for (
    const patch of [{ confirmed_at: null }, { offer: "flow-waitlist" }, {
      consent_text: "legacy digest only",
    }, { source: "old-source" }]
  ) assertThrows(() => mapReceipt({ ...row(1), ...patch }, new Set()));
});
Deno.test("database or suppression failures emit no rows and no cursor advancement", async () => {
  for (
    const overrides of [{
      readReceipts: async () => {
        throw new Error("db");
      },
    }, {
      readSuppressions: async () => {
        throw new Error("suppression");
      },
    }, { readReceipts: async () => [row(2), row(1)] }]
  ) {
    const f = fixture([row(1)], overrides);
    const response = await f.handler(request());
    assertEquals(response.status, 503);
    const body = await response.json();
    assert(!("rows" in body));
    assert(!("next_cursor" in body));
  }
});
