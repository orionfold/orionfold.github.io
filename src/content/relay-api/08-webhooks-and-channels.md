---
id: "08-webhooks-and-channels"
title: "Channels And Webhooks API"
status: "draft"
stability: "webhook"
families: ["channels"]
---

## Who This Is For

This group is for a developer connecting a local Relay instance to an outside messaging surface: Slack, Telegram, or a generic outbound webhook. It covers creating and managing channel configurations, live-testing a channel's connection, and the inbound endpoints that receive third-party events and turn them into chat turns. Read this if you are wiring Relay into a team chat, receiving messages from a bot, or building an integration that posts into Relay from an external service.

Unlike the other groups in this reference, the two inbound endpoints are genuinely externally facing: they receive requests signed or secret-gated by a third party, not the local app. They are documented with that trust boundary in mind.

## Stability

`webhook`

These routes implement webhook and channel plumbing. The management routes power the Relay Settings screens and may change their request and response shapes between releases, so branch on HTTP status codes rather than on the internal structure of a response body. The two inbound webhook routes follow the Slack and Telegram platform contracts; the shape of what they accept is set by those platforms, not by Relay.

## Local Access Model

Relay API routes run inside the local Relay app. Use `http://127.0.0.1:<port>` in examples, where `<port>` is the port your instance is bound to (3000 by default).

The management routes (`GET`/`POST`/`PATCH`/`DELETE` on `/api/channels`) are local app routes and should not be exposed publicly. The inbound routes (`/api/channels/inbound/slack`, `/api/channels/inbound/telegram`) are the exception by design: they must be reachable by Slack or Telegram, so they carry their own request authentication (an HMAC signature for Slack, a shared secret for Telegram) rather than relying on network isolation. Only expose those two paths, and only after a channel is configured with the matching secret.

## Conventions For This Group

These behaviors hold across the routes below, so they are stated once here rather than repeated per endpoint:

- **Channel types.** A channel's `channelType` is one of `slack`, `telegram`, `webhook`. Each type requires specific `config` fields: Slack needs `webhookUrl`; Telegram needs `botToken` and `chatId`; a generic webhook needs `url`.
- **Secrets are masked on read, stored in cleartext.** Every response that returns a channel serializes its `config` through a mask: the keys `botToken`, `signingSecret`, and `webhookSecret` come back as `****` followed by the last four characters, never in full. All other config keys (such as `webhookUrl` or `chatId`) are returned as-is. Note that at rest these secrets are stored in the local database as plaintext JSON; the masking applies only to what the API returns.
- **Direction.** A channel's `direction` is `outbound` or `bidirectional`, defaulting to `outbound`. Inbound messages are only processed for a `bidirectional` channel; an inbound message to an outbound-only channel is accepted at the HTTP layer but silently dropped by the gateway.
- **Timestamps.** `createdAt` and `updatedAt` serialize to ISO date strings on the wire.
- **Inbound acknowledgement semantics.** The Slack and Telegram inbound routes return `200 { "ok": true }` immediately and process the message in the background, so a `200` means the event was accepted, not that a reply was sent or that processing succeeded. The Telegram poll route is the exception: it processes updates synchronously and returns counts.
- **Validation.** These routes validate by hand rather than with a shared schema. Error bodies are `{ "error": "<message>" }` with the specific message noted per route.

## Endpoint Families

- `channels`

## Endpoints

| Method(s) | Path | Stability | Source |
|---|---|---|---|
| `GET`, `POST` | `/api/channels` | `webhook` | `src/app/api/channels/route.ts` |
| `DELETE`, `GET`, `PATCH` | `/api/channels/{id}` | `webhook` | `src/app/api/channels/[id]/route.ts` |
| `POST` | `/api/channels/{id}/test` | `webhook` | `src/app/api/channels/[id]/test/route.ts` |
| `POST` | `/api/channels/inbound/slack` | `webhook` | `src/app/api/channels/inbound/slack/route.ts` |
| `POST` | `/api/channels/inbound/telegram` | `webhook` | `src/app/api/channels/inbound/telegram/route.ts` |
| `POST` | `/api/channels/inbound/telegram/poll` | `webhook` | `src/app/api/channels/inbound/telegram/poll/route.ts` |

## Endpoint Reference

### GET /api/channels

Lists all channel configurations, newest first.

- **Request**: none.
- **Response** `200`: a JSON array of channel objects, ordered by `createdAt` descending. Each element:
  ```json
  {
    "id": "string",
    "channelType": "slack",
    "name": "string",
    "config": "{\"webhookUrl\":\"https://...\"}",
    "status": "active",
    "testStatus": "untested",
    "direction": "outbound",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
  ```
  `config` is a JSON string with secret keys masked to `****<last4>`. `channelType` is one of `slack`, `telegram`, `webhook`. `status` is `active` or `disabled`. `testStatus` is `untested`, `ok`, or `failed`. `direction` is `outbound` or `bidirectional`.
