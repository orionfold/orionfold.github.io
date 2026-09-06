import { getCorsHeaders } from "../_shared/cors.ts";
import { serviceEnvironment } from "../_shared/service-environment.ts";
import {
  alertText,
  canonicalPayload,
  createInsert,
  FLOW_ENTERPRISE_BODY_LIMIT_BYTES,
  type FlowEnterpriseInput,
  type FlowEnterpriseInsert,
  type FlowEnterpriseStored,
  safeErrorCode,
  type SaveResult,
  validateFlowEnterpriseBody,
} from "./contract.ts";

export interface AlertEmail {
  idempotencyKey: string;
  replyTo: string;
  subject: string;
  text: string;
  to: "manav@orionfold.com";
}

export interface HandlerDependencies {
  enabled: () => boolean;
  allowedOrigins: () => string[];
  corsHeaders: (request: Request) => Record<string, string>;
  requestFingerprint: (request: Request) => Promise<string>;
  hashPayload: (canonicalPayload: string) => Promise<string>;
  saveEnquiry: (record: FlowEnterpriseInsert) => Promise<SaveResult>;
  updateAlert: (
    id: string,
    values: {
      alertStatus: "pending" | "sent" | "failed";
      alertAttemptedAt: string;
      alertSentAt: string | null;
      alertErrorCode: string | null;
      alertProviderId: string | null;
      alertRequiresManualReview: boolean;
    },
  ) => Promise<boolean>;
  sendAlert: (email: AlertEmail) => Promise<string>;
  now: () => string;
  logError?: (event: string, code: string) => void;
}

function json(
  body: Record<string, unknown>,
  headers: Record<string, string>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function fallbackCors(allowedOrigins: string[]): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigins[0] ?? "https://orionfold.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

async function readBody(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new Error("invalid_length");
    }
    if (length > FLOW_ENTERPRISE_BODY_LIMIT_BYTES) {
      throw new Error("body_too_large");
    }
  }
  if (!request.body) throw new Error("invalid_json");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > FLOW_ENTERPRISE_BODY_LIMIT_BYTES) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("invalid_json");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_json");
  }
}

async function deliverAlert(
  input: FlowEnterpriseInput,
  record: FlowEnterpriseStored,
  deps: HandlerDependencies,
): Promise<"sent" | "pending"> {
  if (record.alertStatus === "sent") return "sent";
  const currentTime = deps.now();
  const attemptedAt = record.alertAttemptedAt ?? currentTime;
  if (record.alertAttemptedAt) {
    const elapsed = Date.parse(currentTime) -
      Date.parse(record.alertAttemptedAt);
    if (!Number.isFinite(elapsed) || elapsed >= 23 * 60 * 60 * 1_000) {
      if (!record.alertRequiresManualReview) {
        try {
          await deps.updateAlert(record.id, {
            alertStatus: "failed",
            alertAttemptedAt: record.alertAttemptedAt,
            alertSentAt: null,
            alertErrorCode: "manual_review_required",
            alertProviderId: null,
            alertRequiresManualReview: true,
          });
        } catch (error) {
          deps.logError?.(
            "flow_enterprise_manual_review_update_failed",
            safeErrorCode(error),
          );
        }
      }
      return "pending";
    }
  }
  try {
    // Persist the attempt before provider IO. Automatic replay remains inside
    // Resend's 24-hour idempotency window; older uncertainty is held above.
    const claimed = await deps.updateAlert(record.id, {
      alertStatus: "pending",
      alertAttemptedAt: attemptedAt,
      alertSentAt: null,
      alertErrorCode: null,
      alertProviderId: null,
      alertRequiresManualReview: false,
    });
    if (!claimed) return "sent";
    const providerId = await deps.sendAlert({
      idempotencyKey: `flow-enterprise-${input.requestId}`,
      replyTo: input.email,
      to: "manav@orionfold.com",
      subject: `Flow enterprise enquiry · ${input.company}`,
      text: alertText(input),
    });
    await deps.updateAlert(record.id, {
      alertStatus: "sent",
      alertAttemptedAt: attemptedAt,
      alertSentAt: deps.now(),
      alertErrorCode: null,
      alertProviderId: providerId,
      alertRequiresManualReview: false,
    });
    return "sent";
  } catch (error) {
    const code = safeErrorCode(error);
    deps.logError?.("flow_enterprise_alert_pending", code);
    try {
      await deps.updateAlert(record.id, {
        alertStatus: "failed",
        alertAttemptedAt: attemptedAt,
        alertSentAt: null,
        alertErrorCode: code,
        alertProviderId: null,
        alertRequiresManualReview: false,
      });
    } catch (statusError) {
      deps.logError?.(
        "flow_enterprise_alert_status_update_failed",
        safeErrorCode(statusError),
      );
    }
    return "pending";
  }
}

