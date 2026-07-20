---
id: "03-agents-chat-runtimes"
title: "Agents, Chat, And Runtimes API"
status: "draft"
stability: "app-internal"
families: ["agents","chat","runtimes"]
---

## Who This Is For

This group is for a developer working with the agents that do the work, the chat surface that talks to them, and the runtimes that back them. It covers agent profiles and importing them from GitHub, chat conversations with their streaming responses and branching, per-conversation skill composition, and runtime discovery for local Ollama and model routing. Read this if you are creating or testing agent profiles, driving a chat turn programmatically, or building on the streaming message contract.

## Stability

`app-internal`

These routes power the Relay web app. They are documented so you can build against a local instance, but their request and response shapes are tied to the app's own screens and may change between releases. Branch on HTTP status codes rather than on the internal structure of an error body, and treat every response field as additive.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. The agent routes read and write agent files on disk, the chat routes read and write the local SQLite database, and the runtime routes reach out to local model servers.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Agent profiles are files, not rows.** A profile lives on disk as an `agent.yaml` config plus a `SKILL.md` body, under the local skills directory. Creating, updating, or deleting a profile writes or removes those files; it does not touch a database table. Built-in profiles ship with Relay and are read-only. Learned context, test results, and repo-import records do use the database.
- **Timestamps.** `createdAt`, `updatedAt`, and similar fields serialize to ISO date strings on the wire.
- **Malformed request bodies.** Most write routes read the JSON body without a guard. A malformed or empty body throws before validation and surfaces as an unhandled `500`, not a structured `400`. The exceptions are noted per route (for example, skill activation returns a `400` for invalid JSON).
- **Runtime ids.** Where a route names a runtime, the value is one of `claude-code`, `openai-codex-app-server`, `anthropic-direct`, `openai-direct`, `ollama`, `litellm`, or `lmstudio`. Chat conversation creation accepts a narrower set, noted at that route.

## Endpoint Families

- `agents`
- `chat`
- `runtimes`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `GET`, `POST` | `/api/agents` | `app-internal` | `src/app/api/agents/route.ts` |
| `DELETE`, `GET`, `PUT` | `/api/agents/{id}` | `app-internal` | `src/app/api/agents/[id]/route.ts` |
| `GET`, `PATCH`, `POST` | `/api/agents/{id}/context` | `app-internal` | `src/app/api/agents/[id]/context/route.ts` |
| `POST` | `/api/agents/{id}/test` | `app-internal` | `src/app/api/agents/[id]/test/route.ts` |
| `GET` | `/api/agents/{id}/test-results` | `app-internal` | `src/app/api/agents/[id]/test-results/route.ts` |
| `POST` | `/api/agents/{id}/test-single` | `app-internal` | `src/app/api/agents/[id]/test-single/route.ts` |
| `POST` | `/api/agents/assist` | `app-internal` | `src/app/api/agents/assist/route.ts` |
| `POST` | `/api/agents/import` | `app-internal` | `src/app/api/agents/import/route.ts` |
| `GET` | `/api/agents/import-repo` | `app-internal` | `src/app/api/agents/import-repo/route.ts` |
| `POST` | `/api/agents/import-repo/apply-updates` | `app-internal` | `src/app/api/agents/import-repo/apply-updates/route.ts` |
| `POST` | `/api/agents/import-repo/check-updates` | `app-internal` | `src/app/api/agents/import-repo/check-updates/route.ts` |
| `POST` | `/api/agents/import-repo/confirm` | `app-internal` | `src/app/api/agents/import-repo/confirm/route.ts` |
| `POST` | `/api/agents/import-repo/preview` | `app-internal` | `src/app/api/agents/import-repo/preview/route.ts` |
| `POST` | `/api/agents/import-repo/scan` | `app-internal` | `src/app/api/agents/import-repo/scan/route.ts` |
| `GET` | `/api/chat/branching/flag` | `app-internal` | `src/app/api/chat/branching/flag/route.ts` |
| `GET`, `POST` | `/api/chat/conversations` | `app-internal` | `src/app/api/chat/conversations/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/chat/conversations/{id}` | `app-internal` | `src/app/api/chat/conversations/[id]/route.ts` |
| `GET` | `/api/chat/conversations/{id}/branches` | `app-internal` | `src/app/api/chat/conversations/[id]/branches/route.ts` |
| `GET`, `POST` | `/api/chat/conversations/{id}/messages` | `app-internal` | `src/app/api/chat/conversations/[id]/messages/route.ts` |
| `POST` | `/api/chat/conversations/{id}/redo` | `app-internal` | `src/app/api/chat/conversations/[id]/redo/route.ts` |
| `POST` | `/api/chat/conversations/{id}/respond` | `app-internal` | `src/app/api/chat/conversations/[id]/respond/route.ts` |
| `POST` | `/api/chat/conversations/{id}/rewind` | `app-internal` | `src/app/api/chat/conversations/[id]/rewind/route.ts` |
| `POST` | `/api/chat/conversations/{id}/skills/activate` | `app-internal` | `src/app/api/chat/conversations/[id]/skills/activate/route.ts` |
| `POST` | `/api/chat/conversations/{id}/skills/deactivate` | `app-internal` | `src/app/api/chat/conversations/[id]/skills/deactivate/route.ts` |
| `GET` | `/api/chat/entities/search` | `app-internal` | `src/app/api/chat/entities/search/route.ts` |
| `POST` | `/api/chat/export` | `app-internal` | `src/app/api/chat/export/route.ts` |
| `GET` | `/api/chat/files/search` | `app-internal` | `src/app/api/chat/files/search/route.ts` |
| `GET` | `/api/chat/models` | `app-internal` | `src/app/api/chat/models/route.ts` |
| `GET` | `/api/chat/suggested-prompts` | `app-internal` | `src/app/api/chat/suggested-prompts/route.ts` |
| `GET`, `POST` | `/api/runtimes/ollama` | `app-internal` | `src/app/api/runtimes/ollama/route.ts` |
| `GET`, `POST` | `/api/runtimes/openai-compatible/{runtimeId}` | `app-internal` | `src/app/api/runtimes/openai-compatible/[runtimeId]/route.ts` |
| `POST` | `/api/runtimes/suggest` | `app-internal` | `src/app/api/runtimes/suggest/route.ts` |

