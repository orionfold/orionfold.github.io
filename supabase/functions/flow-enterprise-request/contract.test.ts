import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  alertText,
  canonicalPayload,
  createInsert,
  FLOW_ENTERPRISE_SOURCE,
  validateFlowEnterpriseBody,
} from "./contract.ts";

const validBody = {
  requestId: "1bbf403d-d9bc-4c02-a085-7e16dad04acf",
  name: "Ada Lovelace",
  email: "ADA@EXAMPLE.TEST",
  company: "Analytical Engines",
  requirements: "Govern model routing across our document workflows.",
  licenses: 25,
  heardAbout: "A colleague",
  website: "",
};

Deno.test("validates and normalizes the public enterprise fields", () => {
  const result = validateFlowEnterpriseBody({
    ...validBody,
    requestId: validBody.requestId.toUpperCase(),
  });
  assert(result.ok);
  assertEquals(result.input.requestId, validBody.requestId);
  assertEquals(result.input.email, "ada@example.test");
  assertEquals(result.input.licenses, 25);
  const record = createInsert(result.input, "fingerprint", "payload");
  assertEquals(record.source, FLOW_ENTERPRISE_SOURCE);
  assertEquals(record.heardAbout, "A colleague");
});

Deno.test("rejects missing, invalid, and oversize values without truncation", () => {
  const invalid = [
    { ...validBody, name: "" },
    { ...validBody, name: "x".repeat(121) },
    { ...validBody, email: "invalid" },
    { ...validBody, email: `${"x".repeat(250)}@example.test` },
    { ...validBody, company: "" },
    { ...validBody, company: "x".repeat(201) },
    { ...validBody, requirements: "" },
    { ...validBody, requirements: "x".repeat(6_001) },
    { ...validBody, heardAbout: "x".repeat(241) },
    { ...validBody, licenses: 0 },
    { ...validBody, licenses: 100_001 },
    { ...validBody, licenses: 2.5 },
    { ...validBody, licenses: "2" },
  ];
  for (const body of invalid) {
    assert(
      !validateFlowEnterpriseBody(body).ok,
      JSON.stringify(body).slice(0, 200),
    );
  }
});

Deno.test("where-heard is optional", () => {
  const { heardAbout: _heardAbout, ...withoutHeardAbout } = validBody;
  const result = validateFlowEnterpriseBody(withoutHeardAbout);
  assert(result.ok);
  assertEquals(result.input.heardAbout, "");
});

Deno.test("payload identity is canonical and excludes caller-controlled source", () => {
  const result = validateFlowEnterpriseBody({
    ...validBody,
    source: "invented",
  });
  assert(result.ok);
  const canonical = canonicalPayload(result.input);
  assertStringIncludes(canonical, '"source":"flow_pricing"');
  assert(!canonical.includes("invented"));
});

Deno.test("operator alert carries structured fields and no delivery promise", () => {
  const result = validateFlowEnterpriseBody(validBody);
  assert(result.ok);
  const text = alertText(result.input);
  assertStringIncludes(text, "Source: Flow pricing");
  assertStringIncludes(text, "Licenses: 25");
  assertStringIncludes(text, "Requirements:");
});