- **Errors**: none returned explicitly.
- **Side effects**: reads only.

### POST /api/channels

Creates a channel configuration.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Display name for the channel. |
| `channelType` | `string` | yes | One of `slack`, `telegram`, `webhook`. |
| `config` | `object` | yes | Type-specific settings (see below). |

  Required `config` keys by type: Slack requires `webhookUrl`; Telegram requires `botToken` and `chatId`; a generic webhook requires `url`.
- **Response** `201`: the created channel object (same masked shape as a `GET` element). Created with `status` `active` and `testStatus` `untested`; `direction` defaults to `outbound`.
- **Errors** (all `400`):
  - `{ "error": "Name is required" }`.
  - `{ "error": "Invalid channel type. Must be one of: slack, telegram, webhook" }`.
  - `{ "error": "Config object is required" }`.
  - `{ "error": "Slack channels require a webhookUrl" }`.
  - `{ "error": "Telegram channels require botToken and chatId" }`.
  - `{ "error": "Webhook channels require a url" }`.
- **Side effects**: inserts a row into the channel-config table. The `config` is stored as plaintext JSON.

### GET /api/channels/{id}

Fetches one channel configuration by id.

- **Request**: none.
- **Response** `200`: the channel object (masked).
- **Errors**: `404` when not found: `{ "error": "Channel not found" }`.
- **Side effects**: reads only.

### PATCH /api/channels/{id}

Partially updates a channel configuration. Every supplied field is optional; only provided fields change.

