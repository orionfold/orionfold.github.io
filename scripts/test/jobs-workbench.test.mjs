import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JOBS_SCENARIOS, createJobsDemoState, transitionJobsDemo, pendingJobsParts, jobsDemoStatus, focusJobsDemoTransition } from '../../src/scripts/jobs-workbench.js';

const act = (state, type, value) => transitionJobsDemo(state, { type, value });
const run = state => act(act(act(state, 'input'), 'run'), 'finish');

test('the declared input changes before any output and a run needs that change', () => {
  const initial = createJobsDemoState();
  assert.strictEqual(act(initial, 'run'), initial);
  const input = act(initial, 'input');
  assert.equal(input.inputChanged, true);
  assert.deepEqual(input.outputs, { chart: false, summary: false });
  assert.equal(initial.inputChanged, false, 'transitions preserve previous snapshots');
  const running = act(input, 'run');
  assert.equal(running.phase, 'running');
  assert.deepEqual(running.outputs, { chart: false, summary: false });
  const review = act(running, 'finish');
  assert.equal(review.phase, 'review');
  assert.deepEqual(review.outputs, { chart: true, summary: true });
  assert.deepEqual(pendingJobsParts(review), ['chart', 'summary']);
});

test('keeping records a decision while reverting restores only the selected output', () => {
  const review = run(createJobsDemoState());
  const kept = act(review, 'keep');
  assert.equal(kept.decisions.chart, 'kept');
  assert.equal(kept.outputs.chart, true);
  assert.equal(kept.selected, 'summary');
  const complete = act(kept, 'revert');
  assert.equal(complete.phase, 'complete');
  assert.deepEqual(complete.outputs, { chart: true, summary: false });
  assert.deepEqual(complete.decisions, { chart: 'kept', summary: 'reverted' });
  assert.equal(complete.inputChanged, true, 'review cannot undo the authored input');
  assert.match(jobsDemoStatus(complete), /1 kept · 1 reverted/);
  assert.equal(review.decisions.chart, 'pending', 'the old snapshot was not mutated');
});

test('Later preserves applied pending changes and resumes the same review', () => {
  const review = act(run(createJobsDemoState()), 'revert');
  const later = act(review, 'later');
  assert.equal(later.phase, 'later');
  assert.deepEqual(later.outputs, { chart: false, summary: true });
  assert.deepEqual(later.decisions, { chart: 'reverted', summary: 'pending' });
  assert.strictEqual(act(later, 'keep'), later, 'a hidden review cannot accept a decision');
  const resumed = act(later, 'resume');
  assert.equal(resumed.phase, 'review');
  assert.equal(resumed.selected, 'summary');
  assert.deepEqual(resumed.outputs, later.outputs);
});

test('review mode starts with applied changes; reset returns to its illustrative sample', () => {
  const review = createJobsDemoState('portfolio', 'review');
  assert.equal(review.phase, 'review');
  assert.equal(review.inputChanged, true);
  const complete = act(act(review, 'revert'), 'revert');
  assert.equal(complete.phase, 'complete');
  assert.equal(complete.inputChanged, true);
  assert.deepEqual(act(complete, 'reset'), review);
  const content = JOBS_SCENARIOS.portfolio;
  const amount = text => Number(text.replace(/[$,]/g, ''));
  assert.equal(amount(content.chartAfter) - amount(content.chartBefore), 500);
  assert.equal(amount(content.summaryAfter) - amount(content.summaryBefore), 500);
});

test('decided parts cannot be decided twice; a completed run does not repeat', () => {
  const review = run(createJobsDemoState());
  const kept = act(review, 'keep');
  const selected = act(kept, 'select', 'chart');
  assert.strictEqual(act(selected, 'revert'), selected);
  assert.strictEqual(act(selected, 'run'), selected);
  assert.strictEqual(act(selected, 'finish'), selected);
  assert.deepEqual(act(selected, 'reset'), createJobsDemoState());
});

test('viewing definitions, relations and exact changes cannot edit the sample', () => {
  const start = createJobsDemoState();
  const states = [act(start, 'tab', 'relations'), act(start, 'definition', 'watch'), act(start, 'relations', 'list'), act(start, 'view', 'exact')];
  for (const state of states) {
    assert.equal(state.inputChanged, false);
    assert.deepEqual(state.outputs, start.outputs);
    assert.deepEqual(state.decisions, start.decisions);
  }
  assert.equal(act(start, 'tab', 'invalid').tab, 'edit');
});


test('phase changes move focus out of hidden controls into the newly visible review', () => {
  for (const [from, to, selector] of [
    ['ready', 'running', '[data-run-progress] h4'],
    ['running', 'review', '[data-review-active] h4'],
    ['review', 'later', '[data-action="resume"]'],
    ['later', 'review', '[data-review-active] h4'],
    ['review', 'complete', '[data-review-complete] h4'],
    ['complete', 'ready', '[data-action="input"]'],
  ]) {
    let focused = false;
    const previous = { disabled: false, closest: name => name === '[hidden]' ? {} : null };
    const target = { tagName: selector.includes('h4') ? 'H4' : 'BUTTON', focus() { focused = true; } };
    const root = {
      contains: element => element === previous,
      querySelector(requested) { assert.equal(requested, selector); return target; },
    };
    focusJobsDemoTransition(root, from, to, previous);
    assert.equal(focused, true, `${from} to ${to} restores usable keyboard focus`);
    if (target.tagName === 'H4') assert.equal(target.tabIndex, -1);
  }
});

test('normal selections and phase changes never steal visible or external focus', () => {
  const previous = { disabled: false, closest: () => null };
  const root = { contains: element => element === previous, querySelector() { assert.fail('focus must stay where the visitor put it'); } };
  focusJobsDemoTransition(root, 'review', 'review', previous);
  focusJobsDemoTransition(root, 'running', 'review', previous);
  focusJobsDemoTransition(root, 'running', 'review', { disabled: false, closest: () => ({}) });
  focusJobsDemoTransition(root, 'running', 'review', null);
});
