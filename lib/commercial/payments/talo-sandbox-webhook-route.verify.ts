import assert from "node:assert/strict";

import type { TaloTransactionRead } from "@/lib/commercial/payments/talo-customer-webhook";
import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";
import {
  createSandboxWebhookState,
  createWebhookRateLimit,
  handleTaloSandboxCustomerWebhook,
  readTaloSandboxCustomerTransaction,
  readTaloSandboxWebhookAccess,
  taloSandboxWebhookCustomerId
} from "@/lib/commercial/payments/talo-sandbox-webhook-route";

const transactionId = "tx-webhook-1";
const readyEnv = {
  NODE_ENV: "development",
  COMMERCIAL_TALO_WEBHOOK_SANDBOX: "true",
  COMMERCIAL_TALO_WEBHOOK_LISTENER: "1",
  TALO_SANDBOX_API_URL: TALO_SANDBOX_API_ORIGIN,
  TALO_CLIENT_ID: "sandbox-client",
  TALO_CLIENT_SECRET: "sandbox-secret",
  TALO_USER_ID: "sandbox-user"
};

function request(body: string, customerId = taloSandboxWebhookCustomerId, id = transactionId): Request {
  return new Request("http://127.0.0.1/api/commercial/talo/sandbox-customer-webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body || JSON.stringify({ message: "Pago recibido", transactionId: id, customerId })
  });
}

function confirmed(id = transactionId): TaloTransactionRead {
  return {
    ok: true,
    httpStatus: 200,
    body: {
      data: {
        customer_id: taloSandboxWebhookCustomerId,
        id,
        gross_amount: 290000,
        amount: 286491,
        currency: "ARS",
        transaction_status: "PROCESSED",
        creation_timestamp: "2026-10-17T18:00:00.000Z"
      }
    }
  };
}

