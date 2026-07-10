---
id: "05-packs-apps-tables-publishing"
title: "Packs, Apps, Tables, And Publishing API"
status: "draft"
stability: "app-internal"
families: ["packs","apps","tables","views"]
---

## Who This Is For

This group is for a developer working with Relay's composable building blocks: installing and updating packs, inspecting and deleting the apps a pack installs, building and querying user tables (the spreadsheet-like data store), enriching table rows with agent work, and publishing a generated site to a target you own. Read this if you are installing a pack programmatically, driving a table's rows and columns, wiring a row trigger, or automating a publish to GitHub Pages.

## Stability

`app-internal`

These routes power the Relay web app. They are documented so you can build against a local instance, but their request and response shapes are tied to the app's own screens and may change between releases. Branch on HTTP status codes rather than on the internal structure of an error body, and treat every response field as additive.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. These routes read and write the local SQLite database, read and write files on disk, run background jobs, and in the publish path make outbound calls to a git host on your behalf.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Packs install by bundled id only.** The install and update routes accept a bundled template id, not a filesystem path or a git URL. Installing a pack from a git URL is a separate command-line flow, not one of these routes.
- **Licensing.** A paid pack that is not licensed returns `402` with `code` `license_required`. The `installPack` path checks the persisted license store, with no development bypass.
- **JSON-string columns are returned as-is.** Table rows, column configs, trigger conditions, and view filters are stored as JSON strings and, on the raw-select routes, come back as strings, not parsed objects. Parse them client-side. The chart routes are the exception and parse `config` for you.
- **Row writes fire triggers.** Adding, updating, or deleting a row evaluates that table's triggers in the background (row-added, row-updated, row-deleted). Trigger evaluation and any workflow it launches are fire-and-forget: a `2xx` from the row route does not mean a trigger finished or even ran to completion.
- **Enrichment and publish are background jobs.** The enrich and publish routes return `202` and run the actual work asynchronously. Poll the run-list or deployment route for the outcome.
- **Timestamps.** Database timestamp columns serialize to ISO date strings on the wire. Two responses are exceptions and carry a numeric value instead: an app's `createdAt` is a filesystem modification time in milliseconds, noted where it appears.
- **Secrets are masked on read.** Publish-target configs mask credential keys (`token`, `githubToken`, `apiKey`) to `****` plus the last four characters. The unmasked value is stored only on disk.
- **Validation.** Some routes validate with Zod and some by hand. Error bodies are `{ "error": "<message>" }`, with several routes adding a `code` field; the shape is noted per route. A Zod failure returns the flattened error object as the `error` value, not a string.

## Endpoint Families

- `packs`
- `apps`
- `tables`
- `views`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `POST` | `/api/packs/install` | `app-internal` | `src/app/api/packs/install/route.ts` |
| `POST` | `/api/packs/update` | `app-internal` | `src/app/api/packs/update/route.ts` |
| `GET` | `/api/apps` | `app-internal` | `src/app/api/apps/route.ts` |
| `DELETE`, `GET` | `/api/apps/{id}` | `app-internal` | `src/app/api/apps/[id]/route.ts` |
| `GET` | `/api/apps/{id}/deployments` | `app-internal` | `src/app/api/apps/[id]/deployments/route.ts` |
| `GET` | `/api/apps/{id}/deployments/{deploymentId}` | `app-internal` | `src/app/api/apps/[id]/deployments/[deploymentId]/route.ts` |
| `GET`, `POST` | `/api/apps/{id}/preview` | `app-internal` | `src/app/api/apps/[id]/preview/route.ts` |
| `GET` | `/api/apps/{id}/previews/{artifactId}/{path*}` | `app-internal` | `src/app/api/apps/[id]/previews/[artifactId]/[[...path]]/route.ts` |
| `POST` | `/api/apps/{id}/publish` | `app-internal` | `src/app/api/apps/[id]/publish/route.ts` |
| `GET`, `POST` | `/api/apps/{id}/publish-targets` | `app-internal` | `src/app/api/apps/[id]/publish-targets/route.ts` |
| `DELETE` | `/api/apps/{id}/publish-targets/{targetId}` | `app-internal` | `src/app/api/apps/[id]/publish-targets/[targetId]/route.ts` |
| `POST` | `/api/apps/{id}/publish-targets/{targetId}/test` | `app-internal` | `src/app/api/apps/[id]/publish-targets/[targetId]/test/route.ts` |
| `GET`, `PUT` | `/api/apps/{id}/site-settings` | `app-internal` | `src/app/api/apps/[id]/site-settings/route.ts` |
| `GET`, `POST` | `/api/tables` | `app-internal` | `src/app/api/tables/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/tables/{id}` | `app-internal` | `src/app/api/tables/[id]/route.ts` |
| `GET`, `POST` | `/api/tables/{id}/charts` | `app-internal` | `src/app/api/tables/[id]/charts/route.ts` |
| `DELETE`, `PATCH` | `/api/tables/{id}/charts/{chartId}` | `app-internal` | `src/app/api/tables/[id]/charts/[chartId]/route.ts` |
| `PATCH`, `POST` | `/api/tables/{id}/columns` | `app-internal` | `src/app/api/tables/[id]/columns/route.ts` |
| `POST` | `/api/tables/{id}/enrich` | `app-internal` | `src/app/api/tables/[id]/enrich/route.ts` |
| `POST` | `/api/tables/{id}/enrich/plan` | `app-internal` | `src/app/api/tables/[id]/enrich/plan/route.ts` |
| `GET` | `/api/tables/{id}/enrich/runs` | `app-internal` | `src/app/api/tables/[id]/enrich/runs/route.ts` |
| `GET` | `/api/tables/{id}/export` | `app-internal` | `src/app/api/tables/[id]/export/route.ts` |
| `GET` | `/api/tables/{id}/history` | `app-internal` | `src/app/api/tables/[id]/history/route.ts` |
| `POST` | `/api/tables/{id}/import` | `app-internal` | `src/app/api/tables/[id]/import/route.ts` |
| `GET`, `POST` | `/api/tables/{id}/rows` | `app-internal` | `src/app/api/tables/[id]/rows/route.ts` |
| `DELETE`, `PATCH` | `/api/tables/{id}/rows/{rowId}` | `app-internal` | `src/app/api/tables/[id]/rows/[rowId]/route.ts` |
| `GET`, `POST` | `/api/tables/{id}/rows/{rowId}/history` | `app-internal` | `src/app/api/tables/[id]/rows/[rowId]/history/route.ts` |
| `GET`, `PATCH`, `POST` | `/api/tables/{id}/triggers` | `app-internal` | `src/app/api/tables/[id]/triggers/route.ts` |
| `DELETE`, `PATCH` | `/api/tables/{id}/triggers/{triggerId}` | `app-internal` | `src/app/api/tables/[id]/triggers/[triggerId]/route.ts` |
| `GET`, `POST` | `/api/tables/templates` | `app-internal` | `src/app/api/tables/templates/route.ts` |
| `GET`, `POST` | `/api/views` | `app-internal` | `src/app/api/views/route.ts` |
| `DELETE`, `PATCH` | `/api/views/{id}` | `app-internal` | `src/app/api/views/[id]/route.ts` |

