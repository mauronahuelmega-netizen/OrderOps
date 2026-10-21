import assert from "node:assert/strict";

import {
  billingEnvironment,
  buenosAiresDate,
  computeBillingNotices,
  parseBillingSummary,
  type BillingHistoryEntry,
  type ServiceAccess
} from "@/lib/commercial/billing/billing-summary";

// 2026-10-20 12:00 in Buenos Aires (UTC-3).
const now = new Date("2026-10-20T15:00:00Z");

function kinds(access: ServiceAccess, history: BillingHistoryEntry[] = []): string[] {
  return computeBillingNotices(access, history, now).map((notice) => notice.kind);
}

function active(nextPeriodOn: string, nextCovered = false): ServiceAccess {
  return {
    state: "active",
    allows_orders: true,
    start_pending: false,
    current_period_on: "2026-09-25",
    next_period_on: nextPeriodOn,
    next_covered: nextCovered
  };
}

function subscription(collection: Partial<BillingHistoryEntry["collections"][number]>): BillingHistoryEntry {
  return {
    obligation_id: "o",
    kind: "subscription",
    period_on: "2026-10-25",
    list_price_cents: 5_500_000,
    status: "satisfied",
    collections: [{ status: "posted", gross_cents: 5_500_000, nominal: true, posted_at: null, reversed_at: null, ...collection }]
  };
}

assert.equal(buenosAiresDate(new Date("2026-10-21T02:30:00Z")), "2026-10-20");
assert.equal(buenosAiresDate(new Date("2026-10-21T03:00:00Z")), "2026-10-21");

// Renewal window: T-10 opens 10 days before the anniversary, T-3 takes over in the last 3 days.
assert.deepEqual(kinds(active("2026-10-31")), []);
assert.deepEqual(kinds(active("2026-10-30")), ["t_minus_10"]);
assert.deepEqual(kinds(active("2026-10-24")), ["t_minus_10"]);
assert.deepEqual(kinds(active("2026-10-23")), ["t_minus_3"]);
assert.deepEqual(kinds(active("2026-10-20")), ["t_minus_3"]);
assert.deepEqual(kinds(active("2026-10-23", true)), []);

assert.deepEqual(kinds({ state: "grace", allows_orders: true, grace_ends_at: "2026-10-23T03:00:00Z" }), ["grace"]);
assert.equal(
  computeBillingNotices({ state: "grace", allows_orders: true, grace_ends_at: "2026-10-23T03:00:00Z" }, [], now)[0].date,
  "2026-10-23T03:00:00Z"
);
assert.deepEqual(kinds({ state: "suspended", allows_orders: false }), ["suspended"]);
assert.deepEqual(kinds({ state: "pending_activation", allows_orders: false }), ["activation_pending"]);
assert.deepEqual(kinds({ state: "no_terms", allows_orders: false }), ["review"]);
assert.deepEqual(kinds({ state: "review_required", allows_orders: false }), ["review"]);
assert.deepEqual(kinds({ state: "exempt", allows_orders: true }), []);
assert.deepEqual(kinds({ state: "active", allows_orders: true, start_pending: true }), ["service_start_pending"]);

// Payment and reversal notices come from the collection history.
assert.deepEqual(kinds(active("2026-11-25", false), [subscription({ posted_at: "2026-10-18T12:00:00Z" })]), ["payment_received"]);
assert.deepEqual(kinds(active("2026-11-25", false), [subscription({ posted_at: "2026-10-01T12:00:00Z" })]), []);
assert.deepEqual(
  kinds(active("2026-11-25", false), [subscription({ posted_at: "2026-10-18T12:00:00Z", nominal: false })]),
  []
);
assert.deepEqual(
  kinds({ state: "suspended", allows_orders: false }, [
    subscription({ status: "reversed", posted_at: "2026-10-01T12:00:00Z", reversed_at: "2026-10-19T12:00:00Z" })
  ]),
  ["suspended", "reversal"]
);
assert.deepEqual(
  kinds(active("2026-11-25"), [subscription({ status: "reversed", posted_at: "2026-10-18T12:00:00Z", reversed_at: "2026-08-01T12:00:00Z" })]),
  []
);

// Parsing keeps restricted roles away from billing details.
assert.deepEqual(parseBillingSummary({ ok: true, restricted: true, allows_orders: false }), { kind: "restricted", allowsOrders: false });
assert.deepEqual(parseBillingSummary({ ok: false, commercial_error_code: "no_business" }), { kind: "error", code: "no_business" });
assert.deepEqual(parseBillingSummary(null), { kind: "error", code: "error" });
const full = parseBillingSummary({
  ok: true,
  restricted: false,
  access: { state: "active", allows_orders: true },
  payment_destination: { cvu: "1", alias: "a" },
  receipts: [],
  history: [],
  fiscal_documents: []
});
assert.equal(full.kind, "full");
assert.equal(full.kind === "full" ? full.paymentDestination?.alias : null, "a");

assert.equal(billingEnvironment({}), "sandbox");
assert.equal(billingEnvironment({ COMMERCIAL_TALO_ENVIRONMENT: "production" }), "production");

console.log("billing-summary.verify: PASS");
