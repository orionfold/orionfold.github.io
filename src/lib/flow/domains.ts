// Flow Domains (/domains/): the launch articles, newest first.
import { getCollection, type CollectionEntry } from 'astro:content';

export type DomainArticle = CollectionEntry<'domains'>;

export async function publishedDomainArticles(): Promise<DomainArticle[]> {
  const all = await getCollection('domains', (e) => !e.data.draft);
  return all.sort((a, b) => b.data.drafted.getTime() - a.data.drafted.getTime());
}

export const domainArticleHref = (id: string) => `/domains/${id}/`;
