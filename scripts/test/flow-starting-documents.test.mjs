import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createStartingDocumentChooser, initStartingDocuments } from '../../src/scripts/flow-starting-documents.js';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const catalogue = JSON.parse(read('src/data/flow-starting-documents.json'));
const { documents } = catalogue;

test('the chooser retains the released 24-document catalogue and five featured entries', () => {
  assert.equal(catalogue.release.version, '1.7');
  assert.equal(catalogue.release.build, 2173);
  assert.equal(catalogue.release.guideVersion, '1.13.0');
  assert.deepEqual(documents.map(document => document.name), [
    'AI Personal Assistants Market Watch', 'Business Review', 'Charts Gallery', 'Competitor Watch',
    'Customer Research', 'Flow Handbook', 'Health Evidence', 'Household Budget', 'Insurance Renewal',
    'Investment Research', 'Job Search', 'Legal Matter', 'Living Document Starter', 'Marketing Campaign',
    'Model Arena', 'NVIDIA Company Research', 'Product Launch', 'Sales Account', 'Stock Portfolio',
    'Supplier Review', 'Support Knowledge', 'Tax Advisor', 'Team Status', 'Travel Planner',
  ]);
  assert.deepEqual(documents.filter(document => document.featured).map(document => document.name), [
    'AI Personal Assistants Market Watch', 'Household Budget', 'NVIDIA Company Research', 'Stock Portfolio', 'Team Status',
  ]);
  assert.deepEqual(catalogue.categories.map(category => category.label), ['Research & Markets', 'Business & Teams', 'Personal & Money', 'Learn Flow']);
  assert.equal(new Set(documents.map(document => document.id)).size, 24);
  assert.equal(new Set(documents.map(document => document.excerpt)).size, 24, 'each choice has its own sample context');
  for (const document of documents) {
    assert.ok(document.entry.startsWith(`${document.name}/`));
    assert.match(document.sourceSha256, /^[a-f0-9]{64}$/);
    assert.ok(document.headings.length > 0);
    assert.ok(document.excerpt.length > 80);
    assert.ok(catalogue.categories.some(category => category.id === document.category));
  }
  assert.equal(documents.find(document => document.name === 'Team Status').jobs.some(job => job.kind === 'gather'), false, 'direct-bound Team Status must not acquire an invented collection job');
  assert.equal(documents.find(document => document.name === 'Charts Gallery').jobs.length, 0, 'a reference entry is not presented as a runnable job');
});

test('search can discover an unfeatured document while a chosen category remains a boundary', () => {
  const chooser = createStartingDocumentChooser(documents);
  assert.equal(chooser.snapshot().visible.length, 5);
  const research = chooser.search('interview');
  assert.deepEqual(research.visible, ['customer-research']);
  assert.equal(research.selected, 'customer-research');
  const noMatch = chooser.filter('personal-money');
  assert.deepEqual(noMatch.visible, []);
  assert.equal(noMatch.selected, null);
  assert.equal(chooser.copy('A phantom copy').copyName, null, 'an empty result cannot produce a copy preview');
  assert.equal(chooser.search('').visible.length, 6);
  const all = chooser.filter('all');
  assert.equal(all.visible.length, 24);
  assert.equal(chooser.search('  NVIDIA  ').selected, 'nvidia-company-research');
});

test('copy, selection and reset keep the preview attached to the chosen example', () => {
  const chooser = createStartingDocumentChooser(documents);
  chooser.filter('all');
  chooser.select('customer-research');
  assert.equal(chooser.copy('  My interview review  ').copyName, 'My interview review');
  assert.equal(chooser.snapshot().selected, 'customer-research');
  assert.equal(chooser.back().copyName, null);
  assert.equal(chooser.copy('   ').copyName, 'Customer Research copy');
  const changed = chooser.select('team-status');
  assert.equal(changed.copyName, null);
  assert.equal(changed.selected, 'team-status');
  chooser.copy('<em>Sample text</em>');
  const reset = chooser.reset();
  assert.equal(reset.filter, 'featured');
  assert.equal(reset.query, '');
  assert.equal(reset.copyName, null);
  assert.equal(reset.visible.length, 5);
  assert.equal(chooser.select('customer-research').selected, reset.selected, 'hidden choices cannot become selected');
});

function element(dataset = {}) {
  const listeners = new Map();
  return { dataset, hidden: false, value: '', textContent: '', attributes: {},
    addEventListener(type, callback) { listeners.set(type, callback); },
    trigger(type, extra = {}) { listeners.get(type)?.({ currentTarget: this, ...extra }); },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    focus(options) { this.focusOptions = options; },
  };
}

test('browser wiring exposes the correct document and safe copy text without file or run actions', () => {
  const controls = Object.fromEntries(['search', 'filter', 'count', 'status', 'empty', 'no-selection', 'reset'].map(name => [`[data-starting-${name}]`, element()]));
  const buttons = documents.map(document => element({ startingDocument: document.id, category: document.category, featured: String(document.featured), name: document.name, summary: document.summary }));
  const panels = documents.map(document => {
    const panel = element({ startingPanel: document.id });
    panel.children = Object.fromEntries(['original', 'copy-preview', 'copy-title', 'copy-name', 'copy', 'back'].map(name => [`[data-starting-${name}]`, element()]));
    panel.children['[data-starting-copy-name]'].value = `${document.name} copy`;
    panel.querySelector = selector => panel.children[selector];
    return panel;
  });
  const root = element();
  root.querySelectorAll = selector => selector === '[data-starting-document]' ? buttons : panels;
  root.querySelector = selector => controls[selector];
  initStartingDocuments(root);
  assert.equal(buttons.filter(button => !button.hidden).length, 5);
  controls['[data-starting-search]'].value = 'interview';
  controls['[data-starting-search]'].trigger('input');
  const panel = panels.find(panel => panel.dataset.startingPanel === 'customer-research');
  assert.deepEqual(panels.filter(panel => !panel.hidden), [panel]);
  panel.children['[data-starting-copy-name]'].value = '<img src=x onerror=alert(1)>';
  panel.children['[data-starting-copy]'].trigger('click');
  assert.equal(panel.children['[data-starting-copy-title]'].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(panel.children['[data-starting-copy-preview]'].hidden, false);
  assert.equal(panel.children['[data-starting-original]'].hidden, true);
  assert.match(controls['[data-starting-status]'].textContent, /Jobs have not run/);
  panel.children['[data-starting-back]'].trigger('click');
  assert.equal(panel.children['[data-starting-original]'].hidden, false);
  assert.equal(panel.children['[data-starting-copy-preview]'].hidden, true);
  const script = read('src/scripts/flow-starting-documents.js');
  assert.doesNotMatch(script, /innerHTML|fetch\(|XMLHttpRequest|showDirectoryPicker|localStorage|indexedDB/);
});

test('the seven rich previews stay separate and receive only mapped selections', () => {
  const library = read('src/components/living/FlowLibrary.astro');
  assert.match(library, /<StartWithUsefulWork \/>/);
  assert.match(library, /24 USEFUL/);
  assert.match(library, /Explore seven illustrated examples/);
  assert.match(library, /data-example-tab/);
  assert.match(library, /data-example-scroll/);
  assert.deepEqual(documents.filter(document => document.richPreview).map(document => document.richPreview).sort(), ['budget','competitor','job','starter','stock','tax','team']);
  const component = read('src/components/living/StartWithUsefulWork.astro');
  assert.match(component, /Illustration only\. No files created or Jobs run\./);
  assert.match(component, /data-starting-original/);
  assert.match(component, /data-starting-copy-preview hidden/);
});
