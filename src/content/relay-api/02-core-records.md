---
id: "02-core-records"
title: "Core Records API"
status: "draft"
stability: "app-internal"
families: ["customers","projects","tasks","documents","handoffs","memory"]
---

## Who This Is For

This group is for a developer working with the records that organize work inside a local Relay instance: customers, projects, tasks, documents, handoffs between agents, and per-agent memory. Read this if you are scripting task creation and execution, wiring documents into a project, moving work between agent profiles, or inspecting a task's logs, output, and provenance.

## Stability

`app-internal`

These routes power the Relay web app. They are documented so you can build against a local instance, but their request and response shapes are tied to the app's own screens and may change between releases. Where a route is safe to depend on, it says so. Branch on HTTP status codes rather than on the internal structure of an error body, and treat every response field as additive: read the fields you need and ignore the rest.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

Do not expose these routes on a public network without your own access controls. Many of them read and write the local SQLite database, and the document routes read and write local files.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Timestamps.** `createdAt`, `updatedAt`, and similar fields are stored as integer epochs and serialized to ISO date strings on the wire. A few routes convert explicitly with `.toISOString()`; the shape is the same either way.
- **Malformed request bodies.** Most write routes read the JSON body without a guard. A malformed or empty body throws before validation and surfaces as an unhandled `500`, not a structured `400`. Send well-formed JSON with `Content-Type: application/json`.
- **Validation error bodies.** Routes that validate with a schema return `400` with `{ "error": <zod flatten object> }`, whose shape is `{ "formErrors": string[], "fieldErrors": { "<field>": string[] } }`. The internal structure can change with schema edits; branch on the `400` status.
- **Row shapes.** Where a route returns a stored row, the fields listed are the columns that route actually selects. Some routes return the full row and some return a named subset; each endpoint says which.

## Endpoint Families

- `customers`
- `projects`
- `tasks`
- `documents`
- `handoffs`
- `memory`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `GET`, `POST` | `/api/customers` | `app-internal` | `src/app/api/customers/route.ts` |
| `GET`, `PATCH` | `/api/customers/{id}` | `app-internal` | `src/app/api/customers/[id]/route.ts` |
| `POST` | `/api/customers/{id}/link-project` | `app-internal` | `src/app/api/customers/[id]/link-project/route.ts` |
| `GET`, `POST` | `/api/projects` | `app-internal` | `src/app/api/projects/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/projects/{id}` | `app-internal` | `src/app/api/projects/[id]/route.ts` |
| `GET`, `PUT` | `/api/projects/{id}/documents` | `app-internal` | `src/app/api/projects/[id]/documents/route.ts` |
| `GET`, `POST` | `/api/tasks` | `app-internal` | `src/app/api/tasks/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/tasks/{id}` | `app-internal` | `src/app/api/tasks/[id]/route.ts` |
| `POST` | `/api/tasks/{id}/cancel` | `app-internal` | `src/app/api/tasks/[id]/cancel/route.ts` |
| `POST` | `/api/tasks/{id}/execute` | `app-internal` | `src/app/api/tasks/[id]/execute/route.ts` |
| `GET` | `/api/tasks/{id}/history` | `app-internal` | `src/app/api/tasks/[id]/history/route.ts` |
| `GET` | `/api/tasks/{id}/logs` | `app-internal` | `src/app/api/tasks/[id]/logs/route.ts` |
| `GET` | `/api/tasks/{id}/output` | `app-internal` | `src/app/api/tasks/[id]/output/route.ts` |
| `GET` | `/api/tasks/{id}/provenance` | `app-internal` | `src/app/api/tasks/[id]/provenance/route.ts` |
| `POST` | `/api/tasks/{id}/respond` | `app-internal` | `src/app/api/tasks/[id]/respond/route.ts` |
| `POST` | `/api/tasks/{id}/resume` | `app-internal` | `src/app/api/tasks/[id]/resume/route.ts` |
| `GET` | `/api/tasks/{id}/siblings` | `app-internal` | `src/app/api/tasks/[id]/siblings/route.ts` |
| `GET` | `/api/tasks/{id}/target` | `app-internal` | `src/app/api/tasks/[id]/target/route.ts` |
| `POST` | `/api/tasks/assist` | `app-internal` | `src/app/api/tasks/assist/route.ts` |
| `GET`, `POST` | `/api/documents` | `app-internal` | `src/app/api/documents/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/documents/{id}` | `app-internal` | `src/app/api/documents/[id]/route.ts` |
| `GET` | `/api/documents/{id}/file` | `app-internal` | `src/app/api/documents/[id]/file/route.ts` |
| `GET` | `/api/documents/{id}/versions` | `app-internal` | `src/app/api/documents/[id]/versions/route.ts` |
| `GET`, `POST` | `/api/handoffs` | `app-internal` | `src/app/api/handoffs/route.ts` |
| `GET`, `PATCH` | `/api/handoffs/{id}` | `app-internal` | `src/app/api/handoffs/[id]/route.ts` |
| `DELETE`, `GET`, `PATCH`, `POST` | `/api/memory` | `app-internal` | `src/app/api/memory/route.ts` |

## Endpoint Reference

### GET /api/customers

