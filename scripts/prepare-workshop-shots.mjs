import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const stages = ['start', 'inspect', 'adapt', 'govern', 'run', 'retain', 'finish'];
const themes = ['light', 'dark'];
const sourceDir = path.resolve(process.argv[2] || 'output/screengrabs/workshop-2026-07-20');
const publicDir = path.resolve('public/images/training/relay-operator-workshop');
const indexPath = path.resolve('src/data/training-workshop-shots.json');
const widths = [720, 1274];

await mkdir(publicDir, { recursive: true });
const index = {};

for (const stage of stages) {
  index[stage] = { ratio: '1274 / 717', width: 1274, height: 717, light: {}, dark: {} };
  for (const theme of themes) {
    const input = path.join(sourceDir, `workshop-${stage}-${theme}.png`);
    const metadata = await sharp(input).metadata();
    if (metadata.width !== 1274 || metadata.height !== 717) {
      throw new Error(`${path.basename(input)} must be 1274x717; received ${metadata.width}x${metadata.height}`);
    }
    const variants = [];
    for (const width of widths) {
      const filename = `${stage}-${theme}-${width}.webp`;
      const output = path.join(publicDir, filename);
      await sharp(input)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 84, effort: 6, smartSubsample: true })
        .toFile(output);
      variants.push({ width, src: `/images/training/relay-operator-workshop/${filename}`, bytes: (await stat(output)).size });
    }
    index[stage][theme] = {
      src: variants.at(-1).src,
      srcset: variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
      variants,
    };
  }
}

await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Prepared ${stages.length * themes.length * widths.length} workshop screenshot variants.`);
