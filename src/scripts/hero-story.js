// Plays a hero story: a mock Flow window that steps through scenes.
// Markup: [data-story] root with data-durations="ms,ms,…" (one per scene).
// Scene n shows through CSS keyed on [data-story-scene="n"]; animations restart on
// each entry because the selector starts matching again.
// Controls inside the root: [data-story-go="n"], [data-story-toggle],
// [data-story-next], [data-story-prev]. A [data-story-act] button sets
// data-choice on the root (Keep, Undo, Update Selected…) and pauses the story.
// data-auto="scene:choice:ms" makes that choice by itself while the story plays.
// With reduced motion the story never plays by itself; every control still works.
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setup(root) {
  const durations = (root.dataset.durations || '').split(',').map(Number).filter(Boolean);
  const count = durations.length;
  if (!count) return;
  let scene = 0;
  let playing = false;
  let timer = 0;
  let autoTimer = 0;
  const [autoScene, autoChoice, autoMs] = (root.dataset.auto || '').split(':');
  let seen = false;
  const toggle = root.querySelector('[data-story-toggle]');
  const status = root.querySelector('[data-story-status]');

  const show = (n) => {
    scene = (n + count) % count;
    // Re-entering the same scene replays it.
    root.removeAttribute('data-story-scene');
    void root.offsetWidth;
    root.dataset.storyScene = String(scene);
    root.style.setProperty('--hs-dur', `${durations[scene]}ms`);
    root.removeAttribute('data-choice');
    root.querySelectorAll('[data-story-go]').forEach((b) => {
      const on = Number(b.dataset.storyGo) === scene;
      b.classList.toggle('is-on', on);
      b.classList.toggle('is-done', Number(b.dataset.storyGo) < scene);
      if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (status) status.textContent = `Step ${scene + 1} of ${count}`;
    clearTimeout(autoTimer);
    if (playing && autoChoice && Number(autoScene) === scene) {
      autoTimer = setTimeout(() => { if (!root.dataset.choice) root.dataset.choice = autoChoice; }, Number(autoMs));
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => { show(scene + 1); schedule(); }, durations[scene]);
  };
  const setPlaying = (on) => {
    playing = on;
    root.classList.toggle('is-playing', on);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(on));
      toggle.setAttribute('aria-label', on ? 'Pause the story' : 'Play the story');
    }
    schedule();
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-story-go],[data-story-toggle],[data-story-next],[data-story-prev],[data-story-act]');
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-story-toggle')) {
      if (!playing && scene === count - 1) show(0);
      setPlaying(!playing);
      return;
    }
    if (t.hasAttribute('data-story-act')) {
      setPlaying(false);
      root.dataset.choice = t.dataset.storyAct;
      return;
    }
    setPlaying(false);
    if (t.hasAttribute('data-story-go')) show(Number(t.dataset.storyGo));
    else if (t.hasAttribute('data-story-next')) show(scene + 1);
    else show(scene - 1);
  });

  show(scene);
  root.classList.add('is-ready');
  if (REDUCED) return;
  // Play once the window is in view; pause while it is scrolled away.
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !seen) { seen = true; setPlaying(true); }
    else if (!entry.isIntersecting && playing) { clearTimeout(timer); }
    else if (entry.isIntersecting && playing) schedule();
  }, { threshold: 0.35 });
  io.observe(root);
}

document.querySelectorAll('[data-story]').forEach(setup);
