// A Fold as a Rive state machine (Paper 0.4.0, operator 2026-11-03 "Rive and
// type roles now"). This is the contract every Fold's .riv follows and the
// reference the app and the Rive editor work from; the package ships it as
// folds/state-machine.json. Duolingo's pattern (one runtime file per
// character, body/mouth/idle layers in parallel, driven by the app):
// https://blog.duolingo.com/world-character-visemes
export const FOLD_STATE_MACHINE = {
  name: 'fold',
  artboard: { viewBox: '0 0 200 214', note: 'one artboard per Fold, the same polygons as the SVG; colours a, b, c and ink bound through the view model' },
  inputs: {
    state: { type: 'enum', values: ['idle', 'listening', 'thinking', 'speaking'], default: 'idle' },
    viseme: { type: 'number', range: [0, 4], default: 0, note: 'set per phoneme while speaking; 0 is closed' },
    right: { type: 'trigger', note: 'a bounce and a blush, then back to the state before' },
    wrong: { type: 'trigger', note: 'a shake with half-closed lids, then back to the state before' },
  },
  layers: {
    body: { states: { idle: 'breathe, scale 1 to 1.014 over 4 s', listening: 'lean 5 degrees toward the person, 4 px up', thinking: 'slow bob over 2.6 s', speaking: 'quick bob over 0.7 s' } },
    eyes: { states: { listening: 'pupils toward the person', thinking: 'pupils up and to the right', wrong: 'lids half closed' }, note: 'pupils move with the base duration and ease-out' },
    mouth: { visemes: ['closed', 'small round', 'open wide', 'wide thin', 'tall narrow'], note: 'five shapes shared by every Fold, each Fold with its own drawing; 110 ms per viseme while speaking' },
    blink: { note: 'every 4.4 s, 0.2 s closed, runs under idle, listening, thinking and speaking' },
    reaction: { right: 'bounce 16 px over 0.9 s on the bouncy spring, blush to 85%', wrong: 'shake 6 px over 0.55 s, mouth flat' },
  },
  springs: { smooth: { duration: 0.32, bounce: 0 }, snappy: { duration: 0.28, bounce: 0.15 }, bouncy: { duration: 0.5, bounce: 0.3 } },
  reduceMotion: 'the pose changes, nothing moves between poses, blink and breathe stop',
  delight: 'a Fold reacts at rare moments (sign-off, a right or wrong answer, first launch), never on daily actions',
  runtimes: { web: '@rive-app/canvas', apple: 'RiveRuntime, macOS 13.1 and later', fallback: 'dotLottie with state machines (Lottie Creator, since 2025-09)' },
  authoring: 'the .riv is made in the Rive editor from the same layers; Rive has no authoring API, so each Fold is an editor task',
  /** Ember's reference mouth paths in the 200 x 214 viewBox, one per viseme, as drawn on the website's review page. */
  reference: {
    fold: 'ember',
    mouth: ['M94 138 Q100 142 106 138', 'M97 136 Q100 134 103 136 Q104 140 100 141 Q96 140 97 136 Z', 'M92 136 Q100 150 108 136 Z', 'M90 137 Q100 141 110 137 Q100 144 90 137 Z', 'M98 134 Q102 134 102 141 Q100 145 98 141 Z'],
    mouthRight: 'M90 137 Q100 148 110 137', mouthWrong: 'M94 140 L106 140', mouthThinking: 'M95 139 Q100 137 105 139',
    eyes: [[82, 100], [118, 100]], blush: [[72, 112], [128, 112]],
  },
} as const;
