// Curated roadmap overlay (R3, spec §8). Net-new / planned roadmap items that
// are NOT (yet) a shipped product in software.ts / models.ts / books.ts.
//
// Why this file exists: the roadmap is normally a *view* over the three showcase
// data files (see src/lib/roadmap/source.ts). That's perfect for things we've
// shipped — but the Planned lane wants future work that has no showcase entry
// yet. Adding such an item to software.ts would also push it onto /software with
// no real cover or link. So planned/future items live here instead: they appear
// ONLY on /roadmap, and graduate into a real showcase entry once they ship.
//
// buildRoadmap() in source.ts appends these after the showcase-derived items.
// An overlay id that collides with a generated showcase id is skipped (the real
// offering wins), so this stays purely additive.
//
// Edit this file through the `roadmap-manage` skill — it keeps the fields, the
// id convention, and the grade 3-5 copy style consistent and re-validates the
// build. The field reference lives in that skill's references/data-model.md.
import type { RoadmapStatus, SponsorTier, RoadmapFeature } from './roadmap-types';
// Type-only import (erased at build), so the source.ts <-> overlay reference is
// not a runtime cycle: source.ts imports the `roadmapOverlay` value; we import
// only the `RoadmapType` type back.
import type { RoadmapType } from '../lib/roadmap/source';

export interface RoadmapOverlayItem {
  /** Unique stable id. Convention: `${type}:${slug}`, e.g. 'software:agent-studio'.
   *  Rides in enquiry/sponsor metadata, so keep it stable once shipped. */
  id: string;
  type: RoadmapType; // 'book' | 'software' | 'model'
  title: string;
  blurb: string; // one or two plain sentences, grade 3-5, no em-dashes (website-copy-style)
  status: RoadmapStatus; // 'released' | 'active' | 'planned' — usually 'planned' here
  href?: string; // canonical home / repo, if one exists yet
  cover?: string; // asset filename; set assetBase too, else the card uses the constellation motif
  assetBase?: 'projects' | 'models'; // which src/assets/<base>/ the cover lives under
  sponsorTier?: SponsorTier; // 'gold' | 'platinum' badge (set when a sponsorship is confirmed)
  features?: RoadmapFeature[]; // active items expand into these selectable/sponsorable rows
  lookupKey?: string; // Stripe lookup key — only for a book with a paid bundle (rare here)
  roadmapOrder?: number; // sort within the lane; defaults to after the showcase items
}

// Add items via the roadmap-manage skill. Example shape (delete the comment, not
// a live entry — keeping the array typed-empty means the build ships nothing extra):
//   {
//     id: 'software:agent-studio',
//     type: 'software',
//     title: 'Agent Studio',
//     blurb: 'A visual way to build local AI agents, no code needed.',
//     status: 'planned',
//     href: 'https://github.com/manavsehgal/agent-studio',
//     roadmapOrder: 300,
//   },
export const roadmapOverlay: RoadmapOverlayItem[] = [
  // 2026-06-10: 'software:orionfold-advisor' graduated out of the overlay.
  // The Advisor shipped publicly (Orionfold/Advisor-GGUF + Advisor-bench on
  // Hugging Face), so it now lives as a real showcase entry in software.ts
  // (slug 'advisor') with its own detail page.
  {
    id: 'software:private-agent-starter-kit',
    type: 'software',
    title: 'Private Agent Starter Kit',
    blurb: 'One local workflow with a trigger, runner, evaluation, approval loop, artifact output, and audit trail.',
    status: 'planned',
    href: '/workflows/',
    cover: 'private-agent-starter-kit-poster.png',
    assetBase: 'projects',
    roadmapOrder: 55,
  },
];