- **Request** body (JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | no | Trimmed. Must not be blank if provided. |
| `config` | `object` | no | Replaces the stored config. Supplying it also resets `testStatus` to `untested`. |
| `status` | `string` | no | `active` or `disabled`. |
| `direction` | `string` | no | `outbound` or `bidirectional`. |

- **Response** `200`: the updated channel object (masked). `updatedAt` is refreshed on every update.
- **Errors**:
  - `404` when not found: `{ "error": "Channel not found" }`.
  - `400` when `name` is provided but blank: `{ "error": "Name cannot be empty" }`.
  - `400` on an invalid status: `{ "error": "Invalid status" }`.
  - `400` on an invalid direction: `{ "error": "Invalid direction" }`.
- **Side effects**: updates the channel-config row.

### DELETE /api/channels/{id}

Deletes a channel configuration by id.

- **Request**: none.
- **Response** `200`: `{ "deleted": true }`.
- **Errors**: `404` when not found: `{ "error": "Channel not found" }`.
- **Side effects**: removes the channel-config row.

### POST /api/channels/{id}/test

Live-tests a channel by asking its adapter to make a real connection, then persists the result.

- **Request**: none.
- **Response** `200`: `{ "testStatus": "ok" | "failed", "error": "string" }`. `error` is present only on failure. The route also writes the resulting `testStatus` back to the channel row.
  - Slack sends a test post to the configured `webhookUrl`.
  - Telegram sends a test message via the Bot API using `botToken` and `chatId`.
- **Errors**:
  - `404` when not found: `{ "error": "Channel not found" }`.
  - `500` on unparseable stored config: `{ "error": "Invalid channel config JSON" }`.
  - `500` when the adapter throws (for example an unknown channel type): `{ "testStatus": "failed", "error": "<message>" }`.
- **Side effects**: makes an outbound call to the channel's platform and updates the row's `testStatus` and `updatedAt`.

### POST /api/channels/inbound/slack

Receives Slack Events API callbacks. This endpoint is externally facing and verifies Slack's request signature before doing any work. It handles the one-time URL-verification challenge and ongoing message events.

- **Request**:
  - Query param `configId` identifies the channel (required except for the URL-verification challenge).
  - Body is the raw Slack event payload. The handler reads the raw text first so it can verify the signature, then parses it as JSON.
  - **Signature verification**: the stored channel config must contain a `signingSecret`. The handler reads the `x-slack-request-timestamp` and `x-slack-signature` headers, rejects timestamps more than five minutes old (replay protection), and compares an HMAC-SHA256 of the raw body against the signature using a constant-time check.
  - A message event is only processed when it is a real user message: events with a bot id or a subtype, and non-message events, are accepted and ignored.
- **Response**:
  - URL-verification challenge: `200` `{ "challenge": "<value>" }`.
  - Any accepted or ignored event: `200` `{ "ok": true }`, returned immediately. Message handling runs in the background.
- **Errors**:
  - `400` on an unparseable body: `{ "error": "Invalid JSON" }`.
  - `400` when `configId` is missing (and the request is not a challenge): `{ "error": "Missing configId" }`.
  - `404` when the channel is not found: `{ "error": "Channel not found" }`.
  - `500` on unparseable stored config: `{ "error": "Invalid channel config" }`.
  - `401` when the stored config has no `signingSecret`, so the request cannot be verified. The error body states that the channel config is missing its signing secret and the request cannot be verified.
  - `403` on a signature mismatch: `{ "error": "Invalid signature" }`.
- **Side effects**: reads the channel config. For an accepted message it dispatches to the inbound gateway without waiting, which may create a conversation, run the chat engine, and post a reply back to Slack. A message to a channel that is not `bidirectional` is dropped by the gateway.

### POST /api/channels/inbound/telegram

Receives Telegram Bot API webhook updates. This endpoint is externally facing and authenticates with a shared secret carried in the query string, matching Telegram's `secret_token` design.

- **Request**:
  - Query params `configId` (required) and `secret` (required), where `secret` is compared against the channel's stored `webhookSecret`.
  - Body is the Telegram update object, parsed as JSON.
  - Only text messages are processed. Updates without message text (edits, photos, and similar) are accepted and ignored, as are messages from a bot (loop prevention).
  - Because the secret rides in the query string, it can appear in access logs; treat it as sensitive and rotate it if a log is exposed.
- **Response**:
  - Any accepted or ignored update: `200` `{ "ok": true }`, returned immediately. Message handling runs in the background.
- **Errors**:
  - `400` when `configId` is missing: `{ "error": "Missing configId" }`.
  - `404` when the channel is not found: `{ "error": "Channel not found" }`.
  - `500` on unparseable stored config: `{ "error": "Invalid channel config" }`.
  - `401` when the stored config has no `webhookSecret`, so the request cannot be verified. The error body states that the channel config is missing its webhook secret and the request cannot be verified.
  - `403` on a secret mismatch: `{ "error": "Invalid secret" }`.
  - `400` on an unparseable body: `{ "error": "Invalid JSON body" }`.
- **Side effects**: reads the channel config. For an accepted message it dispatches to the inbound gateway without waiting, which may create a conversation, run the chat engine, and reply via the Telegram Bot API. A message to a channel that is not `bidirectional` is dropped by the gateway.

### POST /api/channels/inbound/telegram/poll

Polls Telegram for pending updates and processes them, for local development where Telegram cannot reach a localhost webhook. This route is for internal callers only and is driven by the local scheduler, not by a third party.

- **Request**:
  - Requires the header `x-ainative-internal` set to `poll`; any other value is rejected.
  - Query param `configId` (required).
  - Optional body `{ "offset": number }`; a missing or malformed body is tolerated.
- **Response** `200`:
  - When there are no updates: `{ "processed": 0, "nextOffset": <offset or null> }`.
  - When updates were processed: `{ "processed": <number>, "total": <number>, "nextOffset": <number> }`, where `nextOffset` is the highest update id seen plus one.
- **Errors**:
  - `401` when the internal header is absent or wrong. The error body states that the endpoint is for internal use only.
  - `400` when `configId` is missing: `{ "error": "Missing configId" }`.
  - `404` when the channel is not found: `{ "error": "Channel not found" }`.
  - `403` when the channel is not active: `{ "error": "Channel is not active" }`.
  - `500` on unparseable stored config: `{ "error": "Invalid channel config" }`.
  - `400` when the config has no bot token: `{ "error": "Missing botToken in config" }`.
  - `502` when Telegram's `getUpdates` reports failure: `{ "error": "Telegram getUpdates failed" }`.
  - `502` when the call to Telegram throws: `{ "error": "<message>" }`.
- **Side effects**: calls Telegram's `getUpdates`, processes each non-bot text update synchronously through the inbound gateway (which may run the chat engine and reply), then calls `getUpdates` again with the advanced offset to acknowledge consumed updates.

## Do Not Depend On

- The exact masking format for secrets (`****` plus the last four characters) is a display convenience and may change; never parse a masked value back into a usable credential.
- The background, fire-and-forget dispatch of inbound Slack and Telegram messages is an implementation detail. Do not assume a `200` means a reply was delivered; observe the channel itself for the reply.
- The internal poll route (`/telegram/poll`) exists for local development and is gated to the scheduler. Do not build against it as a public integration point.
- The internal gateway's rejection of outbound-only channels is silent at the HTTP layer. Set a channel to `bidirectional` explicitly if you expect inbound handling.
