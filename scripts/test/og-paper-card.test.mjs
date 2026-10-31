// R3 (G-142): every share card is a Paper card. Titled cards are the sheet
// (paper ground, Fraunces title, a Fold); art cards keep their art with a paper
// brand bar. Guards the renderer's inputs and the page map's Fold names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const card = read('src/lib/og/card.ts');
const og = read('src/data/og.ts');
const endpoint = read('src/pages/og/[slug].jpg.ts');
const folds = [...read('src/lib/paper/folds.ts').matchAll(/\{ id: '([a-z]+)'/g)].map((m) => m[1]);

test('the card renders in Paper type from committed static fonts', () => {
  for (const f of ['Fraunces-Paper-Light.ttf', 'Fraunces-Paper-Regular.ttf', 'Geist-Regular.ttf', 'Geist-Bold.ttf']) {
    assert.ok(existsSync(new URL(`../../src/lib/og/fonts/${f}`, import.meta.url)), `${f} is a committed build input`);
    assert.match(card, new RegExp(f.replace('.', '\\.')), `${f} is loaded`);
  }
  assert.ok(existsSync(new URL('../../public/fonts/Fraunces-OFL.txt', import.meta.url)), 'Fraunces ships with its licence');
  assert.match(card, /fontFamily: 'Fraunces', fontWeight: 300/, 'titles are Fraunces Light, like the site headings');
  assert.match(card, /from '\.\.\/paper\/folds'/, 'Folds come from the Paper source, not a copy');
  assert.doesNotMatch(card, /Barlow|banner\.png|constellation|TEXT_GLOW|hero-home-paper-planes/, 'no Living Systems or banner card remains');
});

test('art cards keep their art and gain the paper bar', () => {
  assert.match(card, /function artCard/);
  assert.match(card, /backgroundColor: PAPER, borderTop/, 'the bar is solid paper, not the old dark strip');
});

test('every Fold named by the page map or the endpoint exists', () => {
  const named = [...og.matchAll(/fold: '([a-z]+)'/g), ...endpoint.matchAll(/fold: '([a-z]+)'/g), ...endpoint.matchAll(/: '([a-z]+)' \};/g)].map((m) => m[1]);
  assert.ok(named.length >= 10, 'the cards carry Folds');
  for (const f of named) assert.ok(folds.includes(f), `${f} is one of the eight Folds`);
  assert.doesNotMatch(og, /\blight: true|"?living"?: true/, 'no page asks for a retired card style');
  assert.match(og, /OG_RENDERER_VERSION = 'paper-/, 'card URLs are versioned for the Paper renderer');
});

test('the card cache keys on the Paper drawings too', () => {
  assert.match(read('src/lib/og/card-cache.ts'), /'src\/lib\/og', 'src\/lib\/paper'/);
});
