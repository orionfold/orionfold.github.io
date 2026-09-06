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
function fixture(query) {
  const copy = { textContent: "" };
  const panel = {
    querySelector: () => copy,
    classList: { remove() {} },
    focus() {},
  };
  const events = [];
  const location = {
    pathname: "/manifesto/",
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
  return { run: () => vm.runInContext(code, context), copy, events, location };
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