Lists all customers with a per-customer project count, ordered by name.

- **Request**: none.
- **Response** `200`: a JSON array. Each element:
  ```json
  {
    "id": "string",
    "name": "string",
    "slug": "string",
    "status": "active",
    "industry": "string | null",
    "notes": "string | null",
    "createdAt": "string",
    "updatedAt": "string",
    "projectCount": 0
  }
  ```
  `status` is one of `active`, `archived`. `projectCount` is the number of projects linked to the customer.
- **Errors**: none returned explicitly. A database read failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/customers

Creates a customer. If a customer with the same slug already exists, returns that existing customer instead of creating a duplicate.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | 1 to 120 characters. |
| `slug` | `string` | no | Up to 64 characters, lowercase letters, numbers, and hyphens only. Derived from `name` when omitted. |
| `industry` | `string` | no | Up to 80 characters. |
| `notes` | `string` | no | Up to 1000 characters. |
| `status` | `"active" \| "archived"` | no | Defaults to `active`. |

- **Response**: `201` when a new customer is created, `200` when an existing customer with the same slug is returned. Body is the customer row: `id`, `name`, `slug`, `status`, `industry`, `notes`, `createdAt`, `updatedAt`.
- **Errors**:
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `400` when the name cannot produce a usable slug: `{ "error": "Cannot derive a customer slug from name: <name>" }`.
- **Side effects**: inserts one customer row only when the slug is new. On the idempotent path (existing slug), no write occurs.

### GET /api/customers/{id}

Fetches a single customer by id.

- **Request**: none.
- **Response** `200`: the customer row (`id`, `name`, `slug`, `status`, `industry`, `notes`, `createdAt`, `updatedAt`).
- **Errors**: `404` when not found: `{ "error": "Customer not found" }`.
- **Side effects**: reads only.

### PATCH /api/customers/{id}

Updates a customer's mutable fields and returns the updated row. The `slug` is immutable and is ignored if sent.

- **Request** body (JSON), all fields optional; only fields you send are changed:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | 1 to 120 characters. |
| `industry` | `string \| null` | Up to 80 characters. `null` clears it. |
| `notes` | `string \| null` | Up to 1000 characters. `null` clears it. |
| `status` | `"active" \| "archived"` | |

- **Response** `200`: the updated customer row. `updatedAt` is always advanced.
- **Errors**:
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `404` when not found: `{ "error": "Customer not found" }`.
- **Side effects**: updates the customer row. No write on the `400` or `404` path.

### POST /api/customers/{id}/link-project

Links an existing project to this customer by setting the project's `customerId`. A project's previous customer link, if any, is overwritten.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `projectId` | `string` | yes | Non-empty. Unlinking is not supported here. |

- **Response** `200`: `{ "customerId": "string", "projectId": "string" }`.
- **Errors**:
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `404` when the customer is not found: `{ "error": "Customer not found" }`.
  - `404` when the project is not found: `{ "error": "Project not found" }`.
- **Side effects**: sets the project's `customerId` and advances the project's `updatedAt`. No write until both the customer and project are found.

### GET /api/projects

Lists all projects with per-project task and document counts.

