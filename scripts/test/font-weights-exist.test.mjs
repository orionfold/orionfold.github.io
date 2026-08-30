// Every font-weight the CSS asks for must be a weight that actually ships.
//
// WHY THIS EXISTS. Found 2026-08-30 while chasing /flow/ mobile LCP: five rules
// across four components asked Geist Sans for weights 800/820/850, but the repo
// ships only static 400/500/700 faces. A browser cannot decline — it SYNTHESISES
// the missing weight by smearing the 700 outline, which renders heavier and
// blurrier than the real face and differs between engines. Nothing failed, no
// audit flagged it, and the headline on the flagship page had been faux-bold
// since launch. A weight typo is invisible to every other check we run.
//
// THE ASYMMETRY THAT MAKES THIS SUBTLE: Geist Mono IS a variable font
// (geist-mono-latin-wght-normal.woff2, range 100-900), so `font-weight: 800` is
// perfectly legal there. The rule is per family, not global — which is exactly
// why a blanket "no weights above 700" lint would be wrong.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

// Which static weights exist for the display/sans family, read from disk rather
// than hardcoded, so adding a 800 face makes this guard relax on its own.
const fontFiles = readdirSync(new URL('public/fonts/', root));
const sansWeights = new Set(
  fontFiles
    .map((f) => f.match(/^geist-sans-latin-(\d{3})-normal\.woff2$/))
    .filter(Boolean)
    .map((m) => Number(m[1])),
);
// A *-wght-* file is a variable font: any weight in its range is real.
const monoIsVariable = fontFiles.some((f) => /^geist-mono-latin-wght-normal\.woff2$/.test(f));

assert.ok(sansWeights.size > 0, 'at least one static Geist Sans face ships');
assert.ok(monoIsVariable, 'Geist Mono ships as a variable font');

// Walk every component/page/style file for weights bound to the display family.
const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(new URL(dir, root), { withFileTypes: true })) {
    const p = `${dir}${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(`${p}/`));
    else if (/\.(astro|css)$/.test(entry.name)) out.push(p);
  }
  return out;
};

const offenders = [];
for (const file of walk('src/')) {
  const text = read(file);
  text.split('\n').forEach((line, i) => {
    // `font: <weight> ...` shorthand and `font-weight: <weight>` longhand.
    const short = line.match(/font:\s*(\d{3})\s/);
    const long = line.match(/font-weight:\s*(\d{3})/);
    const weight = Number((short || long || [])[1]);
    if (!weight) return;
    // Mono is variable: skip any rule that names the mono family on this line.
    if (/--font-mono|Geist Mono/.test(line)) return;
    // A longhand weight may sit in a block whose family is declared elsewhere;
    // only flag it when the surrounding rule names the display/sans family.
    if (long && !short) {
      const block = text.slice(Math.max(0, text.indexOf(line) - 400), text.indexOf(line));
      if (/--font-mono|Geist Mono/.test(block)) return;
      if (!/--font-display|--font-sans|Geist Sans/.test(block)) return;
    }
    if (short && !/--font-display|--font-sans|Geist Sans/.test(line)) return;
    if (!sansWeights.has(weight)) {
      offenders.push(`${file}:${i + 1}  weight ${weight} (ships: ${[...sansWeights].sort().join('/')})`);
    }
  });
}

assert.deepEqual(
  offenders,
  [],
  `these rules ask Geist Sans for a weight that does not ship, so the browser synthesises it:\n  ${offenders.join('\n  ')}`,
);

console.log(`# font-weights-exist: Geist Sans ${[...sansWeights].sort().join('/')} · mono variable · no synthesised weights`);
