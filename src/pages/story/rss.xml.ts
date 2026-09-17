// RSS 2.0 feed for the story collection (the building-in-public build log).
// Hand-rolled rather than pulling in @astrojs/rss: the feed is a few dozen lines
// of XML, and this is a PUBLIC repo where every dependency is supply chain we
// own. Static endpoint, so it emits once at build time to /story/rss.xml.
//
// Contract notes:
//   - Newest first, matching the /story/ index sort.
//   - <description> carries the post summary, NOT the body. Summaries are the
//     authored one-liners already used on cards and meta descriptions, so the
//     feed stays honest and small; readers click through for the full post.
//   - Every value is XML-escaped. Story titles and summaries are author-written
//     prose that legitimately contains & and quotes, which would otherwise
//     produce an invalid feed.
//   - pubDate is RFC-822 in UTC, which is what RSS 2.0 requires.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../../data/seo';
import { ESSAYS } from '../../data/essays';

/** Escape the five XML predefined entities. Order matters: & must go first. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RSS 2.0 requires RFC-822 dates; toUTCString() is exactly that shape. */
function rfc822(date: Date): string {
  return date.toUTCString();
}

export const GET: APIRoute = async () => {
  const stories = (await getCollection('story')).map((post) => ({
    url: `${SITE.url}/story/${post.id}/`, data: post.data,
  }));
  // Canonical essay URLs also appear here without duplicating their bodies.
  const essays = ESSAYS.map(essay => ({
    url: `${SITE.url}${essay.href}`,
    data: { title: essay.title, summary: essay.description,
      date: new Date(`${essay.date}T00:00:00Z`), tags: ['Living Documents', 'Essay'] },
  }));
  const posts = [...stories, ...essays].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = posts
    .map((post) => {
      const url = post.url;
      // guid is the permalink and isPermaLink says so, so readers dedupe on URL
      // even if a title is later edited.
      const categories = post.data.tags
        .map((tag) => `      <category>${xmlEscape(tag)}</category>`)
        .join('\n');
      return [
        '    <item>',
        `      <title>${xmlEscape(post.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(post.data.date)}</pubDate>`,
        `      <description>${xmlEscape(post.data.summary)}</description>`,
        categories,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  // lastBuildDate tracks the newest post rather than the build clock, so a
  // rebuild with no new writing does not churn the feed for subscribers.
  const newest = posts[0]?.data.date ?? new Date(0);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Orionfold Story</title>
    <link>${SITE.url}/story/</link>
    <description>Essays and building-in-public notes on working knowledge, what we shipped, and what we learned.</description>
    <language>en-us</language>
    <copyright>Orionfold LLC</copyright>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
    <atom:link href="${SITE.url}/story/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
