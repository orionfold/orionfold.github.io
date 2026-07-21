import { CATALOG, type CatalogItem } from "./catalog.ts";
import { ORIONFOLD_LEGAL_IDENTITY } from "./legal-identity.ts";

export const CONSULTING_RATE_CENTS = 35_000;
export const CONSULTING_HOUR_CAPS = [10, 15, 20] as const;
export const CONSULTING_CATALOG_VERSION = "2026-07-20";
export const CONSULTING_TERMS_VERSION = "consulting-request-2026-07-20-r2";
export const CONSULTING_SAVINGS_FORMULA_VERSION = "domestic-card-2.9pct-plus-30c-2026-07";
export const CONSULTING_BINDING_STATUS = "non_binding_request" as const;

export type ConsultingHourCap = (typeof CONSULTING_HOUR_CAPS)[number];

export interface ConsultingOfferCopy {
  id: string;
  lookupKey: string;
  family: "Operate" | "Prove" | "Learn" | "Train";
  href: string;
  term: string;
  job: string;
  chooseWhen: string;
  contributes: string;
  worksWith: string;
  notFor: string;
  includes: string;
  freeBoundary?: string;
  workshop?: boolean;
}

export interface ConsultingOffer extends ConsultingOfferCopy {
  label: string;
  amountCents: number;
  mode: CatalogItem["mode"];
  kind: CatalogItem["kind"];
}