- **Request**: none.
- **Response** `200`: a JSON array. Each element:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "workingDirectory": "string | null",
    "customerId": "string | null",
    "status": "active",
    "createdAt": "string",
    "updatedAt": "string",
    "taskCount": 0,
    "docCount": 0
  }
  ```
  `status` is one of `active`, `paused`, `completed`.
- **Errors**: none returned explicitly. A database read failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/projects

Creates a project. When `workingDirectory` is set, the route also scans that directory's environment; the scan is best-effort and its failure does not fail project creation.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | 1 to 100 characters. |
| `description` | `string` | no | Up to 500 characters. |
| `workingDirectory` | `string` | no | Up to 500 characters. Triggers an environment scan. |
| `customerId` | `string \| null` | no | Links the project to an existing customer. |

- **Response** `201`: the project row (`id`, `name`, `description`, `workingDirectory`, `customerId`, `status`, `createdAt`, `updatedAt`). `status` is `active` on creation.
- **Errors**:
  - `400` when the request body is not valid JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `404` when `customerId` does not resolve: `{ "error": "Customer not found: <id>" }`.
- **Side effects**: inserts one project row. When `workingDirectory` is set, scans and records the project's environment (best-effort).

### GET /api/projects/{id}

Fetches a single project by id.

- **Request**: none.
- **Response** `200`: the project row (same shape as the POST response).
- **Errors**: `404` when not found: `{ "error": "Not found" }`.
- **Side effects**: reads only.

### PATCH /api/projects/{id}

Updates project fields and optionally replaces the project's default document bindings.

- **Request** body (JSON), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | 1 to 100 characters. |
| `description` | `string` | Up to 500 characters. |
| `workingDirectory` | `string` | Up to 500 characters. |
| `status` | `"active" \| "paused" \| "completed"` | |
| `customerId` | `string \| null` | `null` clears the customer link. |
| `documentIds` | `string[]` | Replaces the project's default document bindings. Omit to leave bindings unchanged. |

- **Response** `200`: the updated project row. `updatedAt` is always advanced.
- **Errors**:
  - `400` when the request body is not valid JSON: `{ "error": "Invalid JSON body" }`.
  - `400` when the body is not a JSON object: `{ "error": "Invalid request body" }`.
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `404` when not found: `{ "error": "Not found" }`.
  - `404` when `customerId` does not resolve: `{ "error": "Customer not found: <id>" }`.
  - `404` when any `documentIds` value does not resolve: `{ "error": "Documents not found: <ids>" }`.
- **Side effects**: updates the project row. When `documentIds` is present, Relay validates the full set and replaces the project's default-document bindings in the same transaction. An empty array clears the defaults; failed validation leaves the project and bindings unchanged.

### DELETE /api/projects/{id}

Deletes a project and cascade-deletes everything that belongs to it: its tasks, documents, workflows, schedules, chat conversations, usage records, and the project's user tables with their rows, columns, views, and triggers.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `404` when not found: `{ "error": "Not found" }`.
  - `500` on failure: `{ "error": "<message>" }`, or `{ "error": "Delete failed" }` when the cause is not an `Error`.
- **Side effects**: deletes the project and all of its dependent records in one cascade.

### GET /api/projects/{id}/documents

Lists the default document bindings for a project, as flat document metadata. A project with no bindings, and a project id that does not exist, both return an empty array.

- **Request**: none.
- **Response** `200`: a JSON array. Each element:
  ```json
  {
    "id": "string",
    "originalName": "string",
    "filename": "string",
    "mimeType": "string",
    "size": 0,
    "direction": "input",
    "status": "ready",
    "category": "string | null"
  }
  ```
  `direction` is one of `input`, `output`. `status` is one of `uploaded`, `processing`, `ready`, `error`.
- **Errors**: `500` on failure: `{ "error": "Failed to fetch project documents" }`.
- **Side effects**: reads only.

### PUT /api/projects/{id}/documents

Replaces all default document bindings for a project with the provided id list.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `documentIds` | `string[]` | yes | The full replacement set. A non-array value is rejected. |

- **Response** `200`: `{ "updated": 0, "projectId": "string" }`. `updated` is the number of ids received.
- **Errors**:
  - `400` when `documentIds` is not an array: `{ "error": "documentIds must be an array" }`.
  - `404` when the project is not found: `{ "error": "Project not found" }`.
  - `500` on other failure: `{ "error": "Failed to update project documents" }`.
- **Side effects**: clears the project's existing default-document bindings, then inserts one binding per id. Duplicate bindings are skipped.

### GET /api/tasks

Lists tasks, optionally filtered by project and status, ordered by priority then newest first.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `projectId` | `string` | Filters to one project. |
| `status` | `string` | One of `planned`, `queued`, `running`, `completed`, `failed`, `cancelled`. |

- **Response** `200`: a JSON array of full task rows. Key fields include `id`, `projectId`, `workflowId`, `scheduleId`, `title`, `description`, `status`, `assignedAgent`, `agentProfile`, `priority`, `result`, `sessionId`, `sourceType`, `workflowRunNumber`, `createdAt`, `updatedAt`. `status` is one of the six values above; `assignedAgent` is one of `claude-code`, `openai-codex-app-server`, `anthropic-direct`, `openai-direct`, `ollama`.
- **Errors**: `400` when `status` is invalid: `{ "error": "Invalid status. Must be one of: planned, queued, running, completed, failed, cancelled" }`.
- **Side effects**: reads only.

### POST /api/tasks

Creates a task in `planned` status and optionally links documents to it.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | 1 to 200 characters. |
| `description` | `string` | no | Up to 2000 characters. |
| `projectId` | `string` | no | |
| `priority` | `number` | no | 0 to 3. Defaults to `2`. |
| `assignedAgent` | `string` | no | One of the five runtime ids. |
| `agentProfile` | `string` | no | An agent profile name. |
| `documentIds` | `string[]` | no | Documents to link and preprocess. |

- **Response** `201`: the created task row. `status` is `planned`; no execution is started.
- **Errors**:
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `400` when the chosen runtime and profile are incompatible: `{ "error": "<message>" }`.
- **Side effects**: inserts one task row. When `documentIds` is present, links each document to the task and preprocesses it (best-effort; failures are logged and do not fail creation).

### GET /api/tasks/{id}

Returns one task enriched with related project, workflow, and schedule names, and aggregated token usage.

- **Request**: none.
- **Response** `200`: the full task row plus `projectName`, `workflowName`, and `scheduleName` when the corresponding link is set. A `usage` object is included only when usage has been recorded:
  ```json
  {
    "usage": {
      "inputTokens": 0,
      "outputTokens": 0,
      "totalTokens": 0,
      "costMicros": 0,
      "modelId": "string | null",
      "startedAt": "string",
      "finishedAt": "string"
    }
  }
  ```
- **Errors**: `404` when not found: `{ "error": "Not found" }`.
- **Side effects**: reads only.

### PATCH /api/tasks/{id}

Updates a task and reconciles its linked documents. A `status` change is checked against the allowed transitions before it is applied.

- **Request** body (JSON), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | 1 to 200 characters. |
| `description` | `string` | Up to 2000 characters. |
| `status` | `string` | One of the six task statuses; must be a valid transition. |
| `priority` | `number` | 0 to 3. |
| `assignedAgent` | `string` | One of the five runtime ids. |
| `agentProfile` | `string` | |
| `result` | `string` | |
| `sessionId` | `string` | |
| `documentIds` | `string[]` | Reconciles the task's document links. |

  Allowed status transitions: `planned` to `queued` or `cancelled`; `queued` to `running`, `planned`, or `cancelled`; `running` to `completed`, `failed`, or `cancelled`; `completed` to `planned`; `failed` to `planned`, `queued`, or `running`; `cancelled` to `planned` or `running`.
- **Response** `200`: the updated task row.
- **Errors**:
  - `400` on validation failure: `{ "error": <zod flatten object> }`.
  - `404` when not found: `{ "error": "Not found" }`.
  - `400` when the runtime and profile are incompatible: `{ "error": "<message>" }`.
  - `400` on a disallowed status change: `{ "error": "Invalid transition from <current> to <next>" }`.
- **Side effects**: updates the task row. When `documentIds` is present, unlinks documents no longer in the set and links the new ones (best-effort). No execution is triggered.

### DELETE /api/tasks/{id}

Deletes a task row. This is a plain delete regardless of task status; it does not cancel a running runtime.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**: `404` when not found: `{ "error": "Not found" }`.
- **Side effects**: deletes the task row.

### POST /api/tasks/{id}/cancel

Cancels a task through its runtime.

- **Request**: none.
- **Response** `200`: `{ "success": true }`.
- **Errors**: `404` when not found: `{ "error": "Not found" }`. A runtime cancel failure propagates unhandled.
- **Side effects**: asks the task's runtime to cancel the task. The resulting state change is performed by the runtime, not by this route.

### POST /api/tasks/{id}/execute

Atomically claims a `queued` task, moves it to `running`, resolves its runtime and profile, and dispatches execution in the background. The response returns as soon as the task is claimed and dispatched; the work runs after the response.

- **Request**: none.
- **Response** `202`: `{ "message": "Execution started" }`.
- **Errors**:
  - `429` when a budget guardrail blocks execution: `{ "error": "<message>" }`.
  - `404` when not found: `{ "error": "Not found" }`.
  - `400` when the task is not `queued`: `{ "error": "Task must be queued to execute, current status: <status>" }`.
  - `400` when the runtime or profile cannot be resolved, or is incompatible: `{ "error": "<message>" }`. In this case the task is also written to `failed` with the message as its result.
- **Side effects**: claims the task with an atomic move to `running` (this is the guard against double-execution), auto-classifies a profile when none is set, and starts execution in the background. On a resolve or compatibility failure it marks the task `failed`.

### GET /api/tasks/{id}/logs

Streams a task's agent log entries as Server-Sent Events, polling for new rows until the client disconnects.

- **Request**: none. The stream ends when the client closes the connection.
- **Response** `200`, streaming, with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Each data frame is one agent-log row:
  ```
  data: { "id": "string", "taskId": "string", "agentType": "string", "event": "string", "payload": "string", "timestamp": "string" }
  ```
  A keepalive comment (`: keepalive`) is sent every 15 seconds. If a database poll fails, the stream emits `data: { "type": "error", "message": "Database query failed" }` and keeps running.
- **Errors**: none as an HTTP status; the route always returns the stream. A task id that does not exist simply streams nothing.
- **Side effects**: reads only.

### GET /api/tasks/{id}/output

Returns a task's result text with a detected content type.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "taskId": "string",
    "status": "completed",
    "result": "string",
    "contentType": "text"
  }
  ```
  `result` is the empty string when the task has no result. `contentType` is one of `text`, `markdown`, `code`, `json`, detected from the result content.
