// Resolves a flagship proof link's href to the real artwork the site already
// owns: software movie posters, model covers, book covers, and story heroes.
// The flagship pages stay data-driven (flagship-offers.ts holds plain hrefs)
// while every proof card gets the same key art its destination page leads with.
// Unknown hrefs return undefined and the card falls back to the constellation
// motif, so a new proof link never breaks a page.
import type { ImageMetadata } from 'astro';

const posters = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/projects/*-poster.png',
  { eager: true },
);
const modelCovers = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/models/*/cover.png',
  { eager: true },
);
const bookCovers = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/book/*.jpg',
  { eager: true },
);
const storyHeroes = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/story/*/hero.{jpeg,jpg,png}',
  { eager: true },
);
const advisorShots = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/projects/advisor/*.png',
  { eager: true },
);
const sparkHero = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/dgx-spark/hero.jpg',
  { eager: true },
);

// Book route slugs differ from their cover filenames; map them explicitly.
const BOOK_COVER_BY_SLUG: Record<string, string> = {
  'ai-native-business': 'ai-native-business-book',
  'ai-native-platform': 'ai-native-platform-book',
  'ai-research-on-nvidia-dgx-spark': 'ai-research-dgx-spark-book',
};

export function resolveProofArt(href: string): ImageMetadata | undefined {
  const software = href.match(/^\/software\/([\w-]+)\/?$/);
  if (software) return posters[`../../assets/projects/${software[1]}-poster.png`]?.default;

  const model = href.match(/^\/models\/([\w-]+)\/?$/);
  if (model) return modelCovers[`../../assets/models/${model[1]}/cover.png`]?.default;

  const book = href.match(/^\/books\/([\w-]+)\/?$/);
  if (book) {
    const file = BOOK_COVER_BY_SLUG[book[1]];
    return file ? bookCovers[`../../assets/book/${file}.jpg`]?.default : undefined;
  }

  // The public benchmark lives on Hugging Face but has a curated cover here.
  if (href.includes('patent-strategist-bench'))
    return modelCovers['../../assets/models/patent-strategist-bench/cover.png']?.default;

  // The Advisor's Hugging Face artifacts lead with real cockpit proof shots:
  // the model card shows a live refusal scored at the wire, the bench card the
  // 89 replayable measured rows.
  if (href.includes('Orionfold/Advisor-GGUF'))
    return advisorShots['../../assets/projects/advisor/refusal-scored.png']?.default;
  if (href.includes('Orionfold/Advisor-bench'))
    return advisorShots['../../assets/projects/advisor/eval-drawer.png']?.default;

  // The adoption map is the site's own star chart, so it leads with the
  // starscape key art instead of the generic constellation motif.
  if (href.startsWith('/adoption'))
    return sparkHero['../../assets/dgx-spark/hero.jpg']?.default;

  // The story archive: lead with the building-in-public hero.
  if (href.startsWith('/story'))
    return storyHeroes['../../assets/story/building-in-public/hero.jpeg']?.default;

  return undefined;
}