async function main(): Promise<void> {
  assert.equal(readTaloSandboxWebhookAccess({ NODE_ENV: "development" }).status, "disabled");
  assert.equal(readTaloSandboxWebhookAccess({ ...readyEnv, NODE_ENV: "production" }).status, "disabled");
  assert.equal(
    readTaloSandboxWebhookAccess({ ...readyEnv, TALO_SANDBOX_API_URL: "https://api.talo.com.ar" }).status,
    "disabled"
  );
  const missing = readTaloSandboxWebhookAccess({ ...readyEnv, TALO_CLIENT_SECRET: "" });
  assert.equal(missing.status, "missing_credentials");

  const state = createSandboxWebhookState();
  let reads = 0;
  const readTransaction = async (): Promise<TaloTransactionRead> => {
    reads += 1;
    return confirmed();
  };
  const input = {
    env: readyEnv,
    remoteAddress: "127.0.0.1",
    receipts: state.receipts,
    rateLimit: state.rateLimit,
    readTransaction
  };

  const disabled = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request(""),
    env: { NODE_ENV: "development" }
  });
  assert.equal(disabled.disposition, "disabled");
  assert.equal(disabled.httpStatus, 404);
  assert.equal(reads, 0);

  const absent = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request(""),
    env: { ...readyEnv, TALO_USER_ID: "" }
  });
  assert.equal(absent.reason, "missing_credentials");
  assert.equal(reads, 0);

  const observed = await handleTaloSandboxCustomerWebhook({ ...input, request: request("") });
  assert.equal(observed.disposition, "confirmed");
  assert.equal(observed.economicRecognition, false);
  assert.equal(observed.result?.status, "observed");
  if (observed.result?.status === "observed") {
    assert.equal(observed.result.transfer.grossAmountCents, 29000000);
    assert.equal(observed.result.transfer.netAmountCents, 28649100);
    assert.equal(observed.result.transfer.processingDifferenceCents, 350900);
  }

  const duplicate = await handleTaloSandboxCustomerWebhook({ ...input, request: request("") });
  assert.equal(duplicate.disposition, "duplicate");
  assert.equal(reads, 1);

  const invalid = await handleTaloSandboxCustomerWebhook({ ...input, request: request("{") });
  assert.equal(invalid.reason, "body_not_json");
  const otherCustomer = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", "orderops-qa-burger-house")
  });
  assert.equal(otherCustomer.reason, "customer_not_expected");

  const oversized = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: new Request("http://127.0.0.1/hook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(5000) })
    })
  });
  assert.equal(oversized.reason, "body_too_large");
  assert.equal(reads, 1);

  const missingTransaction = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-missing"),
    readTransaction: async () => ({ ok: false, httpStatus: 404, body: null })
  });
  assert.equal(missingTransaction.disposition, "pending_review");
  assert.equal(missingTransaction.reason, "transaction_not_found");

  const forbidden = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-forbidden"),
    readTransaction: async () => ({ ok: false, httpStatus: 403, body: null })
  });
  assert.equal(forbidden.reason, "confirmation_forbidden");

  let attempts = 0;
  const temporary = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-retry"),
    readTransaction: async () => {
      attempts += 1;
      if (attempts === 1) {
        return { ok: false, httpStatus: 503, body: null };
      }
      return confirmed("tx-retry");
    }
  });
  assert.equal(temporary.reason, "temporary_confirmation_failure");
  const retried = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-retry"),
    readTransaction: async () => {
      attempts += 1;
      return confirmed("tx-retry");
    }
  });
  assert.equal(retried.disposition, "confirmed");
  assert.equal(attempts, 2);

  const restarted = createSandboxWebhookState();
  let restartedReads = 0;
  const afterRestart = await handleTaloSandboxCustomerWebhook({
    ...input,
    receipts: restarted.receipts,
    rateLimit: restarted.rateLimit,
    request: request(""),
    readTransaction: async () => {
      restartedReads += 1;
      return confirmed();
    }
  });
  assert.equal(afterRestart.disposition, "confirmed");
  assert.equal(restartedReads, 1);

  const later = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-later"),
    readTransaction: async () => confirmed("tx-later")
  });
  const earlier = await handleTaloSandboxCustomerWebhook({
    ...input,
    request: request("", taloSandboxWebhookCustomerId, "tx-earlier"),
    readTransaction: async () => confirmed("tx-earlier")
  });
  assert.equal(later.disposition, "confirmed");
  assert.equal(earlier.disposition, "confirmed");

  const limited = createWebhookRateLimit(1, 60_000);
  const first = await handleTaloSandboxCustomerWebhook({
    ...input,
    rateLimit: limited,
    now: 1_000,
    request: request("{")
  });
  const second = await handleTaloSandboxCustomerWebhook({
    ...input,
    rateLimit: limited,
    now: 1_100,
    request: request("{")
  });
  assert.equal(first.reason, "body_not_json");
  assert.equal(second.reason, "rate_limited");

  const calls: string[] = [];
  await readTaloSandboxCustomerTransaction(readyEnv, taloSandboxWebhookCustomerId, transactionId, async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/tokens")) {
      return Response.json({ data: { token: "sandbox-token" } });
    }
    return Response.json({ data: {} }, { status: 404 });
  });
  assert.equal(calls.length, 2);
  assert.equal(calls.every((url) => url.startsWith(`${TALO_SANDBOX_API_ORIGIN}/`)), true);

  const merged = await readTaloSandboxCustomerTransaction(readyEnv, taloSandboxWebhookCustomerId, "tx-net", async (url) => {
    const target = String(url);
    if (target.endsWith("/tokens")) {
      return Response.json({ data: { token: "sandbox-token" } });
    }
    if (target.includes("/customers/")) {
      return Response.json({
        data: {
          id: "tx-net",
          customer_id: taloSandboxWebhookCustomerId,
          amount: "54000.00",
          currency: "ARS",
          transaction_status: "PROCESSED",
          creation_timestamp: "2026-10-17T19:00:00.000Z"
        }
      });
    }
    return Response.json({
      data: {
        transactions: [{
          id: "tx-net",
          customer_id: taloSandboxWebhookCustomerId,
          gross_amount: "55000",
          amount: "54000.00"
        }]
      }
    });
  });
  const mergedData = (merged.body as { data: { gross_amount: string; amount: string } }).data;
  assert.equal(merged.ok, true);
  assert.equal(mergedData.gross_amount, "55000");
  assert.equal(mergedData.amount, "54000.00");

  console.log("talo-sandbox-webhook-route.verify: ok");
}

void main();
