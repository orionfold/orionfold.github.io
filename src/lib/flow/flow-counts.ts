// The Flow library numbers every page states. The values live in
// src/data/flow-counts.json, refreshed from the Flow Guide manifest by
// scripts/sync-flow-counts.mjs; never type them into copy.
import counts from '../../data/flow-counts.json';

export const FLOW_COUNTS = counts;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** Small counts read better as words ("four categories"); larger ones stay digits. */
export const countWord = (n: number) => WORDS[n] ?? String(n);
