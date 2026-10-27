// Flow Elements (the Elements set, Flow 3.0): the articles, the element
// sections and the element index all come from scripts/sync-flow-elements.mjs.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import INDEX from '../../data/flow-elements.json';

export type ElementArticle = CollectionEntry<'elements'>;
export type ElementItem = CollectionEntry<'elementItems'>;
export type FlowElement = (typeof INDEX.categories)[number]['items'][number] & { category: string; categoryLabel: string };

export const ELEMENT_CATEGORIES = INDEX.categories;

export async function publishedElementArticles(): Promise<ElementArticle[]> {
  const all = await getCollection('elements', (entry) => import.meta.env.DEV || !entry.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** A category's elements, in the sidebar's order. */
export async function elementItems(category: string): Promise<ElementItem[]> {
  const all = await getCollection('elementItems', (e) => e.data.category === category);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const elementArticleHref = (slug: string) => `/flow/elements/${slug}/`;
export const elementHref = (e: Pick<FlowElement, 'category' | 'anchor'>) => `/flow/elements/${e.category}/#${e.anchor}`;

/** Every element, flat, with its category. */
export const ALL_ELEMENTS: FlowElement[] = INDEX.categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.slug, categoryLabel: c.label })));

// The nav's five, in the operator's order (2026-10-26).
const NAV_PICKS = ['skill-product-mock', 'skill-workflow-path', 'skill-system-explainer', 'skill-field-notes-diagram', 'skill-isometric-figure'];
export const NAV_ELEMENTS: FlowElement[] = NAV_PICKS.map((card) => {
  const hit = ALL_ELEMENTS.find((e) => e.card === card);
  if (!hit) throw new Error(`Flow Elements nav: no element with card ${card}`);
  return hit;
});

// The app's own drawings (SVG templates, ink as currentColor), inlined so
// they stay sharp at any size and take the card's tint.
const drawings = import.meta.glob<string>('../../assets/flow/elements/icons/*.svg', { eager: true, query: '?raw', import: 'default' });
export function elementDrawing(card: string): string {
  const hit = drawings[`../../assets/flow/elements/icons/${card}.svg`];
  if (!hit) throw new Error(`Flow Elements: no drawing for ${card}`);
  return hit;
}

const shots = import.meta.glob<{ default: ImageMetadata }>('../../assets/flow/elements/*/*.webp', { eager: true });
export function elementShot(slug: string, name: string): ImageMetadata {
  const hit = shots[`../../assets/flow/elements/${slug}/${name}.webp`];
  if (!hit) throw new Error(`Flow Elements ${slug}: no shot named ${name}`);
  return hit.default;
}