const OFFER_COPY: readonly ConsultingOfferCopy[] = [
  {
    id: "proof-founding",
    lookupKey: "license_orionfold_proof_founding",
    family: "Prove",
    href: "/proof/",
    term: "Founding license · 12-month kept-proven window",
    job: "Decide which model, setup, or workflow is worth trusting.",
    chooseWhen: "You need rerunnable evidence before standardizing an AI decision.",
    contributes: "A local Proof license and signed receipt workflow for repeatable comparisons.",
    worksWith: "Use its evidence to choose what Arena evaluates repeatedly and what Relay operates.",
    notFor: "Running recurring workflows or managing multiple customer environments.",
    includes: "Founding Proof license with a 12-month kept-proven update window.",
  },
  {
    id: "arena-founding",
    lookupKey: "license_arena_field_edition_founding",
    family: "Prove",
    href: "/arena/",
    term: "Founding Field Edition · 12-month kept-proven window",
    job: "Run, compare, score, and train local models in one evaluation cockpit.",
    chooseWhen: "Your team needs repeated local model operations, not a single decision receipt.",
    contributes: "A Field Edition license for a maintained local evaluation environment.",
    worksWith: "Arena generates operating evidence that Proof can receipt and Relay can use.",
    notFor: "Orchestrating client workflows, approvals, schedules, or hosted Cells.",
    includes: "Founding Arena Field Edition license for DGX Spark with 12 months of kept-proven updates.",
  },
  {
    id: "relay-founding",
    lookupKey: "license_orionfold_relay_founding",
    family: "Operate",
    href: "/relay/",
    term: "Founding premium-Pack license · 12-month update window",
    job: "Operate agent workflows with approvals, schedules, and visible client costs.",
    chooseWhen: "A recurring business process needs a controlled agent operating layer.",
    contributes: "A premium-Pack license for maintained Relay operating content.",
    worksWith: "Turns Proof and Arena model decisions into repeatable business work.",
    notFor: "Hosting isolated customer Cells or deciding which model is trustworthy.",
    includes: "Founding premium-Pack license with a 12-month update window.",
    freeBoundary: "The Relay engine is free and open. This line is for premium Packs, not the engine.",
  },
  {
    id: "relay-host-annual",
    lookupKey: "license_relay_host_annual",
    family: "Operate",
    href: "/relay/host/",
    term: "Annual right · one Host and up to ten customer-managed Cells",
    job: "Coordinate isolated Relay environments across multiple customers.",
    chooseWhen: "You deliver Relay to several customers and need one Host with separated Cells.",
    contributes: "An annual managed-fulfillment right for one Host and up to ten Cells.",
    worksWith: "Adds multi-customer delivery to Relay; premium Packs remain separate rights.",
    notFor: "A single local Relay installation or continuous Orionfold-operated hosting.",
    includes: "One annual Host right covering up to ten customer-managed Relay Cells.",
    freeBoundary: "Customers own their infrastructure. This is not a cloud bill or 24/7 managed service.",
  },
  {
    id: "book-ai-native-business",
    lookupKey: "book_ai_native_business",
    family: "Learn",
    href: "/books/ai-native-business/",
    term: "One-time digital book · PDF and EPUB",
    job: "Understand the operating model for an AI-native company.",
    chooseWhen: "The first need is a business blueprint, not implementation detail.",
    contributes: "A durable guide to roles, loops, economics, and operating choices.",
    worksWith: "Frames why Relay, Proof, Arena, and Host exist before implementation begins.",
    notFor: "API-level platform design or DGX Spark research depth.",
    includes: "AI Native Business in PDF and EPUB.",
  },
  {
    id: "book-ai-native-platform",
    lookupKey: "book_ai_native_platform",
    family: "Learn",
    href: "/books/ai-native-platform/",
    term: "One-time digital book · PDF and EPUB",
    job: "Understand the agent operating layer and its APIs.",
    chooseWhen: "An operator or technical owner needs the map behind Relay configuration and handoff.",
    contributes: "A technical guide to the platform, interfaces, and implementation boundaries.",
    worksWith: "Supports Relay design and makes consulting handoff easier to operate independently.",
    notFor: "General business-model orientation or hardware-specific local-AI research.",
    includes: "AI Native Platform in PDF and EPUB.",
  },
  {
    id: "book-ai-research-dgx-spark",
    lookupKey: "book_ai_research_dgx_spark",
    family: "Learn",
    href: "/books/ai-research-on-nvidia-dgx-spark/",
    term: "One-time digital book · PDF and EPUB",
    job: "Reproduce local-AI research on NVIDIA DGX Spark.",
    chooseWhen: "You need infrastructure, evaluation, and training depth on a local AI system.",
    contributes: "A reproducible research guide for local models and DGX Spark workflows.",
    worksWith: "Deepens the local model foundation used by Arena and evidenced by Proof.",
    notFor: "General business design or recurring agent workflow operations.",
    includes: "AI Research on NVIDIA DGX Spark in PDF and EPUB.",
  },
  {
    id: "workshop-relay-operator-founding",
    lookupKey: "workshop_relay_operator_founding",
    family: "Train",
    href: "/training/relay-operator-workshop/",
    term: "Founding workshop edition · individual access",
    job: "Build one bounded Relay operating capability through guided practice.",
    chooseWhen: "You want a retained artifact and structured instruction before or alongside consulting.",
    contributes: "Workshop access, lessons, workspace, and the edition's published support materials.",
    worksWith: "Prepares an operator to participate in Relay implementation and own the handoff.",
    notFor: "Custom implementation, open-ended support, or a substitute for a written engagement.",
    includes: "Relay Operator Workshop founding-edition access under its published refund terms.",
    workshop: true,
  },
] as const;

export function getConsultingOffers(publishedWorkshopKeys: readonly string[] = []): ConsultingOffer[] {
  const workshops = new Set(publishedWorkshopKeys);
  return OFFER_COPY
    .filter((offer) => !offer.workshop || workshops.has(offer.lookupKey))
    .map((offer) => {
      const item = CATALOG[offer.lookupKey];
      if (!item) throw new Error(`Consulting offer is missing from catalog: ${offer.lookupKey}`);
      return {
        ...offer,
        label: item.label,
        amountCents: item.amount,
        mode: item.mode,
        kind: item.kind,
      };
    });
}

export interface ProposalInput {
  consultingHours: number;
  selectedOfferIds: string[];
}

export interface ProposalLine {
  id: string;
  lookupKey: string;
  label: string;
  term: string;
  includes: string;
  reasonToChoose: string;
  amountCents: number;
  mode: CatalogItem["mode"] | "estimate";
  kind: CatalogItem["kind"] | "consulting";
}

