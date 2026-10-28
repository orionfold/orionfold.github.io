// Flow Domains (/domains/): the launch story first, then the blueprints in the
// site's order (the PR/FAQ's ranks), each an article an expert in that role
// can read and build from.
import { getCollection, type CollectionEntry } from 'astro:content';

export type DomainArticle = CollectionEntry<'domains'>;

export async function publishedDomainArticles(): Promise<DomainArticle[]> {
  const all = await getCollection('domains', (e) => !e.data.draft);
  return all.sort((a, b) => {
    if (a.data.kind !== b.data.kind) return a.data.kind === 'launch' ? -1 : 1;
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return b.data.drafted.getTime() - a.data.drafted.getTime();
  });
}

export const isBlueprint = (e: DomainArticle) => e.data.kind === 'blueprint';

export const domainArticleHref = (id: string) => `/domains/${id}/`;