- **Errors**: `404` when not found: `{ "error": "Task not found" }`.
- **Side effects**: reads only.

### GET /api/tasks/{id}/provenance

Returns a provenance record for a task: a newest-first timeline of its logs, approval prompts, and cost entries, with totals.

- **Request**: none.
- **Response** `200`:
  ```json
  {
    "taskId": "string",
    "taskTitle": "string",
    "taskStatus": "string",
    "initiator": "user",
    "agentProfile": "string | null",
    "runtime": "string | null",
    "createdAt": "string",
    "completedAt": "string | null",
    "timeline": [
      { "timestamp": "string", "type": "log", "event": "string", "detail": "string | null", "status": "string" }
    ],
    "totalCost": 0,
    "approvalCount": 0,
    "toolCallCount": 0
  }
  ```
  `timeline[].type` is one of `log`, `approval`, `cost`. `completedAt` is set only when the task is completed. `totalCost` is in dollars.
- **Errors**: `404` when not found: `{ "error": "Task not found" }`.
- **Side effects**: reads only.

### POST /api/tasks/{id}/respond

Records a user's response to a pending task notification, such as a permission prompt or an agent question. The agent's own polling loop consumes the response; this route only records it. The response is matched by `notificationId` in the body, not by the task id in the path.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `notificationId` | `string` | yes | The pending notification to answer. |
| `behavior` | `"allow" \| "deny"` | yes | |
| `message` | `string` | no | |
| `updatedInput` | any | no | Edited tool input. May only change keys present in the original tool input. |
| `alwaysAllow` | `boolean` | no | |
| `permissionPattern` | `string` | no | Saved as an always-allow rule when `behavior` is `allow` and `alwaysAllow` is set. |