## Endpoint Reference

### POST /api/packs/install

Installs a bundled pack into the local instance.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | A bundled template id. Not a path or git URL. |

- **Response** `200`: an install report:
  ```json
  {
    "packId": "string",
    "packVersion": "string",
    "projectCreated": true,
    "tablesCreated": 0,
    "customersSeeded": 0,
    "profilesDropped": 0,
    "blueprintsDropped": 0,
    "rowsSeeded": 0,
    "schedulesRegistered": 0,
    "tier": "official",
    "tierVerified": true,
    "tierLabel": "string"
  }
  ```
  `tier` is `official`, `partner`, or `community`.
- **Errors**:
  - `400` when the body is not JSON: `{ "error": "Request body must be JSON.", "code": "bad_request" }`.
  - `400` on validation failure: `{ "error": "<joined issues>", "code": "validation_failed" }`.
  - `404` when no bundled pack matches: `{ "error": "No bundled pack named \"<id>\".", "code": "not_found" }`.
  - `402` when the pack requires a license: `{ "error": "<message>", "code": "license_required" }`.
  - `422` when the pack fails validation: `{ "error": "<message>", "code": "pack_invalid" }`.
  - `500` on any other failure: `{ "error": "<message>", "code": "install_failed" }`.
- **Side effects**: creates the parent project, user tables, and seed rows; drops profile and blueprint files; registers schedules; checks the license store.

### POST /api/packs/update

Updates an already-installed bundled pack to the bundled version.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | A bundled template id. |

- **Response** `200`: an update report `{ "packId": "string", "previousVersion": "string", "newVersion": "string", "upToDate": false, "backedUp": ["string"], "install": { ... } }`. `install` is the install report shape above and is absent when `upToDate` is true.
- **Errors**:
  - `400` when the body is not JSON: `{ "error": "Request body must be JSON.", "code": "bad_request" }`.
  - `400` on validation failure: `{ "error": "<joined issues>", "code": "validation_failed" }`.
  - `404` when no bundled pack matches: `{ "error": "No bundled pack named \"<id>\".", "code": "not_found" }`.
  - `409` when the pack is not installed: `{ "error": "<message>", "code": "not_installed" }`.
  - `402` when a license is required: `{ "error": "<message>", "code": "license_required" }`.
  - `422` when the pack fails validation: `{ "error": "<message>", "code": "pack_invalid" }`.
  - `500` on any other failure: `{ "error": "<message>", "code": "update_failed" }`.
- **Side effects**: backs up user-modified files, then runs the install path (same database and file writes), and checks the license store.

### GET /api/apps

Lists all installed apps from the file-based app registry.

