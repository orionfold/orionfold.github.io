---
id: "06-settings-license-instance"
title: "Settings, License, And Instance API"
status: "draft"
stability: "app-internal"
families: ["settings","license","instance","environment","onboarding","auth","host-deployment"]
---

## Who This Is For

This group is for a developer configuring and inspecting a local Relay instance: reading and writing settings (auth, models, routing, budgets, chat, snapshots, browser tools), activating and removing licenses, checking instance identity and upgrade state, scanning the local environment, and tracking onboarding progress. Read this if you are wiring a settings screen, automating license activation, polling for an available upgrade, or building a runtime-connection test.

## Stability

`app-internal`

These routes power the Relay Settings and onboarding screens. Their request and response shapes are tied to the app's own screens and may change between releases, so branch on HTTP status codes rather than on the internal structure of a response body, and treat every response field as additive.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

In `trusted-local`, use loopback as before. In an authenticated exposure profile,
the Relay Proxy protects these routes with a live administrator session and
exact-origin checks for mutations. Do not bypass that boundary or expose the
Next.js listener around the configured ingress. Remote-authenticated v1 binds
loopback and rejects requests without the configured ingress credential.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Secrets are never returned.** No settings, license, or instance route returns a raw or decrypted API key, an OAuth token, or a license signature. API keys are encrypted at rest and only ever surface as a `hasKey` boolean and an `apiKeySource` label. Licenses surface only summary fields and a display label, never the signed envelope.
- **Auth-status labels.** An `apiKeySource` is `db`, `env`, `oauth`, or `unknown`. It is `oauth` only when an OAuth credential is actually present (an OAuth token in the environment or a cached credential file), not merely because OAuth is the selected method. A blank install with no credential reports `unknown`.
- **Settings values are often strings.** Several settings routes store and return their values as strings even when they represent numbers or booleans (for example the runtime tuning and learning-limit routes). The shape is noted per route.
- **Timestamps split two ways.** Budget, pricing, license, and login responses use ISO date strings. Instance config, guardrails, and upgrade state use numeric epoch values, and OpenAI rate-limit resets are numeric epochs too. The shape is noted where it matters.
- **Test routes never fail with a non-200.** The runtime connection-test routes return `200` with a `connected: false` body on failure rather than an error status, so a client can always read the result.
- **Validation.** Some routes validate with Zod and some by hand. Error bodies are `{ "error": "<message>" }`, with several adding a `code` field; a Zod failure returns the flattened error object as the `error` value.

## Endpoint Families

