/**
 * Verify dashboard OrderCard root-only count/summary semantics.
 *
 * Run: npx tsx lib/orders/dashboard-card-summary.verify.ts
 */
import assert from "node:assert/strict";

import { buildDashboardOrderCardSummary } from "@/lib/orders/dashboard-card-summary";

function item(
  overrides: Partial<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    item_kind: "product" | "upsell" | null;
    parent_order_item_id: string | null;
  }> = {}
) {
  return {
    id: overrides.id ?? "item-id",
    product_name: overrides.product_name ?? "Product",
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 1000,
    item_kind: overrides.item_kind ?? "product",
    parent_order_item_id: overrides.parent_order_item_id ?? null
  };
}

// Case 1 — #0215-like root + upsells
const fixture0215 = buildDashboardOrderCardSummary([
  item({ id: "doble", product_name: "Doble Smash", quantity: 2, item_kind: "product" }),
  item({ id: "bbq", product_name: "BBQ Bacon", quantity: 1, item_kind: "product" }),
  item({
    id: "coca-doble",
    product_name: "Coca Cola 500ml",
    quantity: 2,
    item_kind: "upsell",
    parent_order_item_id: "doble"
  }),
  item({
    id: "coca-bbq",
    product_name: "Coca Cola 500ml",
    quantity: 1,
    item_kind: "upsell",
    parent_order_item_id: "bbq"
  })
]);

assert.equal(fixture0215.itemCount, 3);
assert.equal(fixture0215.itemSummary, "2x Doble Smash · 1x BBQ Bacon");
assert.ok(!fixture0215.itemSummary.includes("+"));

// Case 2 — simple order
const simple = buildDashboardOrderCardSummary([
  item({ product_name: "Doble Smash", quantity: 1, item_kind: "product" })
]);
assert.equal(simple.itemCount, 1);
assert.equal(simple.itemSummary, "1x Doble Smash");

// Case 3 — multi-root no upsell
const multiRoot = buildDashboardOrderCardSummary([
  item({ id: "a", product_name: "Doble Smash", quantity: 2 }),
  item({ id: "b", product_name: "BBQ Bacon", quantity: 1 }),
  item({ id: "c", product_name: "Papas", quantity: 1 })
]);
assert.equal(multiRoot.itemCount, 4);
assert.equal(multiRoot.itemSummary, "2x Doble Smash · 1x BBQ Bacon · +1 mas");

// Case 4 — root + multiple upsells
const oneRootManyChildren = buildDashboardOrderCardSummary([
  item({ id: "root", product_name: "Doble Smash", quantity: 1, item_kind: "product" }),
  item({ id: "u1", product_name: "Coca Cola 500ml", quantity: 1, item_kind: "upsell", parent_order_item_id: "root" }),
  item({ id: "u2", product_name: "Sprite 500ml", quantity: 1, item_kind: "upsell", parent_order_item_id: "root" }),
  item({ id: "u3", product_name: "Papas", quantity: 1, item_kind: "upsell", parent_order_item_id: "root" })
]);
assert.equal(oneRootManyChildren.itemCount, 1);
assert.equal(oneRootManyChildren.itemSummary, "1x Doble Smash");
assert.ok(!oneRootManyChildren.itemSummary.includes("+"));

// Case 5 — 3 roots + children (hidden +1 mas is root only)
const threeRootsWithChildren = buildDashboardOrderCardSummary([
  item({ id: "r1", product_name: "Doble Smash", quantity: 2, item_kind: "product" }),
  item({ id: "r2", product_name: "BBQ Bacon", quantity: 1, item_kind: "product" }),
  item({ id: "r3", product_name: "Papas", quantity: 1, item_kind: "product" }),
  item({ id: "u1", product_name: "Coca Cola 500ml", quantity: 2, item_kind: "upsell", parent_order_item_id: "r1" }),
  item({ id: "u2", product_name: "Coca Cola 500ml", quantity: 1, item_kind: "upsell", parent_order_item_id: "r2" })
]);
assert.equal(threeRootsWithChildren.itemCount, 4);
assert.equal(threeRootsWithChildren.itemSummary, "2x Doble Smash · 1x BBQ Bacon · +1 mas");

// Case 6 — legacy rows
const legacy = buildDashboardOrderCardSummary([
  item({ product_name: "Doble Smash", quantity: 2, item_kind: null, parent_order_item_id: null }),
  item({ product_name: "BBQ Bacon", quantity: 1, item_kind: null, parent_order_item_id: null })
]);
assert.equal(legacy.itemCount, 3);
assert.equal(legacy.itemSummary, "2x Doble Smash · 1x BBQ Bacon");

// Case 7 — orphan upsell
const orphan = buildDashboardOrderCardSummary([
  item({ id: "root", product_name: "Doble Smash", quantity: 1, item_kind: "product" }),
  item({
    id: "orphan",
    product_name: "Coca Cola 500ml",
    quantity: 2,
    item_kind: "upsell",
    parent_order_item_id: null
  })
]);
assert.equal(orphan.itemCount, 3);
assert.equal(orphan.itemSummary, "1x Doble Smash · 2x Coca Cola 500ml");

// Case 8 — child before parent in payload (parent id lookup via full byId map)
const childBeforeParent = buildDashboardOrderCardSummary([
  item({
    id: "child",
    product_name: "Coca Cola 500ml",
    quantity: 2,
    item_kind: "upsell",
    parent_order_item_id: "parent"
  }),
  item({ id: "parent", product_name: "Doble Smash", quantity: 2, item_kind: "product" })
]);
assert.equal(childBeforeParent.itemCount, 2);
assert.equal(childBeforeParent.itemSummary, "2x Doble Smash");

// Case 7b — orphan upsell with missing parent id in payload
const missingParent = buildDashboardOrderCardSummary([
  item({ id: "root", product_name: "Doble Smash", quantity: 1, item_kind: "product" }),
  item({
    id: "orphan",
    product_name: "Coca Cola 500ml",
    quantity: 1,
    item_kind: "upsell",
    parent_order_item_id: "missing-parent"
  })
]);
assert.equal(missingParent.itemCount, 2);
assert.equal(missingParent.itemSummary, "1x Doble Smash · 1x Coca Cola 500ml");

console.log("dashboard-card-summary.verify.ts: PASS");
