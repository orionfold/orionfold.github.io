---
id: "04-workflows-automation"
title: "Workflows And Automation API"
status: "draft"
stability: "app-internal"
families: ["workflows","blueprints","schedules","notifications","permissions"]
---

## Who This Is For

This group is for a developer automating multi-step work in a local Relay instance. It covers workflows and the way they run, resume, and stop; blueprints that turn a template into a workflow; schedules that fire tasks on a cron; the notifications that carry approvals and alerts; and the permission rules that govern what agents may do without asking. Read this if you are launching workflow runs, scripting scheduled tasks, polling for pending approvals, or managing an agent's permission allow-list.

## Stability

`app-internal`

These routes power the Relay web app. They are documented so you can build against a local instance, but their request and response shapes are tied to the app's own screens and may change between releases. Branch on HTTP status codes rather than on the internal structure of an error body, and treat every response field as additive.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. These routes read and write the local SQLite database, run agent work in the background, and read and write blueprint files on disk.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Workflow status vocabulary.** A workflow's top-level `status` is one of `draft`, `active`, `paused`, `completed`, `failed`. A run in progress is `active`, not "running". `paused` covers two cases: a delay step waiting for its time (the workflow carries a `resumeAt`) and a step waiting for human input. There is no separate `stopped` or `cancelled` status; a stopped workflow becomes `failed`.
- **Background execution.** `execute`, `resume`, and step `retry` return `202` and run the work in the background. A `202` means the run was claimed and dispatched, not that it finished or even that it will succeed. Poll the status route for the outcome. The `stop` route is the exception: it acts synchronously and returns `200`.
- **Timestamps.** `createdAt`, `updatedAt`, and similar fields serialize to ISO date strings on the wire.
- **Malformed request bodies.** Most write routes read the JSON body without a guard. A malformed or empty body throws before validation and surfaces as an unhandled `500`, not a structured `400`. Send well-formed JSON with `Content-Type: application/json`.
- **Validation.** These routes validate by hand or with plain validator functions rather than a shared schema. Error bodies are `{ "error": "<message>" }` with the specific message noted per route.

## Endpoint Families

- `blueprints`
- `workflows`
- `schedules`
- `notifications`
- `permissions`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `GET`, `POST` | `/api/blueprints` | `app-internal` | `src/app/api/blueprints/route.ts` |
| `DELETE`, `GET` | `/api/blueprints/{id}` | `app-internal` | `src/app/api/blueprints/[id]/route.ts` |
| `POST` | `/api/blueprints/{id}/instantiate` | `app-internal` | `src/app/api/blueprints/[id]/instantiate/route.ts` |
| `POST` | `/api/blueprints/import` | `app-internal` | `src/app/api/blueprints/import/route.ts` |
| `GET`, `POST` | `/api/workflows` | `app-internal` | `src/app/api/workflows/route.ts` |
| `DELETE`, `PATCH` | `/api/workflows/{id}` | `app-internal` | `src/app/api/workflows/[id]/route.ts` |
| `GET` | `/api/workflows/{id}/debug` | `app-internal` | `src/app/api/workflows/[id]/debug/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/workflows/{id}/documents` | `app-internal` | `src/app/api/workflows/[id]/documents/route.ts` |
| `POST` | `/api/workflows/{id}/execute` | `app-internal` | `src/app/api/workflows/[id]/execute/route.ts` |
| `POST` | `/api/workflows/{id}/resume` | `app-internal` | `src/app/api/workflows/[id]/resume/route.ts` |
| `GET` | `/api/workflows/{id}/status` | `app-internal` | `src/app/api/workflows/[id]/status/route.ts` |
| `POST` | `/api/workflows/{id}/steps/{stepId}/retry` | `app-internal` | `src/app/api/workflows/[id]/steps/[stepId]/retry/route.ts` |
| `POST` | `/api/workflows/{id}/stop` | `app-internal` | `src/app/api/workflows/[id]/stop/route.ts` |
| `POST` | `/api/workflows/from-assist` | `app-internal` | `src/app/api/workflows/from-assist/route.ts` |
| `POST` | `/api/workflows/optimize` | `app-internal` | `src/app/api/workflows/optimize/route.ts` |
| `GET` | `/api/notifications` | `app-internal` | `src/app/api/notifications/route.ts` |
| `DELETE`, `PATCH` | `/api/notifications/{id}` | `app-internal` | `src/app/api/notifications/[id]/route.ts` |
| `PATCH` | `/api/notifications/mark-all-read` | `app-internal` | `src/app/api/notifications/mark-all-read/route.ts` |
| `GET` | `/api/notifications/pending-approvals` | `app-internal` | `src/app/api/notifications/pending-approvals/route.ts` |
| `GET` | `/api/notifications/pending-approvals/stream` | `app-internal` | `src/app/api/notifications/pending-approvals/stream/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/permissions` | `app-internal` | `src/app/api/permissions/route.ts` |
| `DELETE`, `GET`, `POST` | `/api/permissions/presets` | `app-internal` | `src/app/api/permissions/presets/route.ts` |
| `GET`, `POST` | `/api/schedules` | `app-internal` | `src/app/api/schedules/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/schedules/{id}` | `app-internal` | `src/app/api/schedules/[id]/route.ts` |
| `POST` | `/api/schedules/{id}/execute` | `app-internal` | `src/app/api/schedules/[id]/execute/route.ts` |
| `GET` | `/api/schedules/{id}/heartbeat-history` | `app-internal` | `src/app/api/schedules/[id]/heartbeat-history/route.ts` |
| `POST` | `/api/schedules/parse` | `app-internal` | `src/app/api/schedules/parse/route.ts` |

