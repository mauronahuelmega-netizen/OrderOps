import type { TaloCustomerWebhookResult } from "@/lib/commercial/payments/talo-customer-webhook";

export type ProviderReceiptCommand =
  | { action: "ignore"; reason: string; economicRecognition: false }
  | {
      action: "defer";
      customerId: string;
      transactionId: string;
      reason: string;
      economicRecognition: false;
    }
  | {
      action: "confirm";
      customerId: string;
      transactionId: string;
      currency: "ARS";
      grossAmountCents: number;
      netAmountCents: number;
      processingDifferenceCents: number;
      grossSource: "detail" | "list";
      netSource: "detail" | "list";
      providerStatus: string;
      observedAt: string;
      economicRecognition: false;
    };

export function providerReceiptCommand(result: TaloCustomerWebhookResult): ProviderReceiptCommand {
  if (result.status === "duplicate") {
    return { action: "ignore", reason: "duplicate", economicRecognition: false };
  }
  if (result.status === "rejected") {
    return { action: "ignore", reason: result.reason, economicRecognition: false };
  }
  if (result.status === "unconfirmed") {
    return {
      action: "defer",
      customerId: result.customerId,
      transactionId: result.transactionId,
      reason: result.reason,
      economicRecognition: false
    };
  }
  return {
    action: "confirm",
    customerId: result.transfer.customerId,
    transactionId: result.transfer.transactionId,
    currency: "ARS",
    grossAmountCents: result.transfer.grossAmountCents,
    netAmountCents: result.transfer.netAmountCents,
    processingDifferenceCents: result.transfer.processingDifferenceCents,
    grossSource: result.transfer.grossSource,
    netSource: result.transfer.netSource,
    providerStatus: result.transfer.transactionStatus,
    observedAt: result.transfer.observedAt,
    economicRecognition: false
  };
}