export interface ProposalEstimateSnapshot {
  bindingStatus: typeof CONSULTING_BINDING_STATUS;
  catalogVersion: string;
  termsVersion: string;
  savingsFormulaVersion: string;
  consultingHours: ConsultingHourCap | 0;
  consultingRateCents: number;
  lines: ProposalLine[];
  listSubtotalCents: number;
  savingsCents: number;
  effectiveSavingsBasisPoints: number;
  estimatedFinalSubtotalCents: number;
  legalIdentity: typeof ORIONFOLD_LEGAL_IDENTITY;
}

export interface ProposalSnapshot extends ProposalEstimateSnapshot {
  consultingHours: ConsultingHourCap;
}

export function isConsultingHourCap(value: number): value is ConsultingHourCap {
  return CONSULTING_HOUR_CAPS.includes(value as ConsultingHourCap);
}

export function calculateBankTransferSavings(subtotalCents: number): number {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) return 0;
  return Math.min(subtotalCents, Math.round(subtotalCents * 0.029 + 30));
}

export function buildProposalEstimate(
  input: ProposalInput,
  publishedWorkshopKeys: readonly string[] = [],
): ProposalEstimateSnapshot {
  if (input.consultingHours !== 0 && !isConsultingHourCap(input.consultingHours)) {
    throw new Error("Choose a 10, 15, or 20 hour consulting cap.");
  }
  const selectedIds = Array.isArray(input.selectedOfferIds) ? input.selectedOfferIds : [];
  if (selectedIds.length !== new Set(selectedIds).size) {
    throw new Error("Duplicate product selections are not allowed.");
  }
  const offers = getConsultingOffers(publishedWorkshopKeys);
  const byId = new Map(offers.map((offer) => [offer.id, offer]));
  const productLines = selectedIds.map((id) => {
    const offer = byId.get(id);
    if (!offer) throw new Error(`This offer is unavailable or has changed: ${id}`);
    return {
      id: offer.id,
      lookupKey: offer.lookupKey,
      label: offer.label,
      term: offer.term,
      includes: offer.includes,
      reasonToChoose: offer.chooseWhen,
      amountCents: offer.amountCents,
      mode: offer.mode,
      kind: offer.kind,
    } satisfies ProposalLine;
  });
  const consultingLine: ProposalLine[] = input.consultingHours === 0 ? [] : [{
    id: `consulting-${input.consultingHours}-hour-cap`,
    lookupKey: "consulting_orionfold_founder_led",
    label: `Founder-led Orionfold consulting · ${input.consultingHours}-hour requested cap`,
    term: "$350/hour · remote · first 5 hours invoiced in advance; additional time invoiced monthly in arrears",
    includes: "Training, AI-native application guidance, and white-glove product deployment support within the written scope.",
    reasonToChoose: "Choose a cap that bounds the initial engagement. Five hours are invoiced in advance to begin; additional time worked is invoiced at month-end.",
    amountCents: input.consultingHours * CONSULTING_RATE_CENTS,
    mode: "estimate",
    kind: "consulting",
  }];
  const lines = [...productLines, ...consultingLine];
  const listSubtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const savingsCents = calculateBankTransferSavings(listSubtotalCents);
  return {
    bindingStatus: CONSULTING_BINDING_STATUS,
    catalogVersion: CONSULTING_CATALOG_VERSION,
    termsVersion: CONSULTING_TERMS_VERSION,
    savingsFormulaVersion: CONSULTING_SAVINGS_FORMULA_VERSION,
    consultingHours: input.consultingHours,
    consultingRateCents: CONSULTING_RATE_CENTS,
    lines,
    listSubtotalCents,
    savingsCents,
    effectiveSavingsBasisPoints: listSubtotalCents > 0
      ? Math.round((savingsCents / listSubtotalCents) * 10_000)
      : 0,
    estimatedFinalSubtotalCents: listSubtotalCents - savingsCents,
    legalIdentity: ORIONFOLD_LEGAL_IDENTITY,
  };
}

export function buildProposalSnapshot(
  input: ProposalInput,
  publishedWorkshopKeys: readonly string[] = [],
): ProposalSnapshot {
  if (!isConsultingHourCap(input.consultingHours)) {
    throw new Error("Choose a 10, 15, or 20 hour consulting cap.");
  }
  return buildProposalEstimate(input, publishedWorkshopKeys) as ProposalSnapshot;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatEffectiveSavings(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}