## Endpoint Reference

### GET /api/blueprints

Lists all workflow blueprints: built-in, user-installed, and any provided by plugins.

- **Request**: none.
- **Response** `200`: a JSON array of blueprints. Each element:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "version": "string",
    "domain": "work",
    "tags": ["string"],
    "pattern": "sequence",
    "variables": [ { "id": "string", "type": "text", "label": "string", "required": true } ],
    "steps": [ { "name": "string", "requiresApproval": false } ],
    "author": "string",
    "source": "string",
    "estimatedDuration": "string",
    "difficulty": "beginner",
    "isBuiltin": false
  }
  ```
  `domain` is one of `work`, `personal`. `pattern` is one of `sequence`, `planner-executor`, `checkpoint`. `difficulty` is one of `beginner`, `intermediate`, `advanced`.
- **Errors**: none returned explicitly. A filesystem failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/blueprints

Creates a user blueprint from a supplied YAML document.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `yaml` | `string` | yes | The blueprint YAML. Parsed and validated after the request is received; needs a `pattern` and at least one step. |

- **Response** `201`: the created blueprint (same shape as a `GET /api/blueprints` element, with `isBuiltin` false).
- **Errors**:
  - `400` when `yaml` is missing: `{ "error": "yaml field is required" }`.
  - `400` on an invalid blueprint: `{ "error": "Invalid blueprint: <issues>" }`.
  - `400` when the id already exists: `{ "error": "Blueprint \"<id>\" already exists" }`, or another failure message.
- **Side effects**: writes the blueprint file to the user blueprints directory and refreshes the blueprint cache.

### GET /api/blueprints/{id}

Fetches a single blueprint by id.

- **Request**: none.
- **Response** `200`: the blueprint object.
- **Errors**: `404` when not found: `{ "error": "Blueprint not found" }`.
- **Side effects**: reads only.

### DELETE /api/blueprints/{id}

Deletes a user blueprint file by id. Built-in blueprints cannot be deleted.

- **Request**: none.
- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `403` when the blueprint is built-in: `{ "error": "Cannot delete built-in blueprints" }`.
  - `400` when the user blueprint is not found: `{ "error": "Blueprint \"<id>\" not found" }`, or `{ "error": "Failed to delete blueprint" }`.
- **Side effects**: removes the blueprint file and refreshes the cache.

### POST /api/blueprints/{id}/instantiate

Instantiates a blueprint into a new draft workflow, resolving its variables and skipping steps whose conditions are not met.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `variables` | object | yes | A map of blueprint variable id to value. Required variables must be provided. |
| `projectId` | `string` | no | Links the new workflow to a project. |

- **Response** `201`:
  ```json
  { "workflowId": "string", "name": "string", "stepsCount": 0, "skippedSteps": ["string"] }
  ```
- **Errors**:
  - `400` when `variables` is missing or not an object: `{ "error": "variables object is required" }`.
  - `400` when the blueprint is not found: `{ "error": "Blueprint \"<id>\" not found" }`.
  - `400` when a required variable is missing: `{ "error": "Missing required variables: ..." }`.
  - `400` when every step is skipped by its conditions: `{ "error": "All steps were skipped by conditions ..." }`, or another failure message.
- **Side effects**: inserts one workflow row in `draft` status. It does not create tasks or start a run.

### POST /api/blueprints/import

Imports a blueprint by fetching a YAML file from a GitHub URL.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `url` | `string` | yes | A GitHub URL to the blueprint YAML. |

- **Response** `201`: `{ "ok": true, "id": "string", "name": "string" }`.
- **Errors**:
  - `400` when `url` is missing: `{ "error": "url is required" }`.
  - `400` on a non-GitHub URL: `{ "error": "Only GitHub URLs are supported" }`.
  - `400` when the fetch fails: `{ "error": "Failed to fetch blueprint: <status>" }`.
  - `400` on any other failure, including a duplicate id: `{ "error": "<message>" }`, or `{ "error": "Import failed" }`.
- **Side effects**: fetches from GitHub and writes a new user blueprint on disk.

### GET /api/workflows

Lists all workflows with per-workflow task and document rollups.

- **Request**: none.
- **Response** `200`: a JSON array, newest first. Each element:
  ```json
  {
    "id": "string",
    "name": "string",
    "projectId": "string | null",
    "definition": "string",
    "status": "draft",
    "runNumber": 0,
    "createdAt": "string",
    "updatedAt": "string",
    "taskCount": 0,
    "liveTaskCount": 0,
    "outputDocCount": 0
  }
  ```
  `status` is one of `draft`, `active`, `paused`, `completed`, `failed`. `definition` is a raw JSON string. `liveTaskCount` counts running and queued tasks.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/workflows

Creates a workflow in `draft` status from a name and a definition.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Non-empty. |
| `definition` | object | yes | A workflow definition with a `pattern` and at least one step. |
| `projectId` | `string` | no | |

  The `pattern` is one of `sequence`, `planner-executor`, `checkpoint`, `loop`, `parallel`, `swarm`, each with its own step-shape rules.
- **Response** `201`: the created workflow row (`status` is `draft`, `runNumber` is 0).
- **Errors**:
  - `400` when `name` is missing: `{ "error": "Name is required" }`.
  - `400` when the definition is invalid: `{ "error": "Definition must include pattern and at least one step" }`, or a specific validation message.
  - `400` when a step's runtime and profile are incompatible: `{ "error": "<message>" }`.
- **Side effects**: inserts one workflow row. It does not create tasks or start a run.

### PATCH /api/workflows/{id}

Edits a workflow's name or definition, or pauses it. Editing is allowed only for `draft`, `completed`, or `failed` workflows.

- **Request** body (JSON):

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Edit mode. Non-empty. |
| `definition` | object | Edit mode. Re-validated. |
| `status` | `string` | Transition mode. Only `paused` is a real transition. |

- **Response** `200`: in edit mode, the updated workflow row; in pause mode, `{ "id": "string", "status": "paused" }`.
- **Errors**:
  - `404` when not found: `{ "error": "Workflow not found" }`.
  - `409` when editing an active or paused workflow: `{ "error": "Cannot edit active or paused workflows" }`.
  - `400` when nothing to change: `{ "error": "status, name, or definition is required" }`.
  - `409` when pausing a non-active workflow: `{ "error": "Can only pause an active workflow" }`.
  - `400` when asked to set `active`: `{ "error": "Use POST /api/workflows/[id]/execute to resume a workflow" }`.
  - `400` on an unsupported transition: `{ "error": "Invalid status transition: <status>" }`.
- **Side effects**: updates the workflow. Editing a completed or failed workflow resets it to `draft` and discards its execution state. Pausing flips the status but does not cancel running tasks.

### DELETE /api/workflows/{id}

Deletes a workflow and cascade-deletes its tasks, documents, logs, and usage records.

- **Request**: none.
- **Response** `200`: `{ "deleted": true }`.
- **Errors**:
  - `404` when not found: `{ "error": "Workflow not found" }`.
  - `409` when the workflow is active with live tasks: `{ "error": "Cannot delete an active workflow ..." }`.
  - `500` on failure: `{ "error": "<message>" }`, or `{ "error": "Delete failed" }`.
- **Side effects**: cascade-deletes the workflow's dependent records, then the workflow row.

### GET /api/workflows/{id}/debug

Returns a failure analysis for a workflow: a root cause, a timeline, fix suggestions, and per-step errors.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "rootCause": { "type": "unknown", "summary": "string" },
    "timeline": [ { "timestamp": "string", "event": "string", "severity": "error", "details": "string", "stepId": "string" } ],
    "suggestions": [ { "tier": "quick", "title": "string", "description": "string", "action": "string" } ],
    "stepErrors": [ { "stepId": "string", "stepName": "string", "error": "string" } ]
  }
  ```
  `rootCause.type` is one of `budget_exceeded`, `timeout`, `transient`, `unknown`. `timeline[].severity` is one of `success`, `warning`, `error`. `suggestions[].tier` is one of `quick`, `better`, `best`.
