export type FlagshipId = 'advisor' | 'workflows' | 'domain-packs' | 'workbench';

export interface ProofLink {
  label: string;
  href: string;
  note: string;
}

export interface FlagshipOffer {
  id: FlagshipId;
  eyebrow: string;
  title: string;
  route: string;
  outcome: string;
  buyer: string;
  status: string;
  proof: ProofLink[];
}

export const flagshipOffers: FlagshipOffer[] = [
  {
    id: 'advisor',
    eyebrow: 'Ask',
    title: 'Orionfold Advisor',
    route: '/advisor/',
    outcome: 'A private expert interface over the Orionfold corpus, built first as local retrieval before model fine-tuning.',
    buyer: 'Founders and operators who need fast answers from a coherent body of AI-native implementation work.',
    status: 'Planned build path',
    proof: [
      { label: 'AI Native Platform book', href: '/books/ai-native-platform/', note: 'The operating manual the first Advisor reads.' },
      { label: 'Story archive', href: '/story/', note: 'Build notes, field lessons, and decisions.' },
      { label: 'Adoption map', href: '/roadmap/#ask', note: 'Sponsor the Advisor lane.' },
    ],
  },
  {
    id: 'workflows',
    eyebrow: 'Run',
    title: 'Private Agent Starter Kit',
    route: '/workflows/',
    outcome: 'One local workflow with a trigger, runner, evaluation, approval loop, artifact output, and audit trail.',
    buyer: 'Small teams that need a useful private agent before they have a full automation team.',
    status: 'Packaged from shipped parts',
    proof: [
      { label: 'AI Native Platform', href: '/software/ai-native-platform/', note: 'Agent runtime, profiles, schedules, and cost ledger.' },
      { label: 'AI Native API', href: '/software/ai-native-api/', note: 'Programmatic workflow control.' },
      { label: 'Sentinel', href: '/software/sentinel/', note: 'Behavior checks for agent runs.' },
    ],
  },
  {
    id: 'domain-packs',
    eyebrow: 'Know',
    title: 'Domain Experts',
    route: '/domain-packs/',
    outcome: 'Offline model plus benchmark, local run path, and use-case playbook for sensitive domain work.',
    buyer: 'Teams with legal, security, finance, medical, or technical work that cannot live only in a generic chatbot.',
    status: 'Patent pack live, more planned',
    proof: [
      { label: 'Patent Strategist', href: '/models/patent-strategist/', note: 'The flagship offline domain model.' },
      { label: 'Patent Strategist Bench', href: 'https://huggingface.co/datasets/Orionfold/patent-strategist-bench-v0.1', note: 'A public benchmark for patent reasoning.' },
      { label: 'Model library', href: '/models/', note: 'Security, legal, finance, medical, and space models.' },
    ],
  },
  {
    id: 'workbench',
    eyebrow: 'Build',
    title: 'Local AI Cockpit',
    route: '/workbench/',
    outcome: 'A cockpit for comparing, remembering, evaluating, and shipping local AI work on customer-controlled hardware.',
    buyer: 'Builders who need inspection, memory, telemetry, and repeatable model runs instead of one-off demos.',
    status: 'Arena and Cortex active',
    proof: [
      { label: 'Orionfold Arena', href: '/software/arena/', note: 'The cockpit for model comparison and evals.' },
      { label: 'Orionfold Cortex', href: '/software/cortex/', note: 'The local memory and provenance layer.' },
      { label: 'fieldkit', href: '/software/fieldkit/', note: 'Reusable Python patterns for local AI systems.' },
    ],
  },
];

export const flagshipById = Object.fromEntries(flagshipOffers.map((offer) => [offer.id, offer])) as Record<FlagshipId, FlagshipOffer>;