- `settings`
- `license`
- `instance`
- `environment`
- `onboarding`
- `auth`
- `host-deployment`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `POST` | `/api/auth/bootstrap` | `app-internal` | `src/app/api/auth/bootstrap/route.ts` |
| `GET` | `/api/auth/events` | `app-internal` | `src/app/api/auth/events/route.ts` |
| `POST` | `/api/auth/login` | `app-internal` | `src/app/api/auth/login/route.ts` |
| `POST` | `/api/auth/logout` | `app-internal` | `src/app/api/auth/logout/route.ts` |
| `POST` | `/api/auth/recovery` | `app-internal` | `src/app/api/auth/recovery/route.ts` |
| `DELETE`, `GET` | `/api/auth/sessions` | `app-internal` | `src/app/api/auth/sessions/route.ts` |
| `GET` | `/api/auth/status` | `app-internal` | `src/app/api/auth/status/route.ts` |
| `POST` | `/api/environment/rescan-if-stale` | `app-internal` | `src/app/api/environment/rescan-if-stale/route.ts` |
| `GET` | `/api/environment/skills` | `app-internal` | `src/app/api/environment/skills/route.ts` |
| `GET`, `POST` | `/api/host-deployment` | `admin-local` | `src/app/api/host-deployment/route.ts` |
| `GET` | `/api/instance/config` | `app-internal` | `src/app/api/instance/config/route.ts` |
| `GET` | `/api/instance/identity` | `app-internal` | `src/app/api/instance/identity/route.ts` |
| `POST` | `/api/instance/init` | `app-internal` | `src/app/api/instance/init/route.ts` |
| `POST` | `/api/instance/upgrade` | `app-internal` | `src/app/api/instance/upgrade/route.ts` |
| `POST` | `/api/instance/upgrade/check` | `app-internal` | `src/app/api/instance/upgrade/check/route.ts` |
| `GET` | `/api/instance/upgrade/status` | `app-internal` | `src/app/api/instance/upgrade/status/route.ts` |
| `GET`, `POST` | `/api/license` | `app-internal` | `src/app/api/license/route.ts` |
| `DELETE` | `/api/license/{id}` | `app-internal` | `src/app/api/license/[id]/route.ts` |
| `GET` | `/api/onboarding/progress` | `app-internal` | `src/app/api/onboarding/progress/route.ts` |
| `GET`, `POST` | `/api/settings` | `app-internal` | `src/app/api/settings/route.ts` |
| `GET`, `POST` | `/api/settings/apps` | `app-internal` | `src/app/api/settings/apps/route.ts` |
| `GET` | `/api/settings/author-default` | `app-internal` | `src/app/api/settings/author-default/route.ts` |
| `GET`, `POST` | `/api/settings/browser-tools` | `app-internal` | `src/app/api/settings/browser-tools/route.ts` |
| `GET`, `POST` | `/api/settings/budgets` | `app-internal` | `src/app/api/settings/budgets/route.ts` |
| `GET`, `PUT` | `/api/settings/chat` | `app-internal` | `src/app/api/settings/chat/route.ts` |
| `POST` | `/api/settings/chat/model-prompt-impression` | `app-internal` | `src/app/api/settings/chat/model-prompt-impression/route.ts` |
| `GET`, `PUT` | `/api/settings/chat/pins` | `app-internal` | `src/app/api/settings/chat/pins/route.ts` |
| `GET`, `PUT` | `/api/settings/chat/saved-searches` | `app-internal` | `src/app/api/settings/chat/saved-searches/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/settings/dashboard` | `app-internal` | `src/app/api/settings/dashboard/route.ts` |
| `GET`, `POST` | `/api/settings/environment` | `app-internal` | `src/app/api/settings/environment/route.ts` |
| `GET` | `/api/settings/glance` | `app-internal` | `src/app/api/settings/glance/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/settings/github` | `app-internal` | `src/app/api/settings/github/route.ts` |
| `GET` | `/api/settings/github/repositories` | `app-internal` | `src/app/api/settings/github/repositories/route.ts` |
| `GET`, `POST` | `/api/settings/learning` | `app-internal` | `src/app/api/settings/learning/route.ts` |
| `GET`, `POST`, `PUT` | `/api/settings/ollama` | `app-internal` | `src/app/api/settings/ollama/route.ts` |
| `GET`, `POST` | `/api/settings/openai` | `app-internal` | `src/app/api/settings/openai/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/settings/openai/login` | `app-internal` | `src/app/api/settings/openai/login/route.ts` |
| `POST` | `/api/settings/openai/logout` | `app-internal` | `src/app/api/settings/openai/logout/route.ts` |
| `DELETE`, `GET`, `PUT` | `/api/settings/openai-compatible/{runtimeId}` | `app-internal` | `src/app/api/settings/openai-compatible/[runtimeId]/route.ts` |
| `GET`, `POST` | `/api/settings/pricing` | `app-internal` | `src/app/api/settings/pricing/route.ts` |
| `GET` | `/api/settings/providers` | `app-internal` | `src/app/api/settings/providers/route.ts` |
| `GET`, `POST`, `PUT` | `/api/settings/routing` | `app-internal` | `src/app/api/settings/routing/route.ts` |
| `GET`, `POST` | `/api/settings/runtime` | `app-internal` | `src/app/api/settings/runtime/route.ts` |
| `POST` | `/api/settings/test` | `app-internal` | `src/app/api/settings/test/route.ts` |
| `GET`, `POST` | `/api/settings/web-search` | `app-internal` | `src/app/api/settings/web-search/route.ts` |

## Endpoint Reference

### GET /api/host-deployment

Returns the content-free Relay Host deployment view used by Settings. The
response includes the saved journey and provisional estimate, a redacted Host
license summary, runtime mode, Host capacity, managed Cell inventory, and up to
20 lifecycle receipts. It never returns the signed license envelope, provider
credentials, filesystem paths, runtime resource references, prompts, or Cell
content. The response uses `Cache-Control: no-store`.

Named store or registry failures return an error object with a stable `code`.
Internal failures use generic recovery guidance rather than exposing local
diagnostic detail.

### POST /api/host-deployment

Runs one strict, discriminated Host deployment mutation and returns the same
redacted view as `GET`. Supported actions are `save_draft`, `estimate`,
`preflight`, `authorize`, `install`, `create_cell`, and `cell_action`. Cell
actions accept `start`, `stop`, `restart`, `retain`, or `purge`. Lifecycle
requests require a client-generated UUID operation ID; purge also requires the
exact Cell ID as confirmation.

Malformed JSON, unknown fields, and invalid action shapes return `400` with
`HOST_DEPLOYMENT_REQUEST_INVALID`. Missing, invalid, or lapsed paid Host rights
return `403`; busy or replay conflicts return `409`; domain precondition and
validation failures return `422`; internal or unavailable dependencies return
`500`. The route accepts no provider token or raw path. The configured Relay
proxy/session and exact-origin boundary protects remote mutations.

### GET /api/auth/status

Public status exchange. Returns the exposure profile, configured and
authenticated booleans, Cell id, and current session summary. It returns no
credential or password state.

### POST /api/auth/bootstrap

Public first-admin exchange with strict body `{ token, password, deviceName }`.
The password must contain at least 12 characters. A successful atomic exchange
sets an HttpOnly session cookie and returns eight recovery codes once. Exact
configured `Origin` is required. Invalid, expired, replayed, or rate-limited
attempts return stable named errors.

