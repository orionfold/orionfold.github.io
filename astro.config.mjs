import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://orionfold.com',
  trailingSlash: 'always',
  // The 4 original thin /story posts were retired for the N-series story arc
  // (their themes survive at higher quality in the new arc). These send the old
  // slugs to the story hub so nothing 404s. N10 may repoint each to its exact
  // successor (why-we-folded → why-i-folded-orionfold, one-desktop →
  // my-first-model-on-a-desktop, week-one → building-in-public, open-vs-closed →
  // the-year-the-gap-closed) once those pages exist.
  redirects: {
    '/story/why-we-folded-orionfold/': '/story/',
    '/story/building-in-public-week-one/': '/story/',
    '/story/picking-open-models-over-closed/': '/story/',
    '/story/shipping-models-from-one-small-desktop/': '/story/',
  },
  integrations: [
    sitemap({
      // The /og/*.png endpoint emits social-card images, not pages — keep them
      // out of the sitemap. The post-checkout /thanks pages are noindex, so they
      // don't belong in the sitemap either (C4).
      filter: (page) =>
        !page.includes('/og/') &&
        !page.endsWith('/thanks/') &&
        !page.endsWith('/sponsor/thanks/'),
      // Priority + changefreq hints. Search engines treat these as signals, not
      // directives, but they nudge crawl scheduling toward the pages that change.
      serialize(item) {
        const url = item.url;
        if (url === 'https://orionfold.com/') {
          return { ...item, changefreq: 'weekly', priority: 1.0 };
        }
        if (url.includes('/story/')) {
          return { ...item, changefreq: 'weekly', priority: 0.7 };
        }
        if (url.includes('/books/') || url.includes('/software/') || url.includes('/models/')) {
          return { ...item, changefreq: 'monthly', priority: 0.8 };
        }
        if (url.includes('/terms/') || url.includes('/privacy/')) {
          return { ...item, changefreq: 'yearly', priority: 0.3 };
        }
        return { ...item, changefreq: 'monthly', priority: 0.6 };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
