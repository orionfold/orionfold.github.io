// The Paper cast: what each Fold's person says, the playbook it becomes, and
// the one moment the roster shows. Ported verbatim from the town-study
// prototype (operator 2026-10-30). This is PROTOTYPE copy: the live home uses
// it only after the operator's copy call at the R2 preview (decision D4).
// Sample clients come only from each blueprint's mock.client; never invent one.
import type { FoldId } from './folds';

export interface Play {
  area: string;
  who: string;
  client: string;
  title: string;
  said: string;
  steps: [string, string, string];
  run: string;
}

export const PLAY: Record<FoldId, Play> = {
  orri: { area: 'AI Consulting', who: 'AI consultant', client: '', title: 'Pick the AI project', said: 'Before any AI build, I write the press release first. If no customer would care, we stop right there.', steps: ['Write the launch press release', 'Answer the hard customer questions', 'Stop if no customer would care'], run: 'write the press release first, for every client' },
  tally: { area: 'Accounting Advisory', who: 'Accounting advisor', client: 'Juniper Bakery', title: 'Month-end close', said: 'I explain every change over 5 percent. If cash and profit tell different stories, I call the client first.', steps: ['Pull the month’s numbers', 'Explain every change over 5 percent', 'Call the client if cash and profit disagree'], run: 'write Juniper Bakery’s March close note your way' },
  ember: { area: 'Content Strategy', who: 'Content strategist', client: 'Larkspur Fastening', title: 'Voice check', said: 'Every post gets checked against the client’s voice guide. If a line makes a promise, I check it with them.', steps: ['Read the draft', 'Mark lines that drift from the guide', 'Check any line that makes a promise'], run: 'check Larkspur Fastening’s posts against their guide' },
  clause: { area: 'Contract Review', who: 'Contract lawyer', client: 'Larkspur Robotics', title: 'First read', said: 'I read liability, payment and ownership first. If the cap is lower than the fees, the client hears from me.', steps: ['Find liability, payment and ownership', 'Compare each one to our fallback', 'Flag a cap lower than the fees'], run: 'mark the risky clauses in the Larkspur Robotics MSA' },
  shell: { area: 'Cybersecurity Advisory', who: 'Security advisor', client: 'Lanternfield Dental', title: 'Quarterly risk review', said: 'Each quarter I score every risk again. If a new threat touches patient data, the owner hears that week.', steps: ['Add the new threats', 'Score every risk again', 'Send patient-data risks to the owner'], run: 'update Lanternfield Dental’s risk register each quarter' },
  sprout: { area: 'Executive Coaching', who: 'Executive coach', client: 'Halvard Lantern', title: 'Session notes', said: 'After each session I write what we covered and what they promised. If they miss a promise twice, we talk about why.', steps: ['Write what we covered', 'List what they promised to do', 'Raise any promise missed twice'], run: 'sum up each Halvard Lantern session this way' },
  atlas: { area: 'Research Synthesis', who: 'Research consultant', client: 'Northgate Grocers', title: 'Interview themes', said: 'I group quotes into themes. If two people use the same word but mean different things, I split it.', steps: ['Tag each quote with its interview', 'Group the quotes into themes', 'Split a word that means two things'], run: 'find the themes in the Northgate Grocers interviews' },
  hop: { area: 'Learning Design', who: 'Trainer', client: 'Harbor Lane Clinic', title: 'Lesson check', said: 'I ask learners to say the idea in their own words. If they only repeat mine, we try a new example.', steps: ['Ask for the idea in their own words', 'Compare it to the worked example', 'Try a new example if they echo it'], run: 'check each Harbor Lane Clinic answer this way' },
};

/** One feeling and one moment per Fold, for the roster. */
export const MOMENT: Record<FoldId, [string, string]> = {
  orri: ['Thinking', 'Orri drafted the PR/FAQ three ways. Which one sounds most like you?'],
  tally: ['Amazed', 'Juniper Bakery’s March close note was ready to review before lunch.'],
  clause: ['Surprised', 'Clause found the liability cap on page 31 of the Larkspur Robotics MSA.'],
  ember: ['Curious', 'Ember marked two Larkspur Fastening posts that drift from the voice guide.'],
  shell: ['Aha', 'Shell mapped Lanternfield Dental’s new policy straight to the method.'],
  sprout: ['Wonder', 'Sprout turned the Halvard Lantern intake into a plan on one page.'],
  atlas: ['Focused', 'Atlas tagged every Northgate Grocers quote with its interview.'],
  hop: ['Proud', 'Hop found the Harbor Lane Clinic learners who only repeated the words.'],
};

/** Every public face is an AI-generated model; this line ships wherever one does. */
export const FACES_LABEL = 'People shown are AI-generated models, not customers.';

