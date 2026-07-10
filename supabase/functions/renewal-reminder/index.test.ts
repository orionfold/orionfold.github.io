import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, selectDue, renewalEmailText, containsThreat, type EntRow } from "./index.ts";
import { footerFor } from "../_shared/email-footer.ts";

// Real tokenized footer as the fixture so the copy assertions exercise a body
// shaped exactly like what ships (footer included).
const FOOTER = footerFor("tok");

const NOW = new Date("2026-07-02T00:00:00Z");
function row(p: Partial<EntRow>): EntRow {
  return { license_id: "OF-FE-2026-0001", email: "buyer@example.com", tier: "relay", status: "active", expires_at: "2027-01-01T00:00:00Z", renewal_reminded_at: null, ...p };
}
function daysOut(n: number): string { return new Date(NOW.getTime() + n * 86400000).toISOString(); }

Deno.test("authorized: exact bearer token passes, others fail", () => {
  const h = (v: string) => new Headers({ Authorization: v });
  assert(authorized(h("Bearer secret"), "secret"));
  assert(!authorized(h("Bearer wrong"), "secret"));
  assert(!authorized(h("secret"), "secret"));
  assert(!authorized(h("Bearer secret"), ""));
});

Deno.test("selectDue: 30-days-out relay license is selected", () => {
  const due = selectDue([row({ expires_at: daysOut(30) })], NOW);
  assertEquals(due.length, 1);
});

Deno.test("selectDue: excludes outside the 28-31 day band", () => {
  const rows = [row({ expires_at: daysOut(60) }), row({ expires_at: daysOut(10) }), row({ expires_at: daysOut(27) }), row({ expires_at: daysOut(32) })];
  assertEquals(selectDue(rows, NOW).length, 0);
});

Deno.test("selectDue: excludes already-reminded, non-active, non-relay", () => {
  const rows = [
    row({ expires_at: daysOut(30), renewal_reminded_at: "2026-06-01T00:00:00Z" }),
    row({ expires_at: daysOut(30), status: "canceled" }),
    row({ expires_at: daysOut(30), tier: "field-edition" }),
  ];
  assertEquals(selectDue(rows, NOW).length, 0);
});

Deno.test("renewalEmailText: carries the D4 sentence verbatim and the renewal CTA", () => {
  const t = renewalEmailText(FOOTER);
  assert(t.includes("Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support."));
  assert(t.includes("https://orionfold.com/relay/"));
  assert(t.includes("relay pack update relay-agency-pro"));
});

Deno.test("renewalEmailText: contains NO threat language", () => {
  assert(!containsThreat(renewalEmailText(FOOTER)));
});

Deno.test("containsThreat: catches forbidden phrases", () => {
  assert(containsThreat("your packs will stop working"));
  assert(containsThreat("you will lose access"));
  assert(!containsThreat("your packs are yours forever"));
});
