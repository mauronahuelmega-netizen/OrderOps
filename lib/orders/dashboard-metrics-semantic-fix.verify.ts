/**
 * Deterministic verification for Admin Dashboard Metrics Semantic Fix (Phase 1).
 *
 * Covers:
 * - Case 1: Root product beats child upsell exclusion (Doble Smash beats Coca Cola 500ml)
 * - Case 2: High quantity child upsell excluded from top product
 * - Case 3: Legacy items without item_kind / parent_order_item_id count as root products
 * - Case 4: Cancelled orders excluded from top product calculation
 * - Case 5: Revenue includes upsell/additional revenue via order total_price
 * - Case 6: Average ticket divides by non-cancelled order count
 * - Case 7: Ready waiting formula counts all ready orders
 * - Case 8: View model label contracts ("Producto más pedido" & "Listos para entrega/retiro")
 *
 * Run: npx tsx lib/orders/dashboard-metrics-semantic-fix.verify.ts
 */
import assert from "node:assert/strict";

import type { AdminOrderDashboardItem, AdminOrderItem } from "@/lib/orders/admin";
import {
  buildAdminOrdersAnalytics,
  getActiveOrdersCount,
  getAverageTicket,
  getTopProducts,
  getTotalRevenue
} from "@/lib/orders/analytics";
import { buildDashboardTopSectionViewModel } from "@/lib/orders/dashboard-top-section-view-model";

function mockOrderItem(
  overrides: Partial<AdminOrderItem> = {}
): AdminOrderItem {
  return {
    id: overrides.id ?? "item-id",
    product_id: overrides.product_id ?? "prod-id",
    product_name: overrides.product_name ?? "Product",
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 1000,
    item_kind: overrides.item_kind ?? "product",
    parent_order_item_id: overrides.parent_order_item_id ?? null,
    image_url: null,
    description: null,
    customization_snapshot: null,
    ...overrides
  };
}

function mockOrder(
  overrides: Partial<AdminOrderDashboardItem> = {}
): AdminOrderDashboardItem {
  return {
    id: overrides.id ?? "order-id",
    order_code: overrides.order_code ?? "K7M4Q9",
    created_at: overrides.created_at ?? new Date().toISOString(),
    customer_name: overrides.customer_name ?? "Cliente Test",
    phone: overrides.phone ?? "+5491112345678",
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
    item_summary: overrides.item_summary ?? "1x Product",
    customer_short_name: overrides.customer_short_name ?? "Cliente",
    has_notes: overrides.has_notes ?? false,
    notes_preview: overrides.notes_preview ?? null,
    order_events: overrides.order_events ?? [],
    relative_time_label: overrides.relative_time_label ?? "Hace 5 min",
    urgency_state: overrides.urgency_state ?? "normal",
    operational_aging: (overrides.operational_aging ?? {
      badge: "Dentro de término",
      isDelayed: false,
      minutesInStatus: 5
    }) as any,
    timeline_steps: overrides.timeline_steps ?? [],
    customer_context: (overrides.customer_context ?? {
      badge: "Cliente nuevo",
      ordersCount: 1,
      favoriteDeliveryMethod: "delivery"
    }) as any
  };
}

// ============================================================================
// Case 1 — Root product beats child upsell exclusion
// ============================================================================
const orderA = mockOrder({
  id: "order-a",
  status: "preparing",
  order_items_preview: [
    mockOrderItem({ id: "smash-1", product_name: "Doble Smash", quantity: 1, item_kind: "product" }),
    mockOrderItem({
      id: "coca-1",
      product_name: "Coca Cola 500ml",
      quantity: 1,
      item_kind: "upsell",
      parent_order_item_id: "smash-1"
    })
  ]
});

const orderB = mockOrder({
  id: "order-b",
  status: "preparing",
  order_items_preview: [
    mockOrderItem({ id: "bbq-1", product_name: "BBQ Bacon", quantity: 1, item_kind: "product" }),
    mockOrderItem({
      id: "coca-2",
      product_name: "Coca Cola 500ml",
      quantity: 1,
      item_kind: "upsell",
      parent_order_item_id: "bbq-1"
    })
  ]
});

const orderC = mockOrder({
  id: "order-c",
  status: "completed",
  order_items_preview: [
    mockOrderItem({ id: "smash-2", product_name: "Doble Smash", quantity: 1, item_kind: "product" }),
    mockOrderItem({
      id: "coca-3",
      product_name: "Coca Cola 500ml",
      quantity: 1,
      item_kind: "upsell",
      parent_order_item_id: "smash-2"
    })
  ]
});

const topProductsCase1 = getTopProducts([orderA, orderB, orderC]);
assert.ok(topProductsCase1.length > 0, "Top products should not be empty");
assert.equal(topProductsCase1[0]?.name, "Doble Smash", "Doble Smash should be top product");
assert.equal(topProductsCase1[0]?.quantity, 2, "Doble Smash count should be 2");
const cocaIndex = topProductsCase1.findIndex((p) => p.name.includes("Coca Cola"));
assert.equal(cocaIndex, -1, "Coca Cola 500ml child upsells should NOT be in top products");

