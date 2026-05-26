// Roadmap merge layer (F2, spec §5 + §9). Combines the live GitHub signals
// (signals.ts) with the site's own F1-tagged offerings into one typed dataset:
//
//   live signals  +  software.ts / models.ts / books.ts  ->  RoadmapItem[]
//
// The two active offerings expand into real, live-sourced features:
//   - fieldkit (software, active) -> features[] = the 11 fieldkit modules.
//   - AI Research (book, active)  -> features[] = the field-notes publishing
//     stages, each active/released by whether it has upcoming notes
//     ("the 5 upcoming notes = active publishing areas", spec §5).
//
// GitHub is the source of truth for WHICH modules/stages exist + the fieldkit
// version; the friendly grade 3-5 labels live in the maps below (raw upstream
// summaries are too technical for site copy, memory `website-copy-style`).
// src/data/roadmap.ts resolves signals then calls buildRoadmap()/deriveLanes().
import type { RoadmapFeature, RoadmapStatus, SponsorTier } from '../../data/roadmap-types';
import { software } from '../../data/software';
import { models } from '../../data/models';
import { books } from '../../data/books';
import type { FieldkitModule, FieldStage, RoadmapSignals } from './signals';

export type { RoadmapSignals } from './signals';

// ─────────────────────────────────────────────────────────────────────────────
// Copy layer: friendly grade 3-5 labels (no em-dashes). GitHub supplies the ids;
// these supply the words shown on the roadmap.

const MODULE_LABELS: Record<string, string> = {
  capabilities: 'Check what your machine can run',
  cli: 'Command-line tools',
  eval: 'Score how well a model does',
  lineage: 'Track where each model came from',
  nim: 'Run NVIDIA model servers',
  notebook: 'Ready-made notebooks',
  publish: 'Publish models with cards',
  quant: 'Shrink models to run faster',
  rag: 'Search over your own files',
  training: 'Train and fine-tune models',
  viz: 'Charts and visuals',
};

const STAGE_LABELS: Record<string, string> = {
  foundations: 'Foundations',
  training: 'Training models',
  'fine-tuning': 'Fine-tuning models',
  inference: 'Running models fast',
  deployment: 'Deployment',
  agentic: 'AI agents',
  observability: 'Watching and measuring',
  'dev-tools': 'Developer tools',
};

// ─────────────────────────────────────────────────────────────────────────────
// Merged dataset types (what the /roadmap page consumes)

export type RoadmapType = 'book' | 'software' | 'model';

export interface RoadmapItem {
  id: string; // `${type}:${slug}` stable id (used in enquiry/sponsor metadata)
  type: RoadmapType;
  title: string;
  blurb: string;
  status: RoadmapStatus; // released | active | planned
  href?: string; // canonical external home
  cover?: string; // asset key as stored in the source data
  assetBase?: 'projects' | 'models'; // which src/assets/<base>/ the cover lives under (R1 glob-resolves)
  sponsorTier?: SponsorTier; // gold/platinum badge
  features?: RoadmapFeature[]; // active items expand into these
  cta: 'buy' | 'sponsor'; // books buy; everything else sponsors
  roadmapOrder: number; // sort key within a status lane
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge: signals + F1-tagged offerings -> one typed dataset

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function modulesToFeatures(modules: FieldkitModule[]): RoadmapFeature[] {
  return modules.map((m) => ({
    id: `fieldkit-${m.id}`,
    label: MODULE_LABELS[m.id] ?? m.id,
    status: 'active' as const,
  }));
}

function stagesToFeatures(stages: FieldStage[]): RoadmapFeature[] {
  return stages
    .slice()
    .sort((a, b) => b.published - a.published)
    .map((s) => ({
      id: `stage-${s.id}`,
      label: STAGE_LABELS[s.id] ?? s.id,
      // a stage with upcoming notes is being worked on; otherwise its work shipped.
      status: (s.upcoming > 0 ? 'active' : 'released') as RoadmapStatus,
    }));
}

/** Merge live signals with the site's own offerings into one typed RoadmapItem[]. */
export function buildRoadmap(signals: RoadmapSignals): RoadmapItem[] {
  const items: RoadmapItem[] = [];

  books.forEach((b, i) => {
    items.push({
      id: `book:${b.slug}`,
      type: 'book',
      title: b.title,
      blurb: b.body,
      status: b.status ?? 'released',
      href: b.href,
      sponsorTier: b.sponsorTier,
      features: b.slug === 'field-notes' ? stagesToFeatures(signals.fieldNotes.stages) : b.features,
      cta: 'buy',
      roadmapOrder: b.roadmapOrder ?? i,
    });
  });

  software.forEach((s, i) => {
    items.push({
      id: `software:${s.slug}`,
      type: 'software',
      title: s.title,
      blurb: s.body,
      status: s.status ?? 'released',
      href: s.href,
      cover: s.cover,
      assetBase: 'projects',
      sponsorTier: s.sponsorTier,
      features: s.slug === 'fieldkit' ? modulesToFeatures(signals.fieldkit.modules) : s.features,
      cta: 'sponsor',
      roadmapOrder: s.roadmapOrder ?? 100 + i,
    });
  });

  // Models carry per-build variants in models.ts; the roadmap shows one card per
  // offering, so dedupe by title (first variant wins for cover/href/status).
  const seen = new Set<string>();
  models.forEach((m, i) => {
    if (seen.has(m.title)) return;
    seen.add(m.title);
    items.push({
      id: `model:${slugify(m.title)}`,
      type: 'model',
      title: m.title,
      blurb: m.tagline,
      status: m.status ?? 'released',
      href: m.href,
      cover: m.cover,
      assetBase: 'models',
      sponsorTier: m.sponsorTier,
      features: m.features,
      cta: 'sponsor',
      roadmapOrder: m.roadmapOrder ?? 200 + i,
    });
  });

  return items;
}

/** Group items into the three status lanes the /roadmap page renders, each sorted by roadmapOrder. */
export function deriveLanes(items: RoadmapItem[]): Record<RoadmapStatus, RoadmapItem[]> {
  const byOrder = (a: RoadmapItem, b: RoadmapItem) => a.roadmapOrder - b.roadmapOrder;
  return {
    released: items.filter((i) => i.status === 'released').sort(byOrder),
    active: items.filter((i) => i.status === 'active').sort(byOrder),
    planned: items.filter((i) => i.status === 'planned').sort(byOrder),
  };
}
