import { authorized } from "../waitlist-export/index.ts";
import {
  afterCursor,
  type Cursor,
  encodeCursor,
  mapReceipt,
  parseCursor,
  parseLimit,
} from "./contract.ts";
export interface ExportDependencies {
  expectedCredential(): string;
  readReceipts(cursor: Cursor | null, limit: number): Promise<unknown[]>;
  readSuppressions(emails: string[]): Promise<Set<string>>;
}
export function createExportHandler(deps: ExportDependencies) {
  return async (request: Request): Promise<Response> => {
    const json = (body: Record<string, unknown>, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (!authorized(request.headers, deps.expectedCredential())) {
      return json({ error: "Unauthorized" }, 401);
    }
    let cursor: Cursor | null;
    let limit: number;
    try {
      const params = new URL(request.url).searchParams;
      cursor = parseCursor(params.get("cursor"));
      limit = parseLimit(params.get("limit"));
    } catch {
      return json({ error: "Invalid cursor or limit" }, 400);
    }
    try {
      const data = await deps.readReceipts(cursor, limit);
      if (!Array.isArray(data) || data.length > limit) {
        throw new Error("invalid_page");
      }
      // Validate the complete receipt shape before deriving lookup identifiers.
      const validated = data.map((row) => mapReceipt(row, new Set()));
      let last = cursor;
      for (const row of validated) {
        if (!afterCursor(row, last)) throw new Error("unordered_page");
        last = { v: 1, updated_at: row.updated_at, id: row.id };
      }
      const suppressed = validated.length
        ? await deps.readSuppressions([
          ...new Set(validated.map((row) => row.email)),
        ])
        : new Set<string>();
      const rows = data.map((row) => mapReceipt(row, suppressed));
      return json({
        rows,
        next_cursor: rows.length ? encodeCursor(rows[rows.length - 1]) : null,
      });
    } catch {
      return json({
        error:
          "Receipt export unavailable. Retry without advancing your cursor.",
      }, 503);
    }
  };
}
