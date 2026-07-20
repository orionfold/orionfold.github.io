export type WorkshopEntitlementState =
  | "pending"
  | "active"
  | "delivery_retrying"
  | "refund_pending"
  | "refunded"
  | "delivery_blocked";

export type WorkshopRefundStatus =
  | "confirmation_sent"
  | "pending"
  | "succeeded"
  | "failed"
  | "canceled"
  | "late_review";

export function canExchangeAccess(
  state: WorkshopEntitlementState,
  expiresAt: Date,
  now = new Date(),
): boolean {
  return (state === "active" || state === "refund_pending") && expiresAt.getTime() > now.getTime();
}

export function accessStateAfterRefund(
  refundStatus: WorkshopRefundStatus,
): WorkshopEntitlementState {
  switch (refundStatus) {
    case "pending":
    case "confirmation_sent":
      return "refund_pending";
    case "succeeded":
      return "refunded";
    case "failed":
    case "canceled":
      return "active";
    case "late_review":
      return "active";
  }
}

export function safeRefundStatus(status: string | null | undefined): WorkshopRefundStatus {
  if (status === "succeeded" || status === "failed" || status === "canceled" || status === "pending") {
    return status;
  }
  return "pending";
}

export function genericRequestResponse() {
  return {
    ok: true,
    message: "If that inbox owns this edition, the requested link is on its way.",
  } as const;
}
