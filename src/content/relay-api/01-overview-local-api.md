---
id: "01-overview-local-api"
title: "Relay Local API Overview"
status: "draft"
stability: "platform"
families: ["context","workspace","command-palette"]
---

## Who This Is For

This group is for a developer standing up or integrating a local Relay instance. It covers the routes that report where Relay is running, discover and import nearby projects, repair the data directory for a cloned instance, and feed the command palette its recent items. Read this first if you are automating first-run setup, wiring Relay into an existing project layout, or building a tool that needs to know the current workspace.

## Stability

`platform`

These routes are documented for developers to build on. They report and change local instance state, so their inputs and outputs are meant to stay stable across releases. The one exception is `POST /api/context/batch`, which is an app-internal moderation route included here for completeness; treat its shape as subject to change.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. Several of them read and write local files (`.env.local`), create directories, and open the local SQLite database.

## Endpoint Families

- `context`
- `workspace`
- `command-palette`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `GET` | `/api/command-palette/recent` | `platform` | `src/app/api/command-palette/recent/route.ts` |
| `POST` | `/api/context/batch` | `app-internal` | `src/app/api/context/batch/route.ts` |
| `GET` | `/api/workspace/context` | `platform` | `src/app/api/workspace/context/route.ts` |
| `POST` | `/api/workspace/discover` | `platform` | `src/app/api/workspace/discover/route.ts` |
| `POST` | `/api/workspace/fix-data-dir` | `platform` | `src/app/api/workspace/fix-data-dir/route.ts` |
| `POST` | `/api/workspace/import` | `platform` | `src/app/api/workspace/import/route.ts` |

![Relay home cockpit, where the command palette and workspace context surface](relay-shot:home-cockpit)

## Endpoint Reference

### GET /api/command-palette/recent

Returns the five most recently updated projects and the five most recently updated tasks, for the command palette recents list.

- **Request**: none. No query parameters or body.
- **Response** `200`:
  ```json
  {
    "projects": [
      { "id": "string", "name": "string", "status": "active" }
    ],
    "tasks": [
      { "id": "string", "title": "string", "status": "planned" }
    ]
  }
  ```
  `projects[].status` is one of `active`, `paused`, `completed`. `tasks[].status` is one of `planned`, `queued`, `running`, `completed`, `failed`, `cancelled`. Each array holds at most five rows, ordered by most recently updated first.
- **Errors**: none are returned explicitly. A database read failure propagates as an unhandled rejection.
- **Side effects**: reads only.

### POST /api/context/batch

Batch-approves or batch-rejects learned-context proposals. This is an internal moderation route used by the Relay web app.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `proposalIds` | `string[]` | yes | At least one non-empty id. |
| `action` | `"approve" \| "reject"` | yes | |

- **Response** `200`:
  ```json
  { "success": true, "action": "approve", "count": 3 }
  ```
  `count` is the number of proposals the action applied to.
- **Errors**:
  - `400` when validation fails: `{ "error": "proposalIds (string[]) and action ('approve'|'reject') are required" }`.
  - `500` on any processing failure: `{ "error": "<message>" }`.
- **Side effects**: writes new learned-context versions and updates related notifications. The approve path may trigger asynchronous context summarization for oversized profiles.

### GET /api/workspace/context

Returns metadata about the directory Relay was launched from: folder name, git branch, worktree status, and the resolved data directory.

- **Request**: none.
- **Response** `200`, with header `Cache-Control: private, max-age=60`:
  ```json
  {
    "cwd": "string",
    "folderName": "string",
    "parentPath": "string",
    "gitBranch": "string | null",
    "isWorktree": false,
    "dataDir": "string",
    "dataDirMismatch": false
  }
  ```
  `gitBranch` is `null` when the launch directory is not a git repository or the branch cannot be read. `dataDirMismatch` is `true` when the running data directory differs from the one this workspace expects.
- **Errors**: none are returned. Git and filesystem probes fail quietly, yielding `gitBranch: null` and `isWorktree: false`.
- **Side effects**: reads only. Runs `git branch --show-current` with a short timeout and reads `.git`.

### POST /api/workspace/discover

Walks a parent directory to find child projects that carry `.claude` or `.codex` markers, then flags which of them are already imported into this instance.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `parentDir` | `string` | yes | 1 to 500 characters. A leading `~` or `~/` is expanded to the home directory. |
| `maxDepth` | `number` | no | Integer, 1 to 3. Defaults to `2`. |
| `markers` | `("claude" \| "codex")[]` | no | At least one entry. Defaults to `["claude","codex"]`. |

