---
id: "07-files-observability-maintenance"
title: "Files, Observability, And Maintenance API"
status: "draft"
stability: "app-internal"
families: ["uploads","snapshots","plugins","telemetry","diagnostics","data"]
---

## Who This Is For

This group is for a developer running and maintaining a local Relay instance: uploading and serving files, taking and restoring full-state snapshots, loading and scaffolding plugins, reading live telemetry and stream diagnostics, and seeding or clearing data in a staging build. Read this if you are building a backup workflow, wiring an upload flow into a task, polling a live log stream, or standing up a disposable staging instance with realistic sample data.

Several routes here are destructive or gated. Restore overwrites the live database; data seed and clear only run on a staging build; diagnostics is disabled in production. Each such gate is called out on the route.

## Stability

`app-internal`

These routes power the Relay web app and its maintenance surfaces. Their request and response shapes are tied to the app's own screens and may change between releases, so branch on HTTP status codes rather than on the internal structure of a response body, and treat every response field as additive.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. These routes read and write the local SQLite database, read and write files on disk, run background jobs, and in the case of restore and clear, delete data irreversibly.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Staging gate.** The data-seed and data-clear routes only run when data operations are allowed, which means either a non-production build or a build launched with `RELAY_STAGING` set to `true`. On a normal production build they return `403` and do nothing.
- **Diagnostics gate.** The chat-stream diagnostics route returns `403` when `NODE_ENV` is `production`.
- **Timestamps.** Database timestamp columns (`agentLogs.timestamp`, `snapshots.createdAt`, `documents.createdAt`) serialize to ISO date strings on the wire. Two responses are exceptions and carry a numeric epoch in milliseconds instead: the diagnostics `TerminationEvent.timestamp`, which is noted where it appears.
- **Raw file responses.** The upload-download route returns raw file bytes, not JSON, with a content type derived from the file extension and `X-Content-Type-Options: nosniff`. Downloads are forced with `Content-Disposition: attachment` so a stored file cannot render inline as HTML.
- **Streaming responses.** The log-stream route is Server-Sent Events (`text/event-stream`), not a single JSON response. Its format is described on the route.
- **Validation.** Most write routes here read the JSON body without a shared schema; the plugin-scaffold route is the exception and validates with Zod. Error bodies are `{ "error": "<message>" }`, with some routes adding a `code` field, noted per route.

## Endpoint Families

- `uploads`
- `snapshots`
- `plugins`
- `telemetry`
- `diagnostics`
- `data`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `POST` | `/api/data/clear` | `app-internal` | `src/app/api/data/clear/route.ts` |
| `POST` | `/api/data/seed` | `app-internal` | `src/app/api/data/seed/route.ts` |
| `GET` | `/api/diagnostics/chat-streams` | `app-internal` | `src/app/api/diagnostics/chat-streams/route.ts` |
| `GET` | `/api/logs/stream` | `app-internal` | `src/app/api/logs/stream/route.ts` |
| `GET` | `/api/plugins` | `app-internal` | `src/app/api/plugins/route.ts` |
| `POST` | `/api/plugins/reload` | `app-internal` | `src/app/api/plugins/reload/route.ts` |
| `POST` | `/api/plugins/scaffold` | `app-internal` | `src/app/api/plugins/scaffold/route.ts` |
| `GET`, `POST` | `/api/snapshots` | `app-internal` | `src/app/api/snapshots/route.ts` |
| `DELETE`, `GET` | `/api/snapshots/{id}` | `app-internal` | `src/app/api/snapshots/[id]/route.ts` |
| `POST` | `/api/snapshots/{id}/restore` | `app-internal` | `src/app/api/snapshots/[id]/restore/route.ts` |
| `GET`, `PUT` | `/api/snapshots/settings` | `app-internal` | `src/app/api/snapshots/settings/route.ts` |
| `GET` | `/api/telemetry` | `app-internal` | `src/app/api/telemetry/route.ts` |
| `POST` | `/api/uploads` | `app-internal` | `src/app/api/uploads/route.ts` |
| `DELETE`, `GET` | `/api/uploads/{id}` | `app-internal` | `src/app/api/uploads/[id]/route.ts` |
| `POST` | `/api/uploads/cleanup` | `app-internal` | `src/app/api/uploads/cleanup/route.ts` |

## Endpoint Reference

### POST /api/uploads

Accepts a file upload, writes it to disk, records a document row, and starts background processing.

- **Request** `multipart/form-data`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | yes | Maximum 50 MB. |
| `taskId` | `string` | no | Associates the upload with a task. |

- **Response** `201`:
  ```json
  {
    "id": "string",
    "filename": "string",
    "originalName": "string",
    "size": 12345,
    "type": "application/pdf",
    "taskId": "string"
  }
  ```
  `filename` is a generated `<uuid>.<ext>`. `taskId` is null when not supplied.
