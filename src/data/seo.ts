// Site constants + structured-data identities consumed by Layout.astro and the
// legal pages. SITE feeds title/description/OG defaults; ORGANIZATION is the
// global JSON-LD Layout injects on every page; PUBLISHER is the publisher node
// the Terms/Privacy pages reference (S10 used inline copies, S11 DRYed them here).
export const SITE = {
  name: 'Orionfold',
  url: 'https://orionfold.com',
  description:
    'Orionfold gives you open or frontier AI models, local or cloud delivery, single- or multi-user operation, optimized for cost or intelligence.',
  logo: 'https://orionfold.com/orionfold-128.png',
  ogImage: 'https://orionfold.com/og-image.png',
  ogImageAlt:
    'Orionfold: proven AI-native business with open or frontier models, local or cloud delivery, and cost or intelligence optimization.',
  // Single light theme: address-bar tint matches the manifest background.
  themeColor: '#f6f9fc',
  license: 'Apache-2.0',
  twitter: '@manavsehgal',
};

// Founder identity. The sameAs links let answer engines (Perplexity, ChatGPT,
// Google AI Overviews) tie the person to a single entity across the web.
export const PERSON = {
  '@type': 'Person',
  name: 'Manav Sehgal',
  url: SITE.url,
  sameAs: [
    'https://github.com/manavsehgal',
    'https://x.com/manavsehgal',
    'https://www.linkedin.com/in/manavsehgal/',
  ],
};

// The startup entity. Layout injects this on every page so the whole site reads
// as one Organization (Orionfold LLC) to crawlers. sameAs lists Orionfold's
// real public homes: GitHub, X, YouTube, and the HuggingFace model org.
export const ORGANIZATION = {
  '@type': 'Organization',
  name: 'Orionfold LLC',
  url: SITE.url,
  logo: SITE.logo,
  description: SITE.description,
  founder: PERSON,
  foundingDate: '2026',
  memberOf: {
    '@type': 'ProgramMembership',
    programName: 'NVIDIA Inception',
    hostingOrganization: {
      '@type': 'Organization',
      name: 'NVIDIA',
      url: 'https://www.nvidia.com/',
    },
  },
  sameAs: [
    'https://github.com/manavsehgal',
    'https://x.com/manavsehgal',
    'https://youtube.com/@ainativebusiness',
    'https://huggingface.co/Orionfold',
  ],
};

// Publisher node for page-level legal JSON-LD (Terms/Privacy).
export const PUBLISHER = {
  '@type': 'Organization',
  name: 'Orionfold LLC',
  url: SITE.url,
  logo: {
    '@type': 'ImageObject',
    url: SITE.logo,
  },
};
