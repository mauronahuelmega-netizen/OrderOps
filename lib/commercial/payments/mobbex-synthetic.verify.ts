import assert from "node:assert/strict";

import {
  MOBBEX_FIXTURE_CHECKOUT_CENTS,
  MOBBEX_FIXTURE_CHECKOUT_ID,
  MOBBEX_FIXTURE_SUBSCRIPTION_CENTS,
  MOBBEX_FIXTURE_SUBSCRIPTION_ID,
  normalizeSyntheticPaymentEvent,
  observeMobbexFixture
} from "@/lib/commercial/payments/mobbex-synthetic";

const checkout = observeMobbexFixture({
  kind: "checkout_created",
  result: true,
  currency: "ARS",
  totalCents: MOBBEX_FIXTURE_CHECKOUT_CENTS,
  checkoutId: MOBBEX_FIXTURE_CHECKOUT_ID,
  test: true
});
assert.equal(checkout.action, "complete_created");
assert.equal(checkout.economicRecognition, false);
if (checkout.action === "complete_created" && checkout.purpose === "setup_checkout") {
  assert.equal(checkout.expectedAmountCents, 29_000_000);
  assert.equal(checkout.checkoutId, MOBBEX_FIXTURE_CHECKOUT_ID);
}

const subscription = observeMobbexFixture({
  kind: "subscription_created",
  result: true,
  currency: "ARS",
  totalCents: MOBBEX_FIXTURE_SUBSCRIPTION_CENTS,
  subscriptionUid: MOBBEX_FIXTURE_SUBSCRIPTION_ID,
  interval: "1m",
  trial: 1,
  limit: 12,
  noRetry: true,
  embed: true,
  test: true
});
assert.equal(subscription.action, "complete_created");
if (subscription.action === "complete_created" && subscription.purpose === "subscription") {
  assert.equal(subscription.expectedAmountCents, 5_500_000);
  assert.equal(subscription.subscriptionId, MOBBEX_FIXTURE_SUBSCRIPTION_ID);
}

assert.deepEqual(observeMobbexFixture({ kind: "empty_coupons", result: true, coupons: [] }), {
  action: "ignore",
  reason: "empty_coupons",
  economicRecognition: false
});
assert.equal(observeMobbexFixture({ kind: "operation_absent" }).action, "ignore");
assert.equal(observeMobbexFixture({ kind: "missing_identifier", result: true }).action, "mark_ambiguous");
assert.equal(observeMobbexFixture({ kind: "transport_error" }).action, "mark_ambiguous");
assert.equal(observeMobbexFixture({ kind: "ambiguous", result: true }).action, "mark_ambiguous");

const returned = normalizeSyntheticPaymentEvent({
  delivery: "browser_return",
  logicalName: "return-ok",
  commercialReference: "referencia-activacion",
  purpose: "setup_checkout",
  cancellation: false
});
assert.equal(returned.action, "record");
if (returned.action === "record") {
  assert.equal(returned.eventKey, "synthetic:browser_return:return-ok");
  assert.equal(returned.status, "pending_unverified");
  assert.equal(returned.economicRecognition, false);
}

const repeated = normalizeSyntheticPaymentEvent({
  delivery: "browser_return",
  logicalName: "return-ok",
  commercialReference: "referencia-activacion",
  purpose: "setup_checkout",
  cancellation: false
});
assert.deepEqual(repeated, returned);

const other = normalizeSyntheticPaymentEvent({
  delivery: "webhook_body",
  logicalName: "webhook-other",
  commercialReference: "referencia-activacion",
  purpose: "setup_checkout",
  cancellation: false
});
if (other.action === "record" && returned.action === "record") {
  assert.notEqual(other.eventKey, returned.eventKey);
}

const cancellation = normalizeSyntheticPaymentEvent({
  delivery: "browser_return",
  logicalName: "return-cancel",
  commercialReference: "referencia-activacion",
  purpose: "setup_checkout",
  cancellation: true
});
if (cancellation.action === "record") {
  assert.equal(cancellation.status, "pending_unverified");
  assert.equal(cancellation.cancellation, true);
  assert.equal(cancellation.economicRecognition, false);
}

const unmatched = normalizeSyntheticPaymentEvent({
  delivery: "webhook_body",
  logicalName: "webhook-unknown",
  commercialReference: null,
  purpose: null,
  cancellation: false
});
if (unmatched.action === "record") {
  assert.equal(unmatched.commercialReference, null);
  assert.equal(unmatched.eventKey, "synthetic:webhook_body:webhook-unknown");
}

assert.equal(
  normalizeSyntheticPaymentEvent({
    delivery: "browser_return",
    logicalName: "MAYUS",
    commercialReference: null,
    purpose: null,
    cancellation: false
  }).action,
  "reject"
);

console.log("mobbex-synthetic.verify: ok");
