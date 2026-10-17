import assert from "node:assert/strict";

import {
  readMobbexSandbox,
  readPaymentWebhookBase,
  readTaloSandbox,
  TALO_SANDBOX_API_ORIGIN
} from "@/lib/commercial/payments/sandbox-env";

const secret = "sandbox-value-not-for-logs";
const empty = {};

const mobbexMissing = readMobbexSandbox(empty);
const taloMissing = readTaloSandbox(empty);
assert.equal(mobbexMissing.status, "BLOCKED_BY_CREDENTIALS");
assert.equal(taloMissing.status, "BLOCKED_BY_CREDENTIALS");
assert.equal(JSON.stringify(mobbexMissing).includes(secret), false);

const mobbexLive = readMobbexSandbox({
  MOBBEX_API_KEY: secret,
  MOBBEX_ACCESS_TOKEN: secret,
  MOBBEX_TEST_MODE: "false"
});
assert.equal(mobbexLive.status, "rejected");
assert.equal(JSON.stringify(mobbexLive).includes(secret), false);

const mobbexReady = readMobbexSandbox({
  MOBBEX_API_KEY: secret,
  MOBBEX_ACCESS_TOKEN: secret,
  MOBBEX_TEST_MODE: "true"
});
assert.equal(mobbexReady.status, "ready");

const productionTalo = readTaloSandbox({
  TALO_SANDBOX_API_URL: "https://api.talo.com.ar",
  TALO_USER_ID: secret,
  TALO_CLIENT_ID: secret,
  TALO_CLIENT_SECRET: secret
});
assert.equal(productionTalo.status, "rejected");
if (productionTalo.status === "rejected") {
  assert.equal(productionTalo.reason, "sandbox_origin_required");
}

const taloReady = readTaloSandbox({
  TALO_SANDBOX_API_URL: TALO_SANDBOX_API_ORIGIN,
  TALO_USER_ID: secret,
  TALO_CLIENT_ID: secret,
  TALO_CLIENT_SECRET: secret
});
assert.equal(taloReady.status, "ready");
assert.equal(JSON.stringify(taloReady).includes(secret), false);

assert.equal(readPaymentWebhookBase({ COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL: "http://example.test/hooks" }).status, "rejected");
assert.equal(
  readPaymentWebhookBase({ COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL: "https://example.test/hooks" }).status,
  "ready"
);

console.log("sandbox-env.verify: ok");
