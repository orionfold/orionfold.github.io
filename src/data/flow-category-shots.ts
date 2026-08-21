// One representative purpose-cut crop per Flow tour category. Shared by the
// /flow/ overview cards and each category page's hero (2026-08-20), so the
// cover a reader clicks on the overview is the picture that greets them on the
// page: the masterclass "thumbnail confirms the click" rule, applied to a
// product tour. Crops, not whole windows: a full capture at card width renders
// its controls at a few pixels tall.
import type { ImageMetadata } from 'astro';
import detailResult from '../assets/flow/details/detail-result.webp';
import detailRunCost from '../assets/flow/details/detail-run-cost.webp';
import detailRoutingRules from '../assets/flow/details/detail-routing-rules.webp';
import detailGrid from '../assets/flow/details/detail-grid.webp';

export const FLOW_CATEGORY_SHOTS: Record<string, { src: ImageMetadata; alt: string; caption: string }> = {
  'writing-with-ai': {
    src: detailResult,
    alt: 'The proposed document in Flow, scrolled to the corrected sentence with the change highlighted.',
    caption: 'The result leads, with the change marked · Nothing is saved until you approve it',
  },
  receipts: {
    src: detailRunCost,
    alt: 'The cost block of a Flow run card: recorded cost, model, provider, and where it ran.',
    caption: 'Cost as observed fact · The model, the provider, and where it ran',
  },
  'models-and-runtime': {
    src: detailRoutingRules,
    alt: 'The Smart Routing rule list: your rules, in order, deciding which model runs.',
    caption: 'Rules decide in order · The first one that matches applies',
  },
  'documents-and-files': {
    // The table grid, not the search column: the search crop is portrait and
    // balloons a landscape card and the category hero.
    src: detailGrid,
    alt: 'A Markdown table open in Flow\'s spreadsheet grid, one cell selected and named R5:C2 in the cell editor bar above it.',
    caption: 'Edit the cell, not the pipes · The file on disk stays plain Markdown',
  },
};
