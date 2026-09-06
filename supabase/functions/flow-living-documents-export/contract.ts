import {
  CONSENT_TEXT,
  OFFER,
  SOURCE,
} from "../flow-living-documents-signup/contract.ts";
export const RECEIPT_FIELDS =
  "id,email,offer,consent_text,source,requested_at,confirmed_at,updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|\+00:00)$/;
export interface Cursor {
  v: 1;
  updated_at: string;
  id: string;
}
export interface ReceiptRow {
  id: string;
  email: string;
  offer: string;
  consent_text: string;
  source: string;
  requested_at: string;
  confirmed_at: string;
  updated_at: string;
  double_optin: "confirmed";
  suppressed: boolean;
}
export function timestampKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = TIMESTAMP.exec(value);
  if (!match) return null;
  const date = new Date(match[1] + "Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 19) !== match[1]
  ) return null;
  // Preserve microseconds. Date.toISOString alone would discard database precision.
  return match[1] + "." + (match[2] || "").padEnd(6, "0");
}
export function parseCursor(value: string | null): Cursor | null {
  if (value === null) return null;
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("invalid_cursor");
  }
  try {
    const row = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
    if (
      !row || Object.keys(row).sort().join(",") !== "id,updated_at,v" ||
      row.v !== 1 || !timestampKey(row.updated_at) ||
      typeof row.id !== "string" || !UUID.test(row.id)
    ) throw new Error("invalid_cursor");
    return { v: 1, updated_at: row.updated_at, id: row.id };
  } catch {
    throw new Error("invalid_cursor");
  }
}
export function encodeCursor(row: { updated_at: string; id: string }): string {
  return btoa(JSON.stringify({ v: 1, updated_at: row.updated_at, id: row.id }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function parseLimit(value: string | null): number {
  if (value === null) return 200;
  if (!/^[1-9]\d{0,3}$/.test(value)) throw new Error("invalid_limit");
  const count = Number(value);
  if (count > 500) throw new Error("invalid_limit");
  return count;
}
export function cursorFilter(cursor: Cursor): string {
  // parseCursor admits only an exact timestamp and UUID, not PostgREST grammar.
  return `updated_at.gt.${cursor.updated_at},and(updated_at.eq.${cursor.updated_at},id.gt.${cursor.id})`;
}
export function afterCursor(
  row: { updated_at: string; id: string },
  cursor: Cursor | null,
): boolean {
  if (!cursor) return true;
  const a = timestampKey(row.updated_at)!;
  const b = timestampKey(cursor.updated_at)!;
  return a > b || (a === b && row.id > cursor.id);
}
export function mapReceipt(
  value: unknown,
  suppressed: Set<string>,
): ReceiptRow {
  if (!value || typeof value !== "object") throw new Error("invalid_receipt");
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" || !UUID.test(row.id) ||
    typeof row.email !== "string" ||
    row.email !== row.email.trim().toLowerCase() || !row.email.includes("@") ||
    row.offer !== OFFER || row.consent_text !== CONSENT_TEXT ||
    row.source !== SOURCE || !timestampKey(row.requested_at) ||
    !timestampKey(row.confirmed_at) || !timestampKey(row.updated_at)
  ) throw new Error("invalid_receipt");
  return {
    id: row.id,
    email: row.email,
    offer: OFFER,
    consent_text: CONSENT_TEXT,
    source: SOURCE,
    requested_at: row.requested_at as string,
    confirmed_at: row.confirmed_at as string,
    updated_at: row.updated_at as string,
    double_optin: "confirmed",
    suppressed: suppressed.has(row.email),
  };
}
