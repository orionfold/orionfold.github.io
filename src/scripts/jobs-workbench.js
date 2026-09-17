/** Bounded, browser-only illustrations of saved Jobs and applied-change review. */
export const JOBS_SCENARIOS = Object.freeze({
  customer: {
    title: 'Research Brief', folder: 'Customer Research', source: 'Interview Register.md',
    definition: 'Research Refresh.md', output: 'data/review-*.json',
    inputBefore: '11 interviews', inputAfter: '12 interviews',
    inputAction: 'Add interview I12', inputDescription: 'Portable files · 1 mention',
    chartTitle: 'What people need', chartBefore: '3', chartAfter: '4',
    summaryTitle: 'Finding table', summaryBefore: 'Portable files: 3', summaryAfter: 'Portable files: 4',
    partLabels: { chart: 'Needs chart', summary: 'Finding table' },
  },
  portfolio: {
    title: 'Portfolio Dashboard', folder: 'Stock Portfolio', source: 'Holdings.md',
    definition: 'Portfolio Refresh.md', output: 'data/portfolio-*.json',
    inputBefore: '$12,500 cash', inputAfter: '$13,000 cash',
    inputAction: 'Add $500 to cash', inputDescription: 'Same retained quote snapshot',
    chartTitle: 'At a glance', chartBefore: '$105,761', chartAfter: '$106,261',
    summaryTitle: 'Cash allocation', summaryBefore: '$12,500', summaryAfter: '$13,000',
    partLabels: { chart: 'Portfolio value', summary: 'Cash allocation' },
  },
});

export function createJobsDemoState(scenario = 'customer', mode = 'full') {
  const reviewing = mode === 'review';
  return {
    scenario: scenario in JOBS_SCENARIOS ? scenario : 'customer', mode,
    phase: reviewing ? 'review' : 'ready', tab: reviewing ? 'run' : 'edit',
    definition: 'gather', relations: 'map', view: 'document', selected: 'chart',
    inputChanged: reviewing,
    outputs: { chart: reviewing, summary: reviewing },
    decisions: { chart: reviewing ? 'pending' : null, summary: reviewing ? 'pending' : null },
  };
}

export function pendingJobsParts(state) {
  return Object.keys(state.decisions).filter(part => state.decisions[part] === 'pending');
}

/** Return a new state only for a valid transition; decisions never mutate source inputs. */
export function transitionJobsDemo(state, action) {
  const next = { ...state, outputs: { ...state.outputs }, decisions: { ...state.decisions } };
  switch (action.type) {
    case 'reset': return createJobsDemoState(state.scenario, state.mode);
    case 'tab':
      if (['edit', 'run', 'relations'].includes(action.value)) next.tab = action.value;
      break;
    case 'definition':
      if (['gather', 'watch'].includes(action.value)) next.definition = action.value;
      break;
    case 'relations':
      if (['map', 'list'].includes(action.value)) next.relations = action.value;
      break;
    case 'view':
      if (['document', 'exact'].includes(action.value)) next.view = action.value;
      break;
    case 'input':
      if (state.phase === 'ready') next.inputChanged = true;
      break;
    case 'run':
      if (state.phase !== 'ready' || !state.inputChanged) return state;
      next.phase = 'running'; next.tab = 'run';
      break;
    case 'finish':
      if (state.phase !== 'running') return state;
      next.phase = 'review'; next.tab = 'run';
      next.outputs = { chart: true, summary: true };
      next.decisions = { chart: 'pending', summary: 'pending' };
      break;
    case 'select':
      if (['chart', 'summary'].includes(action.value)) next.selected = action.value;
      break;
    case 'keep':
    case 'revert': {
      if (state.phase !== 'review' || state.decisions[state.selected] !== 'pending') return state;
      next.decisions[state.selected] = action.type === 'keep' ? 'kept' : 'reverted';
      if (action.type === 'revert') next.outputs[state.selected] = false;
      const pending = pendingJobsParts(next);
      if (pending.length) next.selected = pending[0];
      else next.phase = 'complete';
      next.view = 'document';
      break;
    }
    case 'later':
      if (state.phase === 'review') next.phase = 'later';
      break;
    case 'resume':
      if (state.phase === 'later') { next.phase = 'review'; next.tab = 'run'; }
      break;
    default: return state;
  }
  return next;
}

