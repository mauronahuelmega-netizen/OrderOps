import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  getOrdersInOperationalWindow,
  type OperationalWindow
} from "@/lib/orders/analytics";
import {
  DASHBOARD_EXECUTION_FILTER_LABELS,
  type OrdersFilter
} from "@/lib/orders/dashboard-execution-view-model";
import {
  matchesOperationalSearch,
  parseOperationalSearch,
  type OperationalSearchQuery
} from "@/lib/orders/natural-search";

export type DashboardBoardRenderMode =
  | "operational-empty"
  | "day-scope-empty"
  | "filtered-empty"
  | "kanban"
  | "filtered-list";

export type DashboardBoardLaneKind = "core" | "secondary";

const PERSISTENT_BOARD_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed"
] as const satisfies ReadonlyArray<AdminOrderDashboardItem["status"]>;

const CONDITIONAL_BOARD_STATUSES = ["cancelled"] as const satisfies ReadonlyArray<
  AdminOrderDashboardItem["status"]
>;

export type DashboardBoardGroupedOrder = {
  status: AdminOrderDashboardItem["status"];
  label: string;
  orders: AdminOrderDashboardItem[];
  laneKind: DashboardBoardLaneKind;
  isCoreLane: boolean;
  isSecondaryLane: boolean;
  isPersistentLane: boolean;
  isEmpty: boolean;
};

export type DashboardBoardGroupedOrders = DashboardBoardGroupedOrder[];

export type DashboardBoardViewModelInput = {
  orders: AdminOrderDashboardItem[];
  activeFilter: OrdersFilter;
  searchQuery: string;
  operationalWindow: OperationalWindow;
  now: Date;
  currentUserId: string;
};

export type DashboardBoardViewModel = {
  operationalWindow: OperationalWindow;
  visibleOperationalOrders: AdminOrderDashboardItem[];
  baseFilteredOrders: AdminOrderDashboardItem[];
  filteredOrders: AdminOrderDashboardItem[];
  parsedSearchQuery: OperationalSearchQuery;
  groupedOrders: DashboardBoardGroupedOrders;
  renderMode: DashboardBoardRenderMode;
  isOperationalEmpty: boolean;
  isDayScopeEmpty: boolean;
  isFilteredEmpty: boolean;
  hasAnyOrders: boolean;
  hasOrdersInScope: boolean;
  hasVisibleOrders: boolean;
  activeFilterLabel: string;
  hasSearchQuery: boolean;
  hasActiveFilter: boolean;
  shouldRenderKanban: boolean;
  shouldRenderFilteredList: boolean;
  shouldRenderPersistentEmptyKanban: boolean;
};

const BOARD_GROUP_LABELS: Record<AdminOrderDashboardItem["status"], string> = {
  pending: "Pendientes",
  preparing: "Preparando",
  ready: "Listos",
  completed: "Completados",
  cancelled: "Cancelados"
};

function filterOrdersByActiveFilter(
  orders: AdminOrderDashboardItem[],
  activeFilter: OrdersFilter
): AdminOrderDashboardItem[] {
  if (activeFilter === "all") {
    return orders;
  }

  if (activeFilter === "delivery" || activeFilter === "pickup") {
    return orders.filter((order) => order.delivery_method === activeFilter);
  }

  return orders.filter((order) => order.status === activeFilter);
}

function applyOperationalSearch(
  orders: AdminOrderDashboardItem[],
  parsedSearchQuery: OperationalSearchQuery
): AdminOrderDashboardItem[] {
  if (!parsedSearchQuery.normalized && !parsedSearchQuery.normalizedDigits) {
    return orders;
  }

  return orders.filter((order) =>
    matchesOperationalSearch({
      order,
      query: parsedSearchQuery
    })
  );
}

function getBoardLaneKind(status: AdminOrderDashboardItem["status"]): DashboardBoardLaneKind {
  if (status === "completed" || status === "cancelled") {
    return "secondary";
  }

  return "core";
}

function buildBoardGroupedOrder(
  status: AdminOrderDashboardItem["status"],
  filteredOrders: AdminOrderDashboardItem[],
  isPersistentLane: boolean
): DashboardBoardGroupedOrder {
  const orders = filteredOrders.filter((order) => order.status === status);
  const laneKind = getBoardLaneKind(status);

  return {
    status,
    label: BOARD_GROUP_LABELS[status],
    orders,
    laneKind,
    isCoreLane: laneKind === "core",
    isSecondaryLane: laneKind === "secondary",
    isPersistentLane,
    isEmpty: orders.length === 0
  };
}

