export const workshopTranscriptSources = Object.freeze({
  'source:field-manual-workflows': {
    kind: 'Guide',
    label: 'Run workflows with human checkpoints',
    href: '/relay/docs/run-workflows-with-human-checkpoints/',
  },
  'source:marketing-line-memo': {
    kind: 'Memo',
    label: 'Marketing Line operating memo',
    href: '/relay/memos/marketing-line/',
  },
  'source:relay-knowledge-manifest': {
    kind: 'Docs',
    label: 'Relay documentation',
    href: '/relay/docs/',
  },
  'source:relay-workflow-guide': {
    kind: 'Guide',
    label: 'Run workflows with human checkpoints',
    href: '/relay/docs/run-workflows-with-human-checkpoints/',
  },
  'source:relay-workshop-api': {
    kind: 'API',
    label: 'Workflows and Workshop lifecycle',
    href: '/relay/api/04-workflows-automation/',
  },
  'source:relay-workshop-contract': {
    kind: 'API',
    label: 'Workshop lifecycle and evidence contract',
    href: '/relay/api/04-workflows-automation/',
  },
  'source:relay-workshop-demo': {
    kind: 'Demo',
    label: 'Synthetic Marketing Line demo',
    href: '/relay/demo/',
  },
  'source:relay-workshop-runtime': {
    kind: 'API',
    label: 'Workshop runtime and preflight',
    href: '/relay/api/04-workflows-automation/',
  },
  'source:training-decision': {
    kind: 'Training',
    label: 'Relay Operator Workshop',
    href: '/training/relay-operator-workshop/',
  },
});

const TIME_RANGE = /^\d{2}:\d{2}:\d{2}(?:\.\d{3})?[–-]\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/;

export function parseWorkshopTranscript(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('Workshop transcript must be Markdown text.');

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const title = lines.find((line) => line.startsWith('# '))?.slice(2).trim() || 'Workshop transcript';
  const transcriptStart = lines.findIndex((line) => line.trim() === '## Transcript');
  const disclosuresStart = lines.findIndex((line) => line.trim() === '## Disclosures');
  if (transcriptStart === -1) throw new Error('Workshop transcript is missing its Transcript section.');

  const transcriptEnd = disclosuresStart === -1 ? lines.length : disclosuresStart;
  const sections = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    current.paragraphs = current.paragraphs.filter(Boolean);
    current.sources = [...new Set(current.sources)];
    if (current.title && current.paragraphs.length) sections.push(current);
    current = null;
  };

  for (const rawLine of lines.slice(transcriptStart + 1, transcriptEnd)) {
    const line = rawLine.trim();
    if (line.startsWith('### ')) {
      flush();
      current = { title: line.slice(4).trim(), time: '', paragraphs: [], sources: [] };
      continue;
    }
    if (!current || !line) continue;
    if (TIME_RANGE.test(line)) {
      current.time = line;
      continue;
    }
    if (line.startsWith('Sources:')) {
      current.sources.push(...line.slice('Sources:'.length).split(',').map((source) => source.trim()).filter(Boolean));
      continue;
    }
    if (line.startsWith('Claims:') || line.startsWith('Motion element:')) continue;
    current.paragraphs.push(line);
  }
  flush();

  const disclosures = disclosuresStart === -1
    ? []
    : lines.slice(disclosuresStart + 1)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim());

  if (!sections.length) throw new Error('Workshop transcript contains no readable chapters.');
  return { title, sections, disclosures };
}
