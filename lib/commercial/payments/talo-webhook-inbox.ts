import { readTaloWebhookNotice } from "@/lib/commercial/payments/talo-customer-webhook";
import type { TaloRuntime } from "@/lib/commercial/payments/talo-runtime";
import type { TaloWebhookRateLimit } from "@/lib/commercial/payments/talo-sandbox-webhook-route";

export type EnqueueResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; code: string };

export type EnqueueNotice = (input: {
  environment: "sandbox";
  customerId: string;
  transactionId: string;
  signaturePresent: boolean;
}) => Promise<EnqueueResult>;

export type TaloWebhookInboxOutcome =
  | "disabled"
  | "rate_limited"
  | "rejected"
  | "queued"
  | "duplicate"
  | "ignored"
  | "unavailable";

export type TaloWebhookInboxHandling = {
  httpStatus: number;
  outcome: TaloWebhookInboxOutcome;
  reason?: string;
};

// The notice is untrusted: it is validated syntactically and persisted for an authenticated
// read. It never confirms a transfer, imputes money or grants access.
export async function handleTaloWebhookNotice(input: {
  request: Request;
  runtime: TaloRuntime;
  remoteAddress: string;
  rateLimit: TaloWebhookRateLimit;
  enqueue: EnqueueNotice;
  now?: number;
}): Promise<TaloWebhookInboxHandling> {
  if (input.runtime.status !== "ready") {
    return { httpStatus: 404, outcome: "disabled" };
  }
  if (!input.rateLimit.allow(input.remoteAddress || "unknown", input.now ?? Date.now())) {
    return { httpStatus: 429, outcome: "rate_limited" };
  }
  const notice = await readTaloWebhookNotice(input.request);
  if (notice.status !== "accepted") {
    return { httpStatus: 400, outcome: "rejected", reason: notice.reason };
  }
  let result: EnqueueResult;
  try {
    result = await input.enqueue({
      environment: input.runtime.environment,
      customerId: notice.customerId,
      transactionId: notice.transactionId,
      signaturePresent: notice.signaturePresent
    });
  } catch {
    return { httpStatus: 503, outcome: "unavailable" };
  }
  if (!result.ok) {
    if (result.code === "customer_unknown") {
      return { httpStatus: 202, outcome: "ignored" };
    }
    if (result.code === "validation") {
      return { httpStatus: 400, outcome: "rejected", reason: "identifier_rejected" };
    }
    return { httpStatus: 503, outcome: "unavailable" };
  }
  return { httpStatus: 200, outcome: result.duplicate ? "duplicate" : "queued" };
}

export function taloWebhookInboxResponse(handling: TaloWebhookInboxHandling): Response {
  if (handling.outcome === "disabled") {
    return new Response(null, { status: 404 });
  }
  return Response.json(
    {
      accepted: handling.outcome === "queued" || handling.outcome === "duplicate" || handling.outcome === "ignored",
      reason: handling.reason,
      economicRecognition: false
    },
    { status: handling.httpStatus }
  );
}
