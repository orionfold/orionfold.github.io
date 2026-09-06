import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolveServiceEnvironment, PRODUCTION_FUNCTIONS_BASE, PRODUCTION_WORKSHOP_MEDIA_BASE } from "../../src/lib/service-environment.mjs";
const stage = { PUBLIC_SERVICE_MODE: "staging", PUBLIC_SUPABASE_FUNCTIONS_BASE: "http://127.0.0.1:54321/functions/v1", PUBLIC_WORKSHOP_MEDIA_BASE: "http://127.0.0.1:54321/storage/v1/object/public/workshop-public" };
test("default production retains canonical service URLs", () => {
  assert.deepEqual(resolveServiceEnvironment(), { mode: "production", actionsEnabled: true, functionsBase: PRODUCTION_FUNCTIONS_BASE, mediaBase: PRODUCTION_WORKSHOP_MEDIA_BASE });
});
test("preview denies actions even when production overrides are supplied", () => {
  const value = resolveServiceEnvironment({ ...stage, PUBLIC_SERVICE_MODE: "preview", PUBLIC_SUPABASE_FUNCTIONS_BASE: PRODUCTION_FUNCTIONS_BASE });
  assert.equal(value.actionsEnabled, false);
  assert.equal(value.functionsBase, "/__service-unavailable/functions/v1");
});
test("staging requires both explicit isolated services", () => {
  assert.equal(resolveServiceEnvironment(stage).actionsEnabled, true);
  for (const key of ["PUBLIC_SUPABASE_FUNCTIONS_BASE", "PUBLIC_WORKSHOP_MEDIA_BASE"]) {
    assert.throws(() => resolveServiceEnvironment({ ...stage, [key]: "" }), /requires explicit/);
  }
  assert.throws(() => resolveServiceEnvironment({ ...stage, PUBLIC_SUPABASE_FUNCTIONS_BASE: PRODUCTION_FUNCTIONS_BASE }), /production/);
  assert.throws(() => resolveServiceEnvironment({ ...stage, PUBLIC_WORKSHOP_MEDIA_BASE: PRODUCTION_WORKSHOP_MEDIA_BASE }), /production/);
  assert.throws(() => resolveServiceEnvironment({ ...stage, PUBLIC_SUPABASE_FUNCTIONS_BASE: "https://lgnmmcxvwdnusvfpguvf.supabase.co/functions/v1" }), /production/);
  assert.throws(() => resolveServiceEnvironment({ ...stage, PUBLIC_WORKSHOP_MEDIA_BASE: "https://other.example/storage/v1/object/public/workshop-public" }), /same isolated origin/);
});
test("staging rejects malformed, insecure and credentialed endpoint configuration", () => {
  for (const value of ["/functions/v1", "http://external.example/functions/v1", "https://test.example/functions/v1?key=bad", "https://test.example/functions/v1#bad", "https://test.example/functions/v1/waitlist-signup", "https://user:pass@test.example/functions/v1"]) {
    assert.throws(() => resolveServiceEnvironment({ ...stage, PUBLIC_SUPABASE_FUNCTIONS_BASE: value }));
  }
  assert.throws(() => resolveServiceEnvironment({ PUBLIC_SERVICE_MODE: "typo" }), /Invalid/);
});
test("new offer and enterprise actions have isolated configuration and preview guards", () => {
  const read = p => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  const config = read("src/lib/living-services.ts");
  assert.match(config, /PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED === "true"/);
  assert.match(config, /PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED === "true"/);
  const form = read("src/components/living/LivingDocumentsForm.astro");
  assert.match(form, /serviceEndpoint\('flow-living-documents-signup'\)/);
  assert.match(form, /disabled=\{!LIVING_DOCUMENTS_SIGNUP_ENABLED\}/);
  assert.match(read("src/scripts/living-documents-signup.ts"), /consent_accepted:\s*true/);
  assert.doesNotMatch(read("src/components/ui/WaitlistForm.astro"), /LIVING_DOCUMENTS|living_documents/);
});

test("analytics connection hints are omitted from preview and staging HTML", () => {
  const layout = readFileSync(new URL("../../src/layouts/Layout.astro", import.meta.url), "utf8");
  const hints = [...layout.matchAll(/<link\b[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/g)]
    .map(([tag]) => tag).filter(tag => /google(?:tagmanager|-analytics)\.com/.test(tag));
  assert.equal(hints.length, 2, "the two existing production hints are retained");
  const productionBlocks = [...layout.matchAll(/\{SERVICE_MODE === 'production' && \(([\s\S]*?)\)\}/g)]
    .map(([, body]) => body);
  for (const hint of hints) assert.ok(productionBlocks.some(body => body.includes(hint)), "every analytics hint must be inside the production-only block");
});
