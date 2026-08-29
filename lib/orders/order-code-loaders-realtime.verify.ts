/**
 * Verify order_code data propagation across admin loaders/hydrates/realtime models.
 *
 * Run: npx tsx lib/orders/order-code-loaders-realtime.verify.ts
 */
import assert from "node:assert/strict";

import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";
import {
  patchDashboardOrderFromRealtime,
  patchWorkspaceOrderFromRealtime
} from "@/lib/orders/realtime";
import {
  buildAdminOrderInitialDetail,
  type AdminOrderWorkspaceData
} from "@/lib/orders/workspace";

function buildMockDashboardItem(
  overrides: Partial<AdminOrderDashboardItem> = {}
): AdminOrderDashboardItem {
  return {
    id: overrides.id ?? "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    order_code: overrides.order_code ?? "K7M4Q9",
    created_at: overrides.created_at ?? "2026-08-28T00:00:00Z",
    customer_name: overrides.customer_name ?? "Juan Perez",
    phone: overrides.phone ?? "5491112345678",
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
    customer_short_name: overrides.customer_short_name ?? "Juan P.",
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

// Case 1 — Dashboard item carries order_code
const dashboardItem = buildMockDashboardItem({ order_code: "K7M4Q9" });
assert.equal(dashboardItem.order_code, "K7M4Q9");
assert.equal(dashboardItem.item_count, 1);
assert.equal(dashboardItem.item_summary, "1x Hamburguesa");

// Case 2 — Workspace initial detail mapper inherits order_code from dashboard item
const initialWorkspaceDetail = buildAdminOrderInitialDetail(dashboardItem);
assert.equal(initialWorkspaceDetail.order_code, "K7M4Q9");
assert.equal(initialWorkspaceDetail.id, dashboardItem.id);

// Case 3 — Workspace initial detail preserves order_code when cachedDetail is provided
const cachedWorkspaceDetail: AdminOrderWorkspaceData = {
  ...initialWorkspaceDetail,
  order_code: "K7M4Q9",
  notes: "Nota previa"
};
const refreshedWorkspaceDetail = buildAdminOrderInitialDetail(dashboardItem, cachedWorkspaceDetail);
assert.equal(refreshedWorkspaceDetail.order_code, "K7M4Q9");

// Case 4 — Realtime patch updates order_code when present in payload
const baseOrder = buildMockDashboardItem({ order_code: "AAAAAA" });
const patchedOrder = patchDashboardOrderFromRealtime(baseOrder, {
  order_code: "K7M4Q9",
  status: "preparing"
});
assert.equal(patchedOrder.order_code, "K7M4Q9");
assert.equal(patchedOrder.status, "preparing");

// Case 5 — Realtime patch preserves existing order_code when row lacks order_code
const orderWithCode = buildMockDashboardItem({ order_code: "K7M4Q9" });
const patchedWithoutCode = patchDashboardOrderFromRealtime(orderWithCode, {
  status: "ready"
});
assert.equal(patchedWithoutCode.order_code, "K7M4Q9");
assert.equal(patchedWithoutCode.status, "ready");

// Case 6 — Workspace realtime patch updates and preserves order_code
const workspaceBase: AdminOrderWorkspaceData = {
  ...buildMockDashboardItem({ order_code: "AAAAAA" }),
  order_items: []
};
const workspacePatched = patchWorkspaceOrderFromRealtime(workspaceBase, {
  order_code: "K7M4Q9",
  status: "preparing"
});
assert.equal(workspacePatched.order_code, "K7M4Q9");

const workspacePatchedPreserve = patchWorkspaceOrderFromRealtime(workspacePatched, {
  status: "ready"
});
assert.equal(workspacePatchedPreserve.order_code, "K7M4Q9");

// Case 7 — Display helper remains UUID-derived 4-char hex in this phase (no UI migration yet)
const testUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const displayRef = buildOrderDisplayRef(testUuid);
assert.equal(displayRef, "D479");
assert.notEqual(displayRef, "K7M4Q9");

console.log("order-code-loaders-realtime.verify.ts: PASS");