/**
 * The home hero (operator 2026-10-31): each Fold's person states how they
 * work and asks for one thing, the Fold answers, and a document follows that
 * shows one Flow feature doing the work: Playbooks, a Living Document's Jobs,
 * search by meaning, Smart Routing to a local model, the Night Shift,
 * Elements, a hosted model with its receipt, and a Flow Path. Rows 1 and 2
 * name the feature; row 3 is always the person's call. Feature wording
 * follows the shipped capability copy in src/data/flow-pricing.ts and the
 * /flow/ feature pages; never claim a feature Flow does not have.
 */
export interface HeroBeat {
  said: string;
  reply: string;
  file: string;
  title: string;
  rows: [[string, string], [string, string], string];
  note: string;
}

export const HERO: Record<FoldId, HeroBeat> = {
  orri: {
    said: 'Before any AI build, I write the press release first. If no customer would care, we stop. Make that my playbook.',
    reply: 'Got it. That’s your playbook now. I’ll run it for every new client and bring the go or stop call back to you.',
    file: 'playbook.md', title: 'Pick the AI project',
    rows: [['Write the launch press release', 'Playbook step'], ['Answer the hard customer questions', 'Playbook step'], 'Stop if no customer would care'],
    note: 'Your method, saved once. Every client gets it.',
  },
  tally: {
    said: 'Each month I pull the bank and sales files, then explain every change over 5 percent. Keep the close note up to date.',
    reply: 'Got it. I gave the close note a job. It collects the new files, refreshes the table and the cash chart, and marks what moved.',
    file: 'march-close.md', title: 'Month-end close',
    rows: [['Collect the bank and sales files', 'Job · Collect data'], ['Refresh the table and the cash chart', 'Living Document'], 'Call the client if cash and profit disagree'],
    note: 'The note keeps itself current. You make the call.',
  },
  ember: {
    said: 'Every post gets checked against the client’s voice guide. Find any old post that makes the same promise as this one.',
    reply: 'Got it. I searched by meaning, not just matching words. Three old posts make that same promise, so I marked them for you.',
    file: 'voice-check.md', title: 'Voice check',
    rows: [['Find old posts that promise the same thing', 'Search by meaning'], ['Mark lines that drift from the guide', 'Voice check'], 'Check each repeated promise with the client'],
    note: 'Found by meaning, across every folder you opened.',
  },
  clause: {
    said: 'Client contracts never leave my Mac. Read liability, payment and ownership first, and tell me if the cap is lower than the fees.',
    reply: 'Got it. Smart Routing sent this contract to a model on your Mac, and the screen names the rule that decided. Nothing went to the cloud.',
    file: 'msa-first-read.md', title: 'First read',
    rows: [['The rule “contracts stay local” picks the model', 'Smart Routing'], ['Read liability, payment and ownership', 'Local model'], 'Flag the cap if it is lower than the fees'],
    note: 'Your rule picked a model that runs on your Mac.',
  },
  shell: {
    said: 'When a new threat touches patient data, the owner hears that week. Watch the security advisories for me overnight.',
    reply: 'Got it. The Night Shift watches those pages while you sleep. By breakfast the risk register is scored again and your Morning Briefing is ready.',
    file: 'risk-register.md', title: 'Risk register',
    rows: [['Watch the advisory pages overnight', 'Night Shift · Watch sources'], ['Score the risks again and write the Morning Briefing', 'Night Shift'], 'Keep or revert each overnight change'],
    note: 'Changed overnight on your Mac. Nothing stays until you keep it.',
  },
  sprout: {
    said: 'After each session I list what they promised. If they miss one twice, we talk about why. Show me the pattern.',
    reply: 'Got it. I drew a promise tracker into your notes, with a chart of promises kept each month. It is a real table you can edit.',
    file: 'session-notes.md', title: 'Session notes',
    rows: [['Draw a table of every promise', 'Element · Table'], ['Chart the promises kept each month', 'Element · Chart'], 'Raise any promise missed twice'],
    note: 'Tables and charts drawn right into the page.',
  },
  atlas: {
    said: 'I group interview quotes into themes. If two people use one word to mean two things, I split it. Use the big model for this one.',
    reply: 'Got it. This run uses a hosted model on your own key. When you approve, a receipt keeps what ran, where it ran and what it cost.',
    file: 'interview-themes.md', title: 'Interview themes',
    rows: [['Group the quotes into themes', 'Hosted model · Your key'], ['Keep a receipt when you approve', 'Receipt'], 'Split a word that means two things'],
    note: 'The cloud only when you choose it. A receipt every time.',
  },
  hop: {
    said: 'I ask learners to say the idea in their own words. If they only repeat mine, we try a new example. Where do I start?',
    reply: 'Got it. I started you on a Flow Path. It walks a real job end to end with example files, then takes your own work.',
    file: 'lesson-check.md', title: 'Lesson check',
    rows: [['Start from the checklist Path', 'Flow Path'], ['Compare each answer to the worked example', 'Lesson check'], 'Try a new example if they echo it'],
    note: 'Walk the example first. Then it is yours.',
  },
};
