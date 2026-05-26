// Resolved roadmap dataset (F2, spec §5). This is what the /roadmap page (R1)
// and the homepage poster rail import. The build-time pull + merge logic lives in
// src/lib/roadmap/source.ts; this module just resolves the signals (live, with a
// committed snapshot fallback) and exports the typed result.
//
// The top-level await runs once during `astro build` / `astro dev` startup, so
// pages import a ready dataset (no async in components). Online builds get fresh
// GitHub signals; offline/CI-blip builds fall back to snapshot.json.
import { loadSignals } from '../lib/roadmap/signals';
import { buildRoadmap, deriveLanes } from '../lib/roadmap/source';

export type { RoadmapItem, RoadmapType, RoadmapSignals } from '../lib/roadmap/source';

export const roadmapSignals = await loadSignals();
export const roadmap = buildRoadmap(roadmapSignals);
export const roadmapLanes = deriveLanes(roadmap);