- **Errors**:
  - `400` when no file is present: `{ "error": "No file provided" }`.
  - `400` when the file is over the limit: `{ "error": "File too large (max 50MB)" }`.
- **Side effects**: writes the file to the uploads directory, inserts a `documents` row with `status` `uploaded`, and starts background text extraction. If extraction fails, the row is updated to `status` `error`.

### GET /api/uploads/{id}

Streams an uploaded file's bytes back as a forced download.

- **Request**: none. Matches the first on-disk file whose name starts with `id`.
- **Response** `200`: raw file bytes (not JSON), with a content type derived from the extension, `Content-Disposition: attachment`, and `X-Content-Type-Options: nosniff`.
- **Errors**: `404` when no matching file is found: `{ "error": "File not found" }`.
- **Side effects**: reads only.

### DELETE /api/uploads/{id}

Deletes an uploaded file and its document row.

- **Request**: none.
- **Response** `204`: empty body.
- **Errors**:
  - `404` when no matching file exists: `{ "error": "File not found" }`.
  - `500` on a delete failure: `{ "error": "Failed to delete file" }`.
- **Side effects**: removes the file from disk and deletes the `documents` row.

### POST /api/uploads/cleanup

Deletes orphaned upload files: files older than 24 hours with no matching document row.

- **Request**: none.
- **Response** `200`: `{ "deleted": ["string"], "errors": ["string"] }`. `deleted` lists removed filenames; `errors` lists `"<filename>: <message>"` strings for files that could not be removed.
- **Errors**: none returned at the HTTP layer; a directory-read failure is logged and the route still returns `200` with whatever was collected.
- **Side effects**: removes orphaned files from disk.

### GET /api/snapshots

