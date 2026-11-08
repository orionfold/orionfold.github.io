// Search-result sized titles and descriptions. The synced Flow articles use
// fitTitle with a hand-written fallback (their titles come from the product
// repo, so an edit at the source would be overwritten by the next sync).
// Layout.astro runs every page through fitSearchTitle and fitDescription as a
// last guard, so no page ships a title over 65 or a description over 165.

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

/**
 * Fit a "Page · Section · Orionfold" title into a search result. Over the max,
 * drop the trailing brand first, then trailing section labels, never the
 * page's own first segment. A title without the brand suffix is left alone:
 * its later segments are part of the title, so a short form is written by hand.
 */
export function fitSearchTitle(title: string, max = 65): string {
  const clean = title.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sep = clean.includes(' · ') ? ' · ' : clean.includes(' | ') ? ' | ' : '';
  if (!sep) return clean;
  let parts = clean.split(sep);
  if (parts.length < 2 || parts[parts.length - 1] !== 'Orionfold') return clean;
  parts = parts.slice(0, -1);
  while (parts.length > 1 && parts.join(sep).length > max) parts = parts.slice(0, -1);
  return parts.join(sep);
}
