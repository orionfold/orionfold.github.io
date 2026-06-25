// Frontend commerce view (C4). Imports the server CATALOG (the single source of
// truth for lookup keys, modes, and display amounts — see C1) so prices and
// labels can't drift between the buy buttons and the edge functions. Stripe
// remains the source of truth for what actually gets charged: every checkout
// resolves the price server-side by lookup_key; the amounts here are display only.
//
// This file adds the things only the website needs: a USD formatter, the sponsor
// tier display order, and the per-tier benefit copy (grade 3-5, no em-dashes).
import {
  CATALOG,
  FOUNDING_SEATS,
  SPONSOR_TIERS,
  getCatalogItem,
  sponsorLookupKey,
} from "../../supabase/functions/_shared/catalog";
import type { SponsorTier } from "../../supabase/functions/_shared/catalog";

export { CATALOG, SPONSOR_TIERS, getCatalogItem, sponsorLookupKey };
export type { SponsorTier };

/** Cents → a clean "$10" / "$2.50" string. */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

// Arena Field Edition price family (display only; CATALOG is the SSOT, Stripe is
// the source of truth for what gets charged — every checkout resolves the price
// server-side by lookup_key). The FieldEditionBox reads this so the price chips
// and the JSON-LD Offer can never drift from the catalog or the buy button.
export const FIELD_EDITION = {
  primary: getCatalogItem("license_arena_field_edition")!,
  founding: getCatalogItem("license_arena_field_edition_founding")!,
  renewal: getCatalogItem("license_arena_field_edition_renewal")!,
  /** First-25 founding cap (count-boxed, not dated — enforced server-side in
   * create-checkout-session, which falls the 26th+ founding request back to the
   * standard price). Sourced from the shared catalog SSOT so display + gate agree. */
  foundingSeats: FOUNDING_SEATS,
  /** The kept-proven update window the price includes. */
  windowMonths: 12,
} as const;

// Orionfold Proof price family (display only; same SSOT/Stripe contract as
// FIELD_EDITION above). The ProofBox reads this so the price chips and the buy
// buttons can never drift from the catalog. Same 3-SKU shape + founding cap +
// 12-month window as Arena. (Relay ask orionfold-proof 2026-06-24.)
export const PROOF = {
  primary: getCatalogItem("license_orionfold_proof")!,
  founding: getCatalogItem("license_orionfold_proof_founding")!,
  renewal: getCatalogItem("license_orionfold_proof_renewal")!,
  foundingSeats: FOUNDING_SEATS,
  windowMonths: 12,
} as const;

export interface SponsorTierDisplay {
  tier: SponsorTier;
  lookupKey: string;
  name: string;
  /** cents/month (display only). */
  price: number;
  /** Short promise for the card header. */
  tagline: string;
  /** What you get, each line stands alone. Higher tiers say "Everything in X, plus:". */
  benefits: string[];
  /** Visually highlight one tier. */
  featured?: boolean;
  /** Roadmap badge a tier earns (gold/platinum only). */
  badge?: string;
}

// Benefit ladder (spec §2: priority-by-tier + recognition). Each tier builds on
// the one below. Gold and Platinum earn the per-item roadmap badge (spec §5).
export const SPONSOR_TIER_DISPLAY: SponsorTierDisplay[] = SPONSOR_TIERS.map((tier) => {
  const item = getCatalogItem(sponsorLookupKey(tier))!;
  const base = { tier, lookupKey: item.lookupKey, price: item.amount };
  switch (tier) {
    case "bronze":
      return {
        ...base,
        name: "Bronze",
        tagline: "Back the work",
        benefits: [
          "Your name on our supporters list",
          "A vote on what we build next",
          "A thank you in the build log",
        ],
      };
    case "silver":
      return {
        ...base,
        name: "Silver",
        tagline: "Get a say",
        benefits: [
          "Everything in Bronze, plus:",
          "Your requests join the priority line",
          "Early access to new versions",
        ],
      };
    case "gold":
      return {
        ...base,
        name: "Gold",
        tagline: "Move it up the list",
        featured: true,
        badge: "🥇 Gold sponsor",
        benefits: [
          "Everything in Silver, plus:",
          "High priority on your feature and fix requests",
          "A Gold badge on the roadmap item you back",
          "Access to Orionfold Discord server",
        ],
      };
    case "platinum":
      return {
        ...base,
        name: "Platinum",
        tagline: "Shape the roadmap",
        badge: "🏅 Platinum sponsor",
        benefits: [
          "Everything in Gold, plus:",
          "Top of the line, we work your requests first",
          "A Platinum badge on the roadmap item you back",
          "Access to Orionfold Discord server",
          "A direct line to us and a hand in the roadmap",
        ],
      };
  }
});
