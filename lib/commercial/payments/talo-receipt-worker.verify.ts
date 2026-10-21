import assert from "node:assert/strict";

import type { TaloTransactionRead } from "@/lib/commercial/payments/talo-customer-webhook";
import {
  providerTimestamp,
  responseDigest,
  runTaloReceiptWorker,
  type ClaimedNotice,
  type ProviderReadRecord,
  type TaloReceiptWorkerDeps
} from "@/lib/commercial/payments/talo-receipt-worker";
import { isAuthorizedWorkerRequest } from "@/lib/commercial/payments/worker-auth";

const customerId = "orderops-96969696-9696-4969-8969-9696969696d1";

function processedRead(transactionId: string, overrides: Record<string, unknown> = {}): TaloTransactionRead {
  return {
    ok: true,
    httpStatus: 200,
    body: {
      data: {
        customer_id: customerId,
        transaction_id: transactionId,
        gross_amount: "290000",
        amount: "286491.00",
        currency: "ARS",
        transaction_status: "PROCESSED",
        creation_timestamp: "2026-10-20T15:00:00.000Z",
        ...overrides
      }
    }
  };
}

function harness(reads: Record<string, TaloTransactionRead | Error>, notices: ClaimedNotice[]) {
  const recorded: ProviderReadRecord[] = [];
  const deferred: { inboxId: string; error: string }[] = [];
  const deps: TaloReceiptWorkerDeps = {
    environment: "sandbox",
    async claim() {
      return notices;
    },
    async read(_customer, transactionId) {
      const read = reads[transactionId];
      if (read instanceof Error || !read) {
        throw read ?? new Error("missing");
      }
      return read;
    },
    async record(input) {
      recorded.push(input);
      return { ok: true, status: "imputed" };
    },
    async defer(inboxId, error) {
      deferred.push({ inboxId, error });
    }
  };
  return { deps, recorded, deferred };
}

function notice(transactionId: string, environment = "sandbox"): ClaimedNotice {
  return { inboxId: `inbox-${transactionId}`, environment, customerId, transactionId };
}

async function main(): Promise<void> {
  assert.equal(providerTimestamp("2026-10-20T15:00:00.000Z"), "2026-10-20T15:00:00.000Z");
  assert.equal(providerTimestamp("2026-10-20T12:00:00-03:00"), "2026-10-20T15:00:00.000Z");
  assert.equal(providerTimestamp("2026-10-20T15:00:00"), null);
  assert.equal(providerTimestamp("2026-10-20"), null);
  assert.equal(providerTimestamp("not a date"), null);
  assert.match(responseDigest({ a: 1 }), /^[0-9a-f]{64}$/);

  const ok = harness({ tx1: processedRead("tx1") }, [notice("tx1")]);
  const summary = await runTaloReceiptWorker(ok.deps);
  assert.equal(summary.recorded, 1);
  assert.deepEqual(ok.recorded[0], {
    inboxId: "inbox-tx1",
    providerStatus: "PROCESSED",
    currency: "ARS",
    grossAmountCents: 29000000,
    netAmountCents: 28649100,
    grossSource: "detail",
    netSource: "detail",
    providerTimestamp: "2026-10-20T15:00:00.000Z",
    responseDigest: responseDigest(processedRead("tx1").body)
  });

  const mixed = harness(
    {
      failed: { ok: false, httpStatus: 503, body: null },
      other: processedRead("other", { customer_id: "orderops-otro" }),
      naive: processedRead("naive", { creation_timestamp: "2026-10-20T15:00:00" }),
      pending: processedRead("pending", { transaction_status: "PENDING" }),
      broken: new Error("network")
    },
    [notice("failed"), notice("other"), notice("naive"), notice("pending"), notice("broken"), notice("prod", "production")]
  );
  const mixedSummary = await runTaloReceiptWorker(mixed.deps);
  assert.deepEqual(
    mixed.deferred.map((entry) => entry.error),
    ["transaction_read_failed:503", "transaction_customer_mismatch", "provider_timestamp_invalid", "worker_error", "environment_mismatch"]
  );
  assert.equal(mixed.recorded.length, 1);
  assert.equal(mixed.recorded[0]?.providerStatus, "PENDING");
  assert.equal(mixedSummary.recorded, 1);

  const skipped = harness({ tx1: processedRead("tx1") }, [notice("tx1")]);
  skipped.deps.record = async () => ({ ok: false, code: "not_claimed" });
  const skippedSummary = await runTaloReceiptWorker(skipped.deps);
  assert.equal(skippedSummary.skipped, 1);
  assert.equal(skipped.deferred.length, 0);

  const secret = "s".repeat(32);
  const withAuth = (value: string | null) =>
    new Request("https://worker.invalid", { method: "POST", headers: value === null ? {} : { authorization: value } });
  assert.equal(isAuthorizedWorkerRequest(withAuth(`Bearer ${secret}`), secret), true);
  assert.equal(isAuthorizedWorkerRequest(withAuth(`Bearer ${secret}x`), secret), false);
  assert.equal(isAuthorizedWorkerRequest(withAuth(null), secret), false);
  assert.equal(isAuthorizedWorkerRequest(withAuth("Bearer short"), "short"), false);
  assert.equal(isAuthorizedWorkerRequest(withAuth("Bearer "), undefined), false);

  console.log("talo-receipt-worker.verify: PASS");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