- **Errors**: `500` on failure, including a workflow that does not exist: `{ "error": "<message>" }`, or `{ "error": "Analysis failed" }`.
- **Side effects**: reads only.

### GET /api/workflows/{id}/documents

Lists a workflow's document bindings with the attached document metadata. A workflow with no bindings, and a workflow that does not exist, both return an empty array.

- **Request**: none.
- **Response** `200`: a JSON array:
  ```json
  [
    {
      "bindingId": "string",
      "documentId": "string",
      "stepId": "string | null",
      "createdAt": "string",
      "document": { "id": "string", "originalName": "string", "filename": "string", "mimeType": "string", "size": 0, "direction": "output", "status": "ready", "category": "string | null" }
    }
  ]
  ```
  `document` is `null` when the bound document row is missing.
- **Errors**: `500` on failure: `{ "error": "Failed to fetch workflow documents" }`.
- **Side effects**: reads only.

### POST /api/workflows/{id}/documents

Attaches existing documents to a workflow, optionally scoped to a step.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `documentIds` | `string[]` | yes | Non-empty. |
| `stepId` | `string` | no | Scopes the bindings to one step. |

- **Response** `201`: `{ "attached": 0, "workflowId": "string", "stepId": "string | null" }`. `attached` is the number of ids requested; duplicates are skipped.
- **Errors**:
  - `400` when `documentIds` is empty: `{ "error": "documentIds must be a non-empty array" }`.
  - `404` when the workflow is not found: `{ "error": "Workflow not found" }`.
  - `404` when a document is not found: `{ "error": "Documents not found: <ids>" }`.
  - `500` on other failure: `{ "error": "Failed to attach documents" }`.
