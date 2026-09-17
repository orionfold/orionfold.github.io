// Current tour copy synced 2026-09-17 from released Flow 1.7 (2173).
// V16 export names remain for existing callers; the historical shot set is
// preserved separately from the current tour images and their captions.
// Source briefs: docs/night-shift/night-shift.md,
// docs/living-documents/living-documents.md and docs/settings/settings.md.
// Product-shot provenance and native crop geometry: flow-shot-sources.json.
import nightSettings from '../assets/flow/shots/v16-night-settings.webp';
import nightRunning from '../assets/flow/shots/v16-night-running.webp';
import nightBriefing from '../assets/flow/shots/v16-night-briefing.webp';
import nightReview from '../assets/flow/shots/v16-night-review.webp';
import livingPortfolio from '../assets/flow/shots/v16-living-portfolio.webp';
import livingJobs from '../assets/flow/shots/v16-living-jobs.webp';
import livingJobSearch from '../assets/flow/shots/v16-living-job-search.webp';
import settingsPrivacy from '../assets/flow/shots/v16-settings-privacy.webp';
import settingsDocuments from '../assets/flow/shots/v16-settings-documents.webp';
import settingsModels from '../assets/flow/shots/v16-settings-models.webp';
import settingsLibrary from '../assets/flow/shots/v16-settings-library.webp';
import settingsRouting from '../assets/flow/shots/v16-settings-routing.webp';
import settingsEvidence from '../assets/flow/shots/v16-settings-evidence.webp';
import jobsMap from '../assets/flow/shots/v17-jobs-map.webp';
import reviewChart from '../assets/flow/shots/v17-review-selected-chart.webp';
import modelsWorkbench from '../assets/flow/shots/v17-settings-models.webp';

export const FLOW_V16_SHOTS = { nightSettings, nightRunning, nightBriefing, nightReview, livingPortfolio, livingJobs, livingJobSearch, settingsPrivacy, settingsDocuments, settingsModels, settingsLibrary, settingsRouting, settingsEvidence };
export const FLOW_V17_SHOTS = { jobsMap, reviewChart, modelsWorkbench };
export const FLOW_V16_TOURS = [
  { slug: 'living-documents', label: 'Living Documents', title: 'A document that keeps up.', description: 'Start with 24 Living Documents. Inspect their Jobs, connect data to charts and tables, and review the work in files you own.', image: jobsMap, alt: 'Flow 1.7 shows a document beside the Jobs Workbench and its declared inputs and outputs.', caption: 'Flow 1.7 (2173) · Jobs in the Workbench · Illustrative portfolio example' },
  { slug: 'night-shift', label: 'The Night Shift', title: 'Wake up to what changed.', description: 'Set the jobs and the hours. Return to a Morning Briefing and marked changes. Keep a change, revert that part, or decide later.', image: reviewChart, alt: 'Flow 1.7 highlights a selected chart beside its applied-change review.', caption: 'Flow 1.7 (2173) · Review Changes · Illustrative portfolio data' },
  { slug: 'settings', label: 'Settings', title: 'Your Mac. Your choices.', description: 'Keep Settings beside your document. Inspect models, storage and measurements, and choose what can leave your Mac.', image: modelsWorkbench, alt: 'Flow 1.7 Models settings in the Workbench, with separate document and Night Shift model picks.', caption: 'Flow 1.7 (2173) · Models in the Workbench · This Mac’s configuration' },
] as const;
