import { FLOW_LIVING_DOCUMENTS_OFFER } from "../data/flow-consent";

/** Acknowledge a completed email-link confirmation in the existing navigation bar. */
export function acknowledgeLivingDocumentsConfirmation(): boolean {
  const params = new URLSearchParams(location.search);
  const states = params.getAll("living-documents-confirmed");
  if (states.length !== 1 || !["1", "already", "error"].includes(states[0])) return false;
  const state = states[0];
  const bar = document.getElementById("confirm-bar");
  const text = document.getElementById("confirm-bar-text");
  const detail = document.getElementById("confirm-bar-detail");
  const close = document.getElementById("confirm-bar-close");
  const cta = document.getElementById("confirm-bar-cta");
  const magnet = document.getElementById("magnet-bar");
  if (!bar || !text || !detail) return false;

  text.textContent = state === "1" ? "Thanks for subscribing to the Flow email newsletter."
    : state === "already" ? "You're already subscribed to the Flow email newsletter."
    : "That confirmation link didn't work.";
  detail.hidden = true;
  if (cta) cta.hidden = true;
  bar.dataset.confirmationState = state;
  bar.classList.remove("hidden");
  if (magnet) {
    magnet.classList.remove("hidden");
    magnet.dataset.confirmationCovered = "true";
    magnet.inert = true;
    magnet.setAttribute("aria-hidden", "true");
  }
  // A past dismissal must not prevent the permanent download from returning.
  try { localStorage.removeItem("of-flow-bar-dismissed"); } catch {}

  // This offer owns only its namespaced parameter. Legacy confirmations and
  // attribution remain available to their existing controllers.
  params.delete("living-documents-confirmed");
  history.replaceState({}, "", `${location.pathname}${params.size ? "?" + params.toString() : ""}${location.hash}`);

  let timer: ReturnType<typeof setTimeout>;
  const dismiss = () => {
    clearTimeout(timer);
    bar.classList.add("hidden");
    delete bar.dataset.confirmationState;
    if (magnet) {
      delete magnet.dataset.confirmationCovered;
      magnet.inert = false;
      magnet.removeAttribute("aria-hidden");
      magnet.classList.remove("hidden");
    }
  };
  close?.addEventListener("click", dismiss, { once: true });
  timer = setTimeout(dismiss, 8000);
  if (state === "1") reportLivingConfirmedLead();
  return true;
}

function reportLivingConfirmedLead() {
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
      analytics.gtag?.("event", "conversion", { send_to: analytics.__ofAdsLeadSendTo });
    }
  } catch {}
  try {
    analytics.__ofLoadMetaPixel?.();
    analytics.fbq?.("track", "Lead", { content_name: FLOW_LIVING_DOCUMENTS_OFFER });
  } catch {}
}