### POST /api/auth/login

Public password exchange with `{ password, deviceName }`. A successful request
approves a fresh named 12-hour session and sets a new HttpOnly cookie. Exact
configured `Origin` is required. Invalid credentials use `LOGIN_INVALID`; the
persistent client bucket uses `AUTH_RATE_LIMITED`.

### POST /api/auth/logout

Public idempotent exchange that revokes the presented session when valid and
expires the cookie. Exact configured `Origin` is required.

### POST /api/auth/recovery

Public recovery exchange with `{ recoveryCode, newPassword, deviceName }`.
Success consumes the code, changes the password, revokes all old sessions,
rotates every recovery code, returns the new eight codes once, and issues a new
session. Exact configured `Origin` is required.

### GET /api/auth/sessions

Requires a live administrator session. Returns active named sessions with
created, last-seen, and expiry timestamps plus a `current` marker. It never
returns session tokens.

### DELETE /api/auth/sessions

Requires a live administrator session and strict `{ sessionId }`. Revokes the
named active session and returns `{ ok: true | false }`.

### GET /api/auth/events

Requires a live administrator session. Optional `limit` is bounded to 1 through
100. Returns content-free event and reason codes, session ids, timestamps, and
hashed client fingerprints. It never returns raw credentials, IP addresses,
user agents, prompts, or customer content.

### POST /api/settings/chat/model-prompt-impression

Atomically claims permission for at most one browser session to show the
automatic default-model prompt for the active Relay data directory.

- **Request**: none.
- **Response** `200`: `{ "claimed": true | false }`. `true` means this caller
  won the one-time claim; `false` means another or earlier session already
  claimed it or the instance was previously configured.
- **Errors**: `500` with `{ "error":
  "MODEL_PREFERENCE_PROMPT_IMPRESSION_WRITE_FAILED", "message": "<recovery
  guidance>" }` when Relay cannot persist the claim.
- **Side effects**: atomically writes the instance-local prompt-impression
  marker before any browser displays the prompt. It does not choose or change a
  model.

### GET /api/settings

Returns the Anthropic auth settings summary. It never returns the raw API key.

- **Request**: none.
- **Response** `200`: `{ "method": "oauth", "hasKey": false, "apiKeySource": "unknown" }`. `method` is `api_key` or `oauth` (defaulting to `oauth`). `hasKey` is true when a stored key or an `ANTHROPIC_API_KEY` environment variable is present. `apiKeySource` is `db`, `env`, `oauth`, or `unknown`, where `oauth` requires an actual OAuth credential to be present, not just the method being selected.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings

Updates the Anthropic auth settings.

- **Request** body (JSON), validated by Zod, all optional:

| Field | Type | Required | Notes |
|---|---|---|---|
| `method` | `string` | no | `api_key` or `oauth`. |
| `apiKey` | `string` | no | Must start with `sk-ant-`. Encrypted before storage. |
| `model` | `string` | no | The Anthropic direct model id. |

- **Response** `200`: the re-read auth settings (same shape as `GET`, no secret).
- **Errors**: `400` on validation failure: `{ "error": <flattened Zod error> }`.
- **Side effects**: writes the auth method; encrypts and stores a supplied key; switching to `oauth` deletes any stored key; invalidates cached runtime health.

### GET /api/settings/apps

Returns `{ "showInferenceDiagnostics": true | false }` for app-shell diagnostics.

### POST /api/settings/apps

Stores the strict body `{ "showInferenceDiagnostics": true | false }` and returns the updated setting. Invalid input returns `400` with validation issues.

### GET /api/settings/author-default

Returns the operating-system username to use as a default author.

- **Request**: none.
- **Response** `200`: `{ "author": "string" }`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### GET /api/settings/browser-tools

Returns the browser MCP tool enable flags and their config strings.

- **Request**: none.
- **Response** `200`: `{ "chromeDevtoolsEnabled": false, "playwrightEnabled": false, "chromeDevtoolsConfig": "string", "playwrightConfig": "string" }`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/browser-tools

Updates any subset of the browser tool settings.

- **Request** body (JSON), all optional: `chromeDevtoolsEnabled`, `playwrightEnabled`, `chromeDevtoolsConfig`, `playwrightConfig`.
- **Response** `200`: the re-read state (same shape as `GET`).
- **Errors**: none returned explicitly.
- **Side effects**: writes the provided browser-tool settings.

### GET /api/settings/budgets

Returns the budget guardrail snapshot.

- **Request**: none.
- **Response** `200`: a snapshot with `policy` (overall and per-runtime monthly caps), `statuses` (per-scope spend status with `health` one of `unlimited`, `ok`, `warning`, `blocked`), `dailyResetAtIso`, `monthlyResetAtIso`, `runtimeStates`, `pricing`, `meteredSpend` (`dailyMicros`, `monthlyMicros`), and `planPricedMonthlyMicros`. Costs are integer micro-dollars.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/budgets

Updates the budget policy.

