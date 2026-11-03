// Paper 0.4.0 tonal ramps (operator 2026-11-03 "cut it"): five named steps per
// hue, built in OKLCH at fixed lightness targets so the steps match across hues.
// pale = wash, soft = light face or fill, base = the brand or Fold colour,
// deep = shade face (3:1 on the ground, graphics), ink = the hue as text
// (4.5:1 on paper-2). This file is the source of truth: tokens.css carries the
// same values for the website (the guard test keeps them equal), the exporter
// writes them to the package, and the Folds take their a, b, c and ink from
// here (a = base, b = deep, c = soft, ink = ink).
export type RampStep = 'pale' | 'soft' | 'base' | 'deep' | 'ink';
export type Hue = 'teal' | 'gold' | 'coral' | 'violet' | 'green' | 'pink' | 'blue' | 'ochre' | 'red';
export const HUES: Hue[] = ['teal', 'gold', 'coral', 'violet', 'green', 'pink', 'blue', 'ochre', 'red'];
export const STEPS: RampStep[] = ['pale', 'soft', 'base', 'deep', 'ink'];

export const RAMP: Record<Hue, Record<RampStep, string>> = {
    teal: { pale: '#e3f4f5', soft: '#a7d4d7', base: '#247b80', deep: '#066368', ink: '#1f7176' },
    gold: { pale: '#fdebc4', soft: '#eac486', base: '#f6b73c', deep: '#bc881b', ink: '#8f660d' },
    coral: { pale: '#feece4', soft: '#fdb89a', base: '#f2783c', deep: '#c76b40', ink: '#a95730' },
    violet: { pale: '#f0eeff', soft: '#cbc1ff', base: '#7c5bd6', deep: '#634ea2', ink: '#6d5caa' },
    green: { pale: '#e5f5e7', soft: '#abd8b2', base: '#3d8a4f', deep: '#227238', ink: '#2d7b41' },
    pink: { pale: '#ffeaf0', soft: '#f5b6cb', base: '#f08bb0', deep: '#d57297', ink: '#a85173' },
    blue: { pale: '#eaf0fd', soft: '#b1caff', base: '#4f74c9', deep: '#3c5daa', ink: '#4969b2' },
    ochre: { pale: '#f9efdb', soft: '#e2c790', base: '#d0a43a', deep: '#b68b16', ink: '#8b6909' },
    red: { pale: '#fdece9', soft: '#feb6aa', base: '#f24b39', deep: '#ba2d21', ink: '#ac5246' },
  };

/** The same ramps for the app's night appearance (deep 3:1 on the night paper, ink 4.5:1 on night paper-2). */
export const NIGHT_RAMP: Record<Hue, Record<RampStep, string>> = {
    teal: { pale: '#173537', soft: '#2d4b4d', base: '#5cc0bf', deep: '#40a7a6', ink: '#5cc0bf' },
    gold: { pale: '#3a2f17', soft: '#56411c', base: '#f6b73c', deep: '#d2a148', ink: '#e9bb6d' },
    coral: { pale: '#33221a', soft: '#603a29', base: '#f2783c', deep: '#c26e47', ink: '#d98965' },
    violet: { pale: '#272434', soft: '#463f63', base: '#7c5bd6', deep: '#6e56b9', ink: '#8b7dc7' },
    green: { pale: '#1c2b1f', soft: '#304d35', base: '#3d8a4f', deep: '#387347', ink: '#50965f' },
    pink: { pale: '#332027', soft: '#5e3745', base: '#f08bb0', deep: '#d17697', ink: '#e791b0' },
    blue: { pale: '#1f2635', soft: '#354465', base: '#4f74c9', deep: '#4464aa', ink: '#6887cc' },
    ochre: { pale: '#2d2515', soft: '#53431d', base: '#d0a43a', deep: '#b38c2b', ink: '#caa653' },
    red: { pale: '#34211e', soft: '#613832', base: '#ff6b5a', deep: '#ff9384', ink: '#dd8679' },
  };

/** Warm viz greys (the hue of paper-2): grid lighter than axis labels, context series never read as a category. */
export const VIZ = { 'viz-grid': '#e4e1da', 'viz-axis': '#838078', 'viz-context-1': '#c7c4ba', 'viz-context-2': '#a8a49b', 'viz-context-3': '#838078' } as const;
export const NIGHT_VIZ = { 'viz-grid': '#35332d', 'viz-axis': '#9b9890', 'viz-context-1': '#58554e', 'viz-context-2': '#74716a', 'viz-context-3': '#95928a' } as const;

/** The categorical data ramp: eight steps, each 3:1 on paper, each paired with a marker shape. Gold base is never a series. */
export const DATA: [string, string][] = [['teal-base', 'circle'], ['coral-deep', 'square'], ['violet-base', 'diamond'], ['gold-deep', 'triangle up'], ['blue-base', 'triangle down'], ['green-base', 'cross'], ['pink-deep', 'plus'], ['ink-2', 'hexagon']];

/** Which hue each Fold wears. */
export const FOLD_HUE = { orri: 'gold', tally: 'teal', ember: 'coral', clause: 'violet', shell: 'green', sprout: 'pink', atlas: 'blue', hop: 'ochre' } as const;
