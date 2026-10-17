export const TALO_CUSTOMER_WEBHOOK_MAX_BYTES = 4096;

const customerEventIdPattern = /^[A-Za-z0-9][A-Za-z0-9_.:#-]{0,127}$/;

export type TaloCustomerWebhookReceiptStore = {
  has(key: string): boolean;
  remember(key: string): void;
};

export type TaloTransactionRead = {
  ok: boolean;
  httpStatus: number;
  body: unknown;
};

export type TaloObservedTransfer = {
  customerId: string;
  transactionId: string;
  currency: "ARS";
  grossAmountCents: number;
  netAmountCents: number;
  processingDifferenceCents: number;
  transactionStatus: string;
  observedAt: string;
  economicRecognition: false;
};

export type TaloCustomerWebhookResult =
  | { status: "rejected"; reason: string }
  | { status: "duplicate"; customerId: string; transactionId: string; economicRecognition: false }
  | { status: "unconfirmed"; reason: string; httpStatus?: number; economicRecognition: false }
  | { status: "observed"; transfer: TaloObservedTransfer; signaturePresent: boolean };

type ReceiveInput = {
  request: Request;
  expectedCustomerId: string;
  receipts: TaloCustomerWebhookReceiptStore;
  readTransaction: (customerId: string, transactionId: string) => Promise<TaloTransactionRead>;
};

export function createTaloWebhookMemory(): TaloCustomerWebhookReceiptStore {
  const seen = new Set<string>();
  return {
    has(key: string): boolean {
      return seen.has(key);
    },
    remember(key: string): void {
      seen.add(key);
    }
  };
}

export async function receiveTaloCustomerWebhook(input: ReceiveInput): Promise<TaloCustomerWebhookResult> {
  const notice = await readNotice(input.request, input.expectedCustomerId);
  if (notice.status !== "accepted") {
    return notice;
  }

  const receiptKey = `${notice.customerId}\n${notice.transactionId}`;
  if (input.receipts.has(receiptKey)) {
    return {
      status: "duplicate",
      customerId: notice.customerId,
      transactionId: notice.transactionId,
      economicRecognition: false
    };
  }

  const read = await input.readTransaction(notice.customerId, notice.transactionId);
  const transfer = transferFromRead(read, notice.customerId, notice.transactionId);
  if (transfer.status !== "observed") {
    return transfer;
  }
  input.receipts.remember(receiptKey);
  return { status: "observed", transfer: transfer.transfer, signaturePresent: notice.signaturePresent };
}

export function toTaloCustomerWebhookResponse(result: TaloCustomerWebhookResult): Response {
  if (result.status === "rejected") {
    return Response.json({ accepted: false, reason: result.reason, economicRecognition: false }, { status: 400 });
  }
  if (result.status === "unconfirmed") {
    return Response.json({ accepted: false, reason: result.reason, economicRecognition: false }, { status: 502 });
  }
  return Response.json({
    accepted: true,
    duplicate: result.status === "duplicate",
    economicRecognition: false
  });
}

type AcceptedNotice = {
  status: "accepted";
  customerId: string;
  transactionId: string;
  signaturePresent: boolean;
};

async function readNotice(
  request: Request,
  expectedCustomerId: string
): Promise<AcceptedNotice | { status: "rejected"; reason: string }> {
  if (request.method !== "POST") {
    return { status: "rejected", reason: "method_not_allowed" };
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { status: "rejected", reason: "content_type_rejected" };
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > TALO_CUSTOMER_WEBHOOK_MAX_BYTES) {
    return { status: "rejected", reason: "body_too_large" };
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > TALO_CUSTOMER_WEBHOOK_MAX_BYTES) {
    return { status: "rejected", reason: bytes.byteLength === 0 ? "body_empty" : "body_too_large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return { status: "rejected", reason: "body_not_json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { status: "rejected", reason: "body_not_object" };
  }
  const record = parsed as Record<string, unknown>;
  if ("paymentId" in record || "externalId" in record) {
    return { status: "rejected", reason: "payment_event_rejected" };
  }
  if (typeof record.message !== "string" || record.message.trim().length === 0 || record.message.length > 160) {
    return { status: "rejected", reason: "message_rejected" };
  }
  if (!isEventId(record.transactionId) || !isEventId(record.customerId)) {
    return { status: "rejected", reason: "identifier_rejected" };
  }
  if (expectedCustomerId.length === 0 || record.customerId !== expectedCustomerId) {
    return { status: "rejected", reason: "customer_not_expected" };
  }
  return {
    status: "accepted",
    customerId: record.customerId,
    transactionId: record.transactionId,
    signaturePresent: request.headers.has("x-talo-signature")
  };
}

function isEventId(value: unknown): value is string {
  return typeof value === "string" && customerEventIdPattern.test(value);
}

function transferFromRead(
  read: TaloTransactionRead,
  customerId: string,
  transactionId: string
): { status: "observed"; transfer: TaloObservedTransfer } | { status: "unconfirmed"; reason: string; httpStatus?: number; economicRecognition: false } {
  if (!read.ok) {
    return { status: "unconfirmed", reason: "transaction_read_failed", httpStatus: read.httpStatus, economicRecognition: false };
  }
  const body = asRecord(read.body);
  const data = asRecord(body?.data) ?? body;
  if (!data) {
    return { status: "unconfirmed", reason: "transaction_body_rejected", economicRecognition: false };
  }
  const readCustomer = typeof data.customer_id === "string" ? data.customer_id : null;
  if (readCustomer !== null && readCustomer !== customerId) {
    return { status: "unconfirmed", reason: "transaction_customer_mismatch", economicRecognition: false };
  }
  const readTransaction = typeof data.transaction_id === "string" ? data.transaction_id : null;
  const readId = typeof data.id === "string" ? data.id : null;
  if (
    (readTransaction !== null && readTransaction !== transactionId && readId !== transactionId) ||
    (readId !== null && readId !== transactionId && readTransaction !== transactionId)
  ) {
    return { status: "unconfirmed", reason: "transaction_id_mismatch", economicRecognition: false };
  }
  if (data.currency !== "ARS") {
    return { status: "unconfirmed", reason: "currency_rejected", economicRecognition: false };
  }
  const grossAmountCents = toCents(data.gross_amount);
  const netAmountCents = toCents(data.amount);
  if (grossAmountCents === null || netAmountCents === null) {
    return { status: "unconfirmed", reason: "amounts_incomplete", economicRecognition: false };
  }
  if (grossAmountCents < netAmountCents) {
    return { status: "unconfirmed", reason: "processing_difference_negative", economicRecognition: false };
  }
  const transactionStatus = typeof data.transaction_status === "string"
    ? data.transaction_status
    : typeof data.status === "string"
      ? data.status
      : "";
  const observedAt = typeof data.creation_timestamp === "string"
    ? data.creation_timestamp
    : typeof data.payment_date === "string"
      ? data.payment_date
      : "";
  if (transactionStatus.length === 0 || observedAt.length === 0) {
    return { status: "unconfirmed", reason: "transaction_fields_missing", economicRecognition: false };
  }
  return {
    status: "observed",
    transfer: {
      customerId,
      transactionId,
      currency: "ARS",
      grossAmountCents,
      netAmountCents,
      processingDifferenceCents: grossAmountCents - netAmountCents,
      transactionStatus,
      observedAt,
      economicRecognition: false
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    const cents = Math.round(value * 100);
    if (Math.abs(value * 100 - cents) > 0.000001) {
      return null;
    }
    return cents;
  }
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
