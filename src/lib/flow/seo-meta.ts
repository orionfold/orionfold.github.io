// Search-result sized titles and descriptions for the synced Flow articles.
// The article titles and deks come from the product repo and are written for
// the page, not for a search result, so long ones fall back here instead of
// being edited at the source (the next sync would overwrite the edit).

/** Use the full title when it fits a search result, else the short fallback. */
export function fitTitle(full: string, fallback: string, max = 65): string {
  return full.length <= max ? full : fallback;
}

/** Trim to the last whole sentence that fits, else the last whole word. */
export function fitDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence >= 80) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}