## Endpoint Reference

### GET /api/agents

Lists agent profiles. By default this returns your own profiles plus the built-ins.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `scope` | `string` | `project` returns only project-scoped profiles; `all` returns built-in, user, and project profiles; any other value returns user plus built-in. |
| `projectId` | `string` | Required to resolve project-scoped profiles. |

- **Response** `200`: a JSON array of profiles, ordered by name. Each element includes `id`, `name`, `description`, `domain`, `tags`, `skillMd`, `supportedRuntimes`, `isBuiltin`, `scope`, `readOnly`, and the optional config fields (`allowedTools`, `mcpServers`, `canUseToolPolicy`, `maxTurns`, `outputFormat`, `version`, `author`, `source`, `tests`, `importMeta`, `runtimeOverrides`). A `project` scope with no resolvable project directory returns an empty array.
- **Errors**: none returned explicitly. A database or filesystem failure propagates unhandled.
- **Side effects**: reads only. On first load, built-in profiles are copied into the local skills directory.

### POST /api/agents

Creates a custom profile on disk from a config and a `SKILL.md` body.

- **Request** body (JSON): the profile config fields at the top level, with `skillMd` alongside them.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Non-empty. Must be unique. |
| `name` | `string` | yes | Non-empty. |
| `version` | `string` | yes | Semantic version, `MAJOR.MINOR.PATCH`. |
| `domain` | `"work" \| "personal"` | yes | |
| `tags` | `string[]` | yes | |
| `skillMd` | `string` | no | The skill body. Defaults to empty. |
| `allowedTools` | `string[]` | no | |
| `mcpServers` | object | no | |
| `canUseToolPolicy` | object | no | `{ autoApprove?, autoDeny? }`. |
| `hooks` | object | no | `{ preToolCall?, postToolCall? }`. |
| `maxTurns` | `number` | no | Positive. |
| `outputFormat` | `string` | no | |
| `author` | `string` | no | |
| `source` | `string` | no | A URL. |
| `tests` | array | no | `{ task, expectedKeywords }` entries. |
| `supportedRuntimes` | `string[]` | no | Runtime ids. |
| `preferredRuntime` | `string` | no | A runtime id. |
| `runtimeOverrides` | object | no | Per-runtime overrides. |
| `capabilityOverrides` | object | no | Per-runtime capability overrides. |

- **Response** `201`: `{ "ok": true }`.
- **Errors**:
  - `400` on validation failure: `{ "error": "<joined issue messages>" }`.
  - `400` on any other failure, including a duplicate id: `{ "error": "<message>" }`, or `{ "error": "Failed to create profile" }`.
- **Side effects**: writes `agent.yaml` and `SKILL.md` for the new profile and reloads the profile registry.

### GET /api/agents/{id}

Fetches one profile by id.

- **Request**: none.
- **Response** `200`: the full profile object, including `skillMd`, `supportedRuntimes`, `isBuiltin`, `scope`, and `readOnly`.
- **Errors**: `404` when not found: `{ "error": "Profile not found" }`.
- **Side effects**: reads only.

### PUT /api/agents/{id}

Updates a custom profile's config and `SKILL.md`. Project-scoped and built-in profiles are read-only.

- **Request** body (JSON): the same shape as `POST /api/agents`.
- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `403` when the profile is project-scoped or read-only: `{ "error": "Project-scoped profiles are read-only. Edit them in your project's .claude/skills/ directory." }`.
  - `403` when the profile is built-in: `{ "error": "Cannot modify built-in profiles" }`.
  - `400` on validation failure: `{ "error": "<joined issue messages>" }`.
  - `400` on any other failure, including an unknown id: `{ "error": "<message>" }`, or `{ "error": "Failed to update profile" }`.
- **Side effects**: overwrites the profile's `agent.yaml` and `SKILL.md` and reloads the registry.

### DELETE /api/agents/{id}

Deletes a custom profile's directory from disk. Project-scoped and built-in profiles cannot be deleted.

- **Request**: none.
- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `403` when the profile is project-scoped or read-only: `{ "error": "Project-scoped profiles are read-only. Edit them in your project's .claude/skills/ directory." }`.
  - `403` when the profile is built-in: `{ "error": "Cannot delete built-in profiles" }`.
  - `400` on any other failure, including an unknown id: `{ "error": "<message>" }`, or `{ "error": "Failed to delete profile" }`.
- **Side effects**: removes the profile directory and reloads the registry.

### GET /api/agents/{id}/context

