/**
 * Deterministic verification for Admin Dashboard Order Code Partial Match Search (Phase 1).
 *
 * Covers:
 * - Case 1: Reproduce & resolve bug (PGF and PGF5 both isolate order #PGF5TU exclusively among orders with digit '5' in phone)
 * - Case 2: Monotonic progressive narrowing (PGF, PGF5, PGF5T, PGF5TU, #PGF, #PGF5, #PGF5TU, pgf5tu all match Order A only)
 * - Case 3: No broadening when digit '5' is entered as part of an alphanumeric code
 * - Case 4: Substring code search preserved (K7M, M4Q, #K7M, k7m4 for K7M4Q9)
 * - Case 5: Legacy UUID-derived ref preserved (D479, #D479, d479, UUID prefix)
 * - Case 6: Customer name preserved (Mauro, Ramirez, full/partial name)
 * - Case 7: Customer phone preserved (112345, 23456789, formatted phone)
 * - Case 8: Unrelated/no-match queries return no orders (ZZZZZZ, #ZZZZZZ, 99999999)
 * - Case 9: Empty/whitespace query returns all orders
 * - Case 10: Multi-token search (e.g. "Mauro 2345") matches customer + phone
 *
 * Run: npx tsx lib/orders/order-code-search-partial-match.verify.ts
 */
import assert from "node:assert/strict";

import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  matchesOperationalSearch,
  parseOperationalSearch
} from "@/lib/orders/natural-search";

function buildMockSearchOrder(
  overrides: Partial<AdminOrderDashboardItem> = {}
): AdminOrderDashboardItem {
  return {
    id: overrides.id ?? "default-uuid",
    order_code: overrides.order_code !== undefined ? overrides.order_code : "DEFAULT",
    created_at: overrides.created_at ?? "2026-08-28T00:00:00Z",
    customer_name: overrides.customer_name ?? "Mauro Ramirez",
    phone: overrides.phone ?? "+54 9 11 2345-6789",
    delivery_date: overrides.delivery_date ?? "2026-08-28",
    delivery_time: overrides.delivery_time ?? null,
    delivery_method: overrides.delivery_method ?? "delivery",
    address: overrides.address ?? "Calle Falsa 123",
    status: overrides.status ?? "pending",
    total_price: overrides.total_price ?? 5000,
    notes: overrides.notes ?? null,
    assigned_to: overrides.assigned_to ?? null,
    assigned_at: overrides.assigned_at ?? null,
    order_items_preview: overrides.order_items_preview ?? [],
    item_count: overrides.item_count ?? 1,
    item_summary: overrides.item_summary ?? "1x Hamburguesa",
    customer_short_name: overrides.customer_short_name ?? "Mauro R.",
    has_notes: overrides.has_notes ?? false,
    notes_preview: overrides.notes_preview ?? null,
    order_events: overrides.order_events ?? [],
    relative_time_label: overrides.relative_time_label ?? "hace 5m",
    urgency_state: overrides.urgency_state ?? "normal",
    operational_aging: (overrides.operational_aging ?? {
      badge: "Dentro de término",
      isDelayed: false,
      minutesInStatus: 5
    }) as any,
    timeline_steps: overrides.timeline_steps ?? [],
    customer_context: (overrides.customer_context ?? {
      badge: "Cliente recurrente",
      ordersCount: 3,
      favoriteDeliveryMethod: "delivery"
    }) as any
  };
}

function filterOrders(orders: AdminOrderDashboardItem[], queryString: string): AdminOrderDashboardItem[] {
  const query = parseOperationalSearch(queryString);
  return orders.filter((order) => matchesOperationalSearch({ order, query }));
}

// ============================================================================
// Fixtures for Bug Reproduction & Progressive Matching
// ============================================================================
const orderA = buildMockSearchOrder({
  id: "order-a-uuid-1111",
  order_code: "PGF5TU",
  customer_name: "Mauro Ramirez",
  customer_short_name: "Mauro R.",
  phone: "+54 9 11 1111-1111" // phone has digit 5 in country code (54)
});

const orderB = buildMockSearchOrder({
  id: "order-b-uuid-5555",
  order_code: "X9B97N",
  customer_name: "Mauro Gomez",
  customer_short_name: "Mauro G.",
  phone: "+54 9 11 5555-5555" // phone has multiple 5s
});

const orderC = buildMockSearchOrder({
  id: "order-c-uuid-5222",
  order_code: "EU86T4",
  customer_name: "Mauro Lopez",
  customer_short_name: "Mauro L.",
  phone: "+54 9 11 5222-2222" // phone has 5
});

const legacyOrder = buildMockSearchOrder({
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  order_code: undefined, // Legacy order without order_code, display ref D479
  customer_name: "Carlos Sanchez",
  customer_short_name: "Carlos S.",
  phone: "+54 9 11 9876-5432"
});

const k7Order = buildMockSearchOrder({
  id: "order-k7-uuid-9999",
  order_code: "K7M4Q9",
  customer_name: "Ana Fernandez",
  customer_short_name: "Ana F.",
  phone: "+54 9 11 2345-6789"
});

const allOrders = [orderA, orderB, orderC, legacyOrder, k7Order];

// ============================================================================
// Case 1 — Reproduce & Resolve Bug (PGF and PGF5 both isolate Order A exclusively)
// ============================================================================
const resPGF = filterOrders(allOrders, "PGF");
assert.equal(resPGF.length, 1, "PGF should isolate Order A");
assert.equal(resPGF[0]?.order_code, "PGF5TU");