export function jobsDemoStatus(state) {
  if (state.phase === 'ready') return state.inputChanged ? 'Input saved. Run Jobs to refresh the document.' : 'Inspect the Jobs, then make one change.';
  if (state.phase === 'running') return 'Reading the declared input and refreshing two document parts…';
  if (state.phase === 'review') return `${pendingJobsParts(state).length} applied changes to review. You decide what stays.`;
  if (state.phase === 'later') return 'Review paused. Remaining changes are still applied.';
  const kept = Object.values(state.decisions).filter(value => value === 'kept').length;
  return `Review complete. ${kept} kept · ${2 - kept} reverted. Source input retained.`;
}

/** Restore keyboard focus only when a phase change hides or disables its owner. */
export function focusJobsDemoTransition(root, previousPhase, phase, previousFocus) {
  if (previousPhase === phase || !previousFocus || !root.contains(previousFocus)) return;
  if (!previousFocus.disabled && !previousFocus.closest('[hidden]')) return;
  const targets = {
    ready: '[data-action="input"]', running: '[data-run-progress] h4',
    review: '[data-review-active] h4', later: '[data-action="resume"]',
    complete: '[data-review-complete] h4',
  };
  const target = root.querySelector(targets[phase]);
  if (!target) return;
  if (target.tagName !== 'BUTTON') target.tabIndex = -1;
  target.focus();
}

