import type { FlowCapability } from './flow-pricing';
import {
  FLOW_BASE_CAPABILITIES,
  FLOW_PRO_CAPABILITIES,
  FLOW_LAPSE_FACTS,
} from './flow-pricing';

export type FlowSpecificationState =
  | 'Built in'
  | 'Runnable now'
  | 'Detected today'
  | 'Launch priority';

export interface FlowSpecificationRow {
  label: string;
  value: string;
  note?: string;
}

export interface FlowProviderSpecification {
  provider: string;
  route: string;
  state: FlowSpecificationState;
  note: string;
}

export interface FlowRuntimeComparison {
  eyebrow: string;
  title: string;
  body: string;
  qualifier: string;
}

export const FLOW_COMPATIBILITY_SPECIFICATIONS: FlowSpecificationRow[] = [
  { label: 'App', value: 'Native Mac app' },
  { label: 'Minimum system', value: 'macOS 26 or later' },
  { label: 'Macs', value: 'Apple silicon and Intel' },
  {
    label: 'Delivery',
    value: 'Direct download',
    note: 'Signed and notarized. Distributed outside the Mac App Store.',
  },
  {
    label: 'App payload',
    value: 'Around 40 MB',
  },
  {
    label: 'Local runtime',
    value: 'Included with Flow',
    note: 'Two local inference engines account for 19.2 MiB of the app payload.',
  },
];

export const FLOW_DOCUMENT_SPECIFICATIONS: FlowSpecificationRow[] = [
  {
    label: 'Storage',
    value: 'Ordinary folders and .md files',
    note: 'No private library format and no import step.',
  },
  {
    label: 'Writing format',
    value: 'Markdown',
    note: 'GFM tables, footnotes, code blocks, images, links, and wiki links.',
  },
  {
    label: 'Workspace',
    value: 'Multiple folders, two panes, tabs, and restored layout',
    note: 'Each folder keeps its own tree. Tabs can move between panes, and the workspace returns after relaunch.',
  },
  {
    label: 'Document views',
    value: 'Editor, Reader, Source, tables, pictures, charts, and diagrams',
  },
  {
    label: 'Tables',
    value: 'A grid over the Markdown in the file',
    note: 'A one-cell edit splices one cell instead of rewriting the table. Header and last-column invariants protect its structure.',
  },
  {
    label: 'Pictures',
    value: 'A gallery over images in the folder',
    note: 'Swap or describe an image while the document keeps an ordinary Markdown image reference.',
  },
  {
    label: 'Visuals',
    value: '34 chart types and 20 diagram types',
    note: 'Drawn offline from readable text that remains in the file.',
  },
  {
    label: 'Search',
    value: 'Full text and meaning, on device',
    note: 'The index stays on the Mac. Opening a result returns to a byte-verified passage in the source file.',
  },
  {
    label: 'File safety',
    value: 'Collisions refuse; saved files move to system Trash',
    note: 'Flow never silently overwrites or renames. Folders have no Delete command.',
  },
];

export const FLOW_AGENCY_SPECIFICATIONS: FlowSpecificationRow[] = [
  {
    label: 'Actions',
    value: '7 approval-gated actions',
    note: 'Proofread, Summarize, Translate, two table conversions, Expand with Sources, and Visualize.',
  },
  {
    label: 'Before a run',
    value: 'Scope, estimated cost, model, locality, and deciding rule',
    note: 'A local route says No cost. An unavailable action says why instead of inventing a route or price.',
  },
  {
    label: 'Proposal',
    value: 'The proposed document first; exact changes one tab away',
    note: 'Flow saves nothing until the reviewed proposal is approved.',
  },
  {
    label: 'Long documents',
    value: 'Improved in ordered, reviewable parts',
    note: 'Each part has its own range, proposal, evidence, receipt, and coverage state. Flow never silently truncates the document.',
  },
  {
    label: 'Lookups',
    value: 'Read the document and search open folders',
    note: 'Every lookup is shown live. Lookup-backed runs currently use supported Anthropic models.',
  },
  {
    label: 'Run controls',
    value: 'Pause, Stop, 12-lookups maximum, 180-second maximum',
    note: 'A run that reaches its bound ends without changing the document.',
  },
  {
    label: 'Approval',
    value: 'Approve saves exactly the reviewed bytes',
    note: 'Decline changes nothing. Approval writes one History boundary and appends the run record.',
  },
];

