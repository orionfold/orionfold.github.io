// New-offer reader only. The database normalizes historical suppression rows
// and returns one bounded scalar array, avoiding REST row-cap truncation.
export type SuppressionRpc = (
  emails: string[],
) => Promise<{ data: unknown; error: unknown }>;
export async function readLivingDocumentSuppressions(
  emails: string[],
  rpc: SuppressionRpc,
): Promise<Set<string>> {
  if (
    emails.length > 500 ||
    emails.some((email) =>
      typeof email !== "string" || email !== email.trim().toLowerCase() ||
      email.length < 3 || email.length > 254 || email.indexOf("@") < 1
    )
  ) throw new Error("invalid_suppression_input");
  const requested = new Set(emails);
  if (!requested.size) return new Set();
  const { data, error } = await rpc([...requested]);
  if (error || !Array.isArray(data) || data.length > requested.size) {
    throw new Error("suppression_unavailable");
  }
  const result = new Set<string>();
  for (const value of data) {
    if (
      typeof value !== "string" || !requested.has(value) || result.has(value)
    ) {
      throw new Error("invalid_suppression_result");
    }
    result.add(value);
  }
  return result;
}
