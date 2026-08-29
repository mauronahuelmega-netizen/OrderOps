/**
 * Deterministic verification for Admin Dashboard Search Kanban Visual Stability (Phase 1).
 *
 * Covers:
 * - Case 1: Primary view keeps 4 persistent lanes during search (pending, preparing, ready, completed)
 *   even when some/all lanes have 0 matches; empty lanes marked isEmpty: true, label copy "Sin resultados".
 * - Case 2: Terminal view keeps Cancelados lane with 0 matches when cancelled orders exist in base scope;
 *   groupedOrders retains cancelled group so lane selection returns all 4 terminal lanes (preparing, ready, completed, cancelled).
 * - Case 3: No-search view preserves empty copy "Sin pedidos" for empty lanes; when no cancelled orders exist in base scope,
 *   conditional cancelled lane is omitted from groupedOrders.
 * - Case 4: Search clear restores normal board order distribution and "Sin pedidos" empty copy.
 * - Case 5: Monotonic order_code search (PGF -> PGF5 -> PGF5TU) leaves board geometry intact without dropping lanes.
 *
 * Run: npx tsx lib/orders/dashboard-search-kanban-visual-stability.verify.ts
 */
import assert from "node:assert/strict";

import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  buildDashboardBoardViewModel,
  type DashboardBoardGroupedOrder
} from "@/lib/orders/dashboard-board-view-model";

