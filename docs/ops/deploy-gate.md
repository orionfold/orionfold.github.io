# Deploy gate: one chain, three places

A push to `main` deploys orionfold.com from this public repository, so a push is a release. The deploy chain is defined once in `scripts/preflight.mjs` and runs in three places that cannot drift apart:

| Place | Command | What it proves |
| --- | --- | --- |
| GitHub Actions (`deploy.yml`) | `node scripts/preflight.mjs <step>` per step, in two lanes | The build job runs the gate steps on the pushed commit and captures the Pages artifact; the deploy ships it. The journeys job runs the signal step on that exact artifact beside the deploy. |
| Local, before a push | `npm run preflight` | The same steps, same order, same environment, on your clean checkout. Writes `output/preflight/stamp.json` keyed on the git tree hash and resolved public build settings. |
| `pre-push` hook (installed by `npm install` or `npm run hooks:install`) | `node scripts/preflight.mjs --gate <sha>` | A push to `main` carries proof: a green stamp for that exact tree and current public build settings, or an inline full run when the pushed commit is the clean working tree. |

The steps, in order:

1. `sweep` – the tree (and, on push, the pushed history) has no local-only paths, no key material, and no mailbox other than the public business contact.
2. `boundary` – the Flow release boundary. Locally this reads `FLOW_RELEASE_DECLARED` from the repository variable through `gh`, so the local verdict is the deploy's verdict.
3. `deno` – server and commerce contracts.
4. `build` – `astro build` with the production commercial state.
5. `node` – source and rendered-output contracts.
6. `e2e` – Playwright critical journeys against the built `dist/`, with `CI=1` so a stale local server is never reused.

Each step names its CI lane in `STEPS` (`ci: 'gate'` or `ci: 'signal'`). `scripts/test/preflight.test.mjs` fails the moment the workflow's jobs, their `needs`, and their step lists disagree with `STEPS`.

## Two lanes in CI, one chain locally (G-136, 2026-10-28)

Steps 1 to 5 are the gate lane. They run in the `build` job, in order, and the Pages artifact is captured only after the last of them. The `deploy` job needs `build` and nothing else.

Step 6, the browser journeys, is the signal lane. It runs in the `journeys` job, which also needs only `build`, so it starts beside the deploy rather than ahead of it. The job installs Chromium, downloads the `github-pages` artifact the deploy ships, unpacks it as `dist/`, and runs `node scripts/preflight.mjs e2e` on those exact bytes. There is no second build. A red journey fails the run, marks the commit on GitHub, and ships its traces and screenshots with the run.

Why the deploy does not wait: every push to `main` already carries a green stamp or an inline run of all six steps on the same tree, so the journeys in CI are a second run of the same check on the same bytes. Before the split, a warm deploy spent 69 of the build job's 159 seconds on them plus 21 seconds installing Chromium; the deploy then took another 21 seconds. The split takes the journeys and the browser install off the path from push to live.

What does not change: locally `npm run preflight` runs all six steps and the stamp needs all six; the pre-push hook still refuses a push without them. The provenance manifest captured in the build job records the gate checks (`RELEASE_CHECKS`), never a journey that is still running, and recovery verification accepts an older manifest that listed all six. The Pages gate, the `pages` concurrency group, and the Cloudflare purge are untouched. One side effect: the run is complete only when the journeys finish, so a push that arrives within about a minute of the previous one waits a little longer for the group lock.

## Why

On 2026-08-27 three consecutive deploys failed at three different steps. Each push had been verified with a hand-picked subset of the chain, and CI was the first place the whole sequence ran. A written rule ("run the full regression before any push") was forgotten within twenty minutes. The gate replaces the rule with a check that cannot be skipped by forgetting.

## Everyday use

- Edit, review the publication scope, commit, then `npm run preflight`. A matching green stamp lets `git push` reuse the completed checks after it verifies the current repository flags.
- If you push without running it, the hook runs the chain for you (a few minutes) and only then pushes.
- A prior green deployment does not prove today's build configuration. Source recovery uses the same full check path; it does not bypass the gate or require a force push.
- There is no skip switch. `git push --no-verify` is git's own escape hatch and is reserved for the operator.

## Build configuration is part of the proof

Every preflight entry point pins production service mode and the existing workshop checkout state. Local preflight reads the repository variables `PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED` and `PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED` through authenticated `gh`; Actions uses those same workflow variables. An absent flag is false. An unavailable lookup or a value other than the exact strings `true` and `false` refuses the check. Local shell values cannot replace the production flags.

Activate a frontend flag only after its production dependency and acceptance evidence are ready. Set the repository flags before the final clean-tree preflight. Version2 stamps record all four public build settings. An older stamp, a changed flag, a dirty run or a partial check cannot authorize a push. The inline pre-push run checks the flags again when its full chain finishes.

Dirty-tree preflight is useful during development, but its stamp cannot authorize publication. A release still needs the reviewed committed tree, the full six-step check, a sweep of the entire unpushed range, and the protected Pages deployment approval. Inspect the retained site and recovery artifacts before approving the migration deployment.