- **Request** body (JSON), validated by Zod: `{ "overall": { "monthlySpendCapUsd": <number or null> }, "runtimes": { "<runtimeId>": { "monthlySpendCapUsd": <number or null>, "claudeOAuthPlan": "pro" } } }`. `claudeOAuthPlan` is `pro`, `max_5x`, or `max_20x`.
- **Response** `200`: the re-read budget snapshot.
- **Errors**: `400` on validation failure: `{ "error": <flattened Zod error> }`.
- **Side effects**: normalizes and persists the budget policy and clears the warning state.

### GET /api/settings/chat

Returns the chat model settings.

- **Request**: none.
- **Response** `200`: `{ "defaultModel": "string", "defaultModelRecorded": false, "modelPreference": "balanced" }`. `modelPreference` is `quality`, `cost`, `privacy`, `balanced`, or null.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### PUT /api/settings/chat

Updates the default model and/or the model preference.

- **Request** body (JSON), all optional: `defaultModel` (a known model id or an `ollama:` id) and `modelPreference` (null or `quality`, `cost`, `privacy`, `balanced`).
- **Response** `200`: the same shape as `GET`.
- **Errors**:
  - `400` when `defaultModel` is not a string: `{ "error": "defaultModel must be a string" }`.
  - `400` on an invalid model: `{ "error": "Invalid model. Must be one of: <ids> or an \"ollama:*\" id" }`.
  - `400` on an invalid preference: `{ "error": "Invalid modelPreference. Must be null or one of: quality, cost, privacy, balanced" }`.
- **Side effects**: writes the provided chat settings.

### GET /api/settings/chat/pins

Returns the pinned chat entities.

- **Request**: none.
- **Response** `200`: `{ "pins": [ { "id": "string", "type": "task", "label": "string", "description": "string", "status": "string", "pinnedAt": "2026-01-01T00:00:00.000Z" } ] }`. A malformed stored value degrades to an empty list.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### PUT /api/settings/chat/pins

Replaces the entire pin list.

- **Request** body (JSON), validated by Zod: `{ "pins": [ ... ] }`.
- **Response** `200`: `{ "pins": [ ... ] }`, deduplicated by id.
- **Errors**:
  - `400` on unparseable JSON: `{ "error": "invalid JSON body" }`.
  - `400` on schema failure: `{ "error": "invalid pins payload", "issues": [ ... ] }`.
- **Side effects**: writes the pin list.

### GET /api/settings/chat/saved-searches

Returns the saved chat filter searches.

- **Request**: none.
- **Response** `200`: `{ "searches": [ { "id": "string", "surface": "task", "label": "string", "filterInput": "string", "createdAt": "2026-01-01T00:00:00.000Z" } ] }`. A malformed stored value degrades to an empty list.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### PUT /api/settings/chat/saved-searches

Replaces the entire saved-search list.

- **Request** body (JSON), validated by Zod: `{ "searches": [ ... ] }`.
- **Response** `200`: `{ "searches": [ ... ] }`, deduplicated by id.
- **Errors**:
  - `400` on unparseable JSON: `{ "error": "invalid JSON body" }`.
  - `400` on schema failure: `{ "error": "invalid searches payload", "issues": [ ... ] }`.
- **Side effects**: writes the saved-search list.

### GET /api/settings/dashboard

Returns the local dashboard module preferences.

- **Request**: none.
- **Response** `200`: `{ "version": 1, "smartOrdering": true, "visible": { "<moduleId>": true } }`. Supported module ids are `attention`, `activity`, `packs`, `projects`, `documents`, `features`, `costs`, `health`, `quickActions`, and `workshop`. Missing visibility entries use the module default.
- **Errors**: none returned explicitly. Invalid stored JSON is logged and degrades to the default preferences.
- **Side effects**: reads only.

### POST /api/settings/dashboard

Replaces the local dashboard module preferences.

- **Request** body (JSON), strict: `{ "version": 1, "smartOrdering": <boolean>, "visible": { "<supportedModuleId>": <boolean> } }`. Visibility entries are optional, but unknown keys are rejected.
- **Response** `200`: the stored preference object.
- **Errors**: `400` with `{ "error": "Invalid dashboard preferences", "issues": [ ... ] }` on schema failure.
- **Side effects**: persists the complete dashboard preference object.

### DELETE /api/settings/dashboard

Resets dashboard preferences to Relay defaults.

- **Request**: none.
- **Response** `200`: the default preference object with smart ordering enabled and no explicit visibility overrides.
- **Errors**: none returned explicitly.
- **Side effects**: deletes the persisted dashboard preference.

### GET /api/settings/environment

Returns the auto-promote-skills flag.

- **Request**: none.
- **Response** `200`: `{ "autoPromoteSkills": false }`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/environment

Toggles the auto-promote-skills flag.

- **Request** body (JSON): `{ "autoPromoteSkills": <boolean> }`.
- **Response** `200`: `{ "autoPromoteSkills": false }`.
- **Errors**: none returned explicitly.
- **Side effects**: writes the flag.

