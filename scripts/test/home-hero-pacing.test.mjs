// The home hero (TalkPageHero): no page-then-chat flash on load, and every beat
// held at an adult's reading pace (operator 2026-10-30).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hero = readFileSync(new URL('../../src/components/paper/TalkPageHero.astro', import.meta.url), 'utf8');

test('the hero flips to the empty chat before first paint, except with reduced motion', () => {
  const inline = hero.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1] ?? '';
  assert.match(inline, /prefers-reduced-motion: reduce/, 'reduced motion keeps the served finished page');
  assert.match(inline, /dataset\.act = 'talk'/, 'the chat beat is set before paint');
  assert.ok(hero.indexOf('<script is:inline>') > hero.indexOf('class="pp-pb-note"'), 'the inline script sits right after the duo, so it runs as soon as the duo is parsed');
  assert.match(hero, /let beat = duo\.dataset\.act === 'talk' \? 0 : 1/, 'the player starts from the beat on screen');
});

test('beats are held for their own words at 250 words a minute', () => {
  assert.match(hero, /const WPM = 250/);
  assert.match(hero, /later\(REVEAL \+ readMs\(pageText\(b\)\)/, 'the page is held for its reading time');
  assert.match(hero, /later\(250 \+ readMs\(replyText\(b\)\)/, 'the reply is held for its reading time');
  assert.doesNotMatch(hero, /later\(2300|data-interval/, 'no fixed hold that ignores the copy length');
});
