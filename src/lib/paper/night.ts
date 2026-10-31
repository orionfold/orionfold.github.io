// Paper's night theme: the values the Flow app uses when the Mac is in its
// dark appearance (operator 2026-10-30: Paper owns all design for the website
// and the app, including the app's dark mode). The website itself stays
// light-only; these values reach the app through the Paper package, and the
// dev gallery previews them as plain token overrides.
//
// Every text pair clears WCAG AA (4.5:1), checked by contrast() below and by
// scripts/test/paper-design-system.test.mjs. Each Fold keeps its own colors on
// night, lifted toward white only as far as it needs: its body and facets to
// 3:1 (non-text graphics) and its ink to 4.5:1 (the small labels it colors).
import type { Fold } from './folds.ts';

export const NIGHT: Record<string, string> = {
  paper: '#16191c',
  'paper-2': '#1d2125',
  white: '#23282d',
  ink: '#efece4',
  'ink-2': '#c9c5bb',
  'ink-3': '#a19d94',
  line: '#3a3f44',
  teal: '#5cc0bf',
  'teal-ink': '#5cc0bf',
  'teal-pale': '#173537',
  gold: '#f6b73c',
  'gold-pale': '#3a2f17',
  tape: 'rgba(246, 183, 60, 0.35)',
  red: '#ff6b5a',
  'red-deep': '#ff9384',
  'del-bg': '#3a201d',
  'del-ink': '#ffb4a9',
  'del-strike': 'rgba(255, 180, 169, 0.45)',
  'add-bg': '#16322a',
  'add-ink': '#9be0bf',
  night: '#0d0f11',
  'night-ink': '#efece4',
  'night-ink-2': '#c9c5bb',
  'night-ink-3': '#a9a59c',
  'night-line': '#2e3236',
  star: '#f6e7bf',
  glass: 'rgba(22, 25, 28, 0.88)',
  scrim: 'rgba(0, 0, 0, 0.45)',
};

/** The text pairs night promises at 4.5:1 or better: [foreground, background]. */
export const NIGHT_TEXT_PAIRS: [string, string][] = [
  ['ink', 'paper'], ['ink', 'white'], ['ink-2', 'paper'], ['ink-2', 'white'], ['ink-3', 'paper'], ['ink-3', 'white'], ['ink-3', 'paper-2'],
  ['teal', 'paper'], ['teal', 'white'], ['teal-ink', 'paper'], ['teal-ink', 'paper-2'], ['teal', 'teal-pale'], ['red-deep', 'paper'], ['red-deep', 'white'],
  ['del-ink', 'del-bg'], ['add-ink', 'add-bg'], ['night-ink', 'night'], ['night-ink-3', 'night'],
];

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex: string) => {
  const [r, g, b] = channels(hex).map((v) => v / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio of two #rrggbb colors. */
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const toward = (hex: string, t: number) => '#' + channels(hex).map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('');
/** The least lift toward white that clears `min` against the night paper. */
const lift = (hex: string, min: number) => {
  for (let t = 0; t <= 1; t += 0.02) {
    const c = toward(hex, t);
    if (contrast(c, NIGHT.paper) >= min) return c;
  }
  return '#ffffff';
};

/** A Fold's colors on night: body and facets at 3:1, ink at 4.5:1. */
export const nightFold = (f: Fold) => ({ a: lift(f.a, 3), b: lift(f.b, 3), c: f.c, ink: lift(f.ink, 4.5) });

// Fine detail that drops out on a dark sidebar (product lane measured 16 to
// 64 pt in AppKit, 2026-10-30): Tally's thin legs and Orri's dotted trail.
const NIGHT_STRIP: Record<string, RegExp[]> = {
  orri: [/<path d="M20 170[^>]*\/>/],
  tally: [/<polygon points="(?:92,146|106,146)[^"]*"[^>]*\/>/g],
};
/** A Fold's shapes for night: lifted colors, fine detail removed. */
export const nightFoldShapes = (f: Fold) => {
  const n = nightFold(f);
  return (NIGHT_STRIP[f.id] ?? []).reduce((s, re) => s.replace(re, ''), f.draw(n.a, n.b, n.c));
};
/** Any colorway (a, b, c, ink) lifted for night the same way. */
export const nightColors = (cw: { a: string; b: string; c: string; ink: string }) => ({ a: lift(cw.a, 3), b: lift(cw.b, 3), c: cw.c, ink: lift(cw.ink, 4.5) });
/** The small solid parts of a personal Fold at night (a beak, a body): Paper's own light ink. */
export const NIGHT_DETAIL = NIGHT['ink-2'];
