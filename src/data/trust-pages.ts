// Trust pages data (2026-07-03). On-site versions of the Orionfold Relay trust
// docs that used to link straight to raw GitHub markdown. Source of truth =
// `~/orionfold/relay/docs/trust/*.md` (the Relay repo owns the canonical copy;
// re-sync here when those change — each page carries its lastUpdated). Voice:
// keep the technical specifics (they are the proof a security reviewer reads),
// but open every page with a plain-language summary. No em-dashes in the plain
// framing per website-copy-style; the technical bodies keep the precise terms
// (SLSA, Ed25519, SBOM) because vagueness there would gut the credibility.
//
// Rendered by src/components/trust/TrustPage.astro; routed by the thin files in
// src/pages/trust/. The GitHub repo + manav@orionfold.com links are allowed in
// tracked files (public-repo-boundary). NB: distinct from src/data/trust.ts,
// which is the product-detail HuggingFace stats dataset (unrelated).

export interface TrustTable {
  head: string[];
  rows: string[][];
}

export interface TrustSection {
  title: string;
  /** Optional lead paragraph shown in a slightly stronger weight. */
  lead?: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: TrustTable;
  /** Optional closing note, shown muted/italic. */
  note?: string;
}

export interface TrustPageData {
  slug: string;
  /** Eyebrow label + the homepage-trio phrasing this page backs. */
  eyebrow: string;
  title: string;
  /** One-line plain summary under the H1. */
  summary: string;
  /** The "short version" card, plain language. */
  shortVersion: string;
  lastUpdated: string;
  /** Order on the /trust/ hub. */
  order: number;
  sections: TrustSection[];
}

const REPO = 'https://github.com/orionfold/relay';

