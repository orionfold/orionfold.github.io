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
      states: ['Ready for tonight', 'Reading your sources', 'Connecting the themes', 'Ready for your review', 'Connection kept', 'Connection reverted'],
      titles: ['Your ideas, still growing.', 'Sources become connections.', 'A new link to consider.', 'Decide what belongs.', 'Your judgment, recorded.', 'The earlier note is back.'],
      bottom: ['2 sources named · Ready for tonight', 'Sources linked to their themes', '1 proposed connection · Draft note', '1 proposed connection · Your call', 'Connection kept · Decision recorded', 'Earlier version restored'],
      graph: ['2 named sources · Ready to connect', 'Source-backed themes connected', 'Dashed link: a proposal to review', 'Follow the sources. Decide on the link.', 'Connection kept in this illustration', 'Source-backed themes remain'],
      notes: [
        'Your named notes stay in Markdown. Flow will propose a connection for you to review.',
        'Your notes mention trust. Your reading returns to memory. Their sources stay in view.',
        'Proposed: trust grows when useful context is remembered. Follow both sources, then decide.',
        'Proposed: trust grows when useful context is remembered. Follow both sources, then decide.',
        'Kept: connect trust and memory. The link and your decision stay with the document.',
        'Previous note: trust and memory are separate themes. The proposed link has been reverted.',
      ],
      events: [
        ['Read the sources you named', 'Connect themes in Mermaid', 'Review a proposed connection'],
        ['Two named sources read', 'Trust and memory mapped', 'A connection is taking shape'],
        ['Source links preserved', 'One new connection proposed', 'Overnight note drafted locally'],
        ['Source links preserved', 'Dashed connection marked', 'Your judgment comes next'],
        ['Source links preserved', 'Connection kept', 'Your decision recorded'],
        ['Source links preserved', 'Proposed connection removed', 'Earlier note restored'],
      ],
    };
    function show(d, n) {
      d.step = n;
      d.el.dataset.step = String(n);
      const isKnowledge = d.el.dataset.demoNarrative === 'knowledge';
      d.el.querySelector('[data-demo-state]').textContent = (isKnowledge ? knowledge.states : states)[n];
      d.el.querySelector('[data-demo-time]').textContent = times[n];
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
        ? (n < 3 ? 'Proposed connections need your review.' : 'Review this part: Proposed connection') :
        n < 3
          ? 'Changes will be marked for review.'
          : 'Review this part: Overnight note';
      const keep = d.el.querySelector('[data-demo-keep]'),
        revert = d.el.querySelector('[data-demo-revert]');
      keep.disabled = n !== 3;
      revert.disabled = n !== 3;
      keep.textContent = n === 4 ? 'Kept' : 'Keep';
      revert.textContent = n === 5 ? 'Reverted' : 'Revert';
      d.el.querySelector('[data-demo-decision]').textContent = isKnowledge
        ? (n === 4 ? 'Connection kept. Your decision is recorded in this illustration.' : n === 5 ? 'Earlier diagram and note restored. Named sources remain.' : '') :
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
        const graphDescription = n === 0 ? 'Two named sources, Notes and Reading, ready to connect.' : n === 1 || n === 5 ? 'Notes link to trust; reading links to memory. No proposed connection is kept.' : n === 4 ? 'Notes link to trust; reading links to memory. The connection between trust, memory and living work was kept.' : 'Notes link to trust; reading links to memory. A dashed connection between trust, memory and living work is proposed for review.';
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
        const wait = d.step === 3 ? 16 : 6;
        if (tick - d.last >= wait) {
          d.last = tick;
          show(d, d.step === 3 ? 0 : d.step + 1);
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
    const exampleTabs = [...root.querySelectorAll('[data-example-tab]')],
      examplePanels = [...root.querySelectorAll('[data-example-panel]')];
    function selectExample(index) {
      exampleTabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      examplePanels.forEach((panel, i) => (panel.hidden = i !== index));
      root
        .querySelector('#example-panel')
        ?.setAttribute('aria-labelledby', 'example-tab-' + index);
    }
    exampleTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectExample(i));
      tab.addEventListener('keydown', (event) => {
        let next = i;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
          next = (i + 1) % exampleTabs.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
          next = (i + exampleTabs.length - 1) % exampleTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = exampleTabs.length - 1;
        else return;
        event.preventDefault();
        selectExample(next);
        exampleTabs[next].focus();
      });
    });

  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