- **Response** `200`: `{ "success": true }`.
- **Errors**:
  - `400` on validation failure: `{ "error": "notificationId (string) and behavior ('allow' | 'deny') are required" }`.
  - `404` when the notification is not found: `{ "error": "Notification not found" }`.
  - `409` when the notification was already answered: `{ "error": "Already responded" }`.
  - `400` when an agent-question answer is not `{ answer: string }`: `{ "error": "AskUserQuestion response must be { answer: string }" }`.
  - `400` when `updatedInput` adds keys the original tool input did not have: `{ "error": "updatedInput contains disallowed keys: <keys>" }`.
- **Side effects**: records the response on the notification and marks it read. When `behavior` is `allow` with `alwaysAllow` and a pattern, saves an always-allow permission rule.

### POST /api/tasks/{id}/resume

Resumes a `failed` or `cancelled` task that has a saved session, atomically moving it to `running` and dispatching the resume in the background. Use this when a session exists; use a fresh re-queue otherwise.

- **Request**: none.
- **Response** `202`: `{ "message": "Resume started" }`.
- **Errors**:
  - `404` when not found: `{ "error": "Not found" }`.
  - `400` when there is no session to resume, advising a retry instead: `{ "error": "No session to resume ..." }`.
  - `400` when the resume limit is reached: `{ "error": "Resume limit reached. Re-queue for fresh start." }`.
  - `429` when a budget guardrail blocks the resume: `{ "error": "<message>" }`.
  - `400` when the task is not `failed` or `cancelled`: `{ "error": "Task must be failed or cancelled to resume, current status: <status>" }`.
  - `400` when the runtime cannot be resolved: `{ "error": "<message>" }`. The task is also written to `failed` with the message as its result.
- **Side effects**: claims the task with an atomic move to `running` and starts the resume in the background. On a resolve failure it marks the task `failed`.

### GET /api/tasks/{id}/siblings

Returns the other tasks in the same workflow run as this task.

- **Request**: none.
- **Response** `200`: a JSON array, ordered oldest first, excluding the task itself:
  ```json
  [
    { "id": "string", "title": "string", "status": "running", "createdAt": "string" }
  ]
  ```
  A task with no workflow, or a task id that does not exist, returns an empty array.
- **Errors**: none returned.
- **Side effects**: reads only.

### POST /api/tasks/assist

Improves a draft task with AI: given a title and description, returns a refined description, a suggested breakdown into subtasks, and orchestration recommendations. This route is not tied to a task id and creates no task. It calls a model before responding.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | no | |
| `description` | `string` | no | |
| `assignedAgent` | `string` | no | Runtime to run the assist. |

  At least one of `title` or `description` must be non-empty.
- **Response** `200`:
  ```json
  {
    "improvedDescription": "string",
    "breakdown": [
      { "title": "string", "description": "string", "suggestedProfile": "string", "requiresApproval": false, "dependsOn": [0] }
    ],
    "recommendedPattern": "single",
    "complexity": "simple",
    "needsCheckpoint": false,
    "reasoning": "string",
    "suggestedLoopConfig": { "maxIterations": 0, "timeBudgetMs": 0 },
    "suggestedSwarmConfig": { "workerConcurrencyLimit": 0 }
  }
  ```
  `recommendedPattern` is one of `single`, `sequence`, `planner-executor`, `checkpoint`, `parallel`, `loop`, `swarm`. `complexity` is one of `simple`, `moderate`, `complex`. The two config objects appear only when relevant.
- **Errors**:
  - `400` when neither title nor description is provided: `{ "error": "Provide at least a title or description" }`.
  - `429` when a budget guardrail blocks the call: `{ "error": "<message>" }`.
  - `500` on any other failure: `{ "error": "<message>" }`, or `{ "error": "AI assist failed" }`.
- **Side effects**: runs a model to produce the suggestions. No task is created.

### GET /api/documents

Lists documents with joined task, project, and workflow metadata, filterable and newest first.

- **Request** query parameters, all optional:

| Parameter | Type | Notes |
|---|---|---|
| `id` | `string` | Exact document id match. |
| `taskId` | `string` | Exact match. |
| `projectId` | `string` | Exact match. |
| `status` | `string` | One of `uploaded`, `processing`, `ready`, `error`. |
| `direction` | `string` | One of `input`, `output`. |
| `search` | `string` | Matches the original name or extracted text. |

- **Response** `200`: a JSON array. Each element:
  ```json
  {
    "id": "string",
    "taskId": "string | null",
    "projectId": "string | null",
    "filename": "string",
    "originalName": "string",
    "mimeType": "string",
    "size": 0,
    "storagePath": "string",
    "version": 1,
    "direction": "output",
    "category": "string | null",
    "status": "ready",
    "extractedText": "string | null",
    "processedPath": "string | null",
    "processingError": "string | null",
    "createdAt": "string",
    "updatedAt": "string",
    "taskTitle": "string | null",
    "projectName": "string | null",
    "workflowId": "string | null",
    "workflowName": "string | null",
    "workflowRunNumber": "number | null"
  }
  ```