- **Request**: none.
- **Response** `200`: a JSON array of app summaries, newest first. Each:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "rootDir": "string",
    "primitivesSummary": "string",
    "profileCount": 0,
    "blueprintCount": 0,
    "tableCount": 0,
    "scheduleCount": 0,
    "scheduleHuman": "string",
    "createdAt": 0,
    "files": ["string"],
    "entitlement": "string"
  }
  ```
  `createdAt` here is a filesystem modification time in milliseconds, not an ISO string. `description`, `scheduleHuman`, and `entitlement` may be null.
- **Errors**: `500` on failure: `{ "error": "Failed to list apps" }`.
- **Side effects**: reads only.

### GET /api/apps/{id}

Returns one app's full detail: the summary plus its parsed manifest.

- **Request**: none.
- **Response** `200`: the app summary fields plus `manifest`, the full parsed `manifest.yaml` object (`id`, `version`, `name`, `profiles`, `blueprints`, `tables`, `schedules`, `view`, and more).
- **Errors**: `404` when not found: `{ "error": "Pack not found" }`.
- **Side effects**: reads only.

### DELETE /api/apps/{id}

Cascade-deletes an app: its manifest directory, its project, its namespaced profiles and blueprints, and its schedule rows.

- **Request**: none.
- **Response** `200`: `{ "success": true, "filesRemoved": true, "projectRemoved": true, "profilesRemoved": 0, "blueprintsRemoved": 0 }`.
- **Errors**:
  - `400` when the id is empty: `{ "error": "Pack id is required" }`.
  - `404` when nothing was removed: `{ "error": "Pack not found" }`.
  - `500` on failure: `{ "error": "Failed to delete pack" }`.
- **Side effects**: deletes the app directory, the project (cascade), the app's profile directories and blueprint files, and its schedule rows, then invalidates the apps cache.

### GET /api/apps/{id}/deployments

Lists deployments for an app, optionally filtered by page.

- **Request** query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `pageSlug` | `string` | no | Filters to one page. The default `index` also matches rows with no page. |

- **Response** `200`: a JSON array of deployment rows, newest first:
  ```json
  {
    "id": "string",
    "appId": "string",
    "targetId": "string",
    "status": "success",
    "url": "string",
    "finalUrl": "string",
    "commit": "string",
    "artifactHash": "string",
    "generatorConfig": "string",
    "pageSlug": "string",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "finishedAt": "2026-01-01T00:00:00.000Z",
    "error": null
  }
  ```
  `status` is `pending`, `publishing`, `success`, or `failed`. `startedAt` and `finishedAt` are ISO strings.
- **Errors**:
  - `404` when the app is not found: `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `500` on failure: `{ "error": "Failed to list deployments" }`.
- **Side effects**: reads only.

### GET /api/apps/{id}/deployments/{deploymentId}

Returns a single deployment row.

