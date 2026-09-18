// Responsive copies of the approved artwork. Keep the original 1642px WebP
// unchanged for Retina displays; never re-encode an already compressed image.
// Run from the repository root: node scripts/prepare-living-hero-images.mjs
import sharp from 'sharp';

for (const kind of ['home', 'flow']) {
  const base = `public/assets/living-systems/hero-${kind}-paper-planes`;
  for (const width of [640, 960, 1152]) {
    const { size } = await sharp(`${base}.png`)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(`${base}-${width}.webp`);
    console.log(`${kind}: ${width}px, ${size} bytes`);
  }
}
