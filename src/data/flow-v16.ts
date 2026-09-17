// Content synced 2026-09-06 from installed Flow 1.6 (1899).
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

export const FLOW_V16_SHOTS = { nightSettings, nightRunning, nightBriefing, nightReview, livingPortfolio, livingJobs, livingJobSearch, settingsPrivacy, settingsDocuments, settingsModels, settingsLibrary, settingsRouting, settingsEvidence };
export const FLOW_V16_TOURS = [
  { slug: 'living-documents', label: 'Living Documents', title: 'A document that keeps up.', description: 'Connect charts and tables to your files. Start with seven ready-to-use folders, then make the work your own.', image: livingJobSearch, alt: 'The Job Search living document draws a timeline from application data.' },
  { slug: 'night-shift', label: 'The Night Shift', title: 'Wake up to what changed.', description: 'Set the jobs and the hours. Come back to one Morning Briefing, with every overnight change yours to keep or revert.', image: nightSettings, alt: 'Night Shift controls for the schedule, catch-up on wake and automatic redraws.' },
  { slug: 'settings', label: 'Six focused Settings screens', title: 'Your Mac. Your choices.', description: 'See where AI runs, why a model was chosen and what leaves your Mac. Flow starts with a clear choice you can change.', image: settingsRouting, alt: 'Smart Routing names the chosen model and the rule that decided it.' },
] as const;