- **Request**: none.
- **Response** `200`: one deployment row (same shape as the list element).
- **Errors**:
  - `404` when the deployment is not found: `{ "error": "Deployment not found" }`.
  - `404` when the app is not found: `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `500` on failure: `{ "error": "Failed to read deployment" }`.
- **Side effects**: reads only.

### POST /api/apps/{id}/preview

Generates a preview artifact from the app's generate binding and stores it.

- **Request** query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `pageSlug` | `string` | no | Which page to generate. |

- **Response** `201`: `{ "artifactId": "string", "url": "string", "hash": "string", "createdAt": "2026-01-01T00:00:00.000Z", "expiresAt": "2026-01-02T00:00:00.000Z" }`. The preview expires 24 hours after creation.
- **Errors** (each carries a `code`):
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `400` `{ "error": "App manifest does not declare view.bindings.generate", "code": "APP_GENERATE_NOT_CONFIGURED" }`.
  - `404` `{ "error": "Page not found: <slug>", "code": "PAGE_NOT_FOUND" }`.
  - `400` `{ "error": "Generate table not found: <id>", "code": "GENERATE_TABLE_NOT_FOUND" }`.
  - `500` `{ "error": "Generate row <id> contains invalid JSON: ...", "code": "GENERATE_ROW_INVALID" }`.
  - `500` on any other failure: `{ "error": "Failed to create preview" }`.
- **Side effects**: writes the preview artifact files to disk and cleans up expired previews.

### GET /api/apps/{id}/preview

Returns a preview's status, including whether the stored artifact is stale versus the current source.

- **Request** query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `artifactId` | `string` | yes | The preview artifact to check. |
| `pageSlug` | `string` | no | Which page. |

- **Response** `200`: `{ "artifactId": "string", "hash": "string", "createdAt": "2026-01-01T00:00:00.000Z", "expiresAt": "2026-01-02T00:00:00.000Z", "stale": false }`.
- **Errors**:
  - `400` when `artifactId` is missing: `{ "error": "Missing artifactId", "code": "PREVIEW_ARTIFACT_REQUIRED" }`.
  - `404` `{ "error": "Preview artifact not found: <id>", "code": "PREVIEW_NOT_FOUND" }`.
  - `409` when the preview has expired: `{ "error": "Preview artifact has expired; generate a new preview", "code": "PREVIEW_EXPIRED" }`.
  - `404` or `400` for app-not-found and app-mismatch cases with their codes.
  - `500` on any other failure: `{ "error": "Failed to create preview" }`.
- **Side effects**: reads only.

### GET /api/apps/{id}/previews/{artifactId}/{path*}

Serves the raw bytes of a preview artifact file. With no path it serves the entrypoint.

- **Request**: none. The optional trailing path selects a file within the artifact.
- **Response** `200`: raw file bytes (not JSON), with a content type derived from the extension, `X-Content-Type-Options: nosniff`, and `Cache-Control: no-store`. HTML files are served with a strict `Content-Security-Policy` that blocks scripts.
- **Errors**:
  - `404` `{ "error": "Preview artifact not found: <id>", "code": "PREVIEW_NOT_FOUND" }`, or a not-found for the specific file.
  - `410` when the preview has expired: `{ "error": "Preview artifact has expired; generate a new preview", "code": "PREVIEW_EXPIRED" }`.
  - `409` `{ "error": "Preview artifact file hash does not match metadata", "code": "PREVIEW_HASH_INVALID" }`.
  - `400` for app-mismatch or invalid-path cases with their codes.
  - `500` on any other failure: `{ "error": "Failed to load preview" }`.
- **Side effects**: reads only, hash-verifying each served file.

### POST /api/apps/{id}/publish

Creates a pending deployment and starts the publish in the background.

- **Request** body (JSON), validated by Zod (extra keys rejected):

| Field | Type | Required | Notes |
|---|---|---|---|
| `targetId` | `string` | yes | The publish target to deploy to. |
| `artifactId` | `string` | no | A specific preview artifact to publish. |
| `pageSlug` | `string` | no | Which page to publish. |

- **Response** `202`: `{ "deployment": { ... } }`, the newly-created deployment row with `status` `pending`.
- **Errors**:
  - `400` on unparseable JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `404` `{ "error": "Publish target not found", "code": "PUBLISH_TARGET_NOT_FOUND" }`.
  - `500` on any other failure: `{ "error": "Failed to start publish" }`.
- **Side effects**: inserts a pending deployment row and runs the deployment in the background, which updates the row's status and calls the publisher (for example, a push to a git host).

### GET /api/apps/{id}/publish-targets

Lists an app's publish targets, with credentials masked.

- **Request**: none.
- **Response** `200`: a JSON array, newest first: `{ "id": "string", "appId": "string", "targetType": "github-pages", "config": "string", "createdAt": "2026-01-01T00:00:00.000Z" }`. `config` is a JSON string with credential keys masked to `****<last4>`.
- **Errors**:
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `500` on failure: `{ "error": "Publish target request failed" }`.
- **Side effects**: reads only.

### POST /api/apps/{id}/publish-targets

Creates a publish target.

- **Request** body (JSON), validated by Zod (extra keys rejected):

| Field | Type | Required | Notes |
|---|---|---|---|
| `targetType` | `string` | yes | Currently `github-pages`. |
| `config` | `object` | yes | Target settings, including credentials. |

- **Response** `201`: the created publish-target row (masked, same shape as the list element).
- **Errors**:
  - `400` on unparseable JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `500` `{ "error": "Publish target request failed" }`.
- **Side effects**: inserts a publish-target row. The config is stored unmasked on disk.

### DELETE /api/apps/{id}/publish-targets/{targetId}

Deletes a publish target and its deployment history, unless a deploy is in flight.

- **Request**: none.
- **Response** `200`: `{ "id": "string", "deletedDeployments": 0 }`.
- **Errors**:
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `404` `{ "error": "Publish target not found", "code": "PUBLISH_TARGET_NOT_FOUND" }`.
  - `409` `{ "error": "Publish target has an active deployment; wait for it to finish before deleting", "code": "PUBLISH_TARGET_HAS_ACTIVE_DEPLOYMENT" }`.
  - `500` `{ "error": "Publish target delete failed" }`.
- **Side effects**: deletes the target's deployment rows, then the target row.

### POST /api/apps/{id}/publish-targets/{targetId}/test

Tests a publish target's connectivity and credentials via its adapter.

- **Request**: none.
- **Response** `200`: `{ "testStatus": "ok", "error": "string" }`. `error` is present only on failure.
- **Errors**:
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `404` `{ "error": "Publish target not found", "code": "PUBLISH_TARGET_NOT_FOUND" }`.
  - `500` on a test failure: `{ "testStatus": "failed", "error": "Publish target test failed" }`.
- **Side effects**: makes an outbound reachability check to the target's host.

### GET /api/apps/{id}/site-settings

Returns the app's static-site settings, the defaults, and the available templates.

- **Request**: none.
- **Response** `200`: `{ "settings": { ... }, "defaults": { ... }, "templates": [ ... ] }`. A settings object is `{ "templateId": "relay-default", "theme": "calm", "density": "comfortable", "heroLayout": "split", "accent": "tide", "showCtas": true, "sectionStyle": "cards" }`. `theme` is `calm`, `contrast`, or `editorial`; `density` is `comfortable` or `compact`; `heroLayout` is `split`, `stacked`, or `text-first`; `accent` is `tide`, `indigo`, `emerald`, or `coral`; `sectionStyle` is `cards`, `ruled`, or `banded`.
- **Errors**:
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `400` `{ "error": "<message>", "code": "STATIC_SITE_SETTINGS_INVALID", "issues": ["string"] }`.
  - `400` `{ "error": "<message>", "code": "STATIC_SITE_TEMPLATE_INVALID", "issues": ["string"] }`.
  - `500` on failure: `{ "error": "Failed to load static-site settings" }`.
- **Side effects**: reads only.

### PUT /api/apps/{id}/site-settings

Validates and persists new static-site settings. The chosen template must support the settings.

- **Request** body (JSON): the settings shape above. All fields are optional (defaults applied); extra keys are rejected.
- **Response** `200`: `{ "settings": { ... }, "defaults": { ... }, "templates": [ ... ] }` with the saved settings.
- **Errors**:
  - `404` `{ "error": "App not found", "code": "APP_NOT_FOUND" }`.
  - `400` on unparseable JSON: `{ "error": "Invalid JSON body", "code": "INVALID_JSON" }`.
  - `400` `{ "error": "<message>", "code": "STATIC_SITE_SETTINGS_INVALID", "issues": ["string"] }`.
  - `400` `{ "error": "<message>", "code": "STATIC_SITE_TEMPLATE_INVALID", "issues": [] }`.
  - `500` on failure: `{ "error": "Failed to load static-site settings" }`.
- **Side effects**: persists the settings for the app.

### GET /api/tables

Lists user tables, optionally filtered.

- **Request** query params, all optional: `projectId`, `source` (`manual`, `imported`, `agent`, or `template`), and `search` (matches name or description).
- **Response** `200`: a JSON array, newest first. Each row spreads the table columns plus `projectName` and `columnCount`:
  ```json
  {
    "id": "string",
    "projectId": "string",
    "name": "string",
    "description": "string",
    "columnSchema": "string",
    "rowCount": 0,
    "source": "manual",
    "templateId": "string",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "projectName": "string",
    "columnCount": 0
  }
  ```
  `columnSchema` is a JSON string.
- **Errors**: `500` on failure: `{ "error": "Failed to list tables" }`.
- **Side effects**: reads only.

### POST /api/tables

Creates a table, or clones one from a template when `templateId` is present.

- **Request** body (JSON), validated by Zod. Create path:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | 1 to 256 characters. |
| `description` | `string` | no | Up to 1024 characters. |
| `projectId` | `string` | no | Associates the table with a project. |
| `columns` | array | no | Column definitions. Each: `{ name, displayName, dataType, position, required?, defaultValue?, config? }`. |
| `source` | `string` | no | `manual`, `imported`, `agent`, or `template`. |

  Clone path: `{ templateId (required), name (required), projectId?, includeSampleData? }`. `dataType` is one of `text`, `number`, `date`, `boolean`, `select`, `url`, `email`, `relation`, `computed`.
- **Response** `201`: the created table row.
- **Errors**:
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to create table" }`.
- **Side effects**: inserts the table and its column rows. The clone path with sample data inserts rows, which fires the table's row-added triggers.