- **Side effects**: inserts one document binding per id, skipping duplicates.

### DELETE /api/workflows/{id}/documents

Removes document bindings from a workflow. With no body, removes all of them.

- **Request** body (JSON), optional:

| Field | Type | Notes |
|---|---|---|
| `documentIds` | `string[]` | The bindings to remove. Omit to remove all. |
| `stepId` | `string` | Limits removal to one step. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**: `500` on failure: `{ "error": "Failed to remove document bindings" }`. A workflow that does not exist still returns `{ "ok": true }`.
- **Side effects**: removes the matching bindings, or all bindings when no ids are given.

### POST /api/workflows/{id}/execute

Starts or re-runs a workflow. It atomically claims the workflow into `active` and dispatches execution in the background.

- **Request**: none.
- **Response** `202`: `{ "status": "started", "workflowId": "string" }`.
- **Errors**:
  - `404` when not found: `{ "error": "Workflow not found" }`.
  - `409` when the workflow is already running: `{ "error": "Workflow is already running" }`.
  - `500` when the pre-run reset fails: `{ "error": "Failed to reset workflow state" }`.
- **Side effects**: for a completed, failed, or crashed run, cancels orphaned tasks and resets the workflow to `draft`, then claims it into `active` (the guard against double-execution) and runs it in the background. The run later moves the workflow to `completed`, `failed`, or `paused`.

### POST /api/workflows/{id}/resume

Resumes a delay-paused workflow now, rather than waiting for its `resumeAt`. This supports the sequence pattern.

- **Request**: none.
- **Response** `202`: `{ "status": "resuming", "workflowId": "string" }`.
- **Errors**:
  - `404` when not found: `{ "error": "Workflow not found" }`.
  - `409` when the workflow is not paused: `{ "error": "Workflow is not paused (current status: <status>)", "status": "<status>" }`.
- **Side effects**: clears the pause and continues the run in the background from the next step.

### GET /api/workflows/{id}/status

Returns a workflow's full status: its per-step state, run history, and document lists. The shape depends on the workflow pattern.

- **Request**: none.
- **Response** `200`: an object keyed on `pattern`. Common fields include `id`, `name`, `status`, `projectId`, `definition`, `liveTaskCount`, `runNumber`, `runHistory`, `stepDocuments`, and `parentDocuments`. The non-loop patterns add a `resumeAt` (epoch milliseconds or `null`), per-step `state`, and a `workflowState`; the loop pattern adds `loopState` and `loopConfig`. `runHistory` entries are `{ runNumber, taskCount, completedCount, failedCount }`.
- **Errors**: `404` when not found: `{ "error": "Workflow not found" }`.
- **Side effects**: reads only.

### POST /api/workflows/{id}/steps/{stepId}/retry

Retries a single failed step, dispatched in the background. This route returns `202` before it validates anything, so it does not report step-level errors over HTTP.

