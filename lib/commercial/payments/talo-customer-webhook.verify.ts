import assert from "node:assert/strict";

import {
  createTaloWebhookMemory,
  receiveTaloCustomerWebhook,
  TALO_CUSTOMER_WEBHOOK_MAX_BYTES,
  toTaloCustomerWebhookResponse,
  type TaloTransactionRead
} from "@/lib/commercial/payments/talo-customer-webhook";

const expectedCustomerId = "orderops-qa-burger-house";
const transactionId = "1b5a952a-8a79-4003-b06a-e4043d453456";

function request(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://webhook.invalid/talo/customers", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
}

function confirmedRead(): TaloTransactionRead {
  return {
    ok: true,
    httpStatus: 200,
    body: {
      data: {
        customer_id: expectedCustomerId,
        transaction_id: transactionId,
        gross_amount: "290000",
        amount: "286491.00",
        currency: "ARS",
        transaction_status: "PROCESSED",
        creation_timestamp: "2026-10-17T18:00:00.000Z",
        address: "do-not-copy"
      }
    }
  };
}

const validBody = JSON.stringify({
  message: "Pago recibido",
  transactionId,
  customerId: expectedCustomerId
});

async function main(): Promise<void> {
  const receipts = createTaloWebhookMemory();
  let reads = 0;
  const readTransaction = async (): Promise<TaloTransactionRead> => {
    reads += 1;
    return confirmedRead();
  };

  const observed = await receiveTaloCustomerWebhook({
    request: request(validBody, { "x-talo-signature": "not-logged" }),
    expectedCustomerId,
    receipts,
    readTransaction
  });
  assert.equal(observed.status, "observed");
  if (observed.status !== "observed") {
    return;
  }
  assert.equal(observed.signaturePresent, true);
  assert.equal(observed.transfer.grossAmountCents, 29000000);
  assert.equal(observed.transfer.netAmountCents, 28649100);
  assert.equal(observed.transfer.processingDifferenceCents, 350900);
  assert.equal(observed.transfer.transactionStatus, "PROCESSED");
  assert.equal(observed.transfer.economicRecognition, false);
  assert.equal("address" in observed.transfer, false);
  assert.equal(reads, 1);

  const duplicate = await receiveTaloCustomerWebhook({
    request: request(validBody),
    expectedCustomerId,
    receipts,
    readTransaction
  });
  assert.equal(duplicate.status, "duplicate");
  assert.equal(reads, 1);
  const duplicateResponse = toTaloCustomerWebhookResponse(duplicate);
  assert.equal(duplicateResponse.status, 200);
  const duplicateBody = await duplicateResponse.json() as { economicRecognition: boolean };
  assert.equal(duplicateBody.economicRecognition, false);

  const invalidBodies: Array<[string, string]> = [
    ["{", "body_not_json"],
    [JSON.stringify(["pago"]), "body_not_object"],
    [JSON.stringify({ message: "Pago Actualizado", paymentId: "VAR-1", externalId: "ORDER" }), "payment_event_rejected"],
    [JSON.stringify({ message: "", transactionId, customerId: expectedCustomerId }), "message_rejected"],
    [JSON.stringify({ message: "Pago recibido", transactionId: "../cvu", customerId: expectedCustomerId }), "identifier_rejected"],
    [JSON.stringify({ message: "Pago recibido", transactionId, customerId: "otro-cliente" }), "customer_not_expected"]
  ];
  for (const [body, reason] of invalidBodies) {
    const rejected = await receiveTaloCustomerWebhook({
      request: request(body),
      expectedCustomerId,
      receipts,
      readTransaction
    });
    assert.equal(rejected.status, "rejected");
    if (rejected.status === "rejected") {
      assert.equal(rejected.reason, reason);
    }
  }
  assert.equal(reads, 1);

  const oversized = await receiveTaloCustomerWebhook({
    request: request(JSON.stringify({ padding: "x".repeat(TALO_CUSTOMER_WEBHOOK_MAX_BYTES) })),
    expectedCustomerId,
    receipts,
    readTransaction
  });
  assert.equal(oversized.status, "rejected");
  if (oversized.status === "rejected") {
    assert.equal(oversized.reason, "body_too_large");
  }

  const incomplete = await receiveTaloCustomerWebhook({
    request: request(JSON.stringify({
      message: "Pago recibido",
      transactionId: "tx-neto",
      customerId: expectedCustomerId
    })),
    expectedCustomerId,
    receipts,
    readTransaction: async () => ({
      ok: true,
      httpStatus: 200,
      body: {
        amount: 286491,
        currency: "ARS",
        transaction_status: "PROCESSED",
        creation_timestamp: "2026-10-17T18:00:00.000Z"
      }
    })
  });
  assert.equal(incomplete.status, "unconfirmed");
  if (incomplete.status === "unconfirmed") {
    assert.equal(incomplete.reason, "amounts_incomplete");
    assert.equal(incomplete.economicRecognition, false);
  }

  console.log("talo-customer-webhook.verify: ok");
}

void main();