export function initJobsWorkbenchDemos(scope = document) {
  scope.querySelectorAll('[data-jobs-demo]').forEach(root => {
    if (root.dataset.jobsReady) return;
    root.dataset.jobsReady = 'true';
    let state = createJobsDemoState(root.dataset.scenario, root.dataset.mode);
    const content = JOBS_SCENARIOS[state.scenario];
    let runTimer;
    const all = selector => root.querySelectorAll(selector);
    const show = (selector, visible) => all(selector).forEach(el => { el.hidden = !visible; });
    const setText = (selector, text) => all(selector).forEach(el => { el.textContent = text; });
    const activate = (selector, value, attribute) => all(selector).forEach(el => {
      const active = el.dataset.value === value;
      el.setAttribute(attribute, String(active));
      if (attribute === 'aria-selected') el.tabIndex = active ? 0 : -1;
    });

    function render() {
      const reviewed = ['review', 'later', 'complete'].includes(state.phase);
      const pending = pendingJobsParts(state);
      const chartNew = state.outputs.chart;
      const summaryNew = state.outputs.summary;
      root.dataset.phase = state.phase;
      activate('[data-action="tab"]', state.tab, 'aria-selected');
      activate('[data-action="definition"]', state.definition, 'aria-pressed');
      activate('[data-action="relations"]', state.relations, 'aria-pressed');
      activate('[data-action="view"]', state.view, 'aria-pressed');
      all('[data-panel]').forEach(el => { el.hidden = el.dataset.panel !== state.tab; });
      all('[data-definition]').forEach(el => { el.hidden = el.dataset.definition !== state.definition; });
      all('[data-relations-view]').forEach(el => { el.hidden = el.dataset.relationsView !== state.relations; });
      setText('[data-input-value]', state.inputChanged ? content.inputAfter : content.inputBefore);
      setText('[data-status]', jobsDemoStatus(state));
      setText('[data-chart-value]', chartNew ? content.chartAfter : content.chartBefore);
      setText('[data-summary-value]', summaryNew ? content.summaryAfter : content.summaryBefore);
      setText('[data-interview-count]', chartNew ? '12' : '11');
      setText('[data-cash-percent]', summaryNew ? '12.2%' : '11.8%');
      all('[data-portable-line]').forEach(el => { el.style.width = chartNew ? '80%' : '60%'; });
      all('[data-allocation]').forEach(el => { el.style.setProperty('--cash', summaryNew ? '12.2%' : '11.8%'); });
      all('[data-part]').forEach(el => {
        const part = el.dataset.part;
        const decision = state.decisions[part];
        el.dataset.selected = String(state.selected === part && state.phase === 'review');
        el.dataset.decision = decision || 'unchanged';
        if (el.tagName === 'BUTTON') {
          el.disabled = !reviewed;
          el.setAttribute('aria-pressed', String(state.selected === part && state.phase === 'review'));
          let accessibleValue = '';
          if (el.classList.contains('jw-output')) {
            accessibleValue = part === 'chart'
              ? (state.scenario === 'customer'
                ? `Approval record 5, Portable files ${chartNew ? '4' : '3'}, Faster review 2, Local access 1; ${chartNew ? '12' : '11'} interviews.`
                : `Portfolio value ${chartNew ? content.chartAfter : content.chartBefore}, including cash.`)
              : `${summaryNew ? content.summaryAfter : content.summaryBefore}.`;
          }
          el.setAttribute('aria-label', `Inspect ${content.partLabels[part]}. ${accessibleValue}${decision ? ` Status: ${decision}.` : ''}`);
        }
      });
      all('[data-part-status]').forEach(el => {
        const decision = state.decisions[el.dataset.partStatus];
        el.textContent = decision === 'pending' ? 'Changed' : decision === 'kept' ? 'Kept' : decision === 'reverted' ? 'Reverted' : 'Saved view';
      });
      setText('[data-selected-title]', content.partLabels[state.selected]);
      setText('[data-selected-status]', state.decisions[state.selected] === 'pending' ? 'Applied · awaiting your decision' : `Decision: ${state.decisions[state.selected] || 'not run'}`);
      setText('[data-diff-before]', state.selected === 'chart' ? content.chartBefore : content.summaryBefore);
      setText('[data-diff-after]', state.selected === 'chart' ? content.chartAfter : content.summaryAfter);
      show('[data-doc-view]', state.view === 'document' || !reviewed);
      show('[data-exact-view]', state.view === 'exact' && reviewed);
      show('[data-review-view-toggle]', reviewed);
      show('[data-run-ready]', state.phase === 'ready');
      show('[data-run-progress]', state.phase === 'running');
      show('[data-review-active]', state.phase === 'review');
      show('[data-review-later]', state.phase === 'later');
      show('[data-review-complete]', state.phase === 'complete');
      show('[data-input-new]', state.inputChanged);
      all('[data-action="input"]').forEach(el => { el.disabled = state.inputChanged || state.phase !== 'ready'; el.textContent = state.inputChanged ? 'Input saved' : content.inputAction; });
      all('[data-action="run"]').forEach(el => { el.disabled = state.phase !== 'ready' || !state.inputChanged; });
      all('[data-action="keep"], [data-action="revert"]').forEach(el => { el.disabled = state.decisions[state.selected] !== 'pending'; });
      setText('[data-pending-count]', String(pending.length));
      setText('[data-complete-summary]', jobsDemoStatus(state));
      setText('[data-run-label]', state.scenario === 'portfolio' ? 'Replay sample run' : 'Run Jobs');
      setText('[data-source-note]', state.inputChanged ? `${content.inputAfter} in the source. Review decisions only affect the document outputs.` : 'Your source stays beside the document.');
    }

    function dispatch(action) {
      if (action.type === 'reset') clearTimeout(runTimer);
      const next = transitionJobsDemo(state, action);
      if (next === state) return;
      const previousPhase = state.phase;
      const previousFocus = root.ownerDocument.activeElement;
      state = next;
      render();
      focusJobsDemoTransition(root, previousPhase, state.phase, previousFocus);
      if (action.type === 'run' && state.phase === 'running') {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        runTimer = window.setTimeout(() => dispatch({ type: 'finish' }), reduced ? 0 : 850);
      }
    }

    root.addEventListener('click', event => {
      const control = event.target.closest('[data-action]');
      if (!control || !root.contains(control) || control.disabled) return;
      dispatch({ type: control.dataset.action, value: control.dataset.value });
    });
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...all('[role="tab"]')];
      const index = tabs.indexOf(tab);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      dispatch({ type: 'tab', value: tabs[nextIndex].dataset.value });
      tabs[nextIndex].focus();
    });
    render();
  });
}