Lists all snapshots, newest first, with total disk usage.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "snapshots": [
      {
        "id": "string",
        "label": "string",
        "type": "manual",
        "status": "completed",
        "filePath": "string",
        "sizeBytes": 0,
        "dbSizeBytes": 0,
        "filesSizeBytes": 0,
        "fileCount": 0,
        "error": null,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "filesMissing": false
      }
    ],
    "totalBytes": 0,
    "snapshotCount": 0
  }
  ```
  `type` is `manual` or `auto`. `status` is `in_progress`, `completed`, or `failed`. `filesMissing` is true only when a completed snapshot's file is absent from disk.
- **Errors**: `500` on failure: `{ "error": "Failed to list snapshots" }`.
- **Side effects**: reads only.

### POST /api/snapshots

Creates a manual full-state snapshot: a database backup plus a tarball of the data directories and a manifest.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `label` | `string` | no | Trimmed. Defaults to `Manual snapshot` when absent or blank. |

- **Response** `201`: the created snapshot object (same shape as a `GET` element).
- **Errors**:
  - `409` when another snapshot operation is in progress: `{ "error": "Another snapshot operation is already in progress" }`.
  - `500` on failure: `{ "error": "Failed to create snapshot" }`.
- **Side effects**: inserts an `in_progress` row, backs up the database, tars the data directories, writes a manifest, and updates the row to `completed`. On failure the row is marked `failed` and the partial directory is removed. Only one snapshot operation runs at a time.

### GET /api/snapshots/{id}

Returns one snapshot with its parsed manifest.

- **Request**: none.
- **Response** `200`: the snapshot object plus `filesMissing` and `manifest`. `manifest` is the parsed manifest object, or `null` when the manifest file is missing or corrupt. The manifest carries `version`, `timestamp` (ISO), `label`, `type`, `includedDirs`, `excludedDirs`, per-directory `dirStats`, and the byte totals.
- **Errors**:
  - `404` when not found: `{ "error": "Snapshot not found" }`.
  - `500` on failure: `{ "error": "Failed to get snapshot" }`.
- **Side effects**: reads only.

### DELETE /api/snapshots/{id}

Deletes a snapshot's row and its on-disk files.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `404` when not found: `{ "error": "Snapshot not found" }`.
  - `500` on failure: `{ "error": "Failed to delete snapshot" }`.
- **Side effects**: removes the snapshot directory and deletes the row.

### POST /api/snapshots/{id}/restore

Restores the database and files from a snapshot. This is destructive: it overwrites the live database and data directories. It first takes a pre-restore safety snapshot and refuses to run while any task is running.

- **Request**: none.
- **Response** `200`: `{ "success": true, "requiresRestart": true, "preRestoreSnapshotId": "string", "message": "Restore complete. Please restart the server to load the restored database." }`.
- **Errors**:
  - `409` when another snapshot operation is in progress: `{ "error": "Another snapshot operation is already in progress" }`.
  - `409` when tasks are running: `{ "error": "<n> task(s) are currently running. Stop them before restoring.", "runningTasks": [ { "id": "string", "title": "string" } ] }`.
  - `500` on failure: `{ "error": "Failed to restore snapshot" }`. This covers a missing or incomplete snapshot and missing snapshot files.
- **Side effects**: creates an auto pre-restore snapshot, replaces the live data directories from the tarball, copies the snapshot database over the live database, and clears the write-ahead log files. A server restart is required afterward.

### GET /api/snapshots/settings

Reads the auto-backup and retention settings, with defaults applied.

- **Request**: none.
- **Response** `200`: `{ "enabled": "false", "interval": "1d", "maxCount": "10", "maxAgeWeeks": "4" }`. All values are strings. The shown values are the defaults when unset.
- **Errors**: `500` on failure: `{ "error": "Failed to read settings" }`.
- **Side effects**: reads only.

### PUT /api/snapshots/settings

Updates any provided snapshot settings.

- **Request** body (JSON), all optional. Each provided value is stored as a string:

| Field | Type | Required | Notes |
|---|---|---|---|
| `enabled` | `string` or `boolean` | no | Coerced to a string. |
| `interval` | `string` | no | For example `1d`. |
| `maxCount` | `string` or `number` | no | Coerced to a string. |
| `maxAgeWeeks` | `string` or `number` | no | Coerced to a string. |

- **Response** `200`: `{ "success": true }`.
- **Errors**: `500` on failure: `{ "error": "Failed to save settings" }`.
- **Side effects**: upserts the provided settings rows.

### GET /api/plugins

Rescans the plugins directory on disk and returns the full loaded-plugin list.

- **Request**: none.
- **Response** `200`: `{ "plugins": [ ... ] }`. Each plugin:
  ```json
  {
    "id": "string",
    "manifest": { "id": "string", "version": "string", "apiVersion": "string", "kind": "primitives-bundle" },
    "rootDir": "string",
    "profiles": ["string"],
    "blueprints": ["string"],
    "tables": ["string"],
    "schedules": ["string"],
    "status": "loaded",
    "error": "string"
  }
  ```
  `manifest.kind` is `primitives-bundle` or `chat-tools`; a `chat-tools` manifest additionally carries `capabilities`. `status` is `loaded` or `disabled`; `error` is present only on a disabled plugin.
- **Errors**: none returned explicitly.
- **Side effects**: despite being a `GET`, this reloads the plugin registry: it re-merges plugin profiles, blueprints, and schedules, rewrites plugin-owned table rows, upserts plugin schedules, and appends to the plugin log.

### POST /api/plugins/reload

Reloads all plugins and returns a compact summary.

- **Request**: none.
- **Response** `200`: `{ "loaded": [ { "id": "string", "profiles": ["string"], "blueprints": ["string"], "tables": ["string"] } ], "disabled": [ { "id": "string", "error": "string" } ] }`.
- **Errors**: none returned explicitly.
- **Side effects**: same as `GET /api/plugins`, a full plugin-registry reload.

### POST /api/plugins/scaffold

Scaffolds a new MCP (chat-tools) plugin directory from a validated spec. It does not register the plugin; reload afterward to pick it up.

- **Request** body (JSON), validated by Zod:

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Kebab-case slug matching `^[a-z][a-z0-9-]*[a-z0-9]$`. |
| `name` | `string` | yes | Non-empty. |
| `description` | `string` | yes | Non-empty. |
| `capabilities` | `string[]` | no | Defaults to `[]`. |
| `transport` | `string` | no | `stdio` or `inprocess`. Defaults to `stdio`. |
| `language` | `string` | no | `python` or `node`. Defaults to `python`. |
| `tools` | array | yes | At least one tool. Each: `{ name (matching ^[a-z][a-z0-9_]*$), description, inputSchema? }`. |

- **Response** `200`: `{ "ok": true, "id": "string", "pluginDir": "string", "files": { "pluginYaml": "string", "mcpJson": "string", "serverPy": "string", "readme": "string" }, "tools": ["string"], "message": "Scaffolded <id>. Reload ainative to register." }`.
- **Errors** (each body carries a `code`):
  - `400` on unparseable JSON: `{ "error": "Malformed JSON body", "code": "bad_request" }`.
  - `400` on validation failure: `{ "error": "<joined issues>", "code": "validation_failed" }`.
  - `400` on an invalid id: `{ "error": "<message>", "code": "invalid_id" }`.
  - `409` when the plugin directory already exists: `{ "error": "<message>", "code": "already_exists" }`.
  - `500` on a write failure: `{ "error": "<message>", "code": "write_failed" }`.
  - `500` on any other failure: `{ "error": "<message>", "code": "internal_error" }`.
- **Side effects**: atomically writes a new plugin directory (`plugin.yaml`, `.mcp.json`, `server.py`, `README.md`) via a temp directory and rename. No database writes and no registry reload.

### GET /api/telemetry

Aggregates a live telemetry snapshot: task, project, and workflow counts, cost windows, runtime info, trend sparklines, and host metrics.

- **Request**: none.
- **Response** `200`: a snapshot object with, among others, `tasksRunning`, `tasksFailed`, `completedToday`, `activeProjects`, `activeWorkflows`, `reviewPending`, `costTodayMicros`, `costToDateMicros`, `budgetMonthlyCapMicros`, `runtimeLabel`, `providerId`, `runtimeSdkVersion`, a `trends` block (`agentActivity24h`, `completions7d`, `failures7d`), and a `host` block (`cwd`, `folderName`, `branch`, `cpuLoadPct`, `memUsedPct`). Costs are integer micro-dollars. `cpuLoadPct` and `memUsedPct` are null on a platform that does not report them.
- **Errors**: `500` on failure: `{ "error": "TelemetrySnapshotError", "message": "<message>" }`.
- **Side effects**: reads only. The route is not cached.

### GET /api/diagnostics/chat-streams

Reports how chat SSE streams terminated, from an in-memory ring buffer. Development only.

- **Request** query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `windowMinutes` | `number` | no | Restricts counts to the last N minutes. |
| `limit` | `number` | no | Recent-event cap. Defaults to 50, clamped to 1 through 500. |

- **Response** `200`: `{ "windowMinutes": 0, "totalEvents": 0, "counts": { "stream.completed": 0, "stream.aborted.signal": 0, "stream.aborted.client": 0, "stream.finalized.error": 0, "stream.abandoned": 0, "stream.reconciled.stale": 0 }, "recent": [ ... ] }`. Each recent event carries `reason`, `conversationId`, `messageId`, `durationMs`, an optional `error`, and a numeric `timestamp` (epoch milliseconds, not ISO).
- **Errors**: `403` in production: `{ "error": "Diagnostics disabled in production" }`.
- **Side effects**: reads only, from a process-local buffer.

### GET /api/logs/stream

Opens a Server-Sent Events stream of agent log rows as they arrive, optionally filtered.

- **Request** query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `taskId` | `string` | no | Filters to one task. |
| `eventType` | `string` | no | Filters to one event type. |

- **Response** `200` with `Content-Type: text/event-stream`. The stream emits:
  - Log rows as `data: <json>` events, where the JSON is an `agentLogs` row (`id`, `taskId`, `agentType`, `event`, `payload`, and an ISO `timestamp`). Rows arrive oldest-first, up to 50 per poll cycle.
  - On a database error, `data: {"type":"error","message":"Database query failed"}`.
  - Keepalive comments every 15 seconds.
  There is no terminal event; the stream stays open until the client disconnects.
- **Errors**: none at the HTTP layer; the route always returns `200` and surfaces failures as in-stream error events.
- **Side effects**: polls the agent-logs table every 500 milliseconds until the client disconnects.

### POST /api/data/seed

Clears all data, then seeds realistic sample data across every entity and reseeds installed packs. Staging only.

- **Request**: none.
- **Response** `200`: `{ "success": true, "seeded": { ... } }`, where `seeded` is a map of per-entity insert counts plus pack-reseed counts and a `packReseedErrors` array of `{ "packId": "string", "error": "string" }`.
- **Errors**:
  - `403` on a non-staging build: `{ "success": false, "error": "Sample data seeding is a staging-only tool and is disabled on this build." }`.
  - `500` on failure: `{ "success": false, "error": "<message>" }`.
- **Side effects**: clears all data first (see the clear route), then inserts sample rows across every table, writes and processes sample documents, and reseeds installed packs.

### POST /api/data/clear

Wipes all operational data tables and uploaded and screenshot files, in a foreign-key-safe order. Staging only. The settings and snapshots tables are preserved.

- **Request**: none.
- **Response** `200`: `{ "success": true, "deleted": { ... } }`, where `deleted` is a map of per-table deletion counts.
- **Errors**:
  - `403` on a non-staging build: `{ "success": false, "error": "Clearing data is a staging-only tool and is disabled on this build." }`.
  - `500` on failure: `{ "success": false, "error": "<message>" }`.
- **Side effects**: deletes rows across the operational tables and removes all files in the uploads and screenshots directories, recreating those directories empty.

## Do Not Depend On

- The exact set of per-table keys returned by the data-seed and data-clear routes is an internal detail; new tables are added over time. Treat the maps as informational counts, not a schema.
- The `GET /api/plugins` route reloads the registry as a side effect. Do not rely on it being a pure read, and do not call it in a hot loop.
- Snapshot restore requires a manual server restart to take effect; there is no automatic reload of the restored database in-process.
- The staging and diagnostics gates are enforced by build configuration. Do not build a production integration against the seed, clear, or diagnostics routes.