- **Errors**:
  - `400` on an invalid `status`: `{ "error": "Invalid status. Must be one of: uploaded, processing, ready, error" }`.
  - `400` on an invalid `direction`: `{ "error": "Invalid direction. Must be one of: input, output" }`.
- **Side effects**: reads only.

### POST /api/documents

Registers a document by copying an existing server-local file into Relay's uploads directory, then preprocesses it in the background. The source path is checked against a set of restricted system and home directories before the file is read.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `file_path` | `string` | yes | Path to a file on the server host. Must be under the home directory or `/tmp`, and outside restricted system and secret directories. |
| `taskId` | `string` | no | Must resolve to an existing task. |
| `projectId` | `string` | no | Must resolve to an existing project. |
| `direction` | `"input" \| "output"` | no | Defaults to `output`. |

- **Response** `201`:
  ```json
  {
    "documentId": "string",
    "status": "uploaded",
    "processingStatus": "queued",
    "originalName": "string",
    "mimeType": "string",
    "size": 0
  }
  ```
- **Errors**:
  - `400` on validation failure: `{ "error": "Invalid request body", "details": [ ... ] }`.
  - `403` when the path is under a restricted system directory: `{ "error": "Access denied: path points to a restricted system directory" }`.
  - `403` when the path is under a sensitive home directory: `{ "error": "Access denied: path points to a sensitive home directory" }`.
  - `403` when the path is outside home and `/tmp`: `{ "error": "Access denied: path must be under the user's home directory or /tmp" }`.
  - `400` when the file does not exist: `{ "error": "File not found: <file_path>" }`.
  - `400` when the path is not a regular file: `{ "error": "Not a file: <file_path>" }`.
  - `404` when `taskId` does not resolve: `{ "error": "Task not found: <id>" }`.
  - `404` when `projectId` does not resolve: `{ "error": "Project not found: <id>" }`.
- **Side effects**: copies the source file into the uploads directory, inserts a document row at `version` 1 with status `uploaded`, and preprocesses it in the background. Preprocessing sets the status to `ready` or `error`.

### GET /api/documents/{id}

Fetches a single document with joined task, project, and workflow metadata.

- **Request**: none.
- **Response** `200`: one document object, the same shape as an element of the `GET /api/documents` list.
- **Errors**: `404` when not found: `{ "error": "Document not found" }`.
- **Side effects**: reads only.

### PATCH /api/documents/{id}

Updates a document's task and project links, its category, and optionally re-runs preprocessing.

- **Request** body (JSON), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `taskId` | `string \| null` | Must be a valid id. `null` unlinks. |
| `projectId` | `string \| null` | Must be a valid id. `null` unlinks. |
| `category` | `string` | Up to 100 characters. |
| `metadata` | object | Merged into the `category` field as JSON. Overrides a `category` sent in the same request. |
| `reprocess` | `boolean` | When `true`, clears the extracted text and re-runs preprocessing. |

- **Response** `200`: the full updated document row.
- **Errors**:
  - `400` when the request body is not valid JSON: `{ "error": "Invalid JSON body" }`.
  - `400` on validation failure: `{ "error": "Invalid request body", "details": [ ... ] }`.
  - `404` when not found: `{ "error": "Document not found" }`.
  - `404` when a non-null `taskId` does not resolve: `{ "error": "Task not found: <id>" }`.
  - `404` when a non-null `projectId` does not resolve: `{ "error": "Project not found: <id>" }`.
- **Side effects**: updates the document row. When `reprocess` is `true`, preprocesses the document again in the background.

### GET /api/documents/{id}/file

Serves the stored file bytes for a document. On success this returns the raw file, not JSON.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `inline` | `"1"` | Serves inline instead of as a download, honored only for images and PDFs. |
| `thumb` | `"1"` | Serves the processed thumbnail when one exists. |

- **Response** `200`: the raw file bytes, with headers `Content-Type: <document mime type>`, `Content-Disposition: <inline or attachment>; filename="<name>"`, and `X-Content-Type-Options: nosniff`.
- **Errors**:
  - `404` when the document row is not found: `{ "error": "Document not found" }`.
  - `404` when the file is missing on disk: `{ "error": "File not found" }`.
- **Side effects**: reads only.

### GET /api/documents/{id}/versions

Returns the version history for an output document: all output documents in the same project that share its original name, newest version first. An input document, or a document with no project, returns an empty array.

- **Request**: none.
- **Response** `200`: a JSON array:
  ```json
  [
    { "id": "string", "version": 1, "size": 0, "status": "ready", "createdAt": "string", "workflowRunNumber": "number | null" }
  ]
  ```
- **Errors**: `404` when the document is not found: `{ "error": "Document not found" }`.
- **Side effects**: reads only.

### DELETE /api/documents/{id}

Deletes a document row and its stored file. A document linked to a task is protected: the delete is refused unless you confirm it.

- **Request** query parameter:

| Parameter | Type | Notes |
|---|---|---|
| `cascadeDelete` | `"true"` | Required to delete a task-linked document. |