### GET /api/settings/glance

Returns a consolidated settings-at-a-glance summary. Every field is independently nullable; a failure in one source nulls only that field.

- **Request**: none.
- **Response** `200`: fields including `activeRuntimeLabel`, `activeModel`, `routingPreference`, `configuredRuntimeCount`, `sdkTimeoutSeconds`, `maxTurns`, a `licenseTag` (a display label or community marker, no secret), `budgetMonthlyCapUsd`, `activePreset`, `allowedPermissionCount`, `webSearchEnabled`, `channelCount`, and `autoPromoteSkills`. Any field may be null when its source is unavailable.
- **Errors**: `500` on total failure: `{ "error": "<message>" }`.
- **Side effects**: reads only. No secret values are included.

### GET /api/settings/github

Returns the current GitHub connection and GitHub CLI availability without exposing a token.

### POST /api/settings/github

Connects using `{ "token": "..." }` or `{ "method": "github-cli" }`, or verifies the current connection with `{ "verify": true }`. Invalid bodies return `400`; named connection failures retain their mapped status codes.

### DELETE /api/settings/github

Disconnects GitHub and returns the resulting connection and CLI status. The raw credential is never returned.

### GET /api/settings/github/repositories

Lists repositories visible to the current GitHub connection. Connection failures retain their mapped status codes; unexpected failures return `500`.

### GET /api/settings/learning

Returns the learning-context character limit.

- **Request**: none.
- **Response** `200`: `{ "contextCharLimit": "8000" }`. The value is a string.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/learning

Updates the learning-context character limit.

- **Request** body (JSON): `{ "contextCharLimit": <number> }`.
- **Response** `200`: `{ "contextCharLimit": "8000" }`.
- **Errors**: `400` when out of range: `{ "error": "contextCharLimit must be between 2,000 and 32,000 (step 1,000)" }`.
- **Side effects**: writes the limit as a string.

### GET /api/settings/ollama

Returns the redacted Ollama runtime configuration.

- **Request**: none.
- **Response** `200`: `{ "runtimeId": "ollama", "label": "Ollama", "configured": true, "baseUrl": "http://localhost:11434", "defaultModel": "string", "allowInsecureRemote": false, "hasApiKey": false, "apiKeySource": "unknown" }`. The raw key is never returned.
- **Errors**: `400` when the effective stored or environment configuration is invalid.
- **Side effects**: reads only.

### POST /api/settings/ollama

Compatibility alias for `PUT /api/settings/ollama`; the request and response contracts are identical.

### PUT /api/settings/ollama

Atomically validates and updates Ollama connection and model defaults.

- **Request** body (JSON), all optional: `baseUrl` (non-empty URL), `apiKey` (non-empty), `clearApiKey` (boolean), `defaultModel` (blank clears), and `allowInsecureRemote` (boolean). `apiKey` and `clearApiKey` are mutually exclusive. A non-loopback `http://` URL requires `allowInsecureRemote: true`; HTTPS is otherwise required.
- **Response** `200`: `{ "ok": true, ...redactedConfiguration }`, using the same redacted fields as `GET`.
- **Errors**:
  - `400` for malformed or invalid strict input, unsafe or invalid base URLs, or an invalid effective configuration.
  - `500` when persistence fails: `{ "error": "Failed to save Ollama settings: <message>" }`.
- **Side effects**: applies the settings patch atomically, invalidates model discovery, and invalidates cached runtime health.

### GET /api/settings/openai

Returns the OpenAI auth settings, enriched with live OAuth state when the method is `oauth`. It never returns the raw API key.

- **Request**: none.
- **Response** `200`: `{ "method": "api_key", "hasKey": false, "apiKeySource": "unknown", "oauthConnected": false, "account": null, "rateLimits": null }`. `apiKeySource` for OpenAI is `db`, `env`, or `unknown` (never `oauth`). `account` carries the connected ChatGPT account type, email, and plan when present.
- **Errors**: none returned explicitly (an OAuth read failure degrades to disconnected).
- **Side effects**: when the method is `oauth`, refreshes the live OAuth state, which may persist status.

### POST /api/settings/openai

Updates the OpenAI auth settings.

- **Request** body (JSON), validated by Zod, all optional:

| Field | Type | Required | Notes |
|---|---|---|---|
| `method` | `string` | no | `api_key` or `oauth`. |
| `apiKey` | `string` | no | Must start with `sk-`. Encrypted before storage. |
| `model` | `string` | no | The OpenAI direct model id. |

- **Response** `200`: the re-read OpenAI auth settings (no secret).
- **Errors**: `400` on validation failure: `{ "error": <flattened Zod error> }`.
- **Side effects**: writes the method; encrypts and stores a supplied key; writes the model; invalidates cached runtime health.

### GET /api/settings/openai/login

Returns the current ChatGPT OAuth login state.

