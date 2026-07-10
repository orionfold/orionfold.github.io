// src/components/relay/themed-shot.logic.mjs
// Pure prop resolution for ThemedShot, extracted so it is unit-testable
// without a browser or Astro runtime.
export function themedShotProps(index, { id, alt }) {
  const shot = index[id];
  if (!shot) {
    throw new Error(`ThemedShot: unknown shot id "${id}" — run \`npm run sync:relay-shots\` or check src/data/relay-shots.allow.json`);
  }
  const label = alt === undefined ? shot.alt : alt; // '' => decorative
  return {
    style: `--shot-light:url("${shot.light}");--shot-dark:url("${shot.dark}");aspect-ratio:${shot.ratio};`,
    role: label ? 'img' : 'presentation',
    ariaLabel: label || undefined,
  };
}
