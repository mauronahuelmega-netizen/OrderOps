import { createHash } from "node:crypto";

import { transferFromRead, type TaloTransactionRead } from "@/lib/commercial/payments/talo-customer-webhook";

export type ClaimedNotice = {
  inboxId: string;
  environment: string;
  customerId: string;
  transactionId: string;
};

export type ProviderReadRecord = {
  inboxId: string;
  providerStatus: string;
  currency: string;
  grossAmountCents: number;
  netAmountCents: number;
  grossSource: "detail" | "list";
  netSource: "detail" | "list";
  providerTimestamp: string;
  responseDigest: string;
};

export type TaloReceiptWorkerDeps = {
  environment: "sandbox";
  claim(limit: number): Promise<ClaimedNotice[]>;
  read(customerId: string, transactionId: string): Promise<TaloTransactionRead>;
  record(input: ProviderReadRecord): Promise<{ ok: boolean; status?: string; code?: string }>;
  defer(inboxId: string, error: string): Promise<void>;
};

export type TaloReceiptWorkerSummary = {
  claimed: number;
  recorded: number;
  deferred: number;
  skipped: number;
  outcomes: Record<string, number>;
};

const zonedTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

// A timestamp without an explicit zone is ambiguous for the anniversary calendar and is not used.
export function providerTimestamp(value: string): string | null {
  if (!zonedTimestamp.test(value)) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

export function responseDigest(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex");
}

export async function runTaloReceiptWorker(deps: TaloReceiptWorkerDeps, limit = 10): Promise<TaloReceiptWorkerSummary> {
  const summary: TaloReceiptWorkerSummary = { claimed: 0, recorded: 0, deferred: 0, skipped: 0, outcomes: {} };
  const count = (key: string) => {
    summary.outcomes[key] = (summary.outcomes[key] ?? 0) + 1;
  };
  const defer = async (inboxId: string, reason: string) => {
    await deps.defer(inboxId, reason);
    summary.deferred += 1;
    count(`deferred:${reason.split(":")[0]}`);
  };

  const claimed = await deps.claim(limit);
  summary.claimed = claimed.length;
  for (const notice of claimed) {
    try {
      if (notice.environment !== deps.environment) {
        await defer(notice.inboxId, "environment_mismatch");
        continue;
      }
      const read = await deps.read(notice.customerId, notice.transactionId);
      const observed = transferFromRead(read, notice.customerId, notice.transactionId);
      if (observed.status !== "observed") {
        await defer(notice.inboxId, observed.httpStatus === undefined ? observed.reason : `${observed.reason}:${observed.httpStatus}`);
        continue;
      }
      const timestamp = providerTimestamp(observed.transfer.observedAt);
      if (!timestamp) {
        await defer(notice.inboxId, "provider_timestamp_invalid");
        continue;
      }
      const result = await deps.record({
        inboxId: notice.inboxId,
        providerStatus: observed.transfer.transactionStatus,
        currency: observed.transfer.currency,
        grossAmountCents: observed.transfer.grossAmountCents,
        netAmountCents: observed.transfer.netAmountCents,
        grossSource: observed.transfer.grossSource,
        netSource: observed.transfer.netSource,
        providerTimestamp: timestamp,
        responseDigest: responseDigest(read.body)
      });
      if (!result.ok) {
        summary.skipped += 1;
        count(`skipped:${result.code ?? "unknown"}`);
        continue;
      }
      summary.recorded += 1;
      count(result.status ?? "recorded");
    } catch {
      await defer(notice.inboxId, "worker_error").catch(() => undefined);
    }
  }
  return summary;
}
