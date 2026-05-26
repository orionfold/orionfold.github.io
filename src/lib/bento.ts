// Bento split (V6) — the single, shared rule for laying out a section of cards.
// When a section has an odd number of 3+ cards, the first card leads as a
// full-width featured hero (image left, text right) so the remaining cards pair
// up evenly in a two-column grid below. Even sections — or a lone card — get no
// lead and render as a plain grid. Used by /software/, /models/, and the /story/
// index so the odd/even behaviour stays consistent everywhere (the homepage
// StoriesCarousel keeps its fixed top-3 editorial layout, which already matches).
export function bentoSplit<T>(items: T[]): { lead: T | null; rest: T[] } {
  const useBento = items.length >= 3 && items.length % 2 === 1;
  return useBento ? { lead: items[0], rest: items.slice(1) } : { lead: null, rest: items };
}