export const FLOW_EXECUTION_SPECIFICATIONS: FlowSpecificationRow[] = [
  {
    label: 'Execution domains',
    value: 'Local, LAN, Cloud prepaid, Cloud postpaid',
    note: 'Each domain has its own switch.',
  },
  {
    label: 'Fallback',
    value: 'Permission before crossing a boundary',
    note: 'If a fallback would leave the Mac, Flow stops and asks.',
  },
  {
    label: 'Discovery',
    value: 'Local and consented',
    note: 'Provider checks stay on the Mac and do not invoke a model.',
  },
  {
    label: 'Smart Routing',
    value: 'Ordered rules; first matching rule applies',
    note: 'The deciding rule is named. Unmeasured speed and unpublished price are never guessed.',
  },
  {
    label: 'Benchmarks',
    value: 'Measured on this Mac',
    note: 'First word, reading speed, memory headroom, and model fit remain separate facts.',
  },
  {
    label: 'Model work',
    value: 'Pro',
    note: 'If a model runs, it is part of the subscription, including local models.',
  },
];

export const FLOW_PROVIDER_SPECIFICATIONS: FlowProviderSpecification[] = [
  {
    provider: 'Flow Runtime',
    route: 'Local',
    state: 'Built in',
    note: 'Flow can run compatible local models without another runtime installed.',
  },
  {
    provider: 'Ollama',
    route: 'Local or LAN',
    state: 'Runnable now',
    note: 'Detected models can run directly through Flow Agency under your domain rules.',
  },
  {
    provider: 'Anthropic',
    route: 'Cloud postpaid',
    state: 'Runnable now',
    note: 'Bring your own API key. Anthropic also carries source-lookup tool runs.',
  },
  {
    provider: 'OpenAI',
    route: 'Cloud postpaid',
    state: 'Runnable now',
    note: 'Bring your own API key.',
  },
  {
    provider: 'OpenRouter',
    route: 'Cloud postpaid',
    state: 'Runnable now',
    note: 'Bring your own API key. Reported charges are recorded to the exact decimal.',
  },
  {
    provider: 'LM Studio',
    route: 'Local or LAN',
    state: 'Runnable now',
    note: 'Flow can run the exact loaded text model directly through Agency without copying or sharing its weights. The receipt records LM Studio, the model, locality, and no charge for a local run.',
  },
  {
    provider: 'Codex CLI',
    route: 'Cloud prepaid',
    state: 'Launch priority',
    note: 'Flow can detect and verify a signed-in subscription. Ordinary Agency execution is not yet accepted.',
  },
  {
    provider: 'Claude Code',
    route: 'Cloud prepaid',
    state: 'Launch priority',
    note: 'Flow can detect and verify a signed-in subscription. Ordinary Agency execution is not yet accepted.',
  },
];

export const FLOW_PROOF_SPECIFICATIONS: FlowSpecificationRow[] = [
  {
    label: 'Receipts',
    value: 'One durable run card',
    note: 'Names the model, provider, locality, checks, evidence, lookups, and observed cost. A local run records no charge.',
  },
  {
    label: 'History',
    value: 'Exact revisions, diff, review, and restore',
    note: 'A saved change is bound to before-and-after content digests.',
  },
  {
    label: 'Evidence',
    value: 'Scored dimensions with coverage and uncertainty',
    note: 'A comparison delta appears only when Flow verifies the exact baseline revision byte for byte.',
  },
  {
    label: 'Checks',
    value: 'Six explicit states',
    note: 'An override records the decision. It never relabels Failed as Passed.',
  },
  {
    label: 'Sources',
    value: 'What a run consulted, kept distinct from evidence',
    note: 'Retrieval records what was read. Evidence records what was assessed. One never stands in for the other.',
  },
  {
    label: 'Private telemetry',
    value: 'Stays on the Mac',
    note: 'Flow does not send product-use telemetry to Orionfold.',
  },
];

export const FLOW_RUNTIME_COMPARISON: FlowRuntimeComparison = {
  eyebrow: 'Flow Runtime vs. Ollama',
  title: 'Run local models faster, without rebuilding your library.',
  body: 'In Flow’s measured Apple-silicon comparisons, Flow Runtime generated text 30–80% faster than Ollama across comparable 7B and 27B model pairs. Flow can also use compatible models already saved by Ollama or LM Studio, so you can keep your existing libraries instead of downloading another copy.',
  qualifier: 'Measured generation throughput on an M3 Max with 36 GB of memory across comparable 7B and 27B quantized model pairs on August 14, 2026. Results vary by model, context, and Mac. The pairs matched model family and size, not byte-identical weights.',
};

export const FLOW_BASE_SPECIFICATIONS: FlowCapability[] = FLOW_BASE_CAPABILITIES;
export const FLOW_PRO_SPECIFICATIONS: FlowCapability[] = FLOW_PRO_CAPABILITIES;
export const FLOW_LAPSE_SPECIFICATIONS: string[] = FLOW_LAPSE_FACTS;
