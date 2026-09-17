import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { transform } from "esbuild";
const source = readFileSync(
  new URL(
    "../../src/scripts/living-documents-confirmation.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/import[^;]+;/, "");
const { code } = await transform(source, { loader: "ts" });
function fixture(query, { tokenPage = false, enabled = true } = {}) {
  const copy = { textContent: "" };
  const field = { value: "" };
  const form = { hidden: true, submit() { assert.fail("opening a link cannot submit consent"); }, requestSubmit() { assert.fail("confirmation requires an explicit user action"); } };
  const panel = {
    dataset: { confirmToken: String(tokenPage), actionsEnabled: String(enabled) },
    querySelector: selector => selector === "[data-living-confirmation-form]" ? form : selector === "[data-living-confirmation-token]" ? field : copy,
    classList: { remove() {} },
    focus() {},
  };
  const events = [];
  const location = {
    pathname: tokenPage ? "/flow/confirm/" : "/manifesto/",
    search: query,
    hash: "#email-updates",
  };
  const context = vm.createContext({
    FLOW_LIVING_DOCUMENTS_OFFER: "flow-living-documents-v1",
    URLSearchParams,
    location,
    document: { querySelector: () => panel, addEventListener() {} },
    history: {
      replaceState(_state, _title, url) {
        const u = new URL(url, "https://orionfold.com");
        location.search = u.search;
        location.hash = u.hash;
      },
    },
    window: { gtag: (...args) => events.push(args) },
  });
  return { run: () => vm.runInContext(code, context), copy, events, location, form, field };
}
test("dedicated success return counts once and preserves unrelated query and fragment", () => {
  const f = fixture("?living-documents-confirmed=1&utm_source=email");
  f.run();
  assert.equal(f.events.length, 1);
  assert.equal(f.events[0][1], "confirmed_lead");
  assert.equal(f.events[0][2].offer, "flow-living-documents-v1");
  assert.equal(f.events[0][2].form_source, "manifesto-living-documents");
  assert.equal(f.location.search, "?utm_source=email");
  assert.equal(f.location.hash, "#email-updates");
  assert.match(f.copy.textContent, /AI Native Newsletter/);
  f.run();
  assert.equal(f.events.length, 1);
});
test("unavailable confirmation acknowledges without counting a lead", () => {
  const f = fixture("?living-documents-confirmed=error");
  f.run();
  assert.equal(f.events.length, 0);
  assert.match(f.copy.textContent, /unavailable/);
  assert.equal(f.location.search, "");
});
test("legacy confirmation queries and banner state are untouched", () => {
  for (
    const query of ["?confirmed=1", "?confirmed=already", "?confirmed=error"]
  ) {
    const f = fixture(query);
    f.run();
    assert.equal(f.events.length, 0);
    assert.equal(f.copy.textContent, "");
    assert.equal(f.location.search, query);
  }
});


test("dedicated token page prepares a native form without confirming or counting a lead", () => {
  const token = "a".repeat(64);
  const f = fixture(`?token=${token}&utm_source=email`, { tokenPage: true });
  f.run();
  assert.equal(f.form.hidden, false);
  assert.equal(f.field.value, token);
  assert.equal(f.location.search, "?utm_source=email", "opaque token is removed from the address before interaction");
  assert.equal(f.events.length, 0);
  assert.match(f.copy.textContent, /exact email permission/);
  f.run();
  assert.equal(f.form.hidden, false, "a repeated page initializer preserves the prepared form");
  assert.equal(f.field.value, token);
  assert.equal(f.events.length, 0);
});

test("missing, malformed and ambiguous query tokens cannot prepare a confirmation", () => {
  for (const query of ["", "?token=bad", `?token=${"A".repeat(64)}`, `?token=${"a".repeat(64)}&token=${"b".repeat(64)}`]) {
    const f = fixture(query, { tokenPage: true });
    f.run();
    assert.equal(f.form.hidden, true);
    assert.equal(f.field.value, "");
    assert.equal(f.events.length, 0);
    assert.equal(f.location.search, "");
    assert.match(f.copy.textContent, /unavailable/);
  }
});

test("a token in a preview cannot expose a live confirmation action", () => {
  const f = fixture(`?token=${"a".repeat(64)}`, { tokenPage: true, enabled: false });
  f.run();
  assert.equal(f.form.hidden, true);
  assert.equal(f.field.value, "");
  assert.equal(f.events.length, 0);
  assert.match(f.copy.textContent, /preview/);
});

test("the token route is standalone, non-indexable and free of analytics loaders", () => {
  const page = readFileSync(new URL("../../src/pages/flow/confirm.astro", import.meta.url), "utf8");
  const component = readFileSync(new URL("../../src/components/living/LivingDocumentsConfirmation.astro", import.meta.url), "utf8");
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.match(page, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(page, /import Layout|gtag|fbq|googletagmanager|google-analytics/);
  assert.match(page, /<LivingDocumentsConfirmation confirmToken/);
  assert.match(component, /method="post" action=\{serviceEndpoint\('flow-living-documents-confirm'\)\}/);
  assert.doesNotMatch(source, /fetch\(|requestSubmit\(|\.submit\(/);
});