Returns a profile's learned-context version history plus its current size.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "history": [
      {
        "id": "string",
        "profileId": "string",
        "version": 1,
        "content": "string | null",
        "diff": "string | null",
        "changeType": "approved",
        "sourceTaskId": "string | null",
        "proposalNotificationId": "string | null",
        "proposedAdditions": "string | null",
        "approvedBy": "string | null",
        "createdAt": "string"
      }
    ],
    "currentSize": 0,
    "limit": 0,
    "needsSummarization": false
  }
  ```
  `changeType` is one of `proposal`, `approved`, `rejected`, `rollback`, `summarization`. `history` is ordered newest version first.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/agents/{id}/context

Appends learned context directly, bypassing the proposal flow. The addition is recorded as approved.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `additions` | `string` | yes | Non-empty. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**: `400` when `additions` is missing or blank: `{ "error": "additions is required" }`.
- **Side effects**: inserts an approved learned-context version. When the merged content exceeds the summarization threshold, it also runs a model to summarize and records a summarization version.

### PATCH /api/agents/{id}/context

Approves or rejects a context proposal, or rolls back to a prior version.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | `string` | yes | One of `approve`, `reject`, `rollback`. |
| `notificationId` | `string` | for `approve` and `reject` | The proposal to act on. |
| `targetVersion` | `number` | for `rollback` | The version to roll back to. |
| `editedContent` | `string` | no | An optional override applied on approve. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `400` when `action` is missing: `{ "error": "action is required (approve | reject | rollback)" }`.
  - `400` when a required id or version for the action is missing: `{ "error": "notificationId is required for approve" }`, the same for `reject`, or `{ "error": "targetVersion is required for rollback" }`.
  - `400` on an unknown action: `{ "error": "Unknown action: <action>" }`.
  - `400` on any failure inside the action, such as a missing proposal or version: `{ "error": "<message>" }`.
- **Side effects**: on approve, records an approved version, updates the proposal notification, and may summarize. On reject, records a rejected version and updates the notification. On rollback, records a rollback version.

### POST /api/agents/{id}/test

Runs a profile's full behavioral test suite on a runtime and stores the report.

- **Request** body (JSON), optional:

| Field | Type | Required | Notes |
|---|---|---|---|
| `runtimeId` | `string` | no | Defaults to `claude-code`. An unknown value falls back to the default rather than erroring. |

- **Response** `200`:
  ```json
  {
    "profileId": "string",
    "profileName": "string",
    "runtimeId": "claude-code",
    "results": [
      { "task": "string", "expectedKeywords": ["string"], "foundKeywords": ["string"], "missingKeywords": ["string"], "passed": true }
    ],
    "totalPassed": 0,
    "totalFailed": 0,
    "unsupported": false,
    "unsupportedReason": "string"
  }
  ```
  `unsupported` and `unsupportedReason` appear when the runtime cannot run the suite.
- **Errors**:
  - `429` when a budget guardrail blocks the run: `{ "error": "<message>" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Test execution failed" }`.
- **Side effects**: runs the profile's tests live against the runtime, which uses model calls and records usage. When the suite is supported, replaces the stored test report for that profile and runtime.

### GET /api/agents/{id}/test-results

Returns the most recent stored test report for a profile and runtime.

- **Request** query parameter:

| Parameter | Type | Notes |
|---|---|---|
| `runtimeId` | `string` | Defaults to `claude-code`. |

- **Response** `200`: a test report, the same shape as the `POST /api/agents/{id}/test` response.
- **Errors**: `404` with a `null` body when no report is stored.
- **Side effects**: reads only.

### POST /api/agents/{id}/test-single

Runs a single test case from a profile's suite, for per-test progress.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `testIndex` | `number` | yes | The index of the test to run. |
| `runtimeId` | `string` | no | Defaults to `claude-code`. |

- **Response** `200`: a single test result:
  ```json
  { "task": "string", "expectedKeywords": ["string"], "foundKeywords": ["string"], "missingKeywords": ["string"], "passed": true }
  ```
- **Errors**:
  - `404` when the profile is not found: `{ "error": "Profile not found" }`.
  - `400` when the test index is out of range or the runtime is unsupported: `{ "error": "Invalid test index or unsupported runtime" }`.
  - `429` when a budget guardrail blocks the run: `{ "error": "<message>" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Test execution failed" }`.
- **Side effects**: runs one test live against the runtime. The single-test route does not store a report.

### POST /api/agents/assist

Drafts or refines an agent profile from a natural-language goal: it can generate a new `SKILL.md`, refine an existing one, or suggest tests. It calls a model before responding.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `goal` | `string` | yes | Non-empty. |
| `domain` | `"work" \| "personal"` | no | |
| `mode` | `string` | no | One of `generate`, `refine-skillmd`, `suggest-tests`. Defaults to `generate`. |
| `existingSkillMd` | `string` | no | For the refine and suggest-tests modes. |
| `existingTags` | `string[]` | no | |

- **Response** `200`:
  ```json
  {
    "name": "string",
    "description": "string",
    "domain": "work",
    "tags": ["string"],
    "skillMd": "string",
    "allowedTools": ["string"],
    "canUseToolPolicy": { "autoApprove": ["string"], "autoDeny": ["string"] },
    "maxTurns": 0,
    "outputFormat": "string",
    "supportedRuntimes": ["string"],
    "tests": [ { "task": "string", "expectedKeywords": ["string"] } ],
    "reasoning": "string"
  }
  ```
- **Errors**:
  - `400` when `goal` is missing or blank: `{ "error": "Provide a goal description" }`.
  - `429` when a budget guardrail blocks the call: `{ "error": "<message>" }`.
  - `500` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Profile assist failed" }`.
- **Side effects**: runs a model to produce the draft. It does not write a profile.

### POST /api/agents/import

Imports a single profile from a GitHub URL, fetching its `profile.yaml` and adjacent `SKILL.md`.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `url` | `string` | yes | A `github.com` or `raw.githubusercontent.com` URL. |

- **Response** `201`: `{ "ok": true, "id": "string", "name": "string" }`.
- **Errors**:
  - `400` when `url` is missing: `{ "error": "url is required" }`.
  - `400` when the URL is not a GitHub URL: `{ "error": "Only GitHub URLs are supported (github.com or raw.githubusercontent.com)" }`.
  - `400` when the `profile.yaml` cannot be fetched: `{ "error": "Failed to fetch profile.yaml: <status>" }`.
  - `400` when the `profile.yaml` is invalid: `{ "error": "Invalid profile.yaml: <issues>" }`.
  - `400` on any other failure, including a duplicate id: `{ "error": "<message>" }`, or `{ "error": "Import failed" }`.
- **Side effects**: fetches from GitHub and writes a new profile on disk. A missing `SKILL.md` is tolerated; the profile is created with an empty body.

### GET /api/agents/import-repo

Lists all recorded repository imports, newest first.

- **Request**: none.
- **Response** `200`: a JSON array:
  ```json
  [
    {
      "id": "string",
      "repoUrl": "string",
      "repoOwner": "string",
      "repoName": "string",
      "branch": "string",
      "commitSha": "string",
      "profileIds": ["string"],
      "skillCount": 0,
      "lastCheckedAt": "number | null",
      "createdAt": "number"
    }
  ]
  ```
- **Errors**: `500` on failure: `{ "error": "<message>" }`, or `{ "error": "Failed to list repo imports" }`.
- **Side effects**: reads only.

### POST /api/agents/import-repo/scan

Scans a GitHub repository to discover importable skills.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `url` | `string` | yes | The repository URL. |

- **Response** `200`:
  ```json
  {
    "owner": "string",
    "repo": "string",
    "branch": "string",
    "commitSha": "string",
    "discoveredSkills": [
      { "name": "string", "path": "string", "format": "ainative", "hasProfileYaml": true, "hasSkillMd": true, "hasSkillMdTmpl": false, "hasReadme": true, "description": "string", "frontmatter": {} }
    ],
    "repoReadme": "string",
    "scanDurationMs": 0
  }
  ```
  `format` is one of `ainative`, `skillmd-only`, `unknown`.
- **Errors**:
  - `400` when `url` is missing: `{ "error": "url is required" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Scan failed" }`.
- **Side effects**: reads the repository over the GitHub API. No writes.

### POST /api/agents/import-repo/preview

Fetches the selected skills' content, adapts their format, and checks each against existing profiles for duplicates.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `owner` | `string` | yes | |
| `repo` | `string` | yes | |
| `branch` | `string` | yes | |
| `skills` | array | yes | The discovered skills to preview. Non-empty. |
| `commitSha` | `string` | no | |
| `repoUrl` | `string` | no | |
| `repoReadme` | `string` | no | Enrichment context. |

- **Response** `200`: `{ "previews": [ ... ] }`. Each preview is a success shape (`skill`, `config`, `skillMd`, `dedup`, `error: null`) or a per-skill failure shape (`config: null`, `skillMd: null`, `dedup: null`, `error: "<message>"`).
- **Errors**:
  - `400` when a required field is missing: `{ "error": "Missing required fields" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Preview failed" }`.
- **Side effects**: fetches each skill from GitHub and reads existing profiles. No writes.

### POST /api/agents/import-repo/confirm

Runs a batch import (create, replace, or skip per item) and records the repository import.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `repoUrl` | `string` | yes | |
| `imports` | array | yes | `{ config, skillMd, action }` entries where `action` is `import`, `replace`, or `skip`. Non-empty. |
| `owner` | `string` | no | Recorded on the import. |
| `repo` | `string` | no | Recorded on the import. |
| `branch` | `string` | no | Recorded on the import. |
| `commitSha` | `string` | no | Recorded on the import. |

- **Response** `201`:
  ```json
  { "ok": true, "imported": 0, "replaced": 0, "skipped": 0, "profileIds": ["string"], "errors": ["string"] }
  ```
  `errors` is present only when at least one item failed; per-item failures do not fail the request.
- **Errors**:
  - `400` when a required field is missing: `{ "error": "Missing required fields" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Import failed" }`.
- **Side effects**: writes profiles on disk (creating or replacing per item) and reloads the registry. When any profile succeeded, records one repository-import row.

### POST /api/agents/import-repo/check-updates

Checks whether imported profiles have newer content in their source repositories.

- **Request** body (JSON), provide one selector:

| Field | Type | Required | Notes |
|---|---|---|---|
| `repoImportId` | `string` | one of | Checks all profiles in that recorded import. |
| `profileId` | `string` | one of | Checks a single imported profile. |

- **Response** `200`:
  ```json
  {
    "hasUpdates": false,
    "updates": [
      { "profileId": "string", "profileName": "string", "localHash": "string", "remoteHash": "string", "hasUpdate": false }
    ]
  }
  ```
  A `remoteHash` of `unknown` or `fetch-error` means the source could not be read, and `hasUpdate` is `false` for that entry.
- **Errors**:
  - `404` when a `repoImportId` is not found: `{ "error": "Repo import not found" }`.
  - `400` when a `profileId` has no import metadata: `{ "error": "Profile has no import metadata" }`.
  - `400` when neither selector is provided: `{ "error": "Provide repoImportId or profileId" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Update check failed" }`.
- **Side effects**: reads the source repositories over the GitHub API. When a `repoImportId` is given, updates that import's last-checked time.

### POST /api/agents/import-repo/apply-updates

Re-fetches and applies accepted updates to previously imported profiles.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `updates` | array | yes | `{ profileId, accept }` entries. Non-empty. |

- **Response** `200`:
  ```json
  { "ok": true, "applied": 0, "skipped": 0, "errors": ["string"] }
  ```
  Entries with `accept` false count as skipped; `errors` is present only when at least one item failed.
- **Errors**:
  - `400` when `updates` is empty or missing: `{ "error": "No updates provided" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Apply updates failed" }`.
- **Side effects**: fetches from GitHub and rewrites each accepted profile's `agent.yaml` and `SKILL.md`, then reloads the registry.

### GET /api/chat/branching/flag

Reports whether the chat-branching feature is enabled on this instance.

- **Request**: none.
- **Response** `200`: `{ "enabled": false }`.
- **Errors**: none returned.
- **Side effects**: reads only.

### GET /api/chat/conversations

Lists conversations, newest updated first, with optional filters.

- **Request** query parameters, all optional:

| Parameter | Type | Notes |
|---|---|---|
| `status` | `"active" \| "archived"` | |
| `projectId` | `string` | |
| `limit` | `number` | |

- **Response** `200`: a JSON array of conversation rows:
  ```json
  [
    {
      "id": "string",
      "projectId": "string | null",
      "title": "string | null",
      "runtimeId": "string",
      "modelId": "string | null",
      "status": "active",
      "sessionId": "string | null",
      "contextScope": "string | null",
      "activeSkillId": "string | null",
      "activeSkillIds": ["string"],
      "parentConversationId": "string | null",
      "branchedFromMessageId": "string | null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
  ```
  `status` is one of `active`, `archived`.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/chat/conversations

Creates a conversation, optionally as a branch of an existing one. When the project has a working directory, its environment is scanned in the background.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `runtimeId` | `string` | yes | One of `claude-code`, `openai-codex-app-server`, `ollama`. |
| `projectId` | `string` | no | Triggers an environment scan when the project has a working directory. |
| `title` | `string` | no | |
| `modelId` | `string` | no | |
| `parentConversationId` | `string` | no | Must be paired with `branchedFromMessageId`. |
| `branchedFromMessageId` | `string` | no | Must be paired with `parentConversationId`, and must belong to the parent. |

- **Response** `201`: the created conversation row (same shape as the list element).
- **Errors**:
  - `400` when `runtimeId` is missing: `{ "error": "runtimeId is required" }`.
  - `400` on an invalid `runtimeId`: `{ "error": "Invalid runtimeId. Must be one of: claude-code, openai-codex-app-server, ollama" }`.
  - `400` when only one of the branch pair is provided: `{ "error": "parentConversationId and branchedFromMessageId must both be provided when creating a branch" }`.
  - `404` when the parent conversation is not found: `{ "error": "Parent conversation <id> not found" }`.
  - `400` when the branch point does not belong to the parent: `{ "error": "branchedFromMessageId <id> does not belong to conversation <id>" }`.
- **Side effects**: inserts one conversation row. When the project has a working directory, scans its environment in the background.

### GET /api/chat/conversations/{id}

Returns a conversation and its message count.

- **Request**: none.
- **Response** `200`: the conversation row plus `messageCount`.
- **Errors**: `404` when not found: `{ "error": "Conversation not found" }`.
- **Side effects**: reads only.

### PATCH /api/chat/conversations/{id}

Updates a conversation's title, status, model, or runtime.

- **Request** body (JSON), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `title` | `string \| null` | |
| `status` | `"active" \| "archived"` | |
| `modelId` | `string \| null` | |
| `runtimeId` | `string` | Not restricted to the creation allowlist here. |

- **Response** `200`: the updated conversation row.
- **Errors**:
  - `404` when not found: `{ "error": "Conversation not found" }`.
  - `400` on an invalid status: `{ "error": "status must be 'active' or 'archived'" }`.
- **Side effects**: updates the conversation row.

### DELETE /api/chat/conversations/{id}

Deletes a conversation and all of its messages.

- **Request**: none.
- **Response** `204`: no body.
- **Errors**: `404` when not found: `{ "error": "Conversation not found" }`.
- **Side effects**: deletes the conversation's messages, then the conversation.

### GET /api/chat/conversations/{id}/branches

Returns every conversation in the same branch tree. Available only when chat branching is enabled.

- **Request**: none.
- **Response** `200`: `{ "family": [ <conversation rows> ] }`.
- **Errors**:
  - `404` when branching is disabled: `{ "error": "Not found" }`.
  - `404` when the conversation is not found: `{ "error": "Conversation not found" }`.
- **Side effects**: reads only.

### GET /api/chat/conversations/{id}/messages

Fetches a conversation's message history, optionally after a cursor.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `after` | `string` | A message id. Returns messages newer than it. |
| `limit` | `number` | |

- **Response** `200`: a JSON array of message rows, oldest first:
  ```json
  [
    {
      "id": "string",
      "conversationId": "string",
      "role": "user",
      "content": "string",
      "metadata": "string | null",
      "status": "complete",
      "rewoundAt": "string | null",
      "createdAt": "string"
    }
  ]
  ```
  `role` is one of `user`, `assistant`, `system`. `status` is one of `pending`, `streaming`, `complete`, `error`.
- **Errors**: `404` when the conversation is not found: `{ "error": "Conversation not found" }`.
- **Side effects**: reads only.

### POST /api/chat/conversations/{id}/messages

Persists a user message and streams the assistant's response as Server-Sent Events. This is the main chat turn.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `content` | `string` | yes | Non-empty. |
| `mentions` | any | no | Entity mentions passed through to the engine. |

- **Response** `200`, streaming, with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Each event is `data: <JSON>`, with a keepalive comment (`: keepalive`) every 15 seconds. The event shapes are:
  - `{ "type": "delta", "content": "string" }`
  - `{ "type": "status", "phase": "string", "message": "string" }`
  - `{ "type": "done", "messageId": "string", "quickAccess": [ ... ], "modelId": "string" }`
  - `{ "type": "error", "message": "string" }`
  - `{ "type": "permission_request", "requestId": "string", "messageId": "string", "toolName": "string", "toolInput": {} }`
  - `{ "type": "question", "requestId": "string", "messageId": "string", "questions": [ ... ] }`
  - `{ "type": "screenshot", "documentId": "string", "thumbnailUrl": "string", "originalUrl": "string", "width": 0, "height": 0 }`

  The stream ends after a `done` or `error` event. A `permission_request` or `question` event pauses the turn until you answer it through `POST /api/chat/conversations/{id}/respond`.
- **Errors** (before the stream starts, as JSON):
  - `400` when `content` is missing or not a string: `{ "error": "content is required and must be a string" }`.
  - `404` when the conversation is not found: `{ "error": "Conversation not found" }`.
  - Once streaming has started, failures arrive as `error` events, not HTTP status codes.
- **Side effects**: persists the user message, runs the agent turn against the conversation's runtime, streams the assistant reply, and persists it. The turn may create documents such as screenshots and may request tool permissions.

### POST /api/chat/conversations/{id}/redo

Restores the most recently rewound message pair. Available only when chat branching is enabled.

- **Request**: none.
- **Response** `200`: `{ "restoredMessageIds": ["string"] }`. The array is empty when nothing was rewound.
- **Errors**:
  - `404` when branching is disabled: `{ "error": "Not found" }`.
  - `404` when the conversation is not found: `{ "error": "Conversation not found" }`.
- **Side effects**: clears the rewound mark on the most recent rewound pair.

### POST /api/chat/conversations/{id}/respond

Answers a pending permission request or question raised during a streaming chat turn, unblocking the turn.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `requestId` | `string` | yes | The pending request to resolve. |
| `behavior` | `string` | yes | `allow` or `deny`. |
| `messageId` | `string` | no | Updates that message's status when present. |
| `updatedInput` | any | no | Forwarded on allow. |
| `message` | `string` | no | Forwarded on deny. |
| `alwaysAllow` | `boolean` | no | Persists a permission rule when allowing. |
| `permissionPattern` | `string` | no | The rule pattern. |
| `toolName` | `string` | no | Used with `toolInput` to build a pattern when none is given. |
| `toolInput` | object | no | |

- **Response** `200`: `{ "ok": true, "stale": false }`. `stale` is `true` when the pending request had already been resolved.
- **Errors**:
  - `400` when `requestId` or `behavior` is missing: `{ "error": "requestId and behavior are required" }`.
  - `500` when the pending request could not be resolved: `{ "error": "Failed to resolve request" }`.
- **Side effects**: resolves the in-flight request so the streaming turn continues. When allowing with `alwaysAllow`, persists a permission rule. When `messageId` is present, updates that message's status.

### POST /api/chat/conversations/{id}/rewind

Marks the message pair containing a given assistant message as rewound, returning the user's original content for the composer. Available only when chat branching is enabled.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `assistantMessageId` | `string` | yes | The assistant message to rewind from. |

- **Response** `200`: `{ "rewoundUserContent": "string | null" }`.
- **Errors**:
  - `404` when branching is disabled: `{ "error": "Not found" }`.
  - `404` when the conversation is not found: `{ "error": "Conversation not found" }`.
  - `400` when `assistantMessageId` is missing: `{ "error": "assistantMessageId is required" }`.
- **Side effects**: marks the assistant message and its preceding user message as rewound.

### POST /api/chat/conversations/{id}/skills/activate

Activates a skill on a conversation, with conflict detection against already-active skills.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `skillId` | `string` | yes | Non-empty. |
| `mode` | `"replace" \| "add"` | no | Defaults to `replace`. |
| `force` | `boolean` | no | Bypasses the conflict block. Defaults to `false`. |

- **Response** `200` in both success and conflict cases:
  - Success: `{ "activatedSkillId": "string", "activeSkillIds": ["string"], "skillName": "string", "note": "string" }` (`note` only when present).
  - Conflict: `{ "requiresConfirmation": true, "conflicts": [ { "skillA": "string", "skillB": "string", "sharedTopic": "string", "excerptA": "string", "excerptB": "string" } ], "hint": "Re-call with force=true to add anyway" }`.
- **Errors**:
  - `400` on invalid JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on validation failure: `{ "error": "<joined issue messages>" }`.
  - `404` when the conversation or skill is not found: `{ "error": "<message>" }`.
  - `400` on any other activation failure, such as an unsupported runtime or too many active skills: `{ "error": "<message>" }`.
- **Side effects**: on success, updates the conversation's active skills.

### POST /api/chat/conversations/{id}/skills/deactivate

Clears all active skills on a conversation. This is idempotent.

- **Request**: none.
- **Response** `200`: `{ "previousSkillId": "string | null" }`.
- **Errors**:
  - `404` when the conversation is not found: `{ "error": "<message>" }`.
  - `400` on any other failure: `{ "error": "<message>" }`.
- **Side effects**: clears the conversation's active skills.

### GET /api/chat/entities/search

Searches across projects, tasks, workflows, documents, schedules, tables, and agent profiles, returning one flat result list.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `q` | `string` | The search text. An empty query returns the most recent items per type. |
| `limit` | `number` | Defaults to 20, capped at 30. |

- **Response** `200`:
  ```json
  {
    "results": [
      { "entityType": "project", "entityId": "string", "label": "string", "status": "string", "description": "string" }
    ]
  }
  ```
  `entityType` is one of `project`, `task`, `workflow`, `document`, `schedule`, `table`, `profile`. `status` and `description` appear where the entity has them.
- **Errors**: none returned explicitly. A failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/chat/export

Exports chat markdown to a file and registers it as a document.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | 1 to 200 characters. |
| `markdown` | `string` | yes | Non-empty. |
| `conversationId` | `string \| null` | no | Recorded on the document. |

- **Response** `201`: `{ "id": "string", "filename": "string" }`.
- **Errors**: `400` on an invalid or unparseable body: `{ "error": "Invalid body", "details": [ ... ] }`.
- **Side effects**: writes a Markdown file to the chat-exports directory and inserts an output document row with source `chat-export`.

### GET /api/chat/files/search

Searches files under the active project's working directory, or the launch directory, honoring `.gitignore`. The search root is resolved on the server; a client cannot point it at an arbitrary path.

- **Request** query parameters, all optional:

| Parameter | Type | Notes |
|---|---|---|
| `q` | `string` | Matches file name or path. An empty query returns all tracked files. |
| `limit` | `number` | Defaults to 20, clamped to 1 through 50. |
| `projectId` | `string` | Selects the project whose working directory is searched. |

- **Response** `200`:
  ```json
  { "results": [ { "path": "string", "sizeBytes": 0, "mtime": 0 } ] }
  ```
  `path` is relative to the search root; `mtime` is an epoch in milliseconds. When the root is not a git repository, the result is an empty list.
- **Errors**: `500` on failure: `{ "error": "<message>" }`, or `{ "error": "file search failed" }`.
- **Side effects**: reads only. Runs `git ls-files` under the search root with a short timeout.

### GET /api/chat/models

Returns the chat models available from the configured SDKs, falling back to a built-in list when a provider cannot be reached.

- **Request**: none.
- **Response** `200`: a JSON array:
  ```json
  [
    { "id": "string", "label": "string", "provider": "anthropic", "tier": "string", "costLabel": "string" }
  ]
  ```
  `provider` is one of `anthropic`, `openai`, `ollama`.
- **Errors**: none returned. Provider probes fall back to the built-in list.
- **Side effects**: reads only. May probe the configured SDKs and cache the result.

### GET /api/chat/suggested-prompts

Returns context-aware suggested-prompt categories for the chat composer.

- **Request**: none.
- **Response** `200`: a JSON array:
  ```json
  [
    { "id": "string", "label": "string", "icon": "string", "prompts": [ { "label": "string", "prompt": "string" } ] }
  ]
  ```
  `icon` is an icon name.
- **Errors**: none returned.
- **Side effects**: reads only.

### GET /api/runtimes/ollama

Tests the configured Ollama endpoint and returns normalized model details from its tags response.

- **Request**: none.
- **Response** `200`: `{ "runtimeId": "ollama", "models": [ ... ] }`. Each model can include `id`, `name`, `provider`, `family`, `format`, `parameterSize`, `quantization`, `sizeBytes`, and `modifiedAt`; missing upstream metadata is returned as null.
- **Errors**:
  - `502` when Ollama responds with a non-success status: `{ "phase": "connection", "error": "Ollama request failed (<status>): <bounded detail>" }`.
  - `502` when the tags response is malformed: `{ "phase": "discovery", "error": "Ollama returned invalid model discovery data" }`.
  - `502` on a connection failure or timeout: `{ "phase": "connection", "error": "<message>", "hint": "Make sure the configured Ollama server is reachable from Relay." }`.
- **Side effects**: calls the configured Ollama server. Raw API keys and provider-echoed credential fingerprints are not returned.

### POST /api/runtimes/ollama

Pulls a model on the local Ollama server. This blocks until the pull finishes.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | `string` | yes | Must be `pull`. |
| `model` | `string` | yes | The model to pull. |

- **Response** `200`: `{ "runtimeId": "ollama", "action": "pull", "model": "string", "status": "completed", ... }`, merged with non-conflicting fields from Ollama's response.
- **Errors**:
  - `400` when the strict `{ action: "pull", model }` body is invalid: `{ "phase": "acquisition", "error": "<validation message>" }`.
  - `502` when the Ollama pull responds with a non-success status: `{ "phase": "acquisition", "error": "Ollama pull failed (<status>): <bounded detail>" }`.
  - `502` on any other failure: `{ "phase": "acquisition", "error": "<message>" }`.
- **Side effects**: instructs the configured Ollama server to download the model, then invalidates Relay's model-discovery cache.

### POST /api/runtimes/suggest

Returns an advisory runtime order for a task under the saved routing policy and eligible-runtime pool.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | Non-empty task title. Exact runtime-name signals can affect affinity. |
| `description` | `string \| null` | no | Combined with the title for affinity signals. |
| `profileId` | `string \| null` | no | An eligible profile-preferred runtime wins when present. |

- **Response** `200`:
  ```json
  { "runtimeId": "claude-code", "orderedRuntimeIds": ["claude-code"], "reason": "string", "evidence": "pool-order", "advisory": true }
  ```
  Manual policy returns its strict default as the only ordered runtime. Automatic policies consider only configured members of the saved eligible pool; comparable configured-model cost is used only when known, while unknown cost, latency, and quality retain saved pool order.
- **Errors**:
  - `400` when the strict request body is invalid: `{ "error": "A non-empty title and valid suggestion payload are required" }`.
  - `409` when no configured runtime is eligible for automatic routing.
- **Side effects**: reads routing, runtime setup, profile, and pricing metadata only. It does not probe health or persist a selection.

### GET /api/runtimes/openai-compatible/{runtimeId}

Discovers models from a configured LiteLLM or LM Studio endpoint, or reads one LM Studio download job when `downloadJobId` is supplied.

- **Request**: `runtimeId` must be `litellm` or `lmstudio`. Optional query: `downloadJobId=<id>`; this is valid only for LM Studio.
- **Response** `200`: model discovery returns `{ "runtimeId": "litellm | lmstudio", "models": [ ... ] }` with normalized provider-reported details. A download-status request returns `{ "runtimeId": "lmstudio", "action": "download", ... }`.
- **Errors**:
  - `404` for any other runtime id: `{ "error": "runtimeId must be litellm or lmstudio" }`.
  - `400` when LiteLLM receives a download-status query because LiteLLM artifacts are managed by its administrator.
  - `502` when configuration, connection, discovery, or status lookup fails: `{ "phase": "discovery", "error": "<message>" }`.
- **Side effects**: calls the configured compatible endpoint and reads settings only.

### POST /api/runtimes/openai-compatible/{runtimeId}

Starts an LM Studio model download. LiteLLM does not expose this operation through Relay.

- **Request** body (JSON): `{ "action": "download", "model": "<model id>", "quantization": "<optional variant>" }`.
- **Response** `200`: `{ "runtimeId": "lmstudio", "action": "download", "model": "string", ... }` with LM Studio's normalized job status.
- **Errors**:
  - `404` for an unknown runtime id.
  - `400` for LiteLLM or an invalid strict request body.
  - `502` when LM Studio rejects or cannot start the download.
- **Side effects**: asks the configured LM Studio server to download the selected model artifact.

## Examples

Create a conversation, then send a message and read the streamed reply:

```bash
curl -X POST http://127.0.0.1:3000/api/chat/conversations \
  -H "Content-Type: application/json" \
  -d '{ "runtimeId": "claude-code" }'

curl -N -X POST http://127.0.0.1:3000/api/chat/conversations/<conversationId>/messages \
  -H "Content-Type: application/json" \
  -d '{ "content": "List the open tasks on the Acme project." }'
```

The `-N` flag keeps `curl` from buffering, so you see each streamed event as it arrives.

Answer a permission request the stream raised, so the turn can continue:

```bash
curl -X POST http://127.0.0.1:3000/api/chat/conversations/<conversationId>/respond \
  -H "Content-Type: application/json" \
  -d '{ "requestId": "<requestId>", "behavior": "allow" }'
```

Create a custom agent profile:

```bash
curl -X POST http://127.0.0.1:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
        "id": "release-notes",
        "name": "Release Notes Writer",
        "version": "1.0.0",
        "domain": "work",
        "tags": ["writing"],
        "skillMd": "# Release Notes Writer\n\nWrite customer-facing release notes."
      }'
```

List the models discovered from your configured providers:

```bash
curl http://127.0.0.1:3000/api/chat/models
```

## Do Not Depend On

- Agent profiles are files on disk, not database rows. A profile's identity is its directory, and built-in and project-scoped profiles are read-only through this API. Edit project-scoped profiles in the project's own skills directory.
- The chat message stream reports in-turn failures as `error` events after a `200` has already been sent. Do not treat the `200` as proof the turn succeeded; watch for the `done` event and handle `error` events.
- A `permission_request` or `question` event pauses the turn until you answer it through the respond route. A turn can stall indefinitely if you never answer.
- The branching routes (`branches`, `redo`, `rewind`) return `404` with `{ "error": "Not found" }` when chat branching is disabled. This is indistinguishable from a genuinely missing conversation on that first check; confirm the feature is enabled before relying on them.
- Conversation creation validates `runtimeId` against Relay's current runtime catalog, which includes direct providers and configured OpenAI-compatible runtimes. Treat the catalog as extensible instead of hardcoding a fixed list.
- Runtime model discovery responses are normalized by Relay, but optional model metadata still depends on what the configured Ollama, LiteLLM, or LM Studio server reports. Treat optional fields as nullable and additive.
- A test report is stored only by the full-suite `POST /api/agents/{id}/test`. The single-test route runs live but stores nothing, so a later `GET /api/agents/{id}/test-results` will not reflect single-test runs.
