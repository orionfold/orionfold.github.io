export const DEFAULT_RELAY_RUNTIME = 'http://127.0.0.1:3000';

export function normalizeRelayRuntime(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Enter the address where Relay is running.');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Use a complete Relay address such as http://127.0.0.1:3000.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Relay addresses must use http or https.');
  if (url.username || url.password) throw new Error('Do not put credentials in the Relay address.');
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.origin;
}

export function relayWorkshopTarget(runtime) {
  return new URL('/workshop', `${normalizeRelayRuntime(runtime)}/`).href;
}

export function relayHealthTarget(runtime) {
  return new URL('/api/health/live', `${normalizeRelayRuntime(runtime)}/`).href;
}
