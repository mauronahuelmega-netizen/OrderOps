import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";
import {
  createTaloWebhookMemory,
  receiveTaloCustomerWebhook,
  type TaloCustomerWebhookReceiptStore,
  type TaloCustomerWebhookResult,
  type TaloTransactionRead
} from "@/lib/commercial/payments/talo-customer-webhook";

export const TALO_SANDBOX_WEBHOOK_PATH = "/api/commercial/talo/sandbox-customer-webhook";
export const TALO_SANDBOX_WEBHOOK_HOST = "127.0.0.1";
export const TALO_SANDBOX_WEBHOOK_PORT = 3210;
export const taloSandboxWebhookCustomerId = "orderops-qa-webhook-burger";

const credentialNames = ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"] as const;

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloSandboxWebhookDisposition =
  | "disabled"
  | "rejected"
  | "pending_review"
  | "confirmed"
  | "duplicate";

export type TaloSandboxWebhookHandling = {
  httpStatus: number;
  disposition: TaloSandboxWebhookDisposition;
  reason?: string;
  economicRecognition: false;
  result?: TaloCustomerWebhookResult;
};

export type TaloWebhookRateLimit = {
  allow(key: string, now: number): boolean;
};

type HandleInput = {
  request: Request;
  env: EnvSource;
  remoteAddress: string;
  receipts: TaloCustomerWebhookReceiptStore;
  rateLimit: TaloWebhookRateLimit;
  now?: number;
  readTransaction: (customerId: string, transactionId: string) => Promise<TaloTransactionRead>;
};

export function createWebhookRateLimit(limit = 30, windowMs = 60_000): TaloWebhookRateLimit {
  const buckets = new Map<string, number[]>();
  return {
    allow(key: string, now: number): boolean {
      const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
      if (recent.length >= limit) {
        buckets.set(key, recent);
        return false;
      }
      recent.push(now);
      buckets.set(key, recent);
      if (buckets.size > 100) {
        const oldest = buckets.keys().next().value;
        if (typeof oldest === "string") {
          buckets.delete(oldest);
        }
      }
      return true;
    }
  };
}

export function readTaloSandboxWebhookAccess(env: EnvSource):
  | { status: "disabled" }
  | { status: "missing_credentials"; missing: string[] }
  | { status: "ready" } {
  if (env.NODE_ENV === "production") {
    return { status: "disabled" };
  }
  if (env.COMMERCIAL_TALO_WEBHOOK_SANDBOX !== "true" || env.COMMERCIAL_TALO_WEBHOOK_LISTENER !== "1") {
    return { status: "disabled" };
  }
  const configuredOrigin = env.TALO_SANDBOX_API_URL;
  if (typeof configuredOrigin === "string" && configuredOrigin.trim().length > 0) {
    try {
      if (new URL(configuredOrigin).origin !== TALO_SANDBOX_API_ORIGIN) {
        return { status: "disabled" };
      }
    } catch {
      return { status: "disabled" };
    }
  }
  const missing = credentialNames.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missing.length > 0) {
    return { status: "missing_credentials", missing };
  }
  return { status: "ready" };
}

export async function handleTaloSandboxCustomerWebhook(input: HandleInput): Promise<TaloSandboxWebhookHandling> {
  const access = readTaloSandboxWebhookAccess(input.env);
  if (access.status === "disabled") {
    return { httpStatus: 404, disposition: "disabled", economicRecognition: false };
  }
  if (!input.rateLimit.allow(input.remoteAddress || "unknown", input.now ?? Date.now())) {
    return jsonHandling(429, "rejected", "rate_limited");
  }
  if (access.status === "missing_credentials") {
    return {
      httpStatus: 503,
      disposition: "rejected",
      reason: "missing_credentials",
      economicRecognition: false
    };
  }

  const result = await receiveTaloCustomerWebhook({
    request: input.request,
    expectedCustomerId: taloSandboxWebhookCustomerId,
    receipts: input.receipts,
    readTransaction: input.readTransaction
  });
  if (result.status === "rejected") {
    return { ...jsonHandling(400, "rejected", result.reason), result };
  }
  if (result.status === "duplicate") {
    return { ...jsonHandling(200, "duplicate"), result };
  }
  if (result.status === "unconfirmed") {
    const reason = result.reason === "transaction_read_failed"
      ? confirmationFailure(result.httpStatus)
      : result.reason;
    return { ...jsonHandling(502, "pending_review", reason), result };
  }
  return { ...jsonHandling(200, "confirmed"), result };
}

