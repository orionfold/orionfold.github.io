// Shared roadmap metadata (spec §9, F1). The /roadmap page (R-series) groups
// every offering by lifecycle status and lets visitors sponsor or enquire about
// any line of work. These optional fields are mixed into the existing showcase
// data (software.ts / models.ts / books.ts) so the field is purely additive:
// the live /software, /models, /books pages ignore it and render unchanged.
// F2's src/data/roadmap.ts merges these with live GitHub signals into one typed
// dataset; R3's roadmap-manage skill edits the curated overlay against these types.
export type RoadmapStatus = 'released' | 'active' | 'planned';

// Only Gold and Platinum sponsors earn a per-item badge (spec §2, §5).
export type SponsorTier = 'gold' | 'platinum';

// An active offering expands into individually selectable + sponsorable features
// on the roadmap (e.g. fieldkit -> RAG pipeline, eval harness, quant module).
// F2 sources the real feature lists from the project repo; F1 only defines the type.
export interface RoadmapFeature {
  id: string; // stable id for selection / enquiry payloads
  label: string; // grade 3-5 display name, no em-dashes (website-copy-style)
  status?: RoadmapStatus; // defaults to the parent item's status
  sponsorTier?: SponsorTier; // gold/platinum badge on the feature
}

// Mixed into each showcase interface via `extends`. Every field is optional and
// absent means released, so existing data + rendering stay untouched.
export interface RoadmapMeta {
  status?: RoadmapStatus; // default 'released' (consumers treat undefined as released)
  sponsorTier?: SponsorTier; // gold/platinum badge on the item
  features?: RoadmapFeature[]; // active items expand into these
  roadmapOrder?: number; // optional manual ordering within a status lane
}