### GET /api/tables/{id}

Returns one table with its expanded column records.

- **Request**: none.
- **Response** `200`: the table row plus `columns`, an array of column records: `{ id, tableId, name, displayName, dataType, position, required, defaultValue, config, createdAt, updatedAt }`. `config` is a raw JSON string.
- **Errors**:
  - `404` when not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to get table" }`.
- **Side effects**: reads only.

### PATCH /api/tables/{id}

Updates a table's name, description, or project.

- **Request** body (JSON), all optional: `name` (1 to 256), `description` (up to 1024), `projectId`.
- **Response** `200`: the updated table row.
- **Errors**:
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `404` when not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to update table" }`.
- **Side effects**: updates the table row.

### DELETE /api/tables/{id}

Deletes a table and its rows and columns.

- **Request**: none.
- **Response** `204`: empty body.
- **Errors**:
  - `404` when not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to delete table" }`.
- **Side effects**: deletes the table's rows, then columns, then the table row.

### GET /api/tables/{id}/charts

Lists the chart views for a table.

- **Request**: none.
- **Response** `200`: a JSON array of chart-view rows: `{ id, tableId, name, type, config, isDefault, createdAt, updatedAt }`. `config` is parsed to an object here, or null.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/tables/{id}/charts

Saves a new chart configuration.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `string` | yes | Chart type. |
| `title` | `string` | yes | Chart title, stored as the view name. |
| `xColumn` | `string` | yes | The x-axis column. |
| `yColumn` | `string` | no | The y-axis column. |
| `aggregation` | `string` | no | How values are aggregated. |

