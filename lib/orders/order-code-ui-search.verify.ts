/**
 * Verify operational search matching order_code with/without '#', case-insensitive, partial/exact,
 * along with legacy UUID display ref, customer name, and customer phone searches.
 *
 * Run: npx tsx lib/orders/order-code-ui-search.verify.ts
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
    id: overrides.id ?? "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    order_code: overrides.order_code ?? "K7M4Q9",
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
    relative_time_label: overrides.relative_time_label ?? "hace 5m",
    urgency_state: overrides.urgency_state ?? "normal",
    operational_aging: overrides.operational_aging ?? "normal",
    timeline_steps: overrides.timeline_steps ?? null,
    customer_context: overrides.customer_context ?? {
      isNewCustomer: false,
      totalOrders: 1,
      previousOrderRelativeLabel: null,
      preferredMethodLabel: "Delivery",
      signals: []
    }
  };
}

const testOrder = buildMockSearchOrder({
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // legacy ref: D479
  order_code: "K7M4Q9",
  customer_name: "Mauro Ramirez",
  customer_short_name: "Mauro R.",
  phone: "+54 9 11 2345-6789"
});

function searchMatches(order: AdminOrderDashboardItem, queryString: string): boolean {
  const query = parseOperationalSearch(queryString);
  return matchesOperationalSearch({ order, query });
}

// Case 1 — Exact order_code match
assert.equal(searchMatches(testOrder, "K7M4Q9"), true);

// Case 2 — Order code with leading '#'
assert.equal(searchMatches(testOrder, "#K7M4Q9"), true);

// Case 3 — Lowercase order code
assert.equal(searchMatches(testOrder, "k7m4q9"), true);
assert.equal(searchMatches(testOrder, "#k7m4q9"), true);

// Case 4 — Prefix / partial match on order_code
assert.equal(searchMatches(testOrder, "K7M"), true);
assert.equal(searchMatches(testOrder, "#K7M"), true);
assert.equal(searchMatches(testOrder, "k7m"), true);
assert.equal(searchMatches(testOrder, "M4Q"), true);

// Case 5 — Legacy UUID-derived ref still matches
assert.equal(searchMatches(testOrder, "D479"), true);
assert.equal(searchMatches(testOrder, "#D479"), true);
assert.equal(searchMatches(testOrder, "d479"), true);
assert.equal(searchMatches(testOrder, "f47ac10b"), true); // UUID prefix

// Case 6 — Customer name search still matches
assert.equal(searchMatches(testOrder, "Mauro"), true);
assert.equal(searchMatches(testOrder, "ramirez"), true);
assert.equal(searchMatches(testOrder, "mauro r"), true);

// Case 7 — Customer phone search still matches
assert.equal(searchMatches(testOrder, "23456789"), true);
assert.equal(searchMatches(testOrder, "112345"), true);

// Case 8 — Unrelated queries do NOT match
assert.equal(searchMatches(testOrder, "ZZZZZZ"), false);
assert.equal(searchMatches(testOrder, "#ZZZZZZ"), false);
assert.equal(searchMatches(testOrder, "99999999"), false);
assert.equal(searchMatches(testOrder, "Carlos"), false);

// Case 9 — Empty query matches all
assert.equal(searchMatches(testOrder, ""), true);
assert.equal(searchMatches(testOrder, "   "), true);

// ============================================================================
// ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1 — Monotonic narrowing & no broadening with digits
// ============================================================================
const orderPGF = buildMockSearchOrder({
  id: "order-pgf-uuid-1111",
  order_code: "PGF5TU",
  customer_name: "Mauro Ramirez",
  phone: "+54 9 11 1111-1111"
});

const orderOtherWith5InPhone = buildMockSearchOrder({
  id: "order-other-uuid-5555",
  order_code: "X9B97N",
  customer_name: "Mauro Gomez",
  phone: "+54 9 11 5555-5555"
});

// PGF matches PGF5TU, does not match X9B97N
assert.equal(searchMatches(orderPGF, "PGF"), true);
assert.equal(searchMatches(orderOtherWith5InPhone, "PGF"), false);

// PGF5 matches PGF5TU, MUST NOT match X9B97N despite having digit '5' in phone
assert.equal(searchMatches(orderPGF, "PGF5"), true);
assert.equal(searchMatches(orderOtherWith5InPhone, "PGF5"), false);

// Progressive code search matches PGF5TU monotonically
assert.equal(searchMatches(orderPGF, "PGF5T"), true);
assert.equal(searchMatches(orderPGF, "PGF5TU"), true);
assert.equal(searchMatches(orderPGF, "#PGF5"), true);
assert.equal(searchMatches(orderPGF, "pgf5"), true);

console.log("order-code-ui-search.verify.ts: PASS");
