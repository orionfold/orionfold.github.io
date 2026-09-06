import { getAttribution } from "../lib/attribution";
const keys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "v",
];
function bind() {
  document.querySelectorAll<HTMLFormElement>("[data-living-documents-form]")
    .forEach((form) => {
      if (form.dataset.bound === "true") return;
      form.dataset.bound = "true";
      const email = form.elements.namedItem("email") as HTMLInputElement;
      const consent = form.elements.namedItem("consent") as HTMLInputElement;
      const honeypot = form.elements.namedItem("website") as HTMLInputElement;
      const button = form.querySelector<HTMLButtonElement>(
        "button[type=submit]",
      )!;
      const error = form.querySelector<HTMLElement>("[data-signup-error]")!;
      const success = form.querySelector<HTMLElement>("[data-signup-success]")!;
      let pending: { key: string; id: string } | null = null;
      let sending = false;
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (sending) return;
        error.classList.add("hidden");
        success.classList.add("hidden");
        const fail = (message: string) => {
          error.textContent = message;
          error.classList.remove("hidden");
        };
        if (form.dataset.serviceEnabled !== "true") {
          fail("Email updates are not available yet.");
          return;
        }
        if (!email.validity.valid || !email.value.trim()) {
          fail("Please enter a valid email address.");
          email.focus();
          return;
        }
        if (!consent.checked) {
          fail("Please confirm the email updates you want to receive.");
          consent.focus();
          return;
        }
        const captured = getAttribution();
        const params = new URLSearchParams(location.search);
        const attribution = Object.fromEntries(
          keys.map((key) => [key, params.get(key) || captured[key]]).filter((
            [, value],
          ) => typeof value === "string" && value.length <= 200),
        );
        const payload = {
          email: email.value.trim().toLowerCase(),
          offer: form.dataset.offer,
          consent_text: form.dataset.consent,
          consent_accepted: true,
          source: "manifesto-living-documents",
          attribution,
          website: honeypot.value,
        };
        const key = JSON.stringify(payload);
        if (!pending || pending.key !== key) {
          pending = { key, id: crypto.randomUUID() };
        }
        sending = true;
        button.disabled = true;
        button.textContent = "Sending…";
        try {
          const response = await fetch(form.dataset.endpoint!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, requestId: pending.id }),
            signal: AbortSignal.timeout(20000),
          });
          const data = await response.json().catch(() => null);
          if (!response.ok) {
            if (response.status === 409) pending = null;
            throw new Error(
              typeof data?.error === "string"
                ? data.error
                : "We could not verify your request. Please retry in one minute.",
            );
          }
          if (!data || typeof data.message !== "string") {
            throw new Error(
              "We could not verify your request. Please retry in one minute.",
            );
          }
          success.textContent = data.message;
          success.classList.remove("hidden");
          pending = null;
          form.reset();
          // Submission is not a confirmed lead. The separate confirmation controller owns that event.
        } catch (cause) {
          fail(
            cause instanceof Error && cause.name !== "TimeoutError"
              ? cause.message
              : "We could not verify your request. Please retry in one minute.",
          );
        } finally {
          sending = false;
          button.disabled = form.dataset.serviceEnabled !== "true";
          button.textContent = "Keep me in the loop";
        }
      });
    });
}
bind();
document.addEventListener("astro:page-load", bind);
