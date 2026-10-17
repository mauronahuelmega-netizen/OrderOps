import assert from "node:assert/strict";

import { receiveTaloCustomerWebhook, createTaloWebhookMemory } from "@/lib/commercial/payments/talo-customer-webhook";
import { providerReceiptCommand } from "@/lib/commercial/payments/provider-receipt";

const customerId = "orderops-qa-webhook-burger";

function request(transactionId: string): Request {
  return new Request("https://webhook.invalid/talo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Pago recibido", transactionId, customerId })
  });
}

async function main(): Promise<void> {
  const receipts = createTaloWebhookMemory();
  let reads = 0;
  const observed = await receiveTaloCustomerWebhook({
    request: request("tx-monthly"),
    expectedCustomerId: customerId,
    receipts,
    readTransaction: async () => {
      reads += 1;
      return {
        ok: true,
        httpStatus: 200,
        body: {
          data: {
            customer_id: customerId,
            id: "tx-monthly",
            gross_amount: "55000",
            gross_source: "list",
            amount: "54334.50",
            net_source: "detail",
            currency: "ARS",
            transaction_status: "PROCESSED",
            creation_timestamp: "2026-10-17T20:03:00.000Z"
          }
        }
      };
    }
  });
  const command = providerReceiptCommand(observed);
  assert.equal(command.action, "confirm");
  if (command.action !== "confirm") {
    return;
  }
  assert.equal(command.grossAmountCents, 5500000);
  assert.equal(command.netAmountCents, 5433450);
  assert.equal(command.processingDifferenceCents, 66550);
  assert.equal(command.grossSource, "list");
  assert.equal(command.netSource, "detail");
  assert.equal(command.economicRecognition, false);
  assert.equal("obligationId" in command, false);

  const duplicate = providerReceiptCommand(await receiveTaloCustomerWebhook({
    request: request("tx-monthly"),
    expectedCustomerId: customerId,
    receipts,
    readTransaction: async () => {
      reads += 1;
      throw new Error("must_not_read");
    }
  }));
  assert.equal(duplicate.action, "ignore");
  assert.equal(reads, 1);

  const incomplete = providerReceiptCommand(await receiveTaloCustomerWebhook({
    request: request("tx-incomplete"),
    expectedCustomerId: customerId,
    receipts,
    readTransaction: async () => ({
      ok: true,
      httpStatus: 200,
      body: { amount: 54334.5, currency: "ARS", transaction_status: "PROCESSED", creation_timestamp: "2026-10-17T20:04:00.000Z" }
    })
  }));
  assert.equal(incomplete.action, "defer");
  if (incomplete.action === "defer") {
    assert.equal(incomplete.reason, "amounts_incomplete");
    assert.equal(incomplete.customerId, customerId);
    assert.equal(incomplete.transactionId, "tx-incomplete");
    assert.equal(incomplete.economicRecognition, false);
  }

  const temporary = providerReceiptCommand(await receiveTaloCustomerWebhook({
    request: request("tx-later"),
    expectedCustomerId: customerId,
    receipts,
    readTransaction: async () => ({ ok: false, httpStatus: 503, body: null })
  }));
  assert.equal(temporary.action, "defer");

  const other = providerReceiptCommand(await receiveTaloCustomerWebhook({
    request: new Request("https://webhook.invalid/talo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Pago recibido", transactionId: "tx-other", customerId: "otro-cliente" })
    }),
    expectedCustomerId: customerId,
    receipts,
    readTransaction: async () => {
      throw new Error("must_not_read");
    }
  }));
  assert.equal(other.action, "ignore");

  console.log("provider-receipt.verify: ok");
}

void main();
