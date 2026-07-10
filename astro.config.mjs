import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import remarkAsciinema from './src/lib/products/remark-asciinema.mjs';
import remarkProofCta from './src/lib/products/remark-proof-cta.mjs';
import rehypeTableScroll from './src/lib/products/rehype-table-scroll.mjs';
import rehypeRelayShots from './src/lib/relay/rehype-relay-shots.mjs';

// Build a `pathname -> YYYY-MM-DD` map for sitemap <lastmod>. lastmod is the one
// sitemap field Google actually uses to schedule crawls, so every value here must
// be a REAL content date, never a uniform build stamp (a fake freshness signal
// gets discounted). Stories use their publish `date:`; product pages use the
// freshest `lastSynced:` the product-detail-sync skill stamps; hubs and the home
// page inherit the freshest date of the content they surface. Pages with no honest
// date (legal/static) are left out — lastmod is optional per-URL. Runs once at
// config-eval time because serialize() only sees the URL, not the frontmatter.
const CONTENT = new URL('./src/content/', import.meta.url);
const firstDate = (txt, re) => {
  const m = txt.match(re);
  return m ? m[1] : null;
};
function buildLastmodMap() {
  const map = {};
  // Stories: src/content/story/<slug>.md -> /story/<slug>/
  const storyDir = new URL('story/', CONTENT);
  for (const f of readdirSync(storyDir)) {
    if (!f.endsWith('.md')) continue;
    const txt = readFileSync(new URL(f, storyDir), 'utf8');
    const d = firstDate(txt, /^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
    if (d) map[`/story/${f.replace(/\.md$/, '')}/`] = d;
  }
  // Products: src/content/products/<type>/<slug>.md -> /<type>/<slug>/
  const products = new URL('products/', CONTENT);
  for (const type of ['software', 'models', 'books']) {
    let files;
    try {
      files = readdirSync(new URL(`${type}/`, products));
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const txt = readFileSync(new URL(`${type}/${f}`, products), 'utf8');
      const dates = [...txt.matchAll(/lastSynced:\s*['"]?(\d{4}-\d{2}-\d{2})/g)]
        .map((m) => m[1])
        .sort();
      if (dates.length) map[`/${type}/${f.replace(/\.md$/, '')}/`] = dates.at(-1);
    }
  }
  // Listing hubs inherit the freshest date among their children.
  const freshestUnder = (prefix) =>
    Object.entries(map)
      .filter(([k]) => k !== prefix && k.startsWith(prefix))
      .map(([, v]) => v)
      .sort()
      .at(-1);
  for (const hub of ['/story/', '/software/', '/models/', '/books/']) {
    const d = freshestUnder(hub);
    if (d) map[hub] = d;
  }
  // Home page surfaces the newest content anywhere, so it tracks the freshest date.
  const newest = Object.values(map).sort().at(-1);
  if (newest) map['/'] = newest;
  return map;
}
const LASTMOD = buildLastmodMap();

// Dev-only fix: Astro's dev server (Vite) does not resolve directory index.html
// for public/ subfolders, so the committed Arena demo (public/arena/demo/ — a
// static multi-page app with clean /arena/demo/<tab>/ URLs, mirrored from
// ainative.business) 404s at /arena/demo/ and every sub-route under `astro dev`.
// This middleware rewrites those directory requests to their index.html BEFORE
// Vite's static handler, so the demo is fully navigable locally with the SAME
// clean URLs production uses. `apply: 'serve'` scopes it to dev; the build +
// GitHub Pages already serve directory indexes, so production is untouched.
function arenaDemoDirIndexDev() {
  return {
    name: 'arena-demo-dir-index-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const qi = req.url.indexOf('?');
          const path = qi === -1 ? req.url : req.url.slice(0, qi);
          const query = qi === -1 ? '' : req.url.slice(qi);
          if (path.startsWith('/arena/demo/') && path.endsWith('/')) {
            req.url = `${path}index.html${query}`;
          }
        }
        next();
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://orionfold.com',
  trailingSlash: 'always',
  // Prefetch nav targets so a menu tap loads near-instantly instead of a cold
  // full-page fetch (the site has no client router, so every nav is a real
  // document load that re-runs gtag.js etc.). `viewport` warms each link tagged
  // `data-astro-prefetch` as soon as it scrolls into view — for the mobile menu
  // that's the moment the dropdown opens, so the page is usually cached by the
  // time the user picks an item. Only opted-in links prefetch (prefetchAll off).
  prefetch: {
    defaultStrategy: 'viewport',
  },
  // The 4 original thin /story posts were retired for the N-series story arc
  // (their themes survive at higher quality in the new arc). N10 repointed each
  // old slug to its exact successor story (per spec §3 mapping) so old links land
  // on the post that absorbed the theme, not a generic hub. Astro emits a 301.
  redirects: {
    '/story/why-we-folded-orionfold/': '/story/why-i-folded-orionfold/',
    '/story/building-in-public-week-one/': '/story/building-in-public/',
    '/story/picking-open-models-over-closed/': '/story/the-year-the-gap-closed/',
    '/story/shipping-models-from-one-small-desktop/': '/story/my-first-model-on-a-desktop/',
    // Retitled to drop the marketing-fluff "free" from the slug + headline.
    '/story/a-book-you-can-read-free-and-run/': '/story/a-book-you-can-read-and-run/',
    // 2026-06-09 nav naming (variant C): /roadmap/ was live + indexed in GSC, so
    // it redirects to the renamed /adoption/. The other renamed flagship routes
    // (/domain-packs/ -> /experts/, /workbench/ -> /cockpit/) were never deployed,
    // so they get no redirect. At go-live, mirror this as a Cloudflare 301 rule
    // (this static redirect is a meta-refresh page, weaker than an edge 301).
    '/roadmap/': '/adoption/',
    // Three-flagship consolidation (2026-07-01): the legacy /software/arena/ and
    // /software/ai-native-platform/ detail pages were retired in favor of the
    // canonical /arena/ and /relay/ landings (single buy surface per flagship).
    // Both old URLs carry GSC history, so 301 them to their landing successor.
    // (/software/ai-native-platform/ = the pre-rename Relay engine; the *book*
    // /books/ai-native-platform/ is a different product and stays untouched.)
    // Astro emits a meta-refresh 301; mirror as a Cloudflare edge 301 at go-live.
    '/software/arena/': '/arena/',
    '/software/ai-native-platform/': '/relay/',
    // Arena Field Edition (2026-06-13): marketing campaign links use the short
    // vanity path /arena-field-edition/. It pointed at the retired detail page;
    // repoint to the /arena/ landing where the Field Edition buy block now lives.
    '/arena-field-edition/': '/arena/',
  },
  markdown: {
    remarkPlugins: [remarkDirective, remarkAsciinema, remarkProofCta],
    rehypePlugins: [rehypeTableScroll, rehypeRelayShots],
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
      // lastmod (added below from real content dates) is the one Google weighs.
      serialize(item) {
        const url = item.url;
        const date = LASTMOD[new URL(url).pathname];
        const lastmod = date ? new Date(`${date}T00:00:00Z`) : undefined;
        if (url === 'https://orionfold.com/') {
          return { ...item, changefreq: 'weekly', priority: 1.0, lastmod };
        }
        // Proof is the flagship conversion + demand-gen surface (single-product
        // pivot, relay ask A8). Lift it into the top band just under the homepage
        // (0.9) and crawl it weekly so the receipts wall stays fresh in the index.
        if (url === 'https://orionfold.com/proof/') {
          return { ...item, changefreq: 'weekly', priority: 0.9, lastmod };
        }
        // Receipts (A11): the gallery hub sits just under /proof/; each receipt
        // permalink is fresh, indexable evidence in its own right.
        if (url === 'https://orionfold.com/receipts/') {
          return { ...item, changefreq: 'weekly', priority: 0.8, lastmod };
        }
        if (url.startsWith('https://orionfold.com/receipts/')) {
          return { ...item, changefreq: 'weekly', priority: 0.7, lastmod };
        }
        if (url.includes('/story/')) {
          return { ...item, changefreq: 'weekly', priority: 0.7, lastmod };
        }
        if (url.includes('/books/') || url.includes('/software/') || url.includes('/models/')) {
          return { ...item, changefreq: 'monthly', priority: 0.8, lastmod };
        }
        if (url.includes('/terms/') || url.includes('/privacy/')) {
          return { ...item, changefreq: 'yearly', priority: 0.3, lastmod };
        }
        return { ...item, changefreq: 'monthly', priority: 0.6, lastmod };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss(), arenaDemoDirIndexDev()],
  },
});
