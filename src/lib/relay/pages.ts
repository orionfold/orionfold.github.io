// The Relay sibling pages, in the publish-contract order, for the Paper
// PageNav under each Relay page (R7c retires RelaySubNav).
export type RelayPageKey = 'overview' | 'host' | 'demo' | 'docs' | 'api' | 'memos';

const PAGES: { key: RelayPageKey; href: string; label: string }[] = [
  { key: 'overview', href: '/relay/', label: 'Overview' },
  { key: 'host', href: '/relay/host/', label: 'Host' },
  { key: 'demo', href: '/relay/demo/', label: 'Demo' },
  { key: 'docs', href: '/relay/docs/', label: 'Docs' },
  { key: 'api', href: '/relay/api/', label: 'API' },
  { key: 'memos', href: '/relay/memos/', label: 'Memos' },
];

export const RELAY_PAGES = (current?: RelayPageKey) =>
  PAGES.map(({ key, href, label }) => ({ href, label, current: key === current }));
