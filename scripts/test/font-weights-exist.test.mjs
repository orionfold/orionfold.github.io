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
    if (short && !/--font-display|--font-sans|Geist Sans|--pp-serif|Fraunces/.test(line)) return;
    // Paper R8: --font-display is Fraunces (variable, wght 300-500), not Geist.
    // Longhand: only the rule the line belongs to (from its own opening brace).
    const at = text.indexOf(line);
    const ruleStart = text.lastIndexOf('{', at + line.indexOf('font-weight'));
    const ctx = short ? line : text.slice(ruleStart, at + line.length);
    const lastFamily = [...ctx.matchAll(/--font-display|--pp-serif|Fraunces|--font-sans|Geist Sans/g)].pop()?.[0];
    if (lastFamily && /--font-display|--pp-serif|Fraunces/.test(lastFamily)) {
      // A rule that turns weight synthesis off renders the real 500 cut, never a fake.
      if (/font-synthesis(-weight)?:\s*none/.test(text.slice(ruleStart, text.indexOf('}', at)))) return;
      if (weight < 300 || weight > 500) offenders.push(`${file}:${i + 1}  weight ${weight} (Fraunces ships 300-500)`);
      return;
    }
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

const foundation = read('src/styles/living-system.css');
// Paper R8 (G-147, operator 2026-10-31): Barlow Condensed is retired. The
// display face is Paper's Fraunces, cut at weights 300 to 500 only, so no
// display rule may ask it for 600 or 700 (the browser would fake the bold).
assert.ok(!existsSync(new URL('public/fonts/barlow-condensed-bold.woff2', root)), 'Barlow no longer ships');
assert.doesNotMatch(foundation, /Barlow/, 'no Barlow @font-face');
assert.match(read('src/styles/global.css'), /--font-display:\s*"Fraunces"/, 'display typography selects Fraunces');
assert.doesNotMatch(read('src/layouts/Layout.astro'), /barlow/i, 'no Barlow preload');
{
  const heavy = [];
  const sources = readdirSync(new URL('src/styles/', root)).filter((f) => f.endsWith('.css')).map((f) => ['src/styles/' + f, read('src/styles/' + f)]);
  for (const [file, css] of sources) {
    if (/Barlow/.test(css)) heavy.push(`${file}: names Barlow`);
    for (const m of css.matchAll(/font:\s*(600|700|bold)\s[^;]*(pp-serif|Fraunces|--font-display|--dm-display)/g)) heavy.push(`${file}: ${m[0].slice(0, 90)}`);
  }
  assert.deepEqual(heavy, [], `display serif asked for a weight that does not ship:\n  ${heavy.join('\n  ')}`);
}