- **Response** `204`: no body.
- **Errors**:
  - `404` when not found: `{ "error": "Document not found" }`.
  - `409` when the document is task-linked and not confirmed: `{ "error": "Document is linked to task <taskId>. Add ?cascadeDelete=true to confirm." }`.
- **Side effects**: deletes the stored file (best-effort) and the document row. It does not delete the linked task.

### GET /api/handoffs

Lists up to 100 handoff messages between agent profiles, newest first, optionally filtered.

- **Request** query parameters, both optional:

| Parameter | Type | Notes |
|---|---|---|
| `status` | `string` | Filters by handoff status. |
| `profileId` | `string` | Matches the target (`toProfileId`) profile. |

- **Response** `200`: a JSON array of handoff rows:
  ```json
  [
    {
      "id": "string",
      "fromProfileId": "string",
      "toProfileId": "string",
      "taskId": "string | null",
      "targetTaskId": "string | null",
      "subject": "string",
      "body": "string",
      "attachments": "string | null",
      "priority": 2,
      "status": "pending",
      "requiresApproval": false,
      "approvedBy": "string | null",
      "parentMessageId": "string | null",
      "chainDepth": 0,
      "createdAt": "string",
      "respondedAt": "string | null",
      "expiresAt": "string | null"
    }
  ]
  ```
  `status` is one of `pending`, `accepted`, `in_progress`, `completed`, `rejected`, `expired`.
- **Errors**: none returned explicitly. A database read failure propagates unhandled.
- **Side effects**: reads only.

### POST /api/handoffs

Creates a handoff message from one agent profile to another. When approval is required, the handoff starts in `pending` and a notification is created; otherwise it starts in `accepted`. Creating the handoff does not run it; downstream processing happens separately.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `fromProfileId` | `string` | yes | The source profile. Cannot equal the target. |
| `toProfileId` | `string` | yes | The target profile. |
| `subject` | `string` | yes | |
| `body` | `string` | yes | |
| `sourceTaskId` | `string` | no | |
| `priority` | `number` | no | Defaults to `2`. |
| `requiresApproval` | `boolean` | no | Defaults to `false`. |
| `parentMessageId` | `string` | no | Sets the handoff's position in a chain. |

- **Response** `201`: the created handoff row (same shape as the `GET /api/handoffs` element).
- **Errors**:
  - `400` when a required field is missing: `{ "error": "fromProfileId is required" }`, `{ "error": "toProfileId is required" }`, `{ "error": "subject is required" }`, or `{ "error": "body is required" }`.
  - `400` on a governance failure: `{ "error": "<message>" }`. Messages include a self-handoff (`"Cannot hand off to the same profile (no self-handoff)"`), a chain depth limit of 5, and an unknown source or target profile.
- **Side effects**: inserts one handoff row. When `requiresApproval` is `true`, also inserts an approval notification.

### GET /api/handoffs/{id}

Fetches a single handoff by id.

- **Request**: none.
- **Response** `200`: the handoff row.
- **Errors**: `404` when not found: `{ "error": "Handoff not found" }`.
- **Side effects**: reads only.

### PATCH /api/handoffs/{id}

Approves or rejects a pending handoff. Only a handoff still in `pending` can be acted on.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | `"approve" \| "reject"` | yes | |
| `approvedBy` | `string` | no | Defaults to `user`. |

- **Response** `200`: the updated handoff row. On approve the status becomes `accepted`; on reject it becomes `rejected`. `respondedAt` is set.
- **Errors**:
  - `404` when not found: `{ "error": "Handoff not found" }`.
  - `400` when the action is missing or invalid: `{ "error": "action must be 'approve' or 'reject'" }`.
  - `409` when the handoff is not pending: `{ "error": "Cannot <action> a handoff with status: <status>" }`.
- **Side effects**: updates the handoff's status, `approvedBy`, and `respondedAt`. Approving it makes it eligible for later processing; this route does not run that processing.

### GET /api/memory

Lists memory entries for one agent profile, ordered by confidence.

- **Request** query parameters:

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `profileId` | `string` | yes | The profile whose memory to list. |
| `category` | `string` | no | Filters by category. |
| `status` | `string` | no | Filters by status. |

- **Response** `200`: a JSON array of memory rows:
  ```json
  [
    {
      "id": "string",
      "profileId": "string",
      "category": "fact",
      "content": "string",
      "confidence": 700,
      "sourceTaskId": "string | null",
      "tags": "string | null",
      "lastAccessedAt": "number | null",
      "accessCount": 0,
      "decayRate": 10,
      "status": "active",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
  ```
  `category` is one of `fact`, `preference`, `pattern`, `outcome`. `status` is one of `active`, `decayed`, `archived`, `rejected`. `confidence` is on a 0 to 1000 scale.
- **Errors**: `400` when `profileId` is missing: `{ "error": "profileId query parameter is required" }`.
- **Side effects**: reads only.

### POST /api/memory

Creates a new active memory entry for a profile. Note that on creation, `confidence` is given on a 0-to-1 scale.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `profileId` | `string` | yes | |
| `category` | `string` | yes | One of `fact`, `preference`, `pattern`, `outcome`. |
| `content` | `string` | yes | |
| `tags` | array | no | Stored as JSON. |
| `confidence` | `number` | no | On a 0-to-1 scale. Defaults to `0.7`. |

