# Flow commerce and release ownership

The Flow product repository owns its commerce functions, Stripe catalog,
licence payload, transactional email, DMGs and signed Sparkle feed. Website owns
the public pages, download link, checkout return page and appcast redirect.

The Website webhook acknowledges Flow checkout, invoice and subscription events
without dispatching Website fulfilment. `website-event-ownership.ts` matches the
six exact Pro, Import and Publish lookup keys after signature verification.
Price-resolution failures take the existing retry path. Other products retain
their handlers. Retained legacy Flow branches are a temporary rollback path;
remove them only after the product endpoint's live single-delivery verification.

Project secrets are shared by name across functions. Removing a Website reader
does not authorize deleting or rotating Product's Flow secrets. Shared signing
and database contracts remain unchanged by this cleanup.

## Release boundary

Website no longer generates, signs or serves a static Flow feed. Historical
release notes in `src/data/flow-releases.ts` are retained as history only.
Product verifies release signatures and publishes the current feed and DMGs.

`src/data/flow-release-contract.json` records the Cloudflare redirect from
`/flow/appcast.xml` to the product-owned bucket feed. Ordinary build checks verify
the operator release declaration, permanent DMG URL and exact redirect contract.
They do not need to download or verify Product's current release.

At a release handoff, verify the live redirect as a separate read-only smoke:

```sh
FLOW_RELEASE_DECLARED=true node scripts/check-flow-release-boundary.mjs --live
```

This command is a diagnostic; setting that environment variable does not grant
release authority. The deploy gate continues to read the operator-controlled
repository variable. Preserve `/flow/welcome/` and its session deep link: the
page does not depend on the retired claim helper.
