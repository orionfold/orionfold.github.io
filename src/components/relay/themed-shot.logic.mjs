// src/components/relay/themed-shot.logic.mjs
// Pure prop resolution for ThemedShot, extracted so it is unit-testable
// without a browser or Astro runtime.
export function themedShotProps(index, { id, alt }) {
  const shot = index[id];
  if (!shot) {
    throw new Error(`ThemedShot: unknown shot id "${id}" — run \`npm run sync:relay-shots\` or check src/data/relay-shots.allow.json`);
  }
  const label = alt === undefined ? shot.alt : alt; // '' => decorative
  // Backward compatibility makes a stale generated index fail visibly in tests
  // without breaking local rendering while the sync command is being updated.
  const normalize = (variant) => typeof variant === 'string'
    ? { src: variant, srcset: variant }
    : variant;
  const light = normalize(shot.light);
  const dark = normalize(shot.dark);
  const [ratioWidth = 16, ratioHeight = 10] = String(shot.ratio)
    .split('/')
    .map((value) => Number(value.trim()));
  return {
    style: `aspect-ratio:${shot.ratio};`,
    width: shot.width ?? ratioWidth,
    height: shot.height ?? ratioHeight,
    sizes: '(min-width: 1280px) 768px, (min-width: 768px) calc(100vw - 8rem), calc(100vw - 3rem)',
    alt: label || '',
    light,
    dark,
  };
}
