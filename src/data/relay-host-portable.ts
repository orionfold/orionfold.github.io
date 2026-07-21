// One immutable public Relay release activates the portable Host surface. Never
// point this at main or a placeholder tag: Orionfold guidance must resolve to
// the exact supported customer artifact.
export const RELAY_HOST_PORTABLE_RELEASE: string | null = '0.45.2';

export const RELAY_HOST_PORTABLE_ROUTE = '/relay/host/linux-vm/';

export const RELAY_HOST_PORTABLE_LIVE = RELAY_HOST_PORTABLE_RELEASE !== null;

export const RELAY_HOST_PORTABLE_GUIDE_URL = RELAY_HOST_PORTABLE_RELEASE
  ? `https://github.com/orionfold/relay/blob/v${RELAY_HOST_PORTABLE_RELEASE}/docs/relay-host-linux-vm.md`
  : null;