- **Request**: none.
- **Response** `200`: `{ "phase": "idle", "loginId": null, "authUrl": null, "account": null, "rateLimits": null, "error": null, "startedAt": null, "updatedAt": "2026-01-01T00:00:00.000Z" }`. `phase` is `idle`, `pending`, `connected`, `cancelled`, or `failed`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/openai/login

Starts a ChatGPT OAuth login flow.

- **Request**: none.
- **Response** `200`: a login state, typically `pending` with an `authUrl` and `loginId`, or `connected` if already authenticated, or `failed` with an `error`. Failures are represented in the state, not as an error status.
- **Errors**: none at the HTTP layer.
- **Side effects**: sets the OpenAI auth method to `oauth`, spawns a Codex app-server client, and starts the login flow.

### DELETE /api/settings/openai/login

Cancels an in-progress login.

- **Request**: none.
- **Response** `200`: a login state (`cancelled`, or unchanged if nothing is active).
- **Errors**: none at the HTTP layer.
- **Side effects**: cancels the login, clears OAuth status, and closes the client.

### POST /api/settings/openai/logout

Logs out of OpenAI Codex.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**: none returned explicitly.
- **Side effects**: sends a logout to the Codex client and removes the isolated Codex credential file.

### GET /api/settings/openai-compatible/{runtimeId}

Returns the LiteLLM or LM Studio configuration summary, including `runtimeId`, `label`, `configured`, `baseUrl`, `defaultModel`, `allowInsecureRemote`, `hasApiKey`, and `apiKeySource`. It never returns the API key. Unknown runtime ids return `404`; invalid effective configuration returns `400`.

### PUT /api/settings/openai-compatible/{runtimeId}

Updates `baseUrl`, `apiKey`, `clearApiKey`, `defaultModel`, or `allowInsecureRemote` for `litellm` or `lmstudio`. Relay validates the effective URL before writing any field, applies the patch atomically, and returns the redacted effective configuration. Invalid or unsafe configuration returns `400`. A successful write invalidates model discovery and cached runtime health.

### DELETE /api/settings/openai-compatible/{runtimeId}

Removes stored compatible-runtime settings and invalidates model discovery plus cached runtime health. All three methods return `404` for runtime ids other than `litellm` and `lmstudio`.

### GET /api/settings/pricing

Returns the pricing registry snapshot.

- **Request**: none.
- **Response** `200`: `{ "providers": { ... }, "lastUpdatedIso": "2026-01-01T00:00:00.000Z", "stale": false }`. Each provider carries a `sourceType` (`bundled_default` or `official_pricing_page`), a `fetchedAtIso`, a `version`, a `refreshError`, and `rows` of per-model or per-plan pricing in micro-dollars.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/pricing

Forces a refresh of pricing from the official provider pages.

- **Request**: none.
- **Response** `200`: the refreshed pricing snapshot (same shape). A per-provider `refreshError` is captured in the snapshot rather than thrown.
- **Errors**: none returned explicitly.
- **Side effects**: makes outbound calls to the provider pricing pages and persists the updated registry.

### GET /api/settings/providers

Returns a consolidated provider, runtime, routing-policy, and health overview. It never returns raw API keys or provider credentials.

- **Request** optional query: `refreshRuntimeHealth=1` bypasses the 15-second runtime-health cache for this request.
- **Response** `200`: a `providers` object (each with auth and per-runtime state plus provider-specific OAuth fields), a redacted `ollama` block, `compatibleRuntimes` for LiteLLM and LM Studio, `chatDefaultModel`, the legacy `routingPreference`, the complete versioned `routing` snapshot, `runtimeRoutingStatuses` for all registered runtimes, and `configuredProviderCount`. Each status names configuration, health, selected model, comparable cost when known, capability summary, capability limits, and a bounded reason.
- **Errors**: none returned explicitly.
- **Side effects**: may refresh live OpenAI OAuth state and probes every configured runtime through a bounded, all-settled health snapshot. Probe failures remain per-runtime states instead of failing the aggregate response.

### GET /api/settings/routing

Returns the routing preference and versioned eligible-runtime policy.

- **Request**: none.
- **Response** `200`: `{ "preference": "latency", "policy": { "version": 1, "eligibleRuntimeIds": [ ... ], "manualDefaultRuntimeId": "claude-code", "automaticFallback": true }, "source": "stored", "needsPersistence": false, "repairReason": null }`. A missing policy returns the safe v1 default; corrupt or future values return a conservative repaired policy with a visible reason and fallback disabled.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/routing

Compatibility alias for `PUT /api/settings/routing`; preference-only bodies are rejected so they cannot discard pool edits.

### PUT /api/settings/routing

Atomically replaces the routing preference and v1 policy.

- **Request** strict body: `{ "preference": "cost | latency | quality | manual", "policy": { "version": 1, "eligibleRuntimeIds": ["<unique registered runtime ids>"], "manualDefaultRuntimeId": "<registered runtime id>", "automaticFallback": true } }`.
- **Response** `200`: the normalized stored snapshot, with the same shape as `GET`.
- **Errors**:
  - `400` for malformed JSON, unknown fields, duplicate or unknown runtime ids, an invalid preference or default, or the wrong policy version.
  - `500` when atomic persistence fails.