- **Request**: none.
- **Response** `202`: `{ "status": "retry_started", "workflowId": "string", "stepId": "string" }`.
- **Errors**: none returned to the caller. A missing workflow, a step that is not failed, or an active workflow all cause the retry to fail in the background, not in the response.
- **Side effects**: when the step is failed and the workflow is not active, resets the step, moves the workflow to `active`, and re-runs the step in the background.

### POST /api/workflows/{id}/stop

Stops a running workflow. It cancels the workflow's live tasks and marks the workflow and its state failed. This route acts synchronously.

- **Request**: none.
- **Response** `200`: `{ "status": "stopped", "workflowId": "string", "cancelledTasks": 0 }`.
- **Errors**:
  - `404` when not found: `{ "error": "Workflow not found" }`.
  - `409` when the workflow is not running: `{ "error": "Workflow is not running (current status: <status>)" }`.
  - `500` when the workflow state cannot be parsed: `{ "error": "Failed to parse workflow state" }`.
- **Side effects**: cancels each live task, marks running and waiting steps failed, and sets the workflow status to `failed`. There is no `stopped` status.

### POST /api/workflows/from-assist

Creates a workflow and its per-step tasks together, and optionally starts the run immediately.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Non-empty. |
| `definition` | object | yes | A workflow definition, validated as in `POST /api/workflows`. |
| `projectId` | `string` | no | |
| `priority` | `number` | no | Task priority. Defaults to `2`. |
| `assignedAgent` | `string` | no | Fallback runtime for steps that do not set their own. |
| `executeImmediately` | `boolean` | no | When `true`, creates the workflow `active` and starts it. |

- **Response** `201`:
  ```json
  { "workflow": { }, "taskIds": ["string"], "parentTaskId": null, "status": "created" }
  ```
  `status` is `started` when `executeImmediately` is set, otherwise `created`. `workflow` is the full workflow row.
- **Errors**:
  - `400` when `name` is missing: `{ "error": "Name is required" }`.
  - `400` when the definition is missing or invalid: `{ "error": "Definition must include pattern and at least one step" }`, or a specific message.
  - `400` when a step's runtime and profile are incompatible: `{ "error": "<message>" }`.
  - `500` on failure: `{ "error": "Failed to create workflow and tasks" }`.
- **Side effects**: in one transaction, inserts the workflow and one planned task per step. When `executeImmediately` is set, also starts the run in the background.

### POST /api/workflows/optimize

Returns advisory optimization suggestions for a workflow definition. Suggestions are advisory; the route changes nothing.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `definition` | object | yes | The workflow definition to analyze. |
| `workflowId` | `string` | no | Enables a budget estimate from past runs. |

- **Response** `200`:
  ```json
  {
    "suggestions": [
      { "type": "budget_estimate", "title": "string", "description": "string", "data": {}, "action": { "label": "string", "type": "string", "payload": {} } }
    ]
  }
  ```
  `type` is one of `document_binding`, `budget_estimate`, `runtime_recommendation`, `pattern_insight`. The list may be empty.
- **Errors**:
  - `400` when `definition` is missing: `{ "error": "definition is required" }`.
  - `500` on failure: `{ "error": "<message>" }`, or `{ "error": "Optimization failed" }`.
- **Side effects**: reads only.

### GET /api/notifications

Lists up to 100 notifications, newest first, or just a count.

- **Request** query parameters, all optional:

| Parameter | Type | Notes |
|---|---|---|
| `unread` | `"true"` | Returns only unread notifications. |
| `type` | `string` | Filters by notification type. |
| `countOnly` | `"true"` | Returns `{ "count": 0 }` instead of the rows. |

- **Response** `200`: `{ "count": 0 }` when `countOnly` is set, otherwise a JSON array of notification rows:
  ```json
  [
    {
      "id": "string",
      "taskId": "string | null",
      "type": "permission_required",
      "title": "string",
      "body": "string | null",
      "read": false,
      "toolName": "string | null",
      "toolInput": "string | null",
      "response": "string | null",
      "respondedAt": "string | null",
      "createdAt": "string"
    }
  ]
  ```
  `type` is one of `permission_required`, `task_completed`, `task_failed`, `agent_message`, `budget_alert`, `context_proposal`, `context_proposal_batch`, `tier_limit`. Resolved learning-proposal notifications are hidden from this list.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### PATCH /api/notifications/{id}

Sets a notification's read flag and returns the updated row.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `read` | `boolean` | no | Defaults to `true`. |

- **Response** `200`: the updated notification row.
- **Errors**: `404` when not found: `{ "error": "Not found" }`.
- **Side effects**: updates the notification's read flag.

### DELETE /api/notifications/{id}