- **Response** `201`: `{ "id": "string" }`.
- **Errors**:
  - `400` when a required field is missing: `{ "error": "profileId, category, and content are required" }`.
  - `400` on an invalid category: `{ "error": "category must be one of: fact, preference, pattern, outcome" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Failed to create memory" }`.
- **Side effects**: inserts one memory row with status `active`.

### PATCH /api/memory

Updates a memory entry's confidence and status. The target is identified by an `id` in the body, not a path parameter. Note that here `confidence` is on a 0-to-1000 scale.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | The memory to update. |
| `confidence` | `number` | no | On a 0-to-1000 scale. |
| `status` | `string` | no | One of `active`, `decayed`, `archived`, `rejected`. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `400` when `id` is missing: `{ "error": "id is required" }`.
  - `400` on an invalid status: `{ "error": "status must be one of: active, decayed, archived, rejected" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Failed to update memory" }`.
- **Side effects**: updates the memory row. A non-existent id is a no-op that still returns `200`.

### DELETE /api/memory

Archives a memory entry by setting its status to `archived`. This is a soft delete; the row is kept. The target is identified by an `id` in the body.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | The memory to archive. |

- **Response** `200`: `{ "ok": true }`.
- **Errors**:
  - `400` when `id` is missing: `{ "error": "id is required" }`.
  - `400` on any other failure: `{ "error": "<message>" }`, or `{ "error": "Failed to archive memory" }`.
- **Side effects**: sets the memory's status to `archived`. A non-existent id is a no-op that still returns `200`.

### GET /api/tasks/{id}/history

Returns the task's bounded run history, including each run's status, timing, output summary, error, and retained log events.

- **Request**: none.
- **Response** `200`: `{ "taskId": "string", "currentRun": { }, "runs": [ ] }`. Up to 20 runs are returned newest first. `currentRun` is the current task state normalized to the same run shape.
- **Errors**: `404` when not found: `{ "error": "Task not found" }`.
- **Side effects**: reads task state, output versions, and task events only.

### GET /api/tasks/{id}/target

Previews the effective execution target Relay would use for a task without starting it.

- **Request**: none.
- **Response** `200`: `{ "kind": "task", "ready": true, "targets": [ ], "context": { ... }, "error": null }`. The single target includes the resolved runtime, model, profile, and readiness details. `context.cell` contains only `vocabularyVersion` and `instanceId`; the context also carries `projectId`, `projectName`, the effective `workingDirectory`, and `workingDirectorySource` (`project` or `launch`). Data-directory and database paths remain restricted to the Settings instance response. Runtime and working directory describe where the task executes; they are not a separate customer data or credential boundary.
- **Errors**:
  - `404` when not found: `{ "error": "Task not found" }`.
  - `409` when the requested target cannot be resolved: `{ "kind": "task", "ready": false, "targets": [], "context": { ... } | null, "error": { } }`. Context remains available when it resolved before the runtime failure.
- **Side effects**: reads task, profile, routing, and runtime configuration only.

## Examples

List a project's tasks that are still running:

```bash
curl "http://127.0.0.1:3000/api/tasks?projectId=<projectId>&status=running"
```

Create a task, then queue and execute it:

```bash
curl -X POST http://127.0.0.1:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{ "title": "Summarize the Q3 report", "priority": 1 }'

curl -X PATCH http://127.0.0.1:3000/api/tasks/<taskId> \
  -H "Content-Type: application/json" \
  -d '{ "status": "queued" }'

curl -X POST http://127.0.0.1:3000/api/tasks/<taskId>/execute
```

Follow a running task's logs as they stream:

```bash
curl -N http://127.0.0.1:3000/api/tasks/<taskId>/logs
```

The `-N` flag keeps `curl` from buffering, so you see each log frame as it arrives.

Register a local file as a document on a task:

```bash
curl -X POST http://127.0.0.1:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{ "file_path": "/tmp/report.pdf", "taskId": "<taskId>", "direction": "input" }'
```

## Do Not Depend On

- The exact contents of a Zod flatten error object may change with schema edits. Branch on the `400` status, not on the internal structure of `error`.
- Several routes have no error handling on their read path or their JSON parse. A database failure, or a malformed request body, surfaces as an unhandled `500` rather than a structured error. This applies to the list reads and to the body parse on most write routes.
- `POST /api/tasks/{id}/execute` and `POST /api/tasks/{id}/resume` return `202` before the work runs. A `202` means the task was claimed and dispatched, not that it succeeded. Poll the task, its logs, or its output for the result.
- `POST /api/tasks/{id}/cancel` delegates the state change to the runtime. A `200` means the cancel was requested, not that the task has already stopped.
- The `confidence` scale differs between memory routes: `POST /api/memory` takes a 0-to-1 value, while `GET` and `PATCH` use the stored 0-to-1000 scale. Do not assume one scale across all three.
- `DELETE /api/memory` archives rather than deletes, and both `PATCH` and `DELETE` return `200` for an id that does not exist. Do not treat a `200` as proof that a row was found and changed.
- `POST /api/tasks/{id}/respond` matches the notification by the `notificationId` in the body; the task id in the path is not used for the lookup.
