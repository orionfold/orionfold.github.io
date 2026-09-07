// A single, interruptible reading pass. Selection remains under the reader's control.
export function createDocumentScroller(view, onStateChange = () => {}) {
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let playing = false;

  function stop() {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
    playing = false;
    onStateChange(false);
  }

  function start(reader, automatic = true, resume = false) {
    stop();
    if (!reader) return false;
    const bottom = reader.scrollHeight - reader.clientHeight;
    if (!resume || reader.scrollTop >= bottom - 1) reader.scrollTop = 0;
    if (view.document.visibilityState === 'hidden' || (automatic && reducedMotion.matches)) return false;
    const initialTop = reader.scrollTop;
    const distance = bottom - initialTop;
    if (distance <= 0) return false;
    const duration = Math.min(45000, Math.max(14000, distance / 56 * 1000));
    let startedAt;
    playing = true;
    onStateChange(true);
    function tick(timestamp) {
      startedAt ??= timestamp;
      const progress = Math.min(1, Math.max(0, (timestamp - startedAt - 1200) / duration));
      reader.scrollTop = initialTop + distance * (1 - Math.cos(Math.PI * progress)) / 2;
      if (progress < 1) frame = view.requestAnimationFrame(tick);
      else stop();
    }
    frame = view.requestAnimationFrame(tick);
    return true;
  }

  const onVisibility = () => { if (view.document.visibilityState === 'hidden') stop(); };
  const onMotionChange = () => { if (reducedMotion.matches) stop(); };
  view.document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotionChange);
  return {
    start, stop,
    toggle(reader) { if (playing) { stop(); return false; } return start(reader, false, true); },
    destroy() {
      stop();
      view.document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionChange);
    },
  };
}

// One selection model for the tabs, compact selector and paging controls.
export function initFlowLibrary(root) {
  const tabs = [...root.querySelectorAll('[data-example-tab]')];
  const panels = [...root.querySelectorAll('[data-example-panel]')];
  if (!tabs.length || tabs.length !== panels.length) return;
  const select = root.querySelector('[data-example-select]');
  const count = root.querySelector('[data-example-count]');
  let selected = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
  const readers = panels.map(panel => panel.querySelector('.ls-library-document'));
  const scrollButtons = panels.map(panel => panel.querySelector('[data-example-scroll]'));
  const view = root.ownerDocument?.defaultView;
  let isPlaying = false;
  let manuallyPaused = false;
  const visibleReaders = new Set();
  const scroller = view ? createDocumentScroller(view, playing => {
    isPlaying = playing;
    scrollButtons.forEach((button, i) => {
      if (!button) return;
      const active = i === selected && playing;
      button.textContent = active ? 'Pause scroll' : 'Play scroll';
      button.setAttribute('aria-pressed', String(active));
    });
  }) : null;

  function sizeDocument(reader) {
    if (!reader) return;
    const firstPage = reader.querySelector('[data-example-page]');
    if (!firstPage) return;
    reader.style.removeProperty('--ls-library-page-height');
    const height = Math.max(firstPage.scrollHeight, reader.clientHeight);
    reader.style.setProperty('--ls-library-page-height', `${height}px`);
  }

  function show(index, reveal = false) {
    scroller?.stop();
    manuallyPaused = false;
    selected = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
    });
    panels.forEach((panel, i) => { panel.hidden = i !== selected; });
    if (select) select.value = String(selected);
    if (count) count.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
    sizeDocument(readers[selected]);
    if (reveal) {
      panels[selected].scrollIntoView({ block: 'start', behavior: 'instant' });
      scroller?.start(readers[selected]);
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i, true));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = i + 1;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = i - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      show(next, true);
      tabs[selected].focus({ preventScroll: true });
    });
  });
  select?.addEventListener('change', () => {
    const index = Number(select.value);
    if (Number.isInteger(index) && index >= 0 && index < tabs.length) show(index, true);
  });
  function page(offset) {
    show(selected + offset, true);
    panels[selected].focus({ preventScroll: true });
  }
  root.querySelector('[data-example-prev]')?.addEventListener('click', () => page(-1));
  root.querySelector('[data-example-next]')?.addEventListener('click', () => page(1));
  readers.forEach((reader, i) => {
    if (!reader) return;
    for (const event of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
      reader.addEventListener(event, () => { manuallyPaused = true; scroller?.stop(); }, { passive: true });
    }
    scrollButtons[i]?.addEventListener('click', () => { manuallyPaused = !scroller?.toggle(reader); });
  });
  function resumeVisibleReader() {
    const reader = readers[selected];
    if (visibleReaders.has(reader) && !manuallyPaused && !isPlaying) scroller?.start(reader, true, true);
  }
  const observer = view?.IntersectionObserver ? new view.IntersectionObserver(entries => {
    entries.forEach(entry => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (visible) visibleReaders.add(entry.target);
      else visibleReaders.delete(entry.target);
      if (entry.target !== readers[selected]) return;
      if (visible) resumeVisibleReader();
      else scroller?.stop();
    });
  }, { threshold: 0.5 }) : null;
  readers.forEach(reader => { if (reader) observer?.observe(reader); });
  view?.document.addEventListener('visibilitychange', resumeVisibleReader);
  view?.addEventListener('focus', resumeVisibleReader);
  const onResize = () => { scroller?.stop(); sizeDocument(readers[selected]); };
  view?.addEventListener('resize', onResize);
  show(selected);
  return () => {
    scroller?.destroy();
    observer?.disconnect();
    view?.removeEventListener('resize', onResize);
    view?.removeEventListener('focus', resumeVisibleReader);
    view?.document.removeEventListener('visibilitychange', resumeVisibleReader);
  };
}
