const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  if (!secret) throw new Error("workshop secret is required");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export type WorkshopTokenPurpose = "access" | "refund";

export async function deriveWorkshopToken(
  secret: string,
  entitlementId: string,
  purpose: WorkshopTokenPurpose,
  generation: number,
): Promise<string> {
  if (!entitlementId || !Number.isSafeInteger(generation) || generation < 1) {
    throw new Error("invalid workshop token coordinates");
  }
  return bytesToBase64Url(
    await hmac(secret, `workshop:v1:${purpose}:${entitlementId}:${generation}`),
  );
}

export async function hashWorkshopToken(rawToken: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken)) throw new Error("invalid workshop token");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function requestHash(secret: string, dimension: string, value: string): Promise<string> {
  if (!dimension || !value) throw new Error("request hash input is required");
  return bytesToBase64Url(await hmac(secret, `workshop-request:v1:${dimension}:${value}`));
}

export function normalizeWorkshopEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function isRequestId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