- **Side effects**: writes preference and policy together. It does not mutate provider authentication, provider models, compatible-runtime settings, or the Chat default.

### GET /api/settings/runtime

Returns the SDK timeout and max-turns tuning.

- **Request**: none.
- **Response** `200`: `{ "sdkTimeoutSeconds": "60", "maxTurns": "10" }`. Both values are strings.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/runtime

Updates the runtime tuning.

- **Request** body (JSON), all optional: `sdkTimeoutSeconds` (10 to 300) and `maxTurns` (1 to 50).
- **Response** `200`: `{ "sdkTimeoutSeconds": "60", "maxTurns": "10" }`.
- **Errors**:
  - `400` on an out-of-range timeout: `{ "error": "sdkTimeoutSeconds must be between 10 and 300" }`.
  - `400` on an out-of-range turn count: `{ "error": "maxTurns must be between 1 and 50" }`.
- **Side effects**: writes the tuning as strings.

### POST /api/settings/test

Tests a runtime connection.

- **Request** body (JSON), optional: `{ "runtime": "string" }`. Defaults to the default runtime.
- **Response** `200`: the connection result spread with `runtime` and `capabilities`. On failure it still returns `200` with `{ "connected": false, "error": "<message>" }`.
- **Errors**: none at the HTTP layer.
- **Side effects**: runs the runtime's live health check, which may spawn a subprocess or call the provider.

### GET /api/settings/web-search

Returns the web-search enable flag.

- **Request**: none.
- **Response** `200`: `{ "exaSearchEnabled": false }`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/settings/web-search

Toggles web search.

- **Request** body (JSON): `{ "exaSearchEnabled": <boolean> }`.
- **Response** `200`: `{ "exaSearchEnabled": false }`.
- **Errors**: none returned explicitly.
- **Side effects**: writes the flag.

### GET /api/license

Lists persisted licenses, each re-verified at read time. It never returns the signed envelope.

- **Request**: none.
- **Response** `200`: `{ "licenses": [ { "licenseId": "string", "filePath": "string", "valid": true, "reason": "string", "issuedTo": { "email": "string", "name": "string", "org": "string" }, "issuedAt": "2026-01-01T00:00:00.000Z", "expiresAt": "2027-01-01T00:00:00.000Z", "seats": 1, "entitlements": ["string"] } ] }`.
- **Errors**: `500` on failure: `{ "error": "<message>", "code": "store_error" }`.
- **Side effects**: reads and verifies license files.

### POST /api/license

Activates a license from a pasted or uploaded envelope.

- **Request** body (JSON): `{ "envelope": { "payload": <object>, "signature": <string> } }`.
- **Response** `200`: the stored license summary (same shape as a `GET` element, `valid` true, no signature).
- **Errors**:
  - `400` when the body is not JSON: `{ "error": "Request body must be JSON.", "code": "bad_request" }`.
  - `400` on a shape mismatch, with `code` `validation_failed`. The message asks for an envelope of `{ payload, signature }` and directs the user to paste the license file from their fulfilment email.
  - `422` when the license is rejected (for example a signature that does not verify): `{ "error": "<message>", "code": "license_rejected" }`.
  - `500` on any other failure: `{ "error": "<message>", "code": "store_error" }`.
- **Side effects**: verifies the signature and writes the license file with restrictive permissions.

### DELETE /api/license/{id}

Removes one persisted license. Installed packs are left in place.

- **Request**: none.
- **Response** `200`: `{ "removed": true }`.
- **Errors**:
  - `404` when no license matches: `{ "error": "No stored license with id \"<id>\".", "code": "not_found" }`.
  - `500` on failure: `{ "error": "<message>", "code": "store_error" }`.
- **Side effects**: deletes the license file.

### GET /api/onboarding/progress

Returns the six onboarding milestones, computed from database counts.

- **Request**: none.
- **Response** `200`: `{ "milestones": [ { "id": "string", "label": "string", "completed": false } ], "completedCount": 0, "totalCount": 6 }`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### GET /api/instance/config

Returns the active Relay cell boundary plus the instance bootstrap, guardrail,
and upgrade state in one payload. Timestamps here are numeric epoch values.

