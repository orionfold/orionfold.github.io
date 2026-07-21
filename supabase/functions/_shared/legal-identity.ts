// Canonical public legal identity for proposals and customer email footers.
// Keep this dependency-free so Astro and Supabase Edge Functions can share it.

export const ORIONFOLD_LEGAL_NAME = "Orionfold LLC";
export const ORIONFOLD_CONTACT_EMAIL = "manav@orionfold.com";
export const ORIONFOLD_POSTAL_ADDRESS = "2108 N St Ste N, Sacramento, CA 95816";

export const ORIONFOLD_LEGAL_IDENTITY = {
  name: ORIONFOLD_LEGAL_NAME,
  email: ORIONFOLD_CONTACT_EMAIL,
  postalAddress: ORIONFOLD_POSTAL_ADDRESS,
} as const;
