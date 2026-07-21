import {
  type ConsultingRequestRecord,
  customerConfirmationText,
  notificationText,
} from "./contract.ts";

export type DeliveryResult = "sent" | "delayed";
export type DeliveryKind = "operator" | "customer";

export interface ProposalDeliveryRecord extends ConsultingRequestRecord {
  id: string;
}

export interface ProposalEmail {
  idempotencyKey: string;
  replyTo: string;
  subject: string;
  text: string;
  to: string;
}

export interface DeliveryDependencies {
  now: () => string;
  sendEmail: (email: ProposalEmail) => Promise<void>;
  updateProposal: (
    id: string,
    values: Record<string, string>,
  ) => Promise<void>;
  logError?: (message: string, error: unknown) => void;
}

function emailFor(
  record: ProposalDeliveryRecord,
  kind: DeliveryKind,
): ProposalEmail {
  return kind === "operator"
    ? {
      idempotencyKey: `consulting-operator-${record.request_id}`,
      replyTo: record.business_email,
      to: "manav@orionfold.com",
      subject:
        `Non-binding proposal request · ${record.proposal_number} · ${record.company_name}`,
      text: notificationText(record),
    }
    : {
      idempotencyKey: `consulting-customer-${record.request_id}`,
      replyTo: "manav@orionfold.com",
      to: record.business_email,
      subject:
        `We received your Orionfold proposal · ${record.proposal_number}`,
      text: customerConfirmationText(record),
    };
}

export async function deliverProposalEmail(
  record: ProposalDeliveryRecord,
  kind: DeliveryKind,
  dependencies: DeliveryDependencies,
): Promise<DeliveryResult> {
  const status = kind === "operator"
    ? record.notification_status
    : record.customer_confirmation_status;
  if (status === "sent") return "sent";

  const statusColumn = kind === "operator"
    ? "notification_status"
    : "customer_confirmation_status";
  const sentAtColumn = kind === "operator"
    ? "notification_sent_at"
    : "customer_confirmation_sent_at";
  try {
    await dependencies.sendEmail(emailFor(record, kind));
    await dependencies.updateProposal(record.id, {
      [statusColumn]: "sent",
      [sentAtColumn]: dependencies.now(),
    });
    return "sent";
  } catch (error) {
    dependencies.logError?.(
      `Consulting proposal saved; ${kind} email delayed`,
      error,
    );
    try {
      await dependencies.updateProposal(record.id, {
        [statusColumn]: "failed",
      });
    } catch (statusError) {
      dependencies.logError?.(
        `Consulting proposal saved; ${kind} delivery status could not be updated`,
        statusError,
      );
    }
    return "delayed";
  }
}

export async function deliverProposalEmails(
  record: ProposalDeliveryRecord,
  dependencies: DeliveryDependencies,
): Promise<{
  notificationStatus: DeliveryResult;
  customerConfirmationStatus: DeliveryResult;
}> {
  const [notificationStatus, customerConfirmationStatus] = await Promise.all([
    deliverProposalEmail(record, "operator", dependencies),
    deliverProposalEmail(record, "customer", dependencies),
  ]);
  return { notificationStatus, customerConfirmationStatus };
}