export const TRUST_PAGES: Record<string, TrustPageData> = {
  'data-flow': {
    slug: 'data-flow',
    eyebrow: 'Runs on your own machine',
    title: 'Data flow: what leaves your machine, and when',
    summary:
      'Relay runs on your own computer. This page lists every outbound network call the product can make, checked against the code, so nothing about what leaves your machine is a guess.',
    shortVersion:
      'A plain install with nothing configured makes exactly one kind of outbound call: a checksum-verified download of the server build from GitHub, once per version. Everything else only happens after you configure or click it. No telemetry, no analytics, no update check, no call to orionfold.com anywhere in the code.',
    lastUpdated: '2026-07-01',
    order: 1,
    sections: [
      {
        title: 'The short version',
        paragraphs: [
          'Relay is local-first: the engine, the database, your documents, and your license all live on your machine. But Relay runs AI agents, and agents call model APIs. So local-first needs a precise disclosure, not a slogan.',
          'For a plain install with nothing configured, Relay makes exactly one kind of outbound call: a checksum-verified download of the server build from GitHub Releases, once per version. Every other call in the product exists only downstream of something you explicitly configure or click. There is no telemetry, no analytics, no crash reporting, no update check, no license activation server, and no call to orionfold.com anywhere in the codebase.',
        ],
      },
      {
        title: 'Every outbound call, listed',
        lead: 'This is the complete inventory. Each row names when it fires, where it goes, what is sent, and how to turn it off.',
        table: {
          head: ['Call', 'When', 'Destination', 'What is sent', 'Off switch'],
          rows: [
            ['Server build download', 'First launch of each version', 'GitHub Releases', 'Nothing. A bare GET; the response is sha256-verified', 'A build-artifact URL setting (a mirror or file:// for air-gap)'],
            ['Model API calls', 'An agent run, chat, or scheduled workflow runs', 'Only providers you hold keys for: Anthropic, OpenAI, or local Ollama', 'Prompts, profile instructions, conversation history, attached document content in scope, tool results', 'Do not configure the key; route work to a local Ollama model for zero egress'],
            ['Server-side web search', 'An agent has web search or fetch tools granted', 'Executed provider-side (OpenAI or Anthropic)', 'The agent search queries or fetched URLs', 'Profile tool permissions; runtime choice'],
            ['License file fetch', 'You add a license from an http(s) URL', 'The fulfilment URL you pasted', 'Nothing. A bare GET', 'Pass a local file path instead; verification itself is always offline'],
            ['Channel delivery', 'Only for channels you created with your own tokens', 'Telegram, Slack, or your webhook URL', 'The message text you routed to that channel', 'Do not create the channel'],
            ['Optional agent tooling', 'Only if you enable the setting', 'Exa search or browser tool packages', 'Search queries; pages the agent browses', 'Search and browser tool settings, all default off'],
            ['GitHub imports', 'You click import and supply a repo URL', 'api.github.com, raw.githubusercontent.com', 'GETs for the repo you named', 'Do not use the import feature'],
            ['Pricing refresh', 'You click Refresh in Settings, Pricing', 'Public pricing pages (anthropic.com, openai.com)', 'Nothing. An informational GET', 'Manual only; never scheduled'],
            ['Plugin tooling', 'You install a plugin that ships its own tool server', 'Whatever that plugin calls', 'Whatever you pass it. Treat third-party plugins as code you run', 'Safe mode disables plugin tool servers'],
            ['Upstream git fetch', 'Hourly, only when the launch directory is a git clone (never for npm installs)', 'Your clone own origin remote', 'A standard git fetch; compares SHAs locally, uploads nothing', 'No .git directory means it never runs'],
          ],
        },
        note: 'npm itself contacts the npm registry to install the package. That is npm standard behavior before any Relay code runs, and it is covered by supply-chain verification.',
      },
      {
        title: 'What your agents send to model providers',
        paragraphs: [
          'The model-API row is the one that matters for client confidentiality, so here it is without hedging. When an agent runs, the provider receives the prompt, the agent profile instructions, the conversation so far, the content of documents and table rows placed in the agent context, and the results of tool calls the agent makes. That is inherent to using a hosted model. Relay adds no side channel, but it does not shrink what a model API call is either.',
        ],
        bullets: [
          'Provider choice per task, per schedule, per workflow step, including routing sensitive work to a local Ollama model where nothing leaves localhost.',
          'Tool permissions per profile. A profile with no web tools cannot send context to arbitrary URLs.',
          'Document scoping per project. Agents see the documents scoped to their project, not your whole disk.',
          'Your keys, your agreements. Relay calls providers under your accounts, so your existing terms govern. There is no Orionfold intermediary in the path.',
        ],
      },
      {
        title: 'What never happens',
        bullets: [
          'No telemetry, analytics, or crash reporting. The in-app telemetry and analytics pages read your local database only.',
          'No update checks or self-updating. Versions change only when you install a new one.',
          'No license data ever sent to Orionfold. Verification is an offline signature check that works air-gapped, forever.',
          'No calls to orionfold.com, ever, for any reason.',
        ],
      },
    ],
  },

  continuity: {
    slug: 'continuity',
    eyebrow: 'You own it forever',
    title: 'Continuity: what happens if Orionfold disappears',
    summary:
      'Vendor risk is a fair question to ask of a small company. Relay answers it in the architecture, not a contract: our disappearance cannot take your workflows, your data, or your purchased content with it.',
    shortVersion:
      'The engine is open source, your data is a local file you already hold, and your license verifies offline forever. What you would lose if Orionfold wound down: future pack updates and support. What you keep: everything you have.',
    lastUpdated: '2026-07-01',
    order: 2,
    sections: [
      {
        title: 'The four guarantees',
        lead: 'Relay is built so that our disappearance cannot take your work with it. Four properties make that real.',
        bullets: [
          'The engine is Apache-2.0. The complete application, from orchestration to governance to the UI and CLI, is open source in the Relay repository. You can fork it, patch it, and run it indefinitely under the same license, with no copyleft obligations on your side.',
          'Your data is a local SQLite file you already possess. Relay has no cloud backend. Projects, tasks, workflows, documents, usage ledgers, everything lives in a SQLite database in your data directory, in an open format any SQLite client can read. There is nothing to export and no one to request it from, because it never left your machine.',
          'Licenses verify offline, forever. License verification is an Ed25519 signature check against public keys embedded in the open-source code. No activation server exists, so no activation server can be shut down. Installed premium packs never re-lock.',
          'Installed versions keep working. Nothing in Relay checks for updates, sends your data to Orionfold, or depends on an Orionfold service at runtime. A version you installed and run today runs the same on the day our domain lapses.',
        ],
      },
      {
        title: 'The honest edge cases',
        paragraphs: [
          'A trust page that only lists the good parts is not trustworthy. Here are the real edges.',
        ],
        bullets: [
          'First run of a new install downloads a prebuilt server artifact from the repo GitHub Releases. If GitHub or the repo vanished, the npm package still contains the full source, so any install can build and run from source, and a build-artifact URL setting points installs at your own mirror. Published npm versions stay installable regardless: npm blocks removal of established versions, and your lockfile plus a registry mirror close the rest of that gap if your policy requires it.',
          'Model providers are your relationship, not ours. Relay runs agents against API keys you hold (Anthropic, OpenAI, or a local Ollama model at zero external dependency). Our continuity has no bearing on those.',
          'What you would actually lose if Orionfold wound down: future pack updates, new releases, and support. What you keep: everything you have.',
        ],
      },
    ],
  },

  'supply-chain': {
    slug: 'supply-chain',
    eyebrow: 'Verify every call yourself',
    title: 'Supply-chain verification',
    summary:
      'How to verify that the Relay you install is exactly what the repository CI built, before you run it. Everything here is checkable from your side with standard npm and GitHub tools. None of it asks you to trust a claim we make.',
    shortVersion:
      'Publishing happens only through npm trusted publishing from a committed workflow, with no tokens to steal. Every release carries a provenance attestation and an SBOM you can audit, and the server build is checksum-verified before it runs. Versions are pinnable and never self-update.',
    lastUpdated: '2026-07-01',
    order: 3,
    sections: [
      {
        title: 'What ships, and from where',
        table: {
          head: ['Artifact', 'Channel', 'Integrity mechanism'],
          rows: [
            ['npm package (CLI + app source)', 'registry.npmjs.org', 'npm provenance attestation (SLSA v1), registry signatures'],
            ['Production server build', 'GitHub Release asset', 'SHA-256 sidecar, verified by the CLI before extraction'],
            ['CycloneDX SBOM', 'GitHub Release asset', 'Attached by the same gated publish workflow'],
          ],
        },
      },
      {
        title: 'Provenance: built from this repo, by CI, with no tokens',
        paragraphs: [
          'Publishing happens only through npm Trusted Publishing (OIDC) from the committed publish workflow, triggered by a version tag. There is no npm token anywhere, not in CI secrets, not on a maintainer laptop, so there is no token to steal. npm generates a SLSA v1 provenance attestation for every publish, binding the tarball to the exact repo, commit, and workflow run that produced it.',
          'Verify it yourself, in a project that has orionfold-relay installed: run npm audit signatures and look for verified registry signatures or attestations. Or inspect the attestation directly with npm view orionfold-relay dist.attestations, no install needed. The npm package page also renders the green "Built and signed on GitHub Actions" provenance badge with a link to the workflow run.',
        ],
      },
      {
        title: 'SBOM: audit the dependency tree without installing it',
        paragraphs: [
          'Every release from version 0.20.0 onward attaches a CycloneDX SBOM of the production dependency tree (dev dependencies omitted) as a GitHub Release asset. It is generated by npm sbom inside the publish workflow, from the same committed lockfile the published package was built and tested against, so what the SBOM says is what the install resolves. Feed it to your scanner of choice (Dependency-Track, Grype, osv-scanner).',
        ],
      },
      {
        title: 'The build artifact is checksum-verified before use',
        paragraphs: [
          'The npm package is deliberately small: a size guard in the publish workflow fails the release if it exceeds 10 MB. On first launch of a version, the CLI downloads the prebuilt server build for that exact version from the GitHub Release and verifies it against its sha256 sidecar before extracting. A mismatch aborts loudly. Verified downloads are cached per version. For air-gapped installs, a build-artifact URL setting accepts a file:// or mirror URL to an artifact you fetched out of band, and the sha256 sidecar is still required next to it and still verified.',
        ],
      },
      {
        title: 'Pinning a version',
        paragraphs: [
          'Nothing in Relay self-updates. To stay on an evaluated version, install or run that exact version (for example orionfold-relay@0.19.0). Two properties make the pin meaningful.',
        ],
        bullets: [
          'The version you pin is the version that runs. The build artifact is fetched by exact version and checksum-verified. There is no latest channel, no auto-upgrade, no update check.',
          'The stack under it is pinned too. The framework is pinned to an exact version in package.json, not a range, and releases are built and smoke-tested from the committed lockfile.',
        ],
        note: 'Upgrades are always an explicit act on your side: install the new version, and re-verify provenance and SBOM if your process requires it.',
      },
      {
        title: 'Release gating: what must pass before anything publishes',
        paragraphs: [
          'The publish workflow refuses to release unless, in order: the tag matches package.json; the CLI builds; the licensing test suite passes; the tarball size guard passes; the production build compiles; and a full customer simulation succeeds, which packs the tarball, installs it into a clean directory, runs the first-launch artifact download, serves the app, and exercises the free-to-licensed journey against a real signed license. A failure at any step means no publish.',
        ],
      },
    ],
  },

  'license-terms': {
    slug: 'license-terms',
    eyebrow: 'License terms, in plain language',
    title: 'License terms, in plain language',
    summary:
      'What buying a premium pack license actually gets you, in the words we intend them. The engine is free and open. A license only unlocks premium packs: maintained content installed on top.',
    shortVersion:
      'A license is a small signed file you keep, verified offline. It unlocks premium packs and keeps them current. Installed packs never re-lock, not at expiry, not ever. What is free stays free.',
    lastUpdated: '2026-07-01',
    order: 4,
    sections: [
      {
        title: 'What a license is',
        lead: 'The engine is not licensed. It is free. Everything that makes Relay run is Apache-2.0 open source. A license only unlocks premium packs.',
        paragraphs: [
          'A license is a small signed file, a payload and signature JSON envelope, issued to you at purchase and attached to your fulfilment email. Relay verifies it entirely offline with an Ed25519 signature check against public keys embedded in the open-source verifier. There is no activation server and no periodic re-validation. Relay never sends your data to Orionfold. Keep the file. It is the durable proof of purchase: the download link in the email expires, the file never does.',
        ],
      },
      {
        title: 'The term: what expiry does, and does not, do',
        paragraphs: [
          'Your license names an expiry date. Expiry gates new premium installs and pack updates only.',
        ],
        bullets: [
          'Installed packs never re-lock. Not at expiry, not if you remove the license, not ever. Your packs are yours forever.',
          'Renewal buys forward motion: the year new and updated packs plus priority support.',
          'Removing a license forgets the file. Everything already installed keeps working.',
        ],
        note: 'There is no mechanism in the codebase that can disable installed content. The license check happens at pack install time and nowhere else. This is shipped behavior, not just policy.',
      },
      {
        title: 'Seats: defined by trust, audited by you',
        paragraphs: [
          'A seat is one person in your organization who uses premium packs. Your license records how many seats you bought.',
          'We deliberately do not enforce seats technically. No device counting, no user registry, no lockouts. The verifier checks the signature, the term, and the product entitlement. The seat count is your side of the deal. The license status command is the self-audit surface: it shows what you are licensed for so your admin can check compliance locally, without asking us and without Relay telling us.',
        ],
      },
      {
        title: 'Transfer and machines',
        paragraphs: [
          'The license file is portable. Redeem it on a new machine any time. Moving between machines, reinstalling, or running air-gapped are all fine within your seat count. Transferring a license to a different organization requires reissue: email manav@orionfold.com.',
        ],
      },
      {
        title: 'The boundary will not move under you',
        paragraphs: [
          'What is free stays free. Capabilities never migrate from the free engine into paid packs. Paid packs are new content, not repossessed features. The things we have ruled out permanently: license state in the database, upsell banners in the CLI, online re-validation, and expiry that disables installed packs.',
        ],
        note: 'This page states intent in plain language and links the enforcing code. If a storefront page and this page ever disagree, tell us. The stricter reading in your favor applies while we fix it.',
      },
    ],
  },

  'security-packet': {
    slug: 'security-packet',
    eyebrow: 'Security packet',
    title: 'Security packet',
    summary:
      'A concise security overview for evaluators, written to be handed to a security review as-is. Every claim links to the code or document that backs it.',
    shortVersion:
      'Relay is a locally-installed app, not a SaaS. It hosts no customer data because there is no endpoint to receive it. AI processing runs under your own provider accounts. For product usage there is no data processing agreement to sign, because we process nothing.',
    lastUpdated: '2026-07-01',
    order: 5,
    sections: [
      {
        title: 'What Relay is, structurally',
        paragraphs: [
          'Orionfold Relay is a locally-installed application, not a SaaS. It installs from npm, runs a server bound to 127.0.0.1 on the operator machine, and stores all state in a local SQLite database. The engine is open source (Apache-2.0). The commercial product is premium content packs, unlocked by a signed license file verified offline.',
          'There is no Orionfold cloud, no Orionfold account, and no server-side component operated by us in the product runtime path.',
        ],
      },
      {
        title: 'We host no customer data',
        lead: 'This is the load-bearing claim, so here is its basis.',
        bullets: [
          'All application state is local. Projects, tasks, documents, workflow runs, usage and cost ledgers, chat history, settings, and licenses live in a SQLite file in the operator data directory. Nothing is synced, mirrored, or backed up to us. There is no endpoint to receive it.',
          'No telemetry or analytics exists in the codebase. The in-app telemetry and analytics surfaces read the local database only.',
          'AI processing happens under your provider accounts. When agents run, prompts and in-scope document content go directly from your machine to the model provider you configured. Orionfold is not in that path and cannot see it.',
          'What we do hold: purchase records only, the billing details you give Stripe at checkout and the email a license was issued to. That data exists on the storefront side, never in the product.',
        ],
        note: 'Consequence for your compliance review: for product usage there is no data processing agreement to sign with us, because we process nothing. Your existing terms with your chosen model providers govern the AI data flow.',
      },
      {
        title: 'Subprocessors',
        paragraphs: [
          'In the conventional SaaS sense, none. There is no service of ours processing your data. The third parties in the picture are all under your control or your contract.',
        ],
        table: {
          head: ['Party', 'Role', 'Data', 'Chosen by'],
          rows: [
            ['Anthropic / OpenAI', 'Model APIs your agents call', 'Prompts, in-scope document content, tool results', 'You (per task, step, schedule)'],
            ['Ollama (local)', 'Optional local model runtime', 'Never leaves your machine', 'You'],
            ['GitHub', 'Hosts the repo and releases', 'Serves downloads; receives nothing about you but a GET', 'Us (distribution)'],
            ['npm registry', 'Package distribution', 'Standard npm install traffic', 'Us (distribution)'],
            ['Stripe', 'Payment processing at purchase', 'Billing details, at checkout only', 'Us (storefront)'],
          ],
        },
      },
      {
        title: 'Application security posture',
        bullets: [
          'Deployment surface: binds to 127.0.0.1 by default. Exposing it on a LAN requires an explicit hostname flag, which prints a warning. Relay is a single-operator cockpit; treat network exposure as you would any internal tool.',
          'Agent governance is built in, not bolted on: per-profile tool permissions (an agent without web tools cannot reach arbitrary URLs), human-approval checkpoints for client-facing output, and a full audit trail of agent actions.',
          'Plugin containment: third-party plugins can ship tool servers, which are subprocesses, so treat plugin installation as running code. Safe mode disables plugin tool servers, and plugin content is schema-validated on load.',
          'Failure visibility as an engineering rule: the standing principles are zero silent failures and named error types. The license verifier, artifact downloads, and install paths all fail loudly with typed errors.',
        ],
      },
      {
        title: 'Supply-chain integrity (summary)',
        paragraphs: [
          'Full detail is on the supply-chain page.',
        ],
        bullets: [
          'npm publishes happen only through OIDC trusted publishing from a committed workflow. No npm tokens exist to leak. Every release carries a SLSA v1 provenance attestation you verify with npm audit signatures.',
          'A CycloneDX SBOM of the production dependency tree is attached to every GitHub Release.',
          'The server build downloads once per version from GitHub Releases and is sha256-verified before extraction. A mismatch aborts.',
          'Versions are pinnable and never self-update.',
        ],
      },
      {
        title: 'Licensing privacy',
        paragraphs: [
          'License verification is an offline Ed25519 signature check against public keys embedded in the open-source verifier. No activation, no re-validation, no data ever sent to Orionfold. It works air-gapped. Expiry never disables installed content.',
        ],
      },
      {
        title: 'Vulnerability disclosure',
        paragraphs: [
          'Report vulnerabilities privately via GitHub security advisory form on the Relay repository. Please do not open public issues for security reports. You will get an acknowledgment within 72 hours. Confirmed issues ship as ordinary versioned releases with changelog disclosure.',
        ],
      },
      {
        title: 'Business continuity',
        paragraphs: [
          'The continuity argument is architectural: an Apache-2.0 engine, local data, and offline licenses mean our disappearance cannot take your deployment down. Read the specifics, including the honest edge cases, on the continuity page.',
        ],
      },
    ],
  },
};

/** The repo the deeper "check the code" links point at. */
export const RELAY_REPO = REPO;

/** Pages in hub display order. */
export const trustPagesInOrder = (): TrustPageData[] =>
  Object.values(TRUST_PAGES).sort((a, b) => a.order - b.order);