- **Response** `201`: `{ "id": "string", "name": "string" }`.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` when required fields are missing: `{ "error": "type, title, and xColumn are required" }`.
- **Side effects**: inserts a chart-type view row.

### PATCH /api/tables/{id}/charts/{chartId}

Updates a chart view's title and configuration.

- **Request** body (JSON), all optional: `title`, `type`, `xColumn`, `yColumn`, `aggregation`. Provided config fields are merged into the existing config.
- **Response** `200`: the updated chart-view row, with `config` parsed to an object.
- **Errors**: `404` when the chart is not found: `{ "error": "Chart not found" }`.
- **Side effects**: updates the chart-view row.

### DELETE /api/tables/{id}/charts/{chartId}

Deletes a chart view.

- **Request**: none.
- **Response** `204`: empty body.
- **Errors**: `404` when the chart is not found: `{ "error": "Chart not found" }`.
- **Side effects**: deletes the chart-view row.

### POST /api/tables/{id}/columns

Adds a column to a table.

- **Request** body (JSON), validated by Zod:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | 1 to 64 characters. |
| `displayName` | `string` | yes | 1 to 128 characters. |
| `dataType` | `string` | yes | One of the nine column data types. |
| `required` | `boolean` | no | Defaults to false. |
| `defaultValue` | `string` | no | Nullable. |
| `config` | `object` | no | Type-specific configuration. |

- **Response** `201`: the created column row. `position` is assigned to the end of the column list.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to add column" }`.
- **Side effects**: inserts the column and re-syncs the table's denormalized column schema.

### PATCH /api/tables/{id}/columns

Reorders a table's columns.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `columnIds` | `string[]` | yes | The column ids in their new order. At least one. |

- **Response** `200`: the reordered column rows.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to reorder columns" }`.
- **Side effects**: updates each column's position and re-syncs the column schema.

### POST /api/tables/{id}/enrich

Starts a background workflow that fills a target column across the table's unpopulated rows.

- **Request** body (JSON), validated by Zod. Key fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `targetColumn` | `string` | yes | The column to fill (1 to 128 characters). |
| `promptMode` | `string` | no | `auto` or `custom`. |
| `prompt` | `string` | no | Required when `promptMode` is `custom`. |
| `filter` | object | no | Restricts which rows are enriched. |
| `agentProfile` | `string` | no | The agent profile to run. |
| `batchSize` | `number` | no | Clamped to a maximum of 200. |

- **Response** `202`: `{ "workflowId": "string", "rowCount": 0 }`, where `rowCount` is the number of eligible rows.
- **Errors**:
  - `400` on unparseable JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on schema failure: `{ "error": [ { "path": "string", "message": "string" } ] }`.
  - `404` when the table is not found: `{ "error": "<message>" }` (the message contains "not found").
  - `400` when the target column does not exist or is unsupported: `{ "error": "<message>" }`.
  - `500` on failure: `{ "error": "Failed to start enrichment workflow" }`.
- **Side effects**: inserts a draft workflow and starts it in the background.

### POST /api/tables/{id}/enrich/plan

Previews the enrichment plan (strategy, steps, target contract) without creating a workflow.

- **Request** body (JSON), validated by Zod: the same fields as the enrich route, minus the workflow-creation fields (`projectId`, `itemVariable`, `workflowName`, `plan`).
- **Response** `200`: an enrichment plan `{ "promptMode": "auto", "strategy": "single-pass-lookup", "agentProfile": "string", "reasoning": "string", "steps": [ ... ], "targetContract": { ... }, "eligibleRowCount": 0, "sampleBindings": [ ... ] }`. `strategy` is one of `single-pass-lookup`, `single-pass-classify`, `research-and-synthesize`.
- **Errors**: same shapes as the enrich route, ending in `500` `{ "error": "Failed to build enrichment plan" }`.
- **Side effects**: reads only.

### GET /api/tables/{id}/enrich/runs

Lists recent enrichment workflow runs for a table.

- **Request** query params: `limit` (default 5, clamped to 1 through 10).
- **Response** `200`: a JSON array, newest first: `{ "workflowId": "string", "name": "string", "status": "string", "updatedAt": "2026-01-01T00:00:00.000Z", "targetColumn": "string", "targetColumnLabel": "string", "rowCount": 0, "strategy": "single-pass-lookup", "promptMode": "auto" }`.
- **Errors**: `500` on failure: `{ "error": "Failed to load recent enrichment runs" }`.
- **Side effects**: reads only.

### GET /api/tables/{id}/export

Exports all table rows as CSV, JSON, or XLSX.

- **Request** query params: `format` (`csv` by default, or `json`, or `xlsx`).
- **Response** `200`: a file download (not JSON), with `Content-Disposition: attachment` and a filename of `<table name>.<ext>`. JSON export is a pretty-printed array of row data; CSV and XLSX use column display names as headers. Up to 10,000 rows are exported.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to export table" }`.
- **Side effects**: reads only.

### GET /api/tables/{id}/history

Returns recent row-change history for the whole table.

- **Request** query params: `limit` (default 100, capped at 500).
- **Response** `200`: a JSON array, newest first: `{ "id": "string", "rowId": "string", "tableId": "string", "previousData": "string", "changedBy": "string", "changeType": "update", "createdAt": "2026-01-01T00:00:00.000Z" }`. `changeType` is `update` or `delete`; `previousData` is a raw JSON string.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/tables/{id}/import

Imports structured data from a document into the table, with an optional preview mode.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `documentId` | `string` | yes | The uploaded document to import. |
| `columnMapping` | array | no | Maps source columns to table columns. Each: `{ name, displayName, dataType, skip? }`. |
| `preview` | `boolean` | no | When true, returns inferred columns and sample rows without importing. |