export function createFlowEnterpriseHandler(deps: HandlerDependencies) {
  return async (request: Request): Promise<Response> => {
    let allowedOrigins: string[];
    try {
      allowedOrigins = deps.allowedOrigins();
    } catch (error) {
      deps.logError?.(
        "flow_enterprise_environment_invalid",
        safeErrorCode(error),
      );
      return json(
        { error: "Enterprise contact is unavailable." },
        fallbackCors(["https://orionfold.com"]),
        503,
      );
    }

    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      return json(
        { error: "Origin is not allowed." },
        fallbackCors(allowedOrigins),
        403,
      );
    }

    let cors: Record<string, string>;
    try {
      cors = deps.corsHeaders(request);
    } catch (error) {
      deps.logError?.("flow_enterprise_cors_invalid", safeErrorCode(error));
      return json(
        { error: "Origin is not allowed." },
        fallbackCors(allowedOrigins),
        403,
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, cors, 405);
    }
    if (!deps.enabled()) {
      return json({ error: "Enterprise contact is unavailable." }, cors, 503);
    }
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]
      .trim().toLowerCase();
    if (contentType !== "application/json") {
      return json(
        { error: "Content-Type must be application/json." },
        cors,
        415,
      );
    }

    let body: unknown;
    try {
      body = await readBody(request);
    } catch (error) {
      const status =
        error instanceof Error && error.message === "body_too_large"
          ? 413
          : 400;
      return json(
        {
          error: status === 413
            ? "Request body is too large."
            : "Invalid JSON body.",
        },
        cors,
        status,
      );
    }

    const validation = validateFlowEnterpriseBody(body);
    if (!validation.ok) return json({ error: validation.error }, cors, 400);
    const input = validation.input;
    if (input.website) {
      return json(
        {
          success: true,
          requestId: input.requestId,
          notificationStatus: "pending",
        },
        cors,
        202,
      );
    }

    try {
      const [requestFingerprint, payloadHash] = await Promise.all([
        deps.requestFingerprint(request),
        deps.hashPayload(canonicalPayload(input)),
      ]);
      const saved = await deps.saveEnquiry(
        createInsert(input, requestFingerprint, payloadHash),
      );
      if (saved.kind === "rate_limited") {
        return json(
          { error: "Too many requests. Try again later." },
          cors,
          429,
        );
      }
      if (saved.record.payloadHash !== payloadHash) {
        return json(
          { error: "That request ID was already used for different details." },
          cors,
          409,
        );
      }

      const notificationStatus = await deliverAlert(
        input,
        saved.record,
        deps,
      );
      return json(
        {
          success: true,
          requestId: input.requestId,
          notificationStatus,
        },
        cors,
        notificationStatus === "sent" ? 200 : 202,
      );
    } catch (error) {
      deps.logError?.("flow_enterprise_request_failed", safeErrorCode(error));
      return json(
        { error: "We could not save the enterprise request. Try again." },
        cors,
        500,
      );
    }
  };
}

export const defaultEnvironmentDependencies = {
  allowedOrigins: () => serviceEnvironment().allowedOrigins,
  corsHeaders: getCorsHeaders,
};
