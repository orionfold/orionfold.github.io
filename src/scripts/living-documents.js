import { initFlowLibrary } from './flow-library.js';
// Native product illustrations: offscreen/reduced-motion aware. Services are owned by shared production components.
(() => {
  'use strict';
  function start() {
    const root = document.querySelector('.ls');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = motionQuery.matches;
    let tick = 0;
    function setMotion() {
      root.dataset.motion = paused ? 'off' : 'on';
    }
    setMotion();
    motionQuery.addEventListener('change', (e) => {
      paused = e.matches;
      setMotion();
    });
    const demos = [...root.querySelectorAll('[data-demo]')].map((el) => ({
      el,
      step: 0,
      visible: false,
      last: 0,
      automatic: !motionQuery.matches,
    }));
    const states = [
      'Ready for tonight',
      'Gathering the changes',
      'Refreshing declared parts',
      'Ready for your review',
      'Note kept',
      'Note reverted',
    ];
    const times = ['18:40', '02:10', '02:11', '07:30', '07:30', '07:30'];
    const titles = [
      'Your next useful version.',
      'One update file changed.',
      'The page is current.',
      'Here is what moved.',
      'Your judgment, recorded.',
      'That note is back.',
    ];
    const knowledge = {
      states: ['Ready when you are', 'Reading your Jobs', 'Diagram proposed', 'Waiting for your decision', 'Diagram approved', 'Proposal declined'],
      titles: ['Make your Jobs visible.', 'The steps are in your words.', 'A visual to consider.', 'Decide what belongs.', 'Your Jobs, made visible.', 'Your writing stays as it was.'],
      bottom: ['Research Jobs · Manual visualization', 'Selected section: Evidence to decision', 'Mermaid proposal · Not applied', 'Your approval comes first', 'Diagram added in this illustration', 'Proposal declined · Document unchanged'],
      graph: ['Research Jobs · Ready to visualize', 'Question, sources, evidence, comparison', 'Proposed diagram · Not applied', 'Review the proposal. Make the call.', 'Diagram approved in this illustration', 'Proposal declined · Original Jobs remain'],
      notes: [
        'The selected section describes your research Jobs. Visualize proposes a diagram for your review.',
        'Start with a question and permitted inputs. Record dated claims and limitations, then compare the evidence.',
        'Proposed: show the path from question and sources to evidence, comparison, and your decision.',
        'Review the proposed diagram against your saved Jobs. Nothing is added until you approve.',
        'Approved: the diagram sits with your Jobs. The decision to investigate, act, watch, or ignore stays yours.',
        'Declined: the proposed diagram is discarded. Your original Jobs are unchanged.',
      ],
      events: [
        ['Read the selected section', 'Propose a Mermaid diagram', 'Approve or decline the proposal'],
        ['Research Jobs selected', 'Evidence to decision in view', 'Original writing preserved'],
        ['Jobs visualized', 'Diagram proposed', 'Document unchanged so far'],
        ['Jobs remain in view', 'Proposal ready to inspect', 'Your approval comes first'],
        ['Original Jobs preserved', 'Diagram approved', 'Your judgment stays yours'],
        ['Original Jobs preserved', 'Proposal declined', 'No diagram added'],
      ],
    };
    function show(d, n) {
      d.step = n;
      d.el.dataset.step = String(n);
      const isKnowledge = d.el.dataset.demoNarrative === 'knowledge';
      d.el.querySelector('[data-demo-state]').textContent = (isKnowledge ? knowledge.states : states)[n];
      d.el.querySelector('[data-demo-time]').textContent = isKnowledge ? String(Math.min(n + 1, 4)).padStart(2, '0') : times[n];
      d.el.querySelector('[data-demo-title]').textContent = (isKnowledge ? knowledge.titles : titles)[n];
      d.el.querySelector('[data-demo-bottom]').textContent = isKnowledge ? knowledge.bottom[n] :
        n < 3
          ? [
              'Waiting for the next shift',
              'Reading the sources you named',
              'Table and chart redrawn',
            ][n]
          : '3 marked changes · Review the note';
      d.el.querySelector('[data-demo-review-label]').textContent = isKnowledge
        ? (n < 3 ? 'The proposal waits for your approval.' : 'Review this proposal: Evidence to decision') :
        n < 3
          ? 'Changes will be marked for review.'
          : 'Review this part: Overnight note';
      const keep = d.el.querySelector('[data-demo-keep]'),
        revert = d.el.querySelector('[data-demo-revert]');
      keep.disabled = n !== 3;
      revert.disabled = n !== 3;
      keep.textContent = isKnowledge ? (n === 4 ? 'Approved' : 'Approve') : (n === 4 ? 'Kept' : 'Keep');
      revert.textContent = isKnowledge ? (n === 5 ? 'Declined' : 'Decline') : (n === 5 ? 'Reverted' : 'Revert');
      d.el.querySelector('[data-demo-decision]').textContent = isKnowledge
        ? (n === 4 ? 'Diagram approved and added in this illustration.' : n === 5 ? 'Proposal declined. Your original Jobs remain unchanged.' : '') :
        n === 4
          ? 'Note kept. The decision is recorded in this illustration.'
          : n === 5
            ? 'Previous note restored. The table and chart stay current.'
            : '';
      d.el.querySelector('.ls-overnight-note p').textContent = isKnowledge ? knowledge.notes[n] :
        n === 5
          ? 'Previous note: Launch was 4 of 8 tasks complete at the last review.'
          : 'Launch is now 6 of 8 tasks complete, up from 4. Two fewer tasks remain.';
      if (isKnowledge) {
        d.el.querySelector('[data-knowledge-status]').textContent = knowledge.graph[n];
        d.el.querySelectorAll('[data-knowledge-event-copy]').forEach((el, i) => { el.textContent = knowledge.events[n][i]; });
        const graphDescription = n === 0 ? 'Question and permitted sources begin the saved research Jobs.' : n === 1 || n === 5 ? 'Question and sources lead to evidence and comparison. No diagram has been approved.' : n === 4 ? 'The approved diagram connects the research Jobs to a human decision.' : 'A diagram from question and sources through evidence and comparison to your decision awaits approval.';
        d.el.querySelector('[data-knowledge-graph]').setAttribute('aria-label', `Illustrative Mermaid diagram. ${graphDescription}`);
      }
      d.el
        .querySelectorAll('[data-demo-stage]')
        .forEach((el, i) =>
          el.classList.toggle('is-active', i === Math.min(n, 3)),
        );
      d.el.querySelector('[data-demo-next]').disabled = n >= 3;
    }
    demos.forEach((d) => {
      show(d, 0);
      ['pointerdown', 'focusin'].forEach(event => d.el.addEventListener(event, () => { d.automatic = false; }));
      d.el.querySelector('[data-demo-next]').addEventListener('click', () => {
        d.automatic = false;
        show(d, Math.min(d.step + 1, 3));
      });
      d.el.querySelector('[data-demo-replay]').addEventListener('click', () => {
        d.automatic = !motionQuery.matches;
        d.last = tick;
        show(d, 0);
      });
      d.el.querySelector('[data-demo-keep]').addEventListener('click', () => {
        d.automatic = false;
        show(d, 4);
      });
      d.el.querySelector('[data-demo-revert]').addEventListener('click', () => {
        d.automatic = false;
        show(d, 5);
      });
    });
    const visibility = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const d = demos.find((d) => d.el === entry.target);
          if (d) {
            d.visible = entry.isIntersecting;
            d.last = tick;
          }
        }),
      { threshold: 0.2 },
    );
    demos.forEach((d) => visibility.observe(d.el));
    window.setInterval(() => {
      if (paused || document.hidden) return;
      tick++;
      demos.forEach((d) => {
        if (!d.visible || !d.automatic) return;
        if (d.step >= 3) { d.automatic = false; return; }
        const wait = 6;
        if (tick - d.last >= wait) {
          d.last = tick;
          show(d, d.step + 1);
        }
      });
    }, 500);
    // Visual chapters share the global motion control and stop off screen.
    const scenes = [...root.querySelectorAll('[data-scene]')].map((el) => ({
      el,
      frame: 0,
      count: Number(el.dataset.sceneCount),
      visible: false,
      automatic: !motionQuery.matches,
      last: 0,
    }));
    function showScene(scene, frame) {
      scene.frame = frame;
      scene.el.dataset.frame = String(frame);
      scene.el.querySelectorAll('[data-scene-panel]').forEach((el) => {
        el.hidden = Number(el.dataset.scenePanel) !== frame;
      });
      scene.el.querySelectorAll('[data-scene-caption]').forEach((el) => {
        el.hidden = Number(el.dataset.sceneCaption) !== frame;
      });
      scene.el.querySelectorAll('[data-scene-step]').forEach((el) => {
        el.dataset.active = String(Number(el.dataset.sceneStep) === frame);
      });
      scene.el.querySelectorAll('[data-scene-select]').forEach((el) => {
        el.setAttribute(
          'aria-pressed',
          String(Number(el.dataset.sceneSelect) === frame),
        );
      });
    }
    scenes.forEach((scene) => {
      showScene(scene, 0);
      scene.el
        .querySelector('[data-scene-next]')
        .addEventListener('click', () => {
          scene.automatic = false;
          showScene(scene, (scene.frame + 1) % scene.count);
        });
      scene.el
        .querySelector('[data-scene-replay]')
        .addEventListener('click', () => {
          scene.automatic = !motionQuery.matches;
          scene.last = tick;
          showScene(scene, 0);
        });
      scene.el.querySelectorAll('[data-scene-select]').forEach((button) => {
        button.addEventListener('click', () => {
          scene.automatic = false;
          showScene(scene, Number(button.dataset.sceneSelect));
        });
      });
    });
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const scene = scenes.find((s) => s.el === entry.target);
          if (!scene) return;
          scene.visible = entry.isIntersecting;
          scene.el.dataset.sceneVisible = String(scene.visible);
          scene.last = tick;
        });
      },
      { threshold: 0.15 },
    );
    scenes.forEach((scene) => sceneObserver.observe(scene.el));
    window.setInterval(() => {
      if (paused || document.hidden) return;
      scenes.forEach((scene) => {
        if (!scene.visible || !scene.automatic || tick - scene.last < 9) return;
        scene.last = tick;
        showScene(scene, (scene.frame + 1) % scene.count);
      });
    }, 500);
    initFlowLibrary(root);

  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
