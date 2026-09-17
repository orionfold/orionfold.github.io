import { FLOW_LIVING_DOCUMENTS_OFFER } from "../data/flow-consent";
function acknowledge() {
  const params = new URLSearchParams(location.search);
  const panel = document.querySelector<HTMLElement>(
    "[data-living-confirmation]",
  );
  const copy = panel?.querySelector<HTMLElement>(
    "[data-living-confirmation-copy]",
  );
  if (!panel || !copy) return;
  if (panel.dataset?.confirmToken === "true") {
    if (panel.dataset.tokenPrepared === "true") return;
    panel.dataset.tokenPrepared = "true";
    const values = params.getAll("token");
    const token = values.length === 1 && /^[a-f0-9]{64}$/.test(values[0])
      ? values[0] : null;
    params.delete("token");
    history.replaceState({}, "", `${location.pathname}${params.size ? "?" + params.toString() : ""}${location.hash}`);
    const form = panel.querySelector<HTMLFormElement>("[data-living-confirmation-form]");
    const field = panel.querySelector<HTMLInputElement>("[data-living-confirmation-token]");
    if (token && form && field && panel.dataset.actionsEnabled === "true") {
      field.value = token;
      form.hidden = false;
      copy.textContent = "Confirm your subscription to the updates listed in your email.";
    } else {
      if (form) form.hidden = true;
      if (field) field.value = "";
      copy.textContent = token && panel.dataset.actionsEnabled !== "true"
        ? "Confirmation is unavailable in this preview. Use the link in your email on the live website."
        : "This confirmation link is unavailable. Request a new link from email updates.";
    }
    panel.classList.remove("hidden");
    panel.focus({ preventScroll: true });
    return;
  }
  const state = params.get("living-documents-confirmed");
  if (state !== "1" && state !== "error") return;
  copy.textContent = state === "1"
    ? "You're subscribed to Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time."
    : "That confirmation link is unavailable or has already been used. If you still need to subscribe, request a new link below.";
  panel.classList.remove("hidden");
  panel.focus({ preventScroll: true });
  params.delete("living-documents-confirmed");
  history.replaceState(
    {},
    "",
    `${location.pathname}${
      params.size ? "?" + params.toString() : ""
    }${location.hash}`,
  );
  if (state !== "1") return;
  const analytics = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    __ofLoadMetaPixel?: () => void;
    __ofAdsLeadSendTo?: string;
    __ofLivingLeadHandled?: boolean;
  };
  if (analytics.__ofLivingLeadHandled) return;
  analytics.__ofLivingLeadHandled = true;
  try {
    analytics.gtag?.("event", "confirmed_lead", {
      offer: FLOW_LIVING_DOCUMENTS_OFFER,
      form_source: "manifesto-living-documents",
    });
    if (analytics.__ofAdsLeadSendTo) {
      analytics.gtag?.("event", "conversion", {
        send_to: analytics.__ofAdsLeadSendTo,
      });
    }
  } catch {}
  try {
    analytics.__ofLoadMetaPixel?.();
    analytics.fbq?.("track", "Lead", {
      content_name: FLOW_LIVING_DOCUMENTS_OFFER,
    });
  } catch {}
}
acknowledge();
document.addEventListener("astro:page-load", acknowledge);