export function createSandboxWebhookState(): {
  receipts: TaloCustomerWebhookReceiptStore;
  rateLimit: TaloWebhookRateLimit;
} {
  return {
    receipts: createTaloWebhookMemory(),
    rateLimit: createWebhookRateLimit()
  };
}

export async function readTaloSandboxCustomerTransaction(
  env: EnvSource,
  customerId: string,
  transactionId: string,
  fetchImpl: typeof fetch = fetch
): Promise<TaloTransactionRead> {
  try {
    const tokenResponse = await fetchImpl(`${TALO_SANDBOX_API_ORIGIN}/users/${encodeURIComponent(env.TALO_USER_ID ?? "")}/tokens`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: env.TALO_CLIENT_ID ?? "",
        client_secret: env.TALO_CLIENT_SECRET ?? ""
      }),
      signal: AbortSignal.timeout(5000)
    });
    const tokenBody = await tokenResponse.json() as { data?: { token?: unknown } };
    const token = tokenBody.data?.token;
    if (!tokenResponse.ok || typeof token !== "string" || token.length === 0) {
      return { ok: false, httpStatus: tokenResponse.status, body: null };
    }
    const readResponse = await fetchImpl(
      `${TALO_SANDBOX_API_ORIGIN}/customers/${encodeURIComponent(customerId)}/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(5000)
      }
    );
    const detail = await readResponse.json();
    if (!readResponse.ok || hasGrossAmount(detail)) {
      return { ok: readResponse.ok, httpStatus: readResponse.status, body: detail };
    }
    const listResponse = await fetchImpl(
      `${TALO_SANDBOX_API_ORIGIN}/transactions/?user_id=${encodeURIComponent(env.TALO_USER_ID ?? "")}&limit=100`,
      {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!listResponse.ok) {
      return { ok: true, httpStatus: readResponse.status, body: detail };
    }
    return { ok: true, httpStatus: readResponse.status, body: withListedGross(detail, await listResponse.json(), customerId, transactionId) };
  } catch {
    return { ok: false, httpStatus: 0, body: null };
  }
}

function hasGrossAmount(body: unknown): boolean {
  const data = recordOf(recordOf(body)?.data) ?? recordOf(body);
  return data !== null && data.gross_amount !== undefined && data.gross_amount !== null;
}

function withListedGross(detail: unknown, list: unknown, customerId: string, transactionId: string): unknown {
  const transactions = recordOf(recordOf(list)?.data)?.transactions;
  if (!Array.isArray(transactions)) {
    return detail;
  }
  const matches = transactions.filter((item) => {
    const record = recordOf(item);
    if (!record || record.gross_amount === undefined || record.gross_amount === null) {
      return false;
    }
    const id = typeof record.id === "string" ? record.id : "";
    const alternateId = typeof record.transaction_id === "string" ? record.transaction_id : "";
    const sameTransaction = id === transactionId || alternateId === transactionId;
    const listedCustomer = typeof record.customer_id === "string" ? record.customer_id : null;
    return sameTransaction && (listedCustomer === null || listedCustomer === customerId);
  });
  if (matches.length !== 1) {
    return detail;
  }
  const gross = recordOf(matches[0])?.gross_amount;
  const copy = structuredClone(detail);
  const data = recordOf(recordOf(copy)?.data);
  if (data) {
    data.gross_amount = gross;
    return copy;
  }
  const root = recordOf(copy);
  if (root) {
    root.gross_amount = gross;
  }
  return copy;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function confirmationFailure(httpStatus: number | undefined): string {
  if (httpStatus === 403) {
    return "confirmation_forbidden";
  }
  if (httpStatus === 404) {
    return "transaction_not_found";
  }
  if (httpStatus === undefined || httpStatus === 0 || httpStatus >= 500) {
    return "temporary_confirmation_failure";
  }
  return "transaction_read_failed";
}

function jsonHandling(
  httpStatus: number,
  disposition: TaloSandboxWebhookDisposition,
  reason?: string
): TaloSandboxWebhookHandling {
  return { httpStatus, disposition, reason, economicRecognition: false };
}

export function taloSandboxWebhookResponse(handling: TaloSandboxWebhookHandling): Response {
  if (handling.disposition === "disabled") {
    return new Response(null, { status: handling.httpStatus });
  }
  return Response.json({
    accepted: handling.disposition === "confirmed" || handling.disposition === "duplicate",
    disposition: handling.disposition,
    reason: handling.reason,
    economicRecognition: false
  }, { status: handling.httpStatus });
}
