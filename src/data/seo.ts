// Minimal site constants consumed by Layout.astro (title/description/OG defaults).
// S11 (SEO baseline) enriches this file with PERSON / ORGANIZATION / PUBLISHER
// JSON-LD and a real /og-image.png — Layout reads SITE only, so that is additive.
export const SITE = {
  name: 'Orionfold',
  url: 'https://orionfold.com',
  description:
    'Orionfold builds open AI software, custom models, and the playbooks to run them. Grow 10x with AI, on your own computer.',
  logo: 'https://orionfold.com/orionfold-128.png',
  ogImage: 'https://orionfold.com/og-image.png',
  ogImageAlt:
    'Orionfold: open AI software, custom models, and the playbooks to run them.',
  // Single light theme: address-bar tint matches the manifest background.
  themeColor: '#f6f9fc',
  license: 'Apache-2.0',
  twitter: '@manavsehgal',
};
