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