Deletes a notification by id.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**: none returned. Deleting an id that does not exist still returns `{ "success": true }`.
- **Side effects**: deletes the notification row.

### PATCH /api/notifications/mark-all-read

Marks every unread notification as read.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**: none returned explicitly.
- **Side effects**: sets all unread notifications to read.

### GET /api/notifications/pending-approvals

Returns the current pending approval and learning notifications as enriched payloads for an inbox.

- **Request**: none.
- **Response** `200`: a JSON array. Each element includes `channel`, `notificationId`, `taskId`, `workflowId`, `toolName`, `permissionLabel`, `compactSummary`, `deepLink`, `supportedActionIds`, `title`, `body`, `taskTitle`, `workflowName`, `toolInput`, `createdAt`, `read`, and `notificationType`. `supportedActionIds` lists the actions the client may offer, such as `allow_once`, `always_allow`, `deny`, `open_inbox`.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### GET /api/notifications/pending-approvals/stream

Streams the pending-approvals list as Server-Sent Events, pushing a new frame whenever the list changes.

- **Request**: none. The stream ends when the client disconnects.
- **Response** `200`, streaming, with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Each data frame is the same pending-approvals array as the non-streaming route:
  ```
  data: [ ... ]
  ```
  The first frame is always sent, and a new frame follows only when the list changes. A keepalive comment (`: keepalive`) is sent every 15 seconds. The list is polled about every 0.75 seconds.
- **Errors**: none as an HTTP status; the route always returns the stream. A database poll failure is retried silently and does not produce a client frame.
- **Side effects**: reads only.

### GET /api/permissions

Returns all saved permission allow-patterns.

- **Request**: none.
- **Response** `200`: `{ "permissions": ["string"] }`. Each entry is a pattern string such as `Read` or `Bash(command:git *)`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/permissions

Adds a permission pattern to the allow-list. Adding a pattern that already exists is a no-op.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `pattern` | `string` | yes | Non-empty. |

- **Response** `200`: `{ "success": true }`.
- **Errors**: `400` when `pattern` is missing: `{ "error": "pattern (string) is required" }`.
- **Side effects**: appends the pattern to the allow-list.

### DELETE /api/permissions

Removes a permission pattern from the allow-list. The pattern to remove is given in the body. Removing a pattern that is not present still succeeds.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `pattern` | `string` | yes | The exact pattern to remove. |

- **Response** `200`: `{ "success": true }`.
- **Errors**: `400` when `pattern` is missing: `{ "error": "pattern (string) is required" }`.
- **Side effects**: removes the pattern from the allow-list.

### GET /api/permissions/presets