// ============================================================================
// Case 2 — High quantity child upsell excluded from top product
// ============================================================================
const orderHighUpsell = mockOrder({
  id: "order-high-upsell",
  status: "pending",
  order_items_preview: [
    mockOrderItem({ id: "burger-1", product_name: "Burger Simple", quantity: 1, item_kind: "product" }),
    mockOrderItem({
      id: "coca-5",
      product_name: "Coca Cola 500ml",
      quantity: 5,
      item_kind: "upsell",
      parent_order_item_id: "burger-1"
    })
  ]
});

const topProductsCase2 = getTopProducts([orderHighUpsell]);
assert.equal(topProductsCase2[0]?.name, "Burger Simple");
assert.equal(topProductsCase2[0]?.quantity, 1);
assert.equal(topProductsCase2.length, 1);

// ============================================================================
// Case 3 — Legacy rows without item_kind / parent_order_item_id are counted as roots
// ============================================================================
const legacyOrder = mockOrder({
  id: "legacy-order",
  status: "preparing",
  order_items_preview: [
    mockOrderItem({ id: "leg-1", product_name: "Pizza Muzzarella", quantity: 3, item_kind: null, parent_order_item_id: null })
  ]
});

const topProductsCase3 = getTopProducts([legacyOrder]);
assert.equal(topProductsCase3[0]?.name, "Pizza Muzzarella");
assert.equal(topProductsCase3[0]?.quantity, 3);

// ============================================================================
// Case 4 — Cancelled orders excluded from top product
// ============================================================================
const cancelledOrder = mockOrder({
  id: "cancelled-order",
  status: "cancelled",
  order_items_preview: [
    mockOrderItem({ id: "huge-root", product_name: "Mega Combo", quantity: 100, item_kind: "product" })
  ]
});

const topProductsCase4 = getTopProducts([orderA, cancelledOrder]);
assert.equal(topProductsCase4[0]?.name, "Doble Smash");
assert.equal(topProductsCase4[0]?.quantity, 1);
assert.ok(!topProductsCase4.some((p) => p.name === "Mega Combo"), "Cancelled mega combo must be excluded");

// ============================================================================
// Case 5 — Revenue remains intact (includes upsells through persisted order total_price)
// ============================================================================
const orderWithTotalAndUpsells = mockOrder({
  id: "order-rev",
  status: "completed",
  total_price: 15000 // Includes burger + 2x drinks
});
const revenue = getTotalRevenue([orderWithTotalAndUpsells, cancelledOrder]);
assert.equal(revenue, 15000, "Revenue must equal sum of non-cancelled orders total_price");

// ============================================================================
// Case 6 — Average ticket divides by non-cancelled order count
// ============================================================================
const orderRev2 = mockOrder({
  id: "order-rev-2",
  status: "ready",
  total_price: 5000
});
const avgTicket = getAverageTicket([orderWithTotalAndUpsells, orderRev2, cancelledOrder]);
assert.equal(avgTicket, 10000, "(15000 + 5000) / 2 valid orders = 10000");

// ============================================================================
// Case 7 — Ready waiting formula unchanged (counts all ready orders)
// ============================================================================
const readyOrder1 = mockOrder({ id: "r1", status: "ready", delivery_method: "delivery" });
const readyOrder2 = mockOrder({ id: "r2", status: "ready", delivery_method: "pickup" });
const activeOrdersCount = getActiveOrdersCount([readyOrder1, readyOrder2, orderA, cancelledOrder]);
assert.equal(activeOrdersCount, 3, "pending + preparing + 2 ready = 3 active orders");

// ============================================================================
// Case 8 — View model label contract ("Producto más pedido" & "Listos para entrega/retiro")
// ============================================================================
const analytics = buildAdminOrdersAnalytics([orderA, orderB, orderC, readyOrder1, readyOrder2]);
const now = new Date();
const viewModel = buildDashboardTopSectionViewModel({
  orders: [orderA, orderB, orderC, readyOrder1, readyOrder2],
  operationalWindow: {
    start: new Date(now.getTime() - 3600000),
    end: now,
    source: "store-session",
    sessionId: "session-1"
  },
  now,
  liveLabel: "En vivo",
  onlineCount: 2
});

const topProductKpi = viewModel.businessKpis.find((k) => k.id === "topProduct");
assert.ok(topProductKpi, "topProduct KPI must exist");
assert.equal(topProductKpi.label, "Producto más pedido", "Label must be 'Producto más pedido'");
assert.equal(topProductKpi.value, "Doble Smash", "Value must be Doble Smash");
assert.equal(topProductKpi.detail, "2 unidades", "Detail must be 2 unidades");

const readyWaitingKpi = viewModel.operationalKpis.find((k) => k.id === "readyWaiting");
assert.ok(readyWaitingKpi, "readyWaiting KPI must exist");
assert.equal(readyWaitingKpi.label, "Listos para entrega/retiro", "Label must be 'Listos para entrega/retiro'");
assert.equal(readyWaitingKpi.detail, "Delivery y retiro en local", "Detail must clarify delivery and retiro");
assert.equal(readyWaitingKpi.value, "2 pedidos", "Value must reflect 2 ready orders");

console.log("PASS: dashboard-metrics-semantic-fix.verify.ts (8/8 test suites passed)");
