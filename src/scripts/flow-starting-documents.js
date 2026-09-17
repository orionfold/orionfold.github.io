// The chooser simulates selection and copying only. It never reads or writes files.
export function createStartingDocumentChooser(documents) {
  let filter = 'featured';
  let query = '';
  let selected = documents.find(document => document.featured)?.id ?? null;
  let copyName = null;
  const visibleDocuments = () => documents.filter(document => {
    const categoryMatches = filter === 'all' || (filter === 'featured' ? Boolean(query) || document.featured : document.category === filter);
    const haystack = `${document.name} ${document.summary}`.toLocaleLowerCase();
    return categoryMatches && haystack.includes(query.toLocaleLowerCase());
  });
  const snapshot = () => ({ filter, query, selected, copyName, visible: visibleDocuments().map(document => document.id) });
  function reconcile() {
    copyName = null;
    const visible = visibleDocuments();
    if (!visible.some(document => document.id === selected)) selected = visible[0]?.id ?? null;
    return snapshot();
  }
  return {
    snapshot,
    search(value) { query = value.trim(); return reconcile(); },
    filter(value) { filter = value; return reconcile(); },
    select(id) { if (visibleDocuments().some(document => document.id === id)) { selected = id; copyName = null; } return snapshot(); },
    copy(name) {
      const document = documents.find(document => document.id === selected);
      if (document) copyName = name.trim().slice(0, 80) || `${document.name} copy`;
      return snapshot();
    },
    back() { copyName = null; return snapshot(); },
    reset() { filter = 'featured'; query = ''; selected = documents.find(document => document.featured)?.id ?? null; return reconcile(); },
  };
}

export function initStartingDocuments(root) {
  if (root.dataset.startingReady) return;
  root.dataset.startingReady = 'true';
  const buttons = [...root.querySelectorAll('[data-starting-document]')];
  const panels = [...root.querySelectorAll('[data-starting-panel]')];
  const documents = buttons.map(button => ({ id: button.dataset.startingDocument, category: button.dataset.category, featured: button.dataset.featured === 'true', name: button.dataset.name, summary: button.dataset.summary }));
  const chooser = createStartingDocumentChooser(documents);
  const search = root.querySelector('[data-starting-search]');
  const filter = root.querySelector('[data-starting-filter]');
  const count = root.querySelector('[data-starting-count]');
  const status = root.querySelector('[data-starting-status]');
  function render(state) {
    const visible = new Set(state.visible);
    buttons.forEach(button => {
      button.hidden = !visible.has(button.dataset.startingDocument);
      button.setAttribute('aria-pressed', String(button.dataset.startingDocument === state.selected));
    });
    panels.forEach(panel => {
      const selected = panel.dataset.startingPanel === state.selected;
      panel.hidden = !selected;
      panel.querySelector('[data-starting-original]').hidden = selected && state.copyName !== null;
      panel.querySelector('[data-starting-copy-preview]').hidden = !selected || state.copyName === null;
      if (selected && state.copyName !== null) panel.querySelector('[data-starting-copy-title]').textContent = state.copyName;
    });
    const empty = state.visible.length === 0;
    root.querySelector('[data-starting-empty]').hidden = !empty;
    root.querySelector('[data-starting-no-selection]').hidden = !empty;
    count.textContent = state.filter === 'featured' && !state.query ? `${state.visible.length} featured of ${documents.length} documents` : `${state.visible.length} of ${documents.length} documents`;
    status.textContent = state.copyName !== null ? 'Copy preview ready. Its Jobs have not run.' : empty ? 'No match yet. Try another word or category.' : 'Explore a sample, then try the copy step.';
  }
  search.addEventListener('input', () => render(chooser.search(search.value)));
  filter.addEventListener('change', () => render(chooser.filter(filter.value)));
  buttons.forEach(button => button.addEventListener('click', () => render(chooser.select(button.dataset.startingDocument))));
  root.querySelector('[data-starting-reset]').addEventListener('click', () => {
    search.value = ''; filter.value = 'featured'; render(chooser.reset());
  });
  panels.forEach(panel => {
    panel.querySelector('[data-starting-copy]').addEventListener('click', () => {
      render(chooser.copy(panel.querySelector('[data-starting-copy-name]').value));
      panel.querySelector('[data-starting-back]').focus({ preventScroll: true });
    });
    panel.querySelector('[data-starting-back]').addEventListener('click', () => {
      render(chooser.back());
      panel.querySelector('[data-starting-copy-name]').focus({ preventScroll: true });
    });
    panel.querySelector('[data-starting-rich]')?.addEventListener('click', event => {
      const key = event.currentTarget.dataset.startingRich;
      const target = root.ownerDocument.querySelector(`[data-example-panel].ls-library-${key}`);
      const tab = target && root.ownerDocument.getElementById(target.getAttribute('aria-labelledby'));
      if (!tab) return;
      event.preventDefault();
      tab.click();
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  });
  render(chooser.snapshot());
}