Lists the built-in permission presets, each marked with whether it is currently fully active.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "presets": [
      { "id": "string", "name": "string", "description": "string", "risk": "low", "patterns": ["string"], "active": false }
    ]
  }
  ```
  `risk` is one of `low`, `medium`, `high`. A preset is `active` when all of its patterns are on the allow-list.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/permissions/presets

Enables a preset by adding all of its patterns to the allow-list. This is additive and skips patterns already present.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `presetId` | `string` | yes | The preset to enable. |

- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `400` when `presetId` is missing: `{ "error": "presetId (string) is required" }`.
  - `404` when the preset is unknown: `{ "error": "Unknown preset: <presetId>" }`.
- **Side effects**: adds the preset's patterns to the allow-list.

### DELETE /api/permissions/presets

Disables a preset by removing the patterns unique to it. Patterns shared with another still-active preset are kept.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `presetId` | `string` | yes | The preset to disable. |

- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `400` when `presetId` is missing: `{ "error": "presetId (string) is required" }`.
  - `404` when the preset is unknown: `{ "error": "Unknown preset: <presetId>" }`.
- **Side effects**: removes the preset's unique patterns from the allow-list.

### GET /api/schedules

Lists all schedules, newest first.

- **Request**: none.
- **Response** `200`: a JSON array of schedule rows. Key fields include `id`, `projectId`, `name`, `prompt`, `cronExpression`, `assignedAgent`, `agentProfile`, `recurs`, `status`, `maxFirings`, `firingCount`, `expiresAt`, `lastFiredAt`, `nextFireAt`, `type`, `heartbeatChecklist`, `createdAt`, `updatedAt`. `status` is one of `active`, `paused`, `completed`, `expired`. `type` is one of `scheduled`, `heartbeat`.
- **Errors**: none returned explicitly. A database failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/schedules

Creates a scheduled or heartbeat schedule, turning the interval into a cron expression and staggering it to avoid collisions with other schedules in the same project.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Non-empty. |
| `interval` | `string` | yes | A natural-language or cron interval. |
| `prompt` | `string` | for scheduled type | The task prompt. |
| `type` | `"scheduled" \| "heartbeat"` | no | Defaults to `scheduled`. |
| `projectId` | `string` | no | |
| `assignedAgent` | `string` | no | |
| `agentProfile` | `string` | no | Checked for runtime compatibility. |
| `recurs` | `boolean` | no | Defaults to `true`. |
| `maxFirings` | `number` | no | |
| `expiresInHours` | `number` | no | Sets an expiry. |
| `heartbeatChecklist` | array | for heartbeat type | At least one `{ id, instruction, priority }` item. |
| `activeHoursStart` | `number` | no | Heartbeat only. 0 to 23. |
| `activeHoursEnd` | `number` | no | Heartbeat only. 0 to 23. |
| `activeTimezone` | `string` | no | Defaults to `UTC`. |
| `heartbeatBudgetPerDay` | `number` | no | |
| `documentIds` | `string[]` | no | Documents to link to the schedule. |

- **Response** `201`:
  ```json
  {
    "schedule": { },
    "warnings": [ { "type": "cron_collision", "overlappingSchedules": ["string"], "overlappingMinutes": [0], "estimatedConcurrentSteps": 0 } ]
  }
  ```
  `schedule` is the created schedule row. `warnings` is empty unless the new schedule overlaps a busy schedule in the same project.
- **Errors**:
  - `400` when `name` is missing: `{ "error": "Name is required" }`.
  - `400` when `interval` is missing: `{ "error": "Interval is required" }`.
  - `400` when a scheduled schedule has no prompt: `{ "error": "Prompt is required" }`.
  - `400` when a heartbeat schedule has no checklist: `{ "error": "Heartbeat schedules require at least one checklist item" }`.
  - `400` on out-of-range active hours: `{ "error": "Active hours start must be 0-23" }`, or the end equivalent.
  - `400` when the interval cannot be parsed, or a profile is incompatible: `{ "error": "<message>" }`.
- **Side effects**: inserts one schedule row, staggering its cron minute to avoid collisions, and links any documents. It does not fire the schedule.

### GET /api/schedules/{id}

Fetches one schedule with its firing history.

- **Request**: none.
- **Response** `200`: the schedule row, with `heartbeatChecklist` parsed to an array (or `null`), plus a `firingHistory` array of the tasks this schedule has fired, newest first.
- **Errors**: `404` when not found: `{ "error": "Schedule not found" }`.
- **Side effects**: reads only.

### PATCH /api/schedules/{id}

Updates a schedule, including pausing and resuming it.

- **Request** body (JSON), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `status` | `"paused" \| "active"` | Pause or resume. |
| `name` | `string` | Non-empty when given. |
| `prompt` | `string` | Non-empty when given. |
| `interval` | `string` | Re-parsed to a new cron expression. |
| `assignedAgent` | `string` | |
| `agentProfile` | `string` | |
| `heartbeatChecklist` | array | |
| `activeHoursStart` | `number \| null` | |
| `activeHoursEnd` | `number \| null` | |
| `activeTimezone` | `string` | |
| `heartbeatBudgetPerDay` | `number \| null` | |

- **Response** `200`:
  ```json
  { "schedule": { }, "warnings": [ ] }
  ```
  `schedule` is the updated row; `warnings` follows the same collision shape as `POST /api/schedules`.
- **Errors**:
  - `404` when not found: `{ "error": "Schedule not found" }`.
  - `409` when pausing a non-active schedule: `{ "error": "Can only pause an active schedule" }`.
  - `409` when resuming a non-paused schedule: `{ "error": "Can only resume a paused schedule" }`.
  - `400` on an invalid status: `{ "error": "Invalid status: <status>" }`.
  - `400` when a provided name or prompt is blank: `{ "error": "Name cannot be empty" }`, or the prompt equivalent.
  - `400` when the interval cannot be parsed, or a profile is incompatible: `{ "error": "<message>" }`.
- **Side effects**: updates the schedule. Pausing clears the next fire time; resuming recomputes it. It does not fire the schedule.

### DELETE /api/schedules/{id}

Deletes a schedule by id.

- **Request**: none.
- **Response** `200`: `{ "deleted": true }`.
- **Errors**: `404` when not found: `{ "error": "Schedule not found" }`.
- **Side effects**: deletes the schedule row.

### POST /api/schedules/{id}/execute

Fires a schedule now: it creates a queued task, atomically claims a concurrency slot, and dispatches the task in the background. Add `?force=true` to bypass the concurrency cap.

- **Request** query parameter:

| Parameter | Type | Notes |
|---|---|---|
| `force` | `"true"` | Bypasses the concurrency cap and records an audit entry. |

- **Response** `200`: `{ "taskId": "string", "forced": false }`.
- **Errors**:
  - `404` when not found: `{ "error": "schedule_not_found" }`.
  - `429` when the concurrency cap is full and `force` is not set: `{ "error": "capacity_full", "message": "Swarm at capacity (<running>/<cap>). Retry in ~60s or add ?force=true to bypass.", "slotEtaSec": 60 }`.
- **Side effects**: creates a queued task, claims a run slot, and runs the task in the background. When the slot cannot be claimed, the task is deleted again. This route does not advance the schedule's own firing count or next fire time.

### GET /api/schedules/{id}/heartbeat-history

Returns recent heartbeat evaluation entries and summary stats for a heartbeat schedule.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "history": [ { "id": "string", "taskId": "string | null", "event": "heartbeat_action", "payload": "string | null", "timestamp": "string" } ],
    "stats": { "suppressionCount": 0, "lastActionAt": "string | null", "firingCount": 0, "heartbeatSpentToday": 0, "heartbeatBudgetPerDay": "number | null" }
  }
  ```
  `event` is one of `heartbeat_action`, `heartbeat_suppressed`.
