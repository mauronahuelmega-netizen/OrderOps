import assert from "node:assert/strict";

import { createWebhookRateLimit } from "@/lib/commercial/payments/talo-sandbox-webhook-route";
import { readTaloRuntime, stableWebhookUrl, type TaloRuntime } from "@/lib/commercial/payments/talo-runtime";
import {
  handleTaloWebhookNotice,
  taloWebhookInboxResponse,
  type EnqueueNotice
} from "@/lib/commercial/payments/talo-webhook-inbox";

const transactionId = "1b5a952a-8a79-4003-b06a-e4043d453456";
const customerId = "orderops-96969696-9696-4969-8969-9696969696d1";

const credentials = {
  COMMERCIAL_TALO_ENABLED: "true",
  TALO_USER_ID: "user",
  TALO_CLIENT_ID: "client",
  TALO_CLIENT_SECRET: "secret"
};

function notice(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://webhook.invalid/api/commercial/talo/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

const ready = readTaloRuntime({ ...credentials, COMMERCIAL_TALO_ENVIRONMENT: "sandbox" });

async function main(): Promise<void> {
  assert.deepEqual(readTaloRuntime({}), { status: "disabled" });
  assert.deepEqual(readTaloRuntime({ ...credentials, COMMERCIAL_TALO_ENVIRONMENT: "production" }), {
    status: "blocked",
    reason: "production_not_authorized"
  });
  assert.equal(readTaloRuntime({ ...credentials }).status, "blocked");
  assert.deepEqual(
    readTaloRuntime({ ...credentials, COMMERCIAL_TALO_ENVIRONMENT: "sandbox", TALO_SANDBOX_API_URL: "https://api.talo.com.ar" }),
    { status: "blocked", reason: "sandbox_origin_required" }
  );
  const missing = readTaloRuntime({ COMMERCIAL_TALO_ENABLED: "true", COMMERCIAL_TALO_ENVIRONMENT: "sandbox" });
  assert.equal(missing.status === "blocked" && missing.reason, "missing_credentials");
  assert.equal(ready.status, "ready");
  assert.equal(ready.status === "ready" && ready.origin, "https://sandbox-api.talo.com.ar");

  assert.equal(stableWebhookUrl("https://app.orderops.example"), "https://app.orderops.example/api/commercial/talo/webhook");
  assert.equal(stableWebhookUrl("http://app.orderops.example"), null);
  assert.equal(stableWebhookUrl("https://app.orderops.example/x"), null);
  assert.equal(stableWebhookUrl("https://user:pw@app.orderops.example"), null);
  assert.equal(stableWebhookUrl(undefined), null);

  const calls: Parameters<EnqueueNotice>[0][] = [];
  const known = new Set<string>();
  const enqueue: EnqueueNotice = async (input) => {
    calls.push(input);
    if (input.customerId !== customerId) {
      return { ok: false, code: "customer_unknown" };
    }
    const key = `${input.customerId}:${input.transactionId}`;
    const duplicate = known.has(key);
    known.add(key);
    return { ok: true, duplicate };
  };
  const base = { runtime: ready, remoteAddress: "203.0.113.7", rateLimit: createWebhookRateLimit(100, 60_000), enqueue };
  const valid = { message: "Pago recibido", transactionId, customerId };

  const disabled = await handleTaloWebhookNotice({ ...base, runtime: { status: "disabled" } as TaloRuntime, request: notice(valid) });
  assert.equal(disabled.httpStatus, 404);
  assert.equal(taloWebhookInboxResponse(disabled).status, 404);
  assert.equal(calls.length, 0);

  const first = await handleTaloWebhookNotice({ ...base, request: notice(valid, { "x-talo-signature": "s" }) });
  assert.deepEqual(first, { httpStatus: 200, outcome: "queued" });
  assert.equal(calls[0]?.signaturePresent, true);
  assert.equal(calls[0]?.environment, "sandbox");
  const second = await handleTaloWebhookNotice({ ...base, request: notice(valid) });
  assert.deepEqual(second, { httpStatus: 200, outcome: "duplicate" });
  const body = (await taloWebhookInboxResponse(second).json()) as Record<string, unknown>;
  assert.equal(body.economicRecognition, false);

  const unknown = await handleTaloWebhookNotice({ ...base, request: notice({ ...valid, customerId: "orderops-otro" }) });
  assert.deepEqual(unknown, { httpStatus: 202, outcome: "ignored" });

  for (const bad of ["{", JSON.stringify({ message: "Pago Actualizado", paymentId: "x" }), JSON.stringify({ ...valid, transactionId: "../x" })]) {
    const before: number = calls.length;
    const rejected = await handleTaloWebhookNotice({ ...base, request: notice(bad) });
    assert.equal(rejected.httpStatus, 400);
    assert.equal(calls.length, before);
  }

  const failing = await handleTaloWebhookNotice({
    ...base,
    enqueue: async () => {
      throw new Error("db down");
    },
    request: notice(valid)
  });
  assert.deepEqual(failing, { httpStatus: 503, outcome: "unavailable" });

  const limited = createWebhookRateLimit(1, 60_000);
  await handleTaloWebhookNotice({ ...base, rateLimit: limited, request: notice(valid), now: 1 });
  const throttled = await handleTaloWebhookNotice({ ...base, rateLimit: limited, request: notice(valid), now: 2 });
  assert.equal(throttled.httpStatus, 429);

  console.log("talo-webhook-inbox.verify: PASS");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
