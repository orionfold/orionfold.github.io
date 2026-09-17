/** Compatibility for previously issued site links; the email link is the confirmation action. */
export function redirectLegacyLivingConfirmation(endpoint: string, enabled: boolean) {
  const params = new URLSearchParams(location.search);
  const values = params.getAll("token");
  const token = values.length === 1 && /^[a-f0-9]{64}$/.test(values[0]) ? values[0] : null;
  history.replaceState({}, "", location.pathname);
  if (!token || !enabled) {
    location.replace("/?living-documents-confirmed=error");
    return;
  }
  const destination = new URL(endpoint);
  destination.searchParams.set("token", token);
  location.replace(destination.href);
}
