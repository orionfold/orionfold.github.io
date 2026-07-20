import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sendWorkshopEmail, workshopEmailContent } from "./workshop-email.ts";

Deno.test("workshop email is transactional and escapes its link", () => {
  const content = workshopEmailContent("initial", "https://example.com/#t=<unsafe>");
  assertEquals(content.subject, "Your Relay Operator Workshop is ready");
  assertEquals(content.html.includes("&lt;unsafe&gt;"), true);
  assertEquals(content.text.includes("unsubscribe"), false);
});

Deno.test("workshop email sets a stable Resend idempotency key", async () => {
  let request: RequestInit | undefined;
  await sendWorkshopEmail({
    apiKey: "test-key",
    from: "Orionfold <manav@updates.orionfold.com>",
    to: "buyer@example.com",
    kind: "reaccess",
    link: "https://orionfold.com/#t=token",
    idempotencyKey: "workshop-access-entitlement-2",
    apiUrl: "https://resend.test/emails",
    fetcher: (_input, init) => {
      request = init;
      return Promise.resolve(new Response("{}", { status: 200 }));
    },
  });
  assertEquals((request?.headers as Record<string, string>)["Idempotency-Key"], "workshop-access-entitlement-2");
  assertEquals(JSON.parse(request?.body as string).reply_to, "manav@orionfold.com");
});

Deno.test("workshop email fails closed without credentials", async () => {
  await assertRejects(() =>
    sendWorkshopEmail({
      apiKey: "",
      from: "Orionfold <manav@updates.orionfold.com>",
      to: "buyer@example.com",
      kind: "initial",
      link: "https://orionfold.com/#t=token",
      idempotencyKey: "key",
    })
  );
});