- **Response** `200`:
  ```json
  {
    "projects": [
      {
        "path": "string",
        "folderName": "string",
        "markers": ["claude"],
        "artifactHints": {
          "skillCount": 0,
          "mcpServerCount": 0,
          "hasInstructions": false,
          "hasMemory": false
        },
        "totalArtifactEstimate": 0,
        "gitBranch": "string | null",
        "lastModified": 0,
        "alreadyImported": false
      }
    ],
    "searchPath": "string",
    "depth": 2,
    "durationMs": 0,
    "errors": [{ "path": "string", "error": "string" }]
  }
  ```
  `alreadyImported` is set by cross-referencing each discovered path against imported projects. `errors` lists per-directory scan failures; it does not mean the request failed.
- **Errors**:
  - `400` when validation fails: `{ "error": <zod flatten object> }`.
  - `400` when the expanded directory does not exist: `{ "error": "Directory not found: <path>" }`.
- **Side effects**: reads the projects table and scans the filesystem. No writes.

### POST /api/workspace/fix-data-dir

For a cloned, non-main instance, derives `~/.<folderName>` as the data directory, records it in `.env.local`, creates the directory, and bootstraps an empty SQLite database there.

- **Request**: none. The route derives everything from the launch directory and instance detection.
- **Response** `200`:
  ```json
  {
    "success": true,
    "dataDir": "~/.<folderName>",
    "envLocalPath": "<cwd>/.env.local",
    "needsRestart": true
  }
  ```
  `needsRestart` is always `true`: the new data directory takes effect only after Relay restarts.
- **Errors**:
  - `400` when run in the main dev repository: `{ "error": "Main dev repo does not need a data-dir fix" }`.
  - `400` when the instance is already isolated to a non-default data directory: `{ "error": "AINATIVE_DATA_DIR is already set to a non-default path" }`.
- **Side effects**: rewrites `.env.local` to set `RELAY_DATA_DIR`, creates the data directory, and opens a new SQLite database at `<dataDir>/relay.db` to bootstrap its schema.

### POST /api/workspace/import

Imports a list of projects into the instance, scans each one's environment, and streams per-project progress as Server-Sent Events.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `projects` | `{ path: string, name: string }[]` | yes | At least one entry. `path` 1+ chars, `name` 1 to 100 chars. |

- **Response** `200`, streaming, with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Each SSE frame is one JSON object:
  ```
  data: { "type": "progress", "index": 0, "name": "acme", "status": "creating" }

  data: { "type": "progress", "index": 0, "name": "acme", "status": "done", "projectId": "string", "artifactCount": 0 }

  data: { "type": "complete", "created": 1, "failed": 0 }
  ```
  A project that fails to import emits `{ "type": "progress", "index": 0, "name": "acme", "status": "failed", "error": "string" }` instead of a `done` frame, and the stream still ends with a `complete` frame.
- **Errors**:
  - `400` when validation fails: `{ "error": <zod flatten object> }`, returned as a normal JSON response rather than a stream.
- **Side effects**: inserts one project row per entry, then scans each project's environment and records the scan. A scan failure is caught and does not block that project's creation.

## Examples

Read the current workspace context:

```bash
curl http://127.0.0.1:3000/api/workspace/context
```

Discover projects two levels under a parent directory:

```bash
curl -X POST http://127.0.0.1:3000/api/workspace/discover \
  -H "Content-Type: application/json" \
  -d '{ "parentDir": "~/projects", "maxDepth": 2 }'
```

Import two discovered projects and read the progress stream:

```bash
curl -N -X POST http://127.0.0.1:3000/api/workspace/import \
  -H "Content-Type: application/json" \
  -d '{ "projects": [
        { "path": "/Users/me/projects/acme", "name": "Acme" },
        { "path": "/Users/me/projects/beta", "name": "Beta" }
      ] }'
```

The `-N` flag keeps `curl` from buffering, so you see each SSE frame as it arrives.

## Do Not Depend On

- `GET /api/command-palette/recent` and `POST /api/workspace/fix-data-dir` have no error handling. A database or filesystem failure surfaces as an unhandled rejection, not a structured error body. Do not rely on a specific error shape from these two routes.
- The `count` returned by `POST /api/context/batch` reflects rows the action changed, which can be lower than the number of ids you sent if some were already resolved.
- `POST /api/workspace/fix-data-dir` reads no request body; its entire behavior is derived from the launch directory. Do not assume you can point it at an arbitrary path.
- The exact contents of the Zod flatten error object returned on validation failures may change with schema edits. Branch on the `400` status, not on the internal structure of `error`.
