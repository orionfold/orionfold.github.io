// Opaque email-to-token map for one-click unsubscribe links (relay #9). Keeping the
// token out of the URL means the link carries no PII. Minted on demand at send time
// and reused, so the same recipient gets the same link. Takes the supabase client so
// it stays unit-testable with a fake client.

export async function getOrMintToken(supabase: any, email: string): Promise<string> {
  const { data: existing } = await supabase
    .from("email_tokens")
    .select("token")
    .eq("email", email)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const fresh = crypto.randomUUID();
  const { data, error } = await supabase
    .from("email_tokens")
    .upsert({ email, token: fresh }, { onConflict: "email" })
    .select("token")
    .single();
  if (error) throw error;
  return (data?.token ?? fresh) as string;
}
