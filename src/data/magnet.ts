// Magnet-traffic helper (2026-Q3 magnet-traffic push, marketing relay latest+21).
// One place that builds the UTM-stamped link to the lead-magnet page so every
// on-site placement attributes consistently. GA4 reads utm_content to tell us
// which placement converts; the magnet's Supabase capture preserves these utm_*
// straight into leads/, so attribution survives all the way to the CRM.
//
// Convention (marketing/_FLOWS/traffic-funnel.md):
//   utm_source=orionfold-onsite, utm_medium=organic,
//   utm_campaign=2026-q3-magnet-traffic, utm_content=<placement>

export const MAGNET_PATH = '/become-ai-native-business/';

// The four on-site placements, ranked by intent in the relay.
export type MagnetPlacement =
  | 'nav-cta' // persistent sticky bar (site-wide)
  | 'story-footer' // foot of every Story post (highest intent)
  | 'book-page-cta' // /books/ai-native-business/ buy box
  | 'hero-secondary'; // homepage hero secondary CTA

/** UTM-stamped magnet link for a given on-site placement. */
export function magnetHref(placement: MagnetPlacement): string {
  const params = new URLSearchParams({
    utm_source: 'orionfold-onsite',
    utm_medium: 'organic',
    utm_campaign: '2026-q3-magnet-traffic',
    utm_content: placement,
  });
  return `${MAGNET_PATH}?${params.toString()}`;
}
