# Living Systems migration recovery

The protected **Recover migration presentation** workflow restores the presentation reconstructed from commit `bbbf645b02349c4be744e0b3505c933dc616c54e`, while preserving these new URLs:

- `/essay/`
- `/manifesto/`
- `/flow/night-shift/`
- `/flow/living-documents/`
- `/flow/settings/`

The original baseline deployment artifact expired. Recovery therefore rebuilds that reviewed source with its own lockfile and Node 22; it does not claim to restore the original expired artifact bytes. It preserves the reconstructed baseline's bytes except additive sitemap, RSS and `llms.txt` discovery. New routes keep their current checked pages, social images, styles, scripts and assets. The three new Flow feature pages use the baseline's existing pricing anchor in the recovery copy.

## Preparation before the migration deployment

The normal main workflow runs its unchanged six preflight steps first. While current production is the fixed baseline, or an identical migration candidate's successful normal-deployment rerun, it then reconstructs and verifies the compatibility artifact. The migration must be one non-merge commit whose direct parent is the fixed baseline. A later unrelated production release, including its own reruns, does not generate an obsolete migration rollback.

The artifact is retained **before** the normal deployment job can request the `github-pages` environment approval. Failure to build, verify or retain an eligible compatibility artifact blocks that deployment. Its name is:

`site-compatible-recovery-<candidate SHA>-<source run ID>-<attempt>`

The source build summary records its artifact ID, archive digest and manifest SHA-256. Retention is 35 days. The package contains `site/`, `manifest.json` and `overlay-proof.json`. It records exact file hashes, both source identities, the baseline lockfile, the recipe identity and the checked deployment observed during preparation.

Before approving the migration deployment, inspect that successful preparation and retained artifact. Remote recovery is unavailable until the normal source workflow has completed successfully and retained its artifact. A local reconstruction is deliberately rejected by the remote recovery validator.

## Execute a recovery

1. Confirm that the affected production deployment is still the exact migration candidate. Read the `github-pages` deployment and its latest successful status through GitHub's deployments API. The status's `log_url` identifies its job; the authenticated job record binds the exact run attempt and successful Pages promotion step, even while a later attempt is rerunning. A recent workflow run alone is not production identity. A failed or cancelled promotion with uncertain effect blocks recovery instead of guessing that prior content remains live.
2. Open Actions → **Recover migration presentation** → **Run workflow**, using `main`. Supply the five values below from the reviewed source build summary and current successful deployment.
3. Review and approve the existing `github-pages` environment gate. The workflow authenticates the source run and artifact through GitHub's API, validates the approved digest, safely extracts the archive, and verifies every file and compatibility requirement.
4. The workflow uploads those verified bytes, then rechecks the exact current deployment under the shared Pages lock immediately before the official Pages action promotes them. A separate dependent job then refreshes Cloudflare using the existing purge secrets and checks recovered URLs, social assets, discovery and key CSS/JS bytes. That verification job has no deployment environment; a failed smoke cannot falsify the completed deployment record.

| Input | Required identity |
| --- | --- |
| `source_run` | Successful normal main migration deploy run that retained the compatible artifact |
| `artifact_id` | Exact `site-compatible-recovery-…` artifact from that run |
| `manifest_sha256` | Reviewed SHA-256 printed in that source build summary |
| `expected_deployment_id` | Exact currently successful `github-pages` deployment ID |
| `expected_sha` | Exact currently deployed migration candidate commit SHA |

The current deployment must match both operator-supplied values **and** the artifact's candidate SHA, normal source run and attempt. A later deployment, another workflow, a repeated recovery, an expired artifact, a changed recipe, an unsafe ZIP, a missing new route or a mismatched file aborts recovery. Do not substitute another archive or disable these checks. If the artifact expires, use a newly reviewed forward fix or a specifically reviewed source recovery; this workflow cannot manufacture provenance.

Normal deployment and recovery share `concurrency.group: pages` with `cancel-in-progress: false`. This prevents a new workflow from interrupting an active deployment. GitHub keeps a limited pending queue: do not queue multiple competing deploy/recovery requests. The `github-pages` environment must retain its required reviewer and main-only policy; naming the environment in YAML does not itself enforce review.

Recovery changes static website presentation only. Stripe, Supabase tables/functions/secrets, Resend, subscribers, payments, DNS, installers and appcasts remain untouched. A failed post-deploy smoke is reported for investigation; it does not trigger another automatic deployment or overwrite a later release.

## Evidence and maintenance

Protecting tests are `scripts/test/migration-recovery.test.mjs`, `scripts/test/release-artifact.test.mjs` and the existing preflight-order contract. They cover deployment identity, pending-deployment handling, migration scope, replay/current drift, provenance/digest/expiry, compatibility routes, baseline preservation, asset collisions and unsafe archive extraction.

The executable shared overlay is `scripts/recovery-overlay.py`; the authenticated evidence/preparation path is `scripts/migration-recovery.mjs`. Operational proof has two separate levels: a passing local extraction/verification rehearsal, and a future successful hosted recovery dispatch. Do not label the first as the second.