function buildMockOrder(
  overrides: Partial<AdminOrderDashboardItem> = {}
): AdminOrderDashboardItem {
  return {
    id: overrides.id ?? "order-uuid-default",
    order_code: overrides.order_code ?? "K7M4Q9",
    created_at: overrides.created_at ?? "2026-08-28T12:00:00Z",
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

const PRIMARY_LANE_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed"
] as const;

const TERMINAL_LANE_STATUSES = [
  "preparing",
  "ready",
  "completed",
  "cancelled"
] as const;

function selectLaneWindowGroups(
  groupedOrders: DashboardBoardGroupedOrder[],
  laneWindow: "primary" | "terminal"
): DashboardBoardGroupedOrder[] {
  const statuses =
    laneWindow === "terminal" ? TERMINAL_LANE_STATUSES : PRIMARY_LANE_STATUSES;

  return statuses
    .map((status) => groupedOrders.find((group) => group.status === status))
    .filter((group): group is DashboardBoardGroupedOrder => group !== undefined);
}

// Operational window mock covering today's orders
const mockOperationalWindow = {
  source: "business-window" as const,
  start: new Date("2026-08-28T00:00:00Z"),
  end: new Date("2026-08-28T23:59:59Z"),
  referenceDate: "2026-08-28"
};

const fixedNow = new Date("2026-08-28T14:00:00Z");

// ============================================================================
// Fixtures
// ============================================================================
const orderPending = buildMockOrder({
  id: "order-pending-1",
  order_code: "PND001",
  status: "pending",
  customer_name: "Juan Perez"
});

const orderPreparing = buildMockOrder({
  id: "order-prep-1",
  order_code: "PRP001",
  status: "preparing",
  customer_name: "Lucia Gomez"
});

const orderReady = buildMockOrder({
  id: "order-ready-1",
  order_code: "RDY001",
  status: "ready",
  customer_name: "Sofia Diaz"
});

const orderCompleted = buildMockOrder({
  id: "order-completed-1",
  order_code: "PGF5TU",
  status: "completed",
  customer_name: "Mauro Ramirez"
});

const orderCancelled = buildMockOrder({
  id: "order-cancelled-1",
  order_code: "CNC999",
  status: "cancelled",
  customer_name: "Esteban Quito"
});

const baseOrdersWithCancelled = [
  orderPending,
  orderPreparing,
  orderReady,
  orderCompleted,
  orderCancelled
];

// ============================================================================
// Case 1 — Primary view keeps 4 lanes during search
// ============================================================================
{
  const vm = buildDashboardBoardViewModel({
    orders: baseOrdersWithCancelled,
    activeFilter: "all",
    searchQuery: "PGF5TU",
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });

  assert.equal(vm.hasSearchQuery, true);
  assert.equal(vm.renderMode, "kanban");

  const primaryLanes = selectLaneWindowGroups(vm.groupedOrders, "primary");
  assert.equal(primaryLanes.length, 4, "Primary view must have exactly 4 lanes");
  assert.deepEqual(
    primaryLanes.map((l) => l.status),
    ["pending", "preparing", "ready", "completed"]
  );

  // Completed lane has the matching order
  const completedLane = primaryLanes.find((l) => l.status === "completed");
  assert.equal(completedLane?.orders.length, 1);
  assert.equal(completedLane?.orders[0]?.order_code, "PGF5TU");
  assert.equal(completedLane?.isEmpty, false);

  // Other lanes are empty but present
  const pendingLane = primaryLanes.find((l) => l.status === "pending");
  assert.equal(pendingLane?.orders.length, 0);
  assert.equal(pendingLane?.isEmpty, true);

  // In orchestrator, emptyLaneLabel = hasSearchQuery ? "Sin resultados" : "Sin pedidos"
  const emptyLaneLabel = vm.hasSearchQuery ? "Sin resultados" : "Sin pedidos";
  assert.equal(emptyLaneLabel, "Sin resultados");
}

// ============================================================================
// Case 2 — Terminal view keeps Cancelados lane with 0 matches
// ============================================================================
{
  const vm = buildDashboardBoardViewModel({
    orders: baseOrdersWithCancelled,
    activeFilter: "all",
    searchQuery: "PGF5TU", // Matches completed order, does not match cancelled order
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });

  // groupedOrders must retain cancelled group because cancelled orders exist in base scope
  const cancelledGroup = vm.groupedOrders.find((g) => g.status === "cancelled");
  assert.ok(cancelledGroup, "groupedOrders must retain cancelled group during active search");
  assert.equal(cancelledGroup.orders.length, 0, "No cancelled orders match PGF5TU");
  assert.equal(cancelledGroup.isEmpty, true);

  const terminalLanes = selectLaneWindowGroups(vm.groupedOrders, "terminal");
  assert.equal(terminalLanes.length, 4, "Terminal view must have exactly 4 lanes");
  assert.deepEqual(
    terminalLanes.map((l) => l.status),
    ["preparing", "ready", "completed", "cancelled"]
  );

  const emptyLaneLabel = vm.hasSearchQuery ? "Sin resultados" : "Sin pedidos";
  assert.equal(emptyLaneLabel, "Sin resultados");
}

// ============================================================================
// Case 3 — No-search empty copy preserved
// ============================================================================
{
  const vm = buildDashboardBoardViewModel({
    orders: baseOrdersWithCancelled,
    activeFilter: "all",
    searchQuery: "",
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });

  assert.equal(vm.hasSearchQuery, false);
  const emptyLaneLabel = vm.hasSearchQuery ? "Sin resultados" : "Sin pedidos";
  assert.equal(emptyLaneLabel, "Sin pedidos");

  const terminalLanes = selectLaneWindowGroups(vm.groupedOrders, "terminal");
  assert.equal(terminalLanes.length, 4);
  const cancelledLane = terminalLanes.find((l) => l.status === "cancelled");
  assert.equal(cancelledLane?.orders.length, 1);
  assert.equal(cancelledLane?.isEmpty, false);
}

// ============================================================================
// Case 3b — When 0 cancelled orders exist in base scope, conditional cancelled group is omitted
// ============================================================================
{
  const ordersWithoutCancelled = [orderPending, orderPreparing, orderReady, orderCompleted];
  const vm = buildDashboardBoardViewModel({
    orders: ordersWithoutCancelled,
    activeFilter: "all",
    searchQuery: "",
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });

  const cancelledGroup = vm.groupedOrders.find((g) => g.status === "cancelled");
  assert.equal(cancelledGroup, undefined, "Cancelled group omitted when base scope has 0 cancelled orders");

  const primaryLanes = selectLaneWindowGroups(vm.groupedOrders, "primary");
  assert.equal(primaryLanes.length, 4);
}

// ============================================================================
// Case 4 — Search clear restores normal board
// ============================================================================
{
  // 1. Search active
  const vmSearch = buildDashboardBoardViewModel({
    orders: baseOrdersWithCancelled,
    activeFilter: "all",
    searchQuery: "PGF5TU",
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });
  assert.equal(vmSearch.filteredOrders.length, 1);

  // 2. Search cleared
  const vmCleared = buildDashboardBoardViewModel({
    orders: baseOrdersWithCancelled,
    activeFilter: "all",
    searchQuery: "",
    operationalWindow: mockOperationalWindow,
    now: fixedNow,
    currentUserId: "admin-user"
  });
  assert.equal(vmCleared.filteredOrders.length, 5);
  assert.equal(vmCleared.hasSearchQuery, false);

  const primaryLanes = selectLaneWindowGroups(vmCleared.groupedOrders, "primary");
  assert.equal(primaryLanes.length, 4);
  assert.equal(primaryLanes.find((l) => l.status === "pending")?.orders.length, 1);
  assert.equal(primaryLanes.find((l) => l.status === "completed")?.orders.length, 1);
}

// ============================================================================
// Case 5 — Progressive order code search leaves board geometry intact
// ============================================================================
{
  const progressiveQueries = ["PGF", "PGF5", "PGF5T", "PGF5TU", "#PGF5", "pgf5"];

  for (const q of progressiveQueries) {
    const vm = buildDashboardBoardViewModel({
      orders: baseOrdersWithCancelled,
      activeFilter: "all",
      searchQuery: q,
      operationalWindow: mockOperationalWindow,
      now: fixedNow,
      currentUserId: "admin-user"
    });

    assert.equal(vm.filteredOrders.length, 1, `Query "${q}" matches exactly 1 order`);
    assert.equal(vm.filteredOrders[0]?.order_code, "PGF5TU");

    const primaryLanes = selectLaneWindowGroups(vm.groupedOrders, "primary");
    assert.equal(primaryLanes.length, 4, `Primary lanes stable for query "${q}"`);

    const terminalLanes = selectLaneWindowGroups(vm.groupedOrders, "terminal");
    assert.equal(terminalLanes.length, 4, `Terminal lanes stable for query "${q}"`);
  }
}

console.log("PASS: dashboard-search-kanban-visual-stability.verify.ts (all test suites passed)");
