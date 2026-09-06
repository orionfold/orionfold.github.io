# Deploy gate: one chain, three places

A push to `main` deploys orionfold.com from this public repository, so a push is a release. The deploy chain is defined once in `scripts/preflight.mjs` and runs in three places that cannot drift apart:

| Place | Command | What it proves |
| --- | --- | --- |
| GitHub Actions (`deploy.yml`) | `node scripts/preflight.mjs <step>` per step | The customer-visible build passed every step on the pushed commit. |
| Local, before a push | `npm run preflight` | The same steps, same order, same environment, on your clean checkout. Writes `output/preflight/stamp.json` keyed on the git tree hash and resolved public build settings. |
| `pre-push` hook (installed by `npm install` or `npm run hooks:install`) | `node scripts/preflight.mjs --gate <sha>` | A push to `main` carries proof: a green stamp for that exact tree and current public build settings, or an inline full run when the pushed commit is the clean working tree. |

The steps, in order:

1. `sweep` – the tree (and, on push, the pushed history) has no local-only paths, no key material, and no mailbox other than the public business contact.
2. `boundary` – the Flow release boundary. Locally this reads `FLOW_RELEASE_DECLARED` from the repository variable through `gh`, so the local verdict is the deploy's verdict.
3. `deno` – server and commerce contracts.
4. `build` – `astro build` with the production commercial state.
5. `node` – source and rendered-output contracts.
6. `e2e` – Playwright critical journeys against the built `dist/`, with `CI=1` so a stale local server is never reused.

`scripts/test/preflight.test.mjs` fails the moment the workflow's step list and `STEPS` disagree.

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