- **Request**: none.
- **Response** `200`: every successful shape includes `boundary`: `{ "vocabularyVersion": "relay-host-cell-v1", "instanceId": "string | null", "dataDirectory": "string", "databasePath": "string", "launchWorkingDirectory": "string", "dataDirectorySource": "default | override" }`. Dev mode returns `{ "devMode": true, "boundary": { ... }, "config": null, "guardrails": null, "upgrade": null }`. With no git directory, the same boundary facts accompany `skippedReason: "no_git"`. A validated managed `RELAY_CELL_ID` is authoritative and appears in the compatible `boundary.instanceId` field even in a no-git OCI Cell. Otherwise `config` carries `instanceId`, `branchName`, `isPrivateInstance`, and a numeric `createdAt`; `guardrails` carries the pre-push hook state and `consentStatus`; and `upgrade` carries the poll and upgrade-availability state. Direct dev and no-git npx modes without a managed identity report `boundary.instanceId: null` rather than surfacing stale or invented bootstrap identity.
- **Errors**: `503` with `{ "error": "<message>", "code": "CELL_ID_INVALID" }` when a configured managed Cell id is invalid. Other failures return `500` with `{ "error": "<message>", "code": "INSTANCE_CONFIG_FAILED" }`.
- **Side effects**: reads only. The boundary object contains local administrative paths but no credentials, customer content, raw logs, Host name, port, network, container id, or inferred isolation-strength claim.

### GET /api/instance/identity

Returns the instance identity: version, active model, and license tag. It never returns license key material.

- **Request**: none.
- **Response** `200`: `{ "version": "string", "activeModel": "string", "licenseTag": { "kind": "licensed", "label": "string" } }`. `version` is null when the build has no valid version. `activeModel` is null when no runtime resolves. `licenseTag` is either `{ "kind": "licensed", "label": "string" }` or `{ "kind": "community" }`.
- **Errors**: `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: reads only.

### POST /api/instance/init

Re-runs the instance bootstrap. It is idempotent.

- **Request**: none.
- **Response** `200`: `{ "ensureResult": { ... }, "config": { ... }, "guardrails": { ... }, "upgrade": { ... } }`. `ensureResult` reports a possible `skipped` reason and a list of bootstrap steps with `ok`, `skipped`, or `failed` statuses.
- **Errors**: `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: runs bootstrap, which may write git config, install a pre-push hook, repoint branches, fetch, and write instance settings.

### POST /api/instance/upgrade

Starts a background upgrade task using the upgrade-assistant profile.

- **Request**: none.
- **Response** `202`: `{ "taskId": "string" }`.
- **Errors**:
  - `409` when the instance is not initialized. The error message states that the instance is not yet initialized and to run the instance-init route first.
  - `409` when no upgrade is available: `{ "error": "No upgrade available", "upgradeState": { ... } }`.
  - `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: inserts a planned upgrade task, optimistically updates the upgrade state, and runs the task in the background.

### POST /api/instance/upgrade/check

Force-runs the upgrade poller, rate-limited by a lock file.

- **Request**: none.
- **Response**:
  - `200` when the state was updated: `{ "ok": true, "state": { ... } }`.
  - `202` when the check was skipped: `{ "ok": false, "skipped": "<reason>", "error": "<message>" }`. `skipped` is `in_progress`, `dev_mode_or_no_git`, `lock_held`, or `fetch_failed`; `error` is present only on `fetch_failed`.
- **Errors**: `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: acquires a lock, runs a git fetch, writes the upgrade state, and may create or clear a poll-failure notification.

### GET /api/instance/upgrade/status

Returns the current upgrade state for polling.

- **Request**: none.
- **Response** `200`: in dev mode, a synthetic idle state with `devMode` true; otherwise `{ "devMode": false, ...upgradeState }`, with numeric epoch timestamps.
- **Errors**: `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: reads only.

### POST /api/environment/rescan-if-stale

Triggers a fresh environment scan when the last scan is stale. It is intended for chat-session activation and never returns an error status.

- **Request**: none.
- **Response** `200`: `{ "scanned": false }` when a recent scan already exists, or `{ "scanned": true }` when a scan was attempted. A `true` reports that a scan was attempted, not that it succeeded.
- **Errors**: none surfaced to the client; a scan failure is logged and the route still returns `200`.
- **Side effects**: runs and persists an environment scan when stale.

### GET /api/environment/skills

Returns the enriched skill list from the latest persisted environment scan. It reads the cached scan and does not touch the filesystem.

- **Request**: none.
- **Response** `200`: a JSON array of enriched skills, or an empty array when no scan is persisted. Each skill carries `id`, `name`, `tool`, `scope`, `preview`, `sizeBytes`, `absPath`, a `healthScore` (`healthy`, `stale`, `aging`, `broken`, or `unknown`), a `syncStatus` (`synced`, `claude-only`, `codex-only`, or `shared`), a `linkedProfileId`, and `absPaths`.
- **Errors**: `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: reads only.

## Do Not Depend On

- The exact field set of the glance, providers, and budget snapshots is an internal aggregation and grows over time. Read the fields you need and tolerate new ones.
- Settings values that are stored as strings (runtime tuning, the learning limit, snapshot settings) are returned as strings even when they represent numbers. Do not assume a numeric JSON type.
- Instance config, guardrails, and upgrade timestamps are numeric epoch values, unlike the ISO timestamps used by budget, pricing, license, and login responses. Do not mix the two.
- The runtime-test routes report failure inside a `200` body. Do not treat a non-200 as the only failure signal.
- No settings, license, or instance route exposes a raw key, token, or license signature; do not build an integration that expects to read one back.
