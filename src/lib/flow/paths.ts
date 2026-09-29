// Flow Paths + Compare (Flow 2.0 article series). A synced path arrives with
// draft: true and builds only in dev until it is curated; Compare pages are
// website-authored and always routed.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type PathEntry = CollectionEntry<'paths'>;
export type CompareEntry = CollectionEntry<'compare'>;

const showDrafts = import.meta.env.DEV;

export async function publishedPaths(): Promise<PathEntry[]> {
  const all = await getCollection('paths', (entry) => showDrafts || !entry.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function publishedCompare(): Promise<CompareEntry[]> {
  const all = await getCollection('compare');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const pathHref = (id: string) => `/flow/paths/${id}/`;
export const compareHref = (id: string) => `/flow/compare/${id}/`;

// Card shots are named in front matter, so resolve them through a glob rather
// than an image() field (the name is also the sync script's copy list).
const shots = import.meta.glob<{ default: ImageMetadata }>('../../assets/flow/paths/*/*.webp', { eager: true });

export function pathShot(id: string, name: string): ImageMetadata {
  const hit = shots[`../../assets/flow/paths/${id}/${name}.webp`];
  if (!hit) throw new Error(`Flow path ${id}: no shot named ${name}`);
  return hit.default;
}

/** What each evidence label means, in the site's plain voice. */
export const EVIDENCE_NOTE: Record<PathEntry['data']['receipt'][number]['evidence'], string> = {
  verified: 'Checked against a saved record',
  derived: 'Worked out from checked numbers',
  assumed: 'Our assumption, not measured',
  unknown: 'Not measured',
};