- **Errors**:
  - `404` when not found: `{ "error": "Schedule not found" }`.
  - `400` when the schedule is not a heartbeat: `{ "error": "Not a heartbeat schedule" }`.
- **Side effects**: reads only.

### POST /api/schedules/parse

Parses a natural-language or cron interval into a cron expression, a description, the next fire times, and a confidence score. It creates nothing.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `expression` | `string` | yes | The interval to parse. |

- **Response** `200`:
  ```json
  {
    "cronExpression": "string",
    "description": "string",
    "nextFireTimes": ["string"],
    "confidence": 1.0
  }
  ```
  `nextFireTimes` holds three ISO timestamps.
- **Errors**:
  - `400` when `expression` is missing: `{ "error": "Expression is required" }`.
  - `400` when it cannot be parsed: `{ "error": "Could not parse \"<input>\". Try expressions like \"every weekday at 9am\", \"hourly\", \"5m\", or a cron expression." }`.
- **Side effects**: reads only.

## Examples

Instantiate a blueprint into a draft workflow, then run it:

```bash
curl -X POST http://127.0.0.1:3000/api/blueprints/<blueprintId>/instantiate \
  -H "Content-Type: application/json" \
  -d '{ "variables": { "topic": "Q3 launch" } }'

curl -X POST http://127.0.0.1:3000/api/workflows/<workflowId>/execute
```

Poll a running workflow's status:

```bash
curl http://127.0.0.1:3000/api/workflows/<workflowId>/status
```

Stream pending approvals into an inbox:

```bash
curl -N http://127.0.0.1:3000/api/notifications/pending-approvals/stream
```

The `-N` flag keeps `curl` from buffering, so you see each frame as it arrives.

Check what a schedule interval resolves to before creating it:

```bash
curl -X POST http://127.0.0.1:3000/api/schedules/parse \
  -H "Content-Type: application/json" \
  -d '{ "expression": "every weekday at 9am" }'
```

## Do Not Depend On

- A workflow's top-level status has no `running`, `stopped`, or `cancelled` value. A run in progress is `active`; a stopped workflow is `failed`. `paused` covers both a delay wait and a human-input wait; tell them apart by the presence of `resumeAt` and the per-step state, not the top-level status.
- `execute`, `resume`, and step `retry` return `202` before the work runs. A `202` means the run was claimed and dispatched, not that it succeeded. Poll the status route.
- `POST /api/workflows/{id}/steps/{stepId}/retry` returns `202` before it validates anything, so an invalid retry looks identical to a valid one over HTTP. Confirm the outcome by polling the status route.
- `GET /api/workflows/{id}/debug` returns `500`, not `404`, for a workflow that does not exist, because the analysis throws on a missing workflow.
- `GET` and `DELETE` on `/api/workflows/{id}/documents` do not check that the workflow exists; a missing workflow yields an empty list or a success. Only `POST` validates the workflow.
- Pausing a workflow through `PATCH /api/workflows/{id}` flips the status but does not stop tasks that are already running. Use `POST /api/workflows/{id}/stop` to cancel live tasks.
- The `POST /api/schedules/{id}/execute` not-found body is `{ "error": "schedule_not_found" }`, while the other schedule routes use `{ "error": "Schedule not found" }`. Do not match on one spelling across all schedule routes.
- Permission mutations return only `{ "success": true }`; they do not echo the resulting allow-list. Re-read `GET /api/permissions` to observe the new state.