const resPGF5 = filterOrders(allOrders, "PGF5");
assert.equal(resPGF5.length, 1, "PGF5 MUST NOT broaden results; should still isolate Order A exclusively");
assert.equal(resPGF5[0]?.order_code, "PGF5TU");

// ============================================================================
// Case 2 — Monotonic Progressive Narrowing
// ============================================================================
const progressiveQueries = [
  "PGF",
  "PGF5",
  "PGF5T",
  "PGF5TU",
  "#PGF",
  "#PGF5",
  "#PGF5TU",
  "pgf5",
  "pgf5tu"
];

for (const q of progressiveQueries) {
  const res = filterOrders(allOrders, q);
  assert.equal(res.length, 1, `Query "${q}" must resolve to exactly 1 order`);
  assert.equal(res[0]?.order_code, "PGF5TU", `Query "${q}" must match PGF5TU`);
}

// ============================================================================
// Case 3 — No Broadening With Digit
// ============================================================================
// Order B and Order C both contain digit '5' in phone number and UUID,
// but searching 'PGF5' must never return Order B or Order C.
const resNoBroadening = filterOrders([orderA, orderB, orderC], "PGF5");
assert.equal(resNoBroadening.length, 1);
assert.equal(resNoBroadening[0]?.id, orderA.id);

// ============================================================================
// Case 4 — Substring & Prefix Code Search Preserved
// ============================================================================
assert.equal(filterOrders(allOrders, "K7M").length, 1);
assert.equal(filterOrders(allOrders, "K7M")[0]?.order_code, "K7M4Q9");

assert.equal(filterOrders(allOrders, "M4Q").length, 1);
assert.equal(filterOrders(allOrders, "M4Q")[0]?.order_code, "K7M4Q9");

assert.equal(filterOrders(allOrders, "#K7M").length, 1);
assert.equal(filterOrders(allOrders, "#K7M")[0]?.order_code, "K7M4Q9");

assert.equal(filterOrders(allOrders, "k7m4").length, 1);
assert.equal(filterOrders(allOrders, "k7m4")[0]?.order_code, "K7M4Q9");

// ============================================================================
// Case 5 — Legacy UUID-Derived Ref Preserved
// ============================================================================
assert.equal(filterOrders(allOrders, "D479").length, 1);
assert.equal(filterOrders(allOrders, "D479")[0]?.id, legacyOrder.id);

assert.equal(filterOrders(allOrders, "#D479").length, 1);
assert.equal(filterOrders(allOrders, "#D479")[0]?.id, legacyOrder.id);

assert.equal(filterOrders(allOrders, "d479").length, 1);
assert.equal(filterOrders(allOrders, "d479")[0]?.id, legacyOrder.id);

assert.equal(filterOrders(allOrders, "f47ac10b").length, 1);
assert.equal(filterOrders(allOrders, "f47ac10b")[0]?.id, legacyOrder.id);

// ============================================================================
// Case 6 — Customer Name Search Preserved
// ============================================================================
const resMauro = filterOrders(allOrders, "Mauro");
assert.equal(resMauro.length, 3, "Mauro matches Order A, B, C");

const resRamirez = filterOrders(allOrders, "Ramirez");
assert.equal(resRamirez.length, 1, "Ramirez matches Order A only");
assert.equal(resRamirez[0]?.order_code, "PGF5TU");

const resCarlos = filterOrders(allOrders, "Carlos");
assert.equal(resCarlos.length, 1);
assert.equal(resCarlos[0]?.id, legacyOrder.id);

// ============================================================================
// Case 7 — Customer Phone Search Preserved
// ============================================================================
const resPhone11 = filterOrders(allOrders, "1111");
assert.equal(resPhone11.length, 1);
assert.equal(resPhone11[0]?.id, orderA.id);

const resPhone2345 = filterOrders(allOrders, "23456789");
assert.equal(resPhone2345.length, 1);
assert.equal(resPhone2345[0]?.order_code, "K7M4Q9");

// ============================================================================
// Case 8 — Unrelated / No-Match Queries Return Empty Array
// ============================================================================
assert.equal(filterOrders(allOrders, "ZZZZZZ").length, 0);
assert.equal(filterOrders(allOrders, "#ZZZZZZ").length, 0);
assert.equal(filterOrders(allOrders, "99999999").length, 0);
assert.equal(filterOrders(allOrders, "NonExistentName").length, 0);

// ============================================================================
// Case 9 — Empty & Whitespace Queries Return All Orders
// ============================================================================
assert.equal(filterOrders(allOrders, "").length, allOrders.length);
assert.equal(filterOrders(allOrders, "   ").length, allOrders.length);

// ============================================================================
// Case 10 — Multi-Token Search (e.g. "Mauro 1111" vs "Mauro 9999")
// ============================================================================
const resMultiTokenMatch = filterOrders(allOrders, "Mauro 1111");
assert.equal(resMultiTokenMatch.length, 1);
assert.equal(resMultiTokenMatch[0]?.id, orderA.id);

const resMultiTokenNoMatch = filterOrders(allOrders, "Mauro 9999");
assert.equal(resMultiTokenNoMatch.length, 0);

console.log("PASS: order-code-search-partial-match.verify.ts (10/10 test suites passed)");
