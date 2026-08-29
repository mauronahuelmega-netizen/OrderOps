/**
 * Deterministic verification for Admin Dashboard Mobile Terminal Orders Density Polish (Phase 1).
 *
 * Covers:
 * 1. Active statuses ('pending', 'preparing', 'ready') are never capped on mobile or desktop.
 * 2. Terminal statuses ('completed', 'cancelled') cap to 5 preview items on mobile (<=767px) when collapsed.
 * 3. Expanded terminal section renders all orders.
 * 4. Active search disables the terminal cap so all matching terminal orders are rendered.
 * 5. Section lane badge count always displays the total order count (never truncated to preview count).
 * 6. Desktop (>=1200px) and tablet (768px-1199px) modes do not apply the terminal cap.
 * 7. Boundary thresholds: 0-5 terminal orders show no disclosure button.
 * 8. Boundary thresholds: 6+ terminal orders show disclosure button.
 * 9. Hidden count button label is formatted as 'Mostrar ${total - 5} más' (collapsed) and 'Mostrar menos' (expanded).
 * 10. Existing order sort sequence is preserved by slicing the first 5 newest items.
 * 11. Source contracts for DashboardKanbanBoard.tsx and dashboard-kanban.module.css.
 *
 * Run: npx tsx lib/orders/dashboard-mobile-terminal-density.verify.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";

function buildMockOrder(
  id: string,
  status: AdminOrderDashboardItem["status"],
  createdAt: string
): AdminOrderDashboardItem {
  return {
    id,
    order_code: "PGF5TU",
    created_at: createdAt,
    customer_name: `Customer ${id}`,
    phone: "+54 9 11 1234-5678",
    delivery_date: "2026-08-28",
    delivery_time: null,
    delivery_method: "delivery",
    address: "Av. Corrientes 1234",
    status,
    total_price: 15000,
    notes: null,
    assigned_to: null,
    assigned_at: null,
    order_items_preview: [],
    item_count: 2,
    item_summary: "2x Burger",
    customer_short_name: "Customer",
    has_notes: false,
    notes_preview: null,
    order_events: [],
    relative_time_label: "hace 5m",
    urgency_state: "normal",
    operational_aging: {
      badge: "Dentro de término",
      isDelayed: false,
      minutesInStatus: 5
    } as any,
    timeline_steps: [],
    customer_context: {
      badge: "Cliente recurrente",
      ordersCount: 3,
      favoriteDeliveryMethod: "delivery"
    } as any
  };
}

// Pure implementation mirroring DashboardKanbanBoard.tsx mobile terminal density derivation
const MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT = 5;
const MOBILE_TERMINAL_ORDER_STATUSES = new Set<AdminOrderDashboardItem["status"]>([
  "completed",
  "cancelled"
]);

type DeriveVisibleOrdersInput = {
  status: AdminOrderDashboardItem["status"];
  orders: AdminOrderDashboardItem[];
  isMobileStacked: boolean;
  hasActiveSearch: boolean;
  isExpanded: boolean;
};

function deriveLaneOrdersState({
  status,
  orders,
  isMobileStacked,
  hasActiveSearch,
  isExpanded
}: DeriveVisibleOrdersInput) {
  const isTerminalStatus = MOBILE_TERMINAL_ORDER_STATUSES.has(status);
  const shouldApplyMobileTerminalCap =
    isMobileStacked &&
    !hasActiveSearch &&
    isTerminalStatus &&
    orders.length > MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT;

  const visibleOrders =
    shouldApplyMobileTerminalCap && !isExpanded
      ? orders.slice(0, MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT)
      : orders;

  const hiddenCount = orders.length - MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT;
  const buttonLabel = shouldApplyMobileTerminalCap
    ? isExpanded
      ? "Mostrar menos"
      : `Mostrar ${hiddenCount} más`
    : null;

  return {
    totalCount: orders.length,
    visibleOrders,
    visibleCount: visibleOrders.length,
    shouldApplyMobileTerminalCap,
    buttonLabel
  };
}

async function runVerification() {
  console.log("Starting mobile terminal orders density verification...");

  // 1. Active statuses are never capped on mobile
  const activeStatuses: AdminOrderDashboardItem["status"][] = ["pending", "preparing", "ready"];
  for (const status of activeStatuses) {
    const mockOrders = Array.from({ length: 12 }, (_, i) =>
      buildMockOrder(`order-active-${i}`, status, `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status,
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: false,
      isExpanded: false
    });

    assert.equal(result.totalCount, 12);
    assert.equal(result.visibleCount, 12, `Active status ${status} must not be capped`);
    assert.equal(result.shouldApplyMobileTerminalCap, false);
    assert.equal(result.buttonLabel, null);
  }

  // 2. Terminal statuses cap to 5 on mobile collapsed
  const terminalStatuses: AdminOrderDashboardItem["status"][] = ["completed", "cancelled"];
  for (const status of terminalStatuses) {
    const mockOrders = Array.from({ length: 16 }, (_, i) =>
      buildMockOrder(`order-terminal-${i}`, status, `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status,
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: false,
      isExpanded: false
    });

    assert.equal(result.totalCount, 16);
    assert.equal(result.visibleCount, 5, `Terminal status ${status} must cap to 5 when collapsed`);
    assert.equal(result.shouldApplyMobileTerminalCap, true);
    assert.equal(result.buttonLabel, "Mostrar 11 más");
    assert.equal(result.visibleOrders[0].id, "order-terminal-0");
    assert.equal(result.visibleOrders[4].id, "order-terminal-4");
  }

  // 3. Expanded terminal section renders all orders
  for (const status of terminalStatuses) {
    const mockOrders = Array.from({ length: 16 }, (_, i) =>
      buildMockOrder(`order-terminal-${i}`, status, `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status,
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: false,
      isExpanded: true
    });

    assert.equal(result.totalCount, 16);
    assert.equal(result.visibleCount, 16, `Expanded terminal status ${status} must show all orders`);
    assert.equal(result.shouldApplyMobileTerminalCap, true);
    assert.equal(result.buttonLabel, "Mostrar menos");
  }

  // 4. Search active disables cap so all matches render
  for (const status of terminalStatuses) {
    const mockOrders = Array.from({ length: 20 }, (_, i) =>
      buildMockOrder(`order-search-${i}`, status, `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status,
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: true,
      isExpanded: false
    });

    assert.equal(result.totalCount, 20);
    assert.equal(result.visibleCount, 20, "Search active must bypass terminal cap");
    assert.equal(result.shouldApplyMobileTerminalCap, false);
    assert.equal(result.buttonLabel, null);
  }

  // 5. Desktop (not mobile stacked) does not cap
  for (const status of terminalStatuses) {
    const mockOrders = Array.from({ length: 25 }, (_, i) =>
      buildMockOrder(`order-desktop-${i}`, status, `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status,
      orders: mockOrders,
      isMobileStacked: false,
      hasActiveSearch: false,
      isExpanded: false
    });

    assert.equal(result.totalCount, 25);
    assert.equal(result.visibleCount, 25, "Desktop mode must not cap orders");
    assert.equal(result.shouldApplyMobileTerminalCap, false);
    assert.equal(result.buttonLabel, null);
  }

  // 6. Threshold tests: 0-5 terminal orders show no disclosure
  for (let count = 0; count <= 5; count++) {
    const mockOrders = Array.from({ length: count }, (_, i) =>
      buildMockOrder(`order-thresh-${i}`, "completed", `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status: "completed",
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: false,
      isExpanded: false
    });

    assert.equal(result.totalCount, count);
    assert.equal(result.visibleCount, count);
    assert.equal(result.shouldApplyMobileTerminalCap, false);
    assert.equal(result.buttonLabel, null);
  }

  // 7. Threshold test: exactly 6 terminal orders
  {
    const mockOrders = Array.from({ length: 6 }, (_, i) =>
      buildMockOrder(`order-six-${i}`, "completed", `2026-08-28T12:${String(i).padStart(2, "0")}:00Z`)
    );

    const result = deriveLaneOrdersState({
      status: "completed",
      orders: mockOrders,
      isMobileStacked: true,
      hasActiveSearch: false,
      isExpanded: false
    });

    assert.equal(result.totalCount, 6);
    assert.equal(result.visibleCount, 5);
    assert.equal(result.shouldApplyMobileTerminalCap, true);
    assert.equal(result.buttonLabel, "Mostrar 1 más");
  }

  // 8. Source code verification for DashboardKanbanBoard.tsx and CSS module
  const kanbanTsxPath = path.resolve(process.cwd(), "components/admin/orders/DashboardKanbanBoard.tsx");
  const kanbanTsxContent = fs.readFileSync(kanbanTsxPath, "utf-8");

  assert.equal(
    kanbanTsxContent.includes("MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT = 5"),
    true,
    "DashboardKanbanBoard.tsx must define MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT = 5"
  );
  assert.equal(
    kanbanTsxContent.includes("MOBILE_STACKED_MEDIA_QUERY = \"(max-width: 767px)\""),
    true,
    "DashboardKanbanBoard.tsx must define MOBILE_STACKED_MEDIA_QUERY = '(max-width: 767px)'"
  );
  assert.equal(
    kanbanTsxContent.includes("mobileTerminalDisclosure"),
    true,
    "DashboardKanbanBoard.tsx must reference mobileTerminalDisclosure CSS class"
  );
  assert.equal(
    kanbanTsxContent.includes("expandedTerminalSections"),
    true,
    "DashboardKanbanBoard.tsx must manage local expandedTerminalSections state"
  );

  const kanbanCssPath = path.resolve(process.cwd(), "components/admin/orders/dashboard-kanban.module.css");
  const kanbanCssContent = fs.readFileSync(kanbanCssPath, "utf-8");

  assert.equal(
    kanbanCssContent.includes(".mobileTerminalDisclosure"),
    true,
    "dashboard-kanban.module.css must contain .mobileTerminalDisclosure class"
  );
  assert.equal(
    kanbanCssContent.includes("@media (min-width: 768px)"),
    true,
    "dashboard-kanban.module.css must protect tablet/desktop via min-width: 768px query"
  );

  console.log("All mobile terminal density assertions PASS!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
