import { COMMERCE_FUNCTIONS_BASE } from "./commerce-config";

const FUNCTIONS_BASE = COMMERCE_FUNCTIONS_BASE;

async function post(fn: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { retryable: true, state: "retryable", error: "Could not connect." },
    };
  }
}

export function takeFragmentToken(): string | null {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get("t");
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  return token;
}

export async function exchangeWorkshopAccess(token: string) {
  return post("workshop-access", { token });
}

export async function confirmWorkshopRefund(token: string) {
  return post("workshop-refund", { token });
}

export async function requestWorkshopLink(action: "reaccess" | "refund", email: string) {
  return post("workshop-request", {
    action,
    email,
    offeringId: "relay-operator-workshop",
    requestId: crypto.randomUUID(),
  });
}