function buildGroupedBoardOrders(
  activeFilter: OrdersFilter,
  filteredOrders: AdminOrderDashboardItem[]
): DashboardBoardGroupedOrders {
  if (activeFilter !== "all") {
    return [];
  }

  const persistentGroups = PERSISTENT_BOARD_STATUSES.map((status) =>
    buildBoardGroupedOrder(status, filteredOrders, true)
  );

  const conditionalGroups = CONDITIONAL_BOARD_STATUSES.map((status) =>
    buildBoardGroupedOrder(status, filteredOrders, false)
  ).filter((group) => group.orders.length > 0);

  return [...persistentGroups, ...conditionalGroups];
}

function buildPersistentEmptyGroupedOrders(): DashboardBoardGroupedOrders {
  return PERSISTENT_BOARD_STATUSES.map((status) => buildBoardGroupedOrder(status, [], true));
}

function resolveShouldRenderPersistentEmptyKanban(
  activeFilter: OrdersFilter,
  hasSearchQuery: boolean,
  isOperationalEmpty: boolean,
  isDayScopeEmpty: boolean
): boolean {
  return (
    activeFilter === "all" &&
    !hasSearchQuery &&
    (isOperationalEmpty || isDayScopeEmpty)
  );
}

function resolveBoardRenderMode(
  activeFilter: OrdersFilter,
  isOperationalEmpty: boolean,
  isDayScopeEmpty: boolean,
  isFilteredEmpty: boolean
): DashboardBoardRenderMode {
  if (isOperationalEmpty) {
    return "operational-empty";
  }

  if (isDayScopeEmpty) {
    return "day-scope-empty";
  }

  if (activeFilter === "all") {
    return "kanban";
  }

  if (isFilteredEmpty) {
    return "filtered-empty";
  }

  return "filtered-list";
}

export function buildDashboardBoardViewModel(
  input: DashboardBoardViewModelInput
): DashboardBoardViewModel {
  const { orders, activeFilter, searchQuery, operationalWindow } = input;

  const visibleOperationalOrders = getOrdersInOperationalWindow(orders, operationalWindow);
  const baseFilteredOrders = filterOrdersByActiveFilter(visibleOperationalOrders, activeFilter);
  const parsedSearchQuery = parseOperationalSearch(searchQuery);
  const filteredOrders = applyOperationalSearch(baseFilteredOrders, parsedSearchQuery);

  const hasAnyOrders = orders.length > 0;
  const hasOrdersInScope = visibleOperationalOrders.length > 0;
  const hasVisibleOrders = filteredOrders.length > 0;
  const isOperationalEmpty = !hasAnyOrders;
  const isDayScopeEmpty = hasAnyOrders && !hasOrdersInScope;
  const isFilteredEmpty = hasOrdersInScope && !hasVisibleOrders;

  const groupedOrders = buildGroupedBoardOrders(activeFilter, filteredOrders);
  const renderMode = resolveBoardRenderMode(
    activeFilter,
    isOperationalEmpty,
    isDayScopeEmpty,
    isFilteredEmpty
  );

  const activeFilterLabel = DASHBOARD_EXECUTION_FILTER_LABELS[activeFilter];
  const hasSearchQuery =
    parsedSearchQuery.normalized.length > 0 || parsedSearchQuery.normalizedDigits.length > 0;
  const hasActiveFilter = activeFilter !== "all";
  const shouldRenderPersistentEmptyKanban = resolveShouldRenderPersistentEmptyKanban(
    activeFilter,
    hasSearchQuery,
    isOperationalEmpty,
    isDayScopeEmpty
  );
  const groupedOrdersForBoard = shouldRenderPersistentEmptyKanban
    ? groupedOrders.length > 0
      ? groupedOrders
      : buildPersistentEmptyGroupedOrders()
    : groupedOrders;

  return {
    operationalWindow,
    visibleOperationalOrders,
    baseFilteredOrders,
    filteredOrders,
    parsedSearchQuery,
    groupedOrders: groupedOrdersForBoard,
    renderMode,
    isOperationalEmpty,
    isDayScopeEmpty,
    isFilteredEmpty,
    hasAnyOrders,
    hasOrdersInScope,
    hasVisibleOrders,
    activeFilterLabel,
    hasSearchQuery,
    hasActiveFilter,
    shouldRenderKanban: renderMode === "kanban" || shouldRenderPersistentEmptyKanban,
    shouldRenderFilteredList: renderMode === "filtered-list",
    shouldRenderPersistentEmptyKanban
  };
}
