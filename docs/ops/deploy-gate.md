# Deploy gate: one chain, three places

A push to `main` deploys orionfold.com from this public repository, so a push is a release. The deploy chain is defined once in `scripts/preflight.mjs` and runs in three places that cannot drift apart:

| Place | Command | What it proves |
| --- | --- | --- |
| GitHub Actions (`deploy.yml`) | `node scripts/preflight.mjs <step>` per step | The customer-visible build passed every step on the pushed commit. |
| Local, before a push | `npm run preflight` | The same steps, same order, same environment, on your clean checkout. Writes `output/preflight/stamp.json` keyed on the git tree hash. |
| `pre-push` hook (installed by `npm install` or `npm run hooks:install`) | `node scripts/preflight.mjs --gate <sha>` | A push to `main` carries proof: a fresh green stamp for that exact tree, or a green Pages deploy of that exact commit (rollbacks), or an inline full run when the pushed commit is the clean working tree. |

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

- Edit, commit, then `npm run preflight`. When it is green, `git push` passes the gate in under a second (stamp fast path).
- If you push without running it, the hook runs the chain for you (a few minutes) and only then pushes.
- A rollback (`git push --force-with-lease` to a commit that already deployed green) passes on the deploy record alone.
- There is no skip switch. `git push --no-verify` is git's own escape hatch and is reserved for the operator.
