// Paths Home mock (/flow/): a chip picks which path the featured panel shows.
// Every panel is server-rendered; without script the featured one stays visible.
export function initPathsHome(root = document) {
  root.querySelectorAll('[data-paths-home]').forEach((demo) => {
    if (demo.dataset.ready) return;
    demo.dataset.ready = '1';
    const chips = [...demo.querySelectorAll('[data-chip]')];
    const panels = [...demo.querySelectorAll('[data-panel]')];
    const select = (slug) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.chip === slug)));
      panels.forEach((p) => { p.hidden = p.dataset.panel !== slug; });
    };
    chips.forEach((chip) => chip.addEventListener('click', () => select(chip.dataset.chip)));
  });
}
