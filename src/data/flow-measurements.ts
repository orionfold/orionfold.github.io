export type FlowMeasurementTone = 'speed' | 'route' | 'money' | 'craft' | 'pace';

export interface FlowMeasurement {
  value: string;
  label: string;
  fine: string;
  icon: string;
  tone: FlowMeasurementTone;
}

const searchP95 = {
  value: '22.3 ms',
  label: 'Search, 95th percentile',
  fine: 'Measured on a 10,000-note library, Apple silicon',
  icon: 'searchFast',
  tone: 'speed',
} satisfies FlowMeasurement;

const longDocumentPlanning = {
  value: '620,000',
  label: 'Characters planned part by part',
  fine: 'Long documents are split in about 0.5 seconds, and the time grows evenly with length',
  icon: 'document',
  tone: 'craft',
} satisfies FlowMeasurement;

const billedRun = {
  value: '$0.00425',
  label: 'A real billed run, to the digit',
  fine: '105 input and 149 output tokens. Exact decimal arithmetic',
  icon: 'receipt',
  tone: 'money',
} satisfies FlowMeasurement;

const localRuntime = {
  value: '+19.2 MiB',
  label: 'A complete local AI runtime',
  fine: 'Two engines inside the app. About the size of twenty photos',
  icon: 'chip',
  tone: 'route',
} satisfies FlowMeasurement;

const agencyCatalog = {
  value: '7 actions',
  label: 'The Agency catalog',
  fine: 'Proofread, Summarize, Translate, two table conversions, Expand with Sources, and Visualize',
  icon: 'actions',
  tone: 'craft',
} satisfies FlowMeasurement;

const aiDomains = {
  value: '4 domains',
  label: 'Where AI may run',
  fine: 'Local, LAN, Cloud prepaid, Cloud postpaid. Each has its own switch',
  icon: 'domains',
  tone: 'route',
} satisfies FlowMeasurement;

const pictures = {
  value: '54 pictures',
  label: '34 chart plus 20 diagram types',
  fine: 'Drawn in place from plain text in your file, offline, in one house style',
  icon: 'chart',
  tone: 'craft',
} satisfies FlowMeasurement;

const firstIndex = {
  value: '1.1 s',
  label: 'First index of 10,000 notes',
  fine: 'Measured on a 10,000-note library, Apple silicon. Results stream in as it goes',
  icon: 'bolt',
  tone: 'speed',
} satisfies FlowMeasurement;

const recentChanges = {
  value: '140 changes',
  label: 'Shipped in the last 24 days',
  fine: 'Counted from the Flow changelog, which records user-visible behavior only',
  icon: 'refresh',
  tone: 'pace',
} satisfies FlowMeasurement;

// Canonical evidence for the Flow landing page's “Measured, not promised”
// band. Other surfaces select these same objects so values, labels, icons and
// semantic tones cannot drift into a second marketing version.
export const FLOW_MEASUREMENTS: FlowMeasurement[] = [
  searchP95,
  longDocumentPlanning,
  billedRun,
  localRuntime,
  agencyCatalog,
  aiDomains,
  pictures,
  firstIndex,
  recentChanges,
];

export const FLOW_STORYBOARD_MEASUREMENTS: FlowMeasurement[] = [
  searchP95,
  billedRun,
  firstIndex,
  agencyCatalog,
];

// Stable, qualified measurements suitable for the technical specifications
// page. The rolling changelog count is intentionally excluded: it describes a
// moment in the release train, not a durable product characteristic.
export const FLOW_SPECIFICATION_MEASUREMENTS: FlowMeasurement[] = [
  searchP95,
  longDocumentPlanning,
  billedRun,
  localRuntime,
  agencyCatalog,
  aiDomains,
  pictures,
  firstIndex,
];