- **Response** `200`:
  - Preview mode: `{ "headers": ["string"], "sampleRows": [ ... ], "totalRows": 0, "inferredColumns": [ ... ] }`.
  - Import mode: `{ "importId": "string", "rowsImported": 0, "rowsSkipped": 0, "errors": [ { "row": 0, "error": "string" } ], "columns": [ ... ] }`.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` when `documentId` is missing: `{ "error": "documentId is required" }`.
  - `500` on failure: `{ "error": "<message>" }`.
- **Side effects**: in import mode, adds any missing columns, inserts rows (firing row-added triggers), and records an import audit row.

### GET /api/tables/{id}/rows

Lists rows with optional pagination, filters, and sorts.

- **Request** query params: `limit` (1 to 1000), `offset` (0 or more), `filters` (a URL-encoded JSON array), and `sorts` (a URL-encoded JSON array). A filter is `{ column, operator, value? }`; a sort is `{ column, direction }` where `direction` is `asc` or `desc`.
- **Response** `200`: a JSON array of row records: `{ "id": "string", "tableId": "string", "data": "string", "dataHash": "string", "position": 0, "createdBy": "string", "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }`. `data` is a raw JSON string.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` on invalid filter JSON: `{ "error": "Invalid filters JSON" }`.
  - `400` on invalid sort JSON: `{ "error": "Invalid sorts JSON" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to list rows" }`.
- **Side effects**: reads only.

### POST /api/tables/{id}/rows

Bulk-adds rows, deduplicating by content.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `rows` | array | yes | 1 to 1000 rows. Each: `{ data (object), createdBy? }`. |

- **Response** `201`: `{ "ids": ["string"], "skipped": 0 }`, where `ids` are the actually-inserted rows and `skipped` counts deduplicated rows.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to add rows" }`.
- **Side effects**: inserts deduplicated rows, updates the table's row count, fires row-added triggers, and revalidates the app runtime cache.

### PATCH /api/tables/{id}/rows/{rowId}

Updates one row, merging the patch into the existing data.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `data` | `object` | yes | The fields to merge into the row. |

- **Response** `200`: the updated row record.
- **Errors**:
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `404` when the row is not found: `{ "error": "Row not found" }`.
  - `500` on failure: `{ "error": "Failed to update row" }`.
- **Side effects**: snapshots the prior row state into history, updates the row, and fires row-updated triggers.

### DELETE /api/tables/{id}/rows/{rowId}

Deletes one row.

- **Request**: none.
- **Response** `204`: empty body. Deleting a row that does not exist still returns `204`.
- **Errors**: `500` on failure: `{ "error": "Failed to delete row" }`.
- **Side effects**: snapshots the row into history, fires row-deleted triggers, deletes the row, and updates the table's row count.

### GET /api/tables/{id}/rows/{rowId}/history

Returns the version history for one row.

- **Request** query params: `limit` (default 50, capped at 200).
- **Response** `200`: a JSON array of history records (same shape as the table history route), newest first, for this row.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/tables/{id}/rows/{rowId}/history

Rolls a row back to a previous history snapshot.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `historyEntryId` | `string` | yes | The history snapshot to restore. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `400` when `historyEntryId` is missing: `{ "error": "historyEntryId is required" }`.
  - `404` when the history entry is not found: `{ "error": "History entry not found" }`.
- **Side effects**: snapshots the current row into history, then restores the row's data from the chosen entry.

### GET /api/tables/{id}/triggers

Lists all triggers for a table.

- **Request**: none.
- **Response** `200`: a JSON array: `{ "id": "string", "tableId": "string", "name": "string", "triggerEvent": "row_added", "condition": "string", "actionType": "run_workflow", "actionConfig": "string", "status": "active", "fireCount": 0, "lastFiredAt": "2026-01-01T00:00:00.000Z", "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }`. `triggerEvent` is `row_added`, `row_updated`, or `row_deleted`; `actionType` is `run_workflow` or `create_task`; `status` is `active` or `paused`. `condition` and `actionConfig` are raw JSON strings.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to list triggers" }`.
- **Side effects**: reads only.

### POST /api/tables/{id}/triggers

Creates a trigger.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Trigger name. |
| `triggerEvent` | `string` | yes | `row_added`, `row_updated`, or `row_deleted`. |
| `actionType` | `string` | yes | `run_workflow` or `create_task`. |
| `actionConfig` | `object` | yes | Action-specific configuration. |
| `condition` | `object` | no | An optional firing condition. |

- **Response** `201`: the created trigger row. New triggers start `active` with a fire count of 0.
- **Errors**:
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `400` when required fields are missing: `{ "error": "name, triggerEvent, actionType, and actionConfig are required" }`.
  - `500` on failure: `{ "error": "Failed to create trigger" }`.
- **Side effects**: inserts the trigger row.

### PATCH /api/tables/{id}/triggers

Updates a trigger's status. The trigger is identified in the body.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `triggerId` | `string` | yes | The trigger to update. |
| `status` | `string` | yes | `active` or `paused`. |

- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `400` when a field is missing: `{ "error": "triggerId and status are required" }`.
  - `500` on failure: `{ "error": "Failed to update trigger" }`.
- **Side effects**: updates the trigger's status.

### PATCH /api/tables/{id}/triggers/{triggerId}

Updates a trigger's fields, scoped to the table and trigger in the path.

- **Request** body (JSON), all optional: `name`, `triggerEvent`, `status`, `condition`, `actionType`, `actionConfig`.
- **Response** `200`: the updated trigger row. `condition` and `actionConfig` remain JSON strings.
- **Errors**: `404` when the trigger is not found: `{ "error": "Trigger not found" }`.
- **Side effects**: updates the trigger row.

### DELETE /api/tables/{id}/triggers/{triggerId}

Deletes a trigger.

- **Request**: none.
- **Response** `204`: empty body.
- **Errors**: `404` when the trigger is not found: `{ "error": "Trigger not found" }`.
- **Side effects**: deletes the trigger row.

### GET /api/tables/templates

Lists table templates, optionally filtered.

- **Request** query params: `category` (`business`, `personal`, `pm`, `finance`, or `content`) and `scope` (`system` or `user`).
- **Response** `200`: a JSON array, ordered by name: `{ "id": "string", "name": "string", "description": "string", "category": "business", "columnSchema": "string", "sampleData": "string", "scope": "system", "icon": "string", "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }`. `columnSchema` and `sampleData` are raw JSON strings.
- **Errors**:
  - `400` on schema failure: `{ "error": <flattened Zod error> }`.
  - `500` on failure: `{ "error": "Failed to list templates" }`.
- **Side effects**: reads only.

### POST /api/tables/templates

Saves an existing table as a user-scoped template.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `tableId` | `string` | yes | The source table. |
| `name` | `string` | yes | Template name. |
| `description` | `string` | no | Defaults to the table's description. |
| `category` | `string` | no | Defaults to `personal`. |
| `includeSampleData` | `boolean` | no | Stores the first five rows as sample data. |

- **Response** `201`: `{ "id": "string", "name": "string" }`.
- **Errors**:
  - `400` when a required field is missing: `{ "error": "tableId and name are required" }`.
  - `404` when the table is not found: `{ "error": "Table not found" }`.
  - `500` on failure: `{ "error": "Failed to save template" }`.
- **Side effects**: inserts a user-scoped template row.

### GET /api/views

Lists saved views for a surface.

- **Request** query params: `surface` (required).
- **Response** `200`: a JSON array, defaults first then by name: `{ "id": "string", "surface": "string", "name": "string", "filters": "string", "sorting": "string", "columns": "string", "density": "comfortable", "isDefault": false, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }`. `density` is `compact`, `comfortable`, or `spacious`; `filters`, `sorting`, and `columns` are raw JSON strings.
- **Errors**: `400` when `surface` is missing: `{ "error": "surface param required" }`.
- **Side effects**: reads only.

### POST /api/views

Creates a saved view. Marking a view default clears any existing default on that surface.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `surface` | `string` | yes | The surface this view belongs to. |
| `name` | `string` | yes | View name. |
| `filters` | `object` | no | Stored as a JSON string. |
| `sorting` | `object` | no | Stored as a JSON string. |
| `columns` | `object` | no | Stored as a JSON string. |
| `density` | `string` | no | Defaults to `comfortable`. |
| `isDefault` | `boolean` | no | Defaults to false. |

- **Response** `201`: the created view row.
- **Errors**: `400` when a required field is missing: `{ "error": "surface and name are required" }`.
- **Side effects**: inserts the view row and, when default, clears other defaults on that surface.

### PATCH /api/views/{id}

Updates a saved view. Marking it default clears any existing default on that surface.

- **Request** body (JSON), all optional: `name`, `filters`, `sorting`, `columns`, `density`, `isDefault`.
- **Response** `200`: the updated view row.
- **Errors**: `404` when the view is not found: `{ "error": "View not found" }`.
- **Side effects**: updates the view row and, when default, clears other defaults.

### DELETE /api/views/{id}

Deletes a saved view.

- **Request**: none.
- **Response** `200`: `{ "ok": true }`.
- **Errors**: `404` when the view is not found: `{ "error": "View not found" }`.
- **Side effects**: deletes the view row.

## Do Not Depend On

- JSON-string columns (`data`, `columnSchema`, `config`, `condition`, `actionConfig`, `filters`, `sorting`, `columns`, `previousData`, `sampleData`) are returned as strings on the raw-select routes and must be parsed client-side. Only the chart routes parse `config` for you.
- Trigger evaluation and any workflow a trigger launches are fire-and-forget. A `2xx` from a row route does not confirm a trigger fired or completed.
- An app's `createdAt` in the app-list and app-detail responses is a filesystem modification time in milliseconds, not an ISO timestamp; do not compare it against ISO timestamps from other routes.
- Several list routes (charts, row history, views) have no explicit error handling; an internal failure surfaces as an unhandled `500` rather than a structured error body.
- Currently `github-pages` is the only publish target type. Do not hardcode the assumption that it is the only one that will ever exist.
