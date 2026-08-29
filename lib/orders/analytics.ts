import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import { buildDashboardOrderItemTree } from "@/lib/product-customization/order-dashboard";

type AdminOrderStatus = AdminOrderDashboardItem["status"];
type AdminOrderDeliveryMethod = AdminOrderDashboardItem["delivery_method"];

export type AdminOrdersAnalytics = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageTicket: number;
  validOrdersCount: number;
  ordersByStatus: Record<AdminOrderStatus, number>;
  ordersByDeliveryMethod: Record<AdminOrderDeliveryMethod, number>;
  topProduct: {
    name: string;
    quantity: number;
  } | null;
};

export type BusinessWindowConfig = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type StoreSession = {
  id: string;
  storeId: string;
  openedAt: string | Date;
  closedAt?: string | Date | null;
  status: "open" | "closed";
};

export type OperationalWindowSource =
  | "store-session"
  | "last-closed-store-session"
  | "business-window";

export type OperationalWindow = {
  start: Date;
  end: Date;
  source: OperationalWindowSource;
  sessionId?: string;
  crossesMidnight?: boolean;
};

export type AnalyticsScopeKind = "active-session" | "last-closed-session" | "business-window";

export type DashboardActionPolicyMode = "active" | "review" | "passive";

export type DashboardActionPolicy = {
  mode: DashboardActionPolicyMode;
  isReviewingLastClosedSession: boolean;
  canMutateOrders: boolean;
  canChangeStatus: boolean;
  canAssignOrders: boolean;
  canUseQuickActions: boolean;
  canOpenOrderDetail: boolean;
  canUseNonMutatingUtilities: boolean;
  reason?: string;
};

export const DASHBOARD_REVIEW_MODE_BLOCKED_REASON =
  "Est\u00e1s revisando una sesi\u00f3n cerrada. Las acciones operativas est\u00e1n bloqueadas.";

export const DASHBOARD_REVIEW_MODE_MUTATION_HINT =
  "Est\u00e1s revisando una sesi\u00f3n cerrada. Abr\u00ed una nueva sesi\u00f3n para operar pedidos.";

export function resolveDashboardActionPolicy(
  source: OperationalWindowSource
): DashboardActionPolicy {
  if (source === "last-closed-store-session") {
    return {
      mode: "review",
      isReviewingLastClosedSession: true,
      canMutateOrders: false,
      canChangeStatus: false,
      canAssignOrders: false,
      canUseQuickActions: false,
      canOpenOrderDetail: true,
      canUseNonMutatingUtilities: true,
      reason: DASHBOARD_REVIEW_MODE_BLOCKED_REASON
    };
  }

  if (source === "store-session") {
    return {
      mode: "active",
      isReviewingLastClosedSession: false,
      canMutateOrders: true,
      canChangeStatus: true,
      canAssignOrders: true,
      canUseQuickActions: true,
      canOpenOrderDetail: true,
      canUseNonMutatingUtilities: true
    };
  }

  return {
    mode: "passive",
    isReviewingLastClosedSession: false,
    canMutateOrders: true,
    canChangeStatus: true,
    canAssignOrders: true,
    canUseQuickActions: true,
    canOpenOrderDetail: true,
    canUseNonMutatingUtilities: true
  };
}

export function resolveAnalyticsScopeKind(
  source: OperationalWindowSource
): AnalyticsScopeKind {
  switch (source) {
    case "store-session":
      return "active-session";
    case "last-closed-store-session":
      return "last-closed-session";
    default:
      return "business-window";
  }
}

export function getAnalyticsScopeCopy(scopeKind: AnalyticsScopeKind) {
  switch (scopeKind) {
    case "active-session":
      return {
        sessionLabel: "Sesión activa",
        scopeStatusLabel: null as string | null,
        salesPrefix: "Ventas de sesión",
        deliveryDominanceTitle: "Delivery domina la sesión",
        pickupDominanceTitle: "Retiro domina la sesión",
        averageTicketScopeLabel: "de la sesión",
        completedScopeLabel: "en esta sesión"
      };
    case "last-closed-session":
      return {
        sessionLabel: "Última sesión cerrada",
        scopeStatusLabel: "Modo revisión",
        salesPrefix: "Ventas de la sesión",
        deliveryDominanceTitle: "Delivery dominó la sesión",
        pickupDominanceTitle: "Retiro dominó la sesión",
        averageTicketScopeLabel: "de la sesión",
        completedScopeLabel: "en la sesión"
      };
    default:
      return {
        sessionLabel: "Jornada actual",
        scopeStatusLabel: null as string | null,
        salesPrefix: "Ventas de jornada",
        deliveryDominanceTitle: "Delivery domina hoy",
        pickupDominanceTitle: "Retiro domina hoy",
        averageTicketScopeLabel: "de la jornada",
        completedScopeLabel: "en la jornada"
      };
  }
}

export type DashboardTopSectionScopeIndicator = "live" | "review" | "neutral";

export function resolveDashboardTopSectionMetaStatus(input: {
  source: OperationalWindowSource;
  liveLabel: string;
}) {
  const scopeKind = resolveAnalyticsScopeKind(input.source);
  const scopeCopy = getAnalyticsScopeCopy(scopeKind);

  if (scopeKind === "active-session") {
    return {
      scopeIndicator: "live" as DashboardTopSectionScopeIndicator,
      statusLabel: input.liveLabel,
      showScopeDot: true,
      scopeAriaLabel: "Estado del panel en vivo"
    };
  }

  if (scopeKind === "last-closed-session") {
    return {
      scopeIndicator: "review" as DashboardTopSectionScopeIndicator,
      statusLabel: scopeCopy.scopeStatusLabel ?? "Modo revisión",
      showScopeDot: true,
      scopeAriaLabel: "Estado del panel en modo revisión"
    };
  }

  return {
    scopeIndicator: "neutral" as DashboardTopSectionScopeIndicator,
    statusLabel: null,
    showScopeDot: false,
    scopeAriaLabel: "Estado del panel"
  };
}

export function formatLastClosedSessionReviewLabel(start: Date, end: Date) {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };
  const startTime = start.toLocaleTimeString("es-AR", timeOptions);
  const endTime = end.toLocaleTimeString("es-AR", timeOptions);

  if (start.toDateString() === end.toDateString()) {
    return `Última sesión cerrada · ${startTime}–${endTime}`;
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit"
  };
  const startDate = start.toLocaleDateString("es-AR", dateOptions);

  return `Última sesión cerrada · ${startDate} ${startTime}–${endTime}`;
}

export const DEFAULT_BUSINESS_WINDOW_CONFIG: BusinessWindowConfig = {
  startHour: 0,
  startMinute: 0,
  endHour: 24,
  endMinute: 0
};

export function getCurrentBusinessWindow(
  now = new Date(),
  config: BusinessWindowConfig = DEFAULT_BUSINESS_WINDOW_CONFIG
) {
  const startMinutes = config.startHour * 60 + config.startMinute;
  const endMinutes = config.endHour * 60 + config.endMinute;
  const crossesMidnight = endMinutes <= startMinutes;

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const startOfDayWithMinutes = (baseDay: Date, minutes: number) => {
    const nextDate = new Date(baseDay);
    nextDate.setMinutes(nextDate.getMinutes() + minutes);
    return nextDate;
  };

  if (!crossesMidnight) {
    return {
      start: startOfDayWithMinutes(dayStart, startMinutes),
      end: startOfDayWithMinutes(dayStart, endMinutes),
      crossesMidnight
    };
  }

  const todayStart = startOfDayWithMinutes(dayStart, startMinutes);
  const todayEnd = startOfDayWithMinutes(dayStart, endMinutes);

  if (now >= todayStart) {
    return {
      start: todayStart,
      end: startOfDayWithMinutes(dayStart, 1440 + endMinutes),
      crossesMidnight
    };
  }

  if (now < todayEnd) {
    return {
      start: startOfDayWithMinutes(dayStart, startMinutes - 1440),
      end: todayEnd,
      crossesMidnight
    };
  }

  return {
    start: todayStart,
    end: startOfDayWithMinutes(dayStart, 1440 + endMinutes),
    crossesMidnight
  };
}

export function getOperationalWindow(
  now = new Date(),
  config: BusinessWindowConfig = DEFAULT_BUSINESS_WINDOW_CONFIG,
  activeStoreSession: StoreSession | null = null,
  lastClosedStoreSession: StoreSession | null = null
): OperationalWindow {
  if (
    activeStoreSession &&
    activeStoreSession.status === "open" &&
    activeStoreSession.closedAt == null
  ) {
    const openedAt = new Date(activeStoreSession.openedAt);

    if (!Number.isNaN(openedAt.getTime())) {
      return {
        start: openedAt,
        end: now,
        source: "store-session",
        sessionId: activeStoreSession.id
      };
    }
  }

  if (
    lastClosedStoreSession &&
    lastClosedStoreSession.status === "closed" &&
    lastClosedStoreSession.closedAt != null
  ) {
    const openedAt = new Date(lastClosedStoreSession.openedAt);
    const closedAt = new Date(lastClosedStoreSession.closedAt);

    if (
      !Number.isNaN(openedAt.getTime()) &&
      !Number.isNaN(closedAt.getTime()) &&
      closedAt.getTime() >= openedAt.getTime()
    ) {
      return {
        start: openedAt,
        end: closedAt,
        source: "last-closed-store-session",
        sessionId: lastClosedStoreSession.id
      };
    }
  }

  const businessWindow = getCurrentBusinessWindow(now, config);

  return {
    start: businessWindow.start,
    end: businessWindow.end,
    source: "business-window",
    crossesMidnight: businessWindow.crossesMidnight
  };
}

export function isOrderInBusinessWindow(
  order: Pick<AdminOrderDashboardItem, "created_at">,
  now = new Date(),
  config: BusinessWindowConfig = DEFAULT_BUSINESS_WINDOW_CONFIG
) {
  const createdAt = new Date(order.created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const { start, end } = getCurrentBusinessWindow(now, config);

  return createdAt >= start && createdAt < end;
}

export function getOrdersInBusinessWindow(
  orders: AdminOrderDashboardItem[],
  now = new Date(),
  config: BusinessWindowConfig = DEFAULT_BUSINESS_WINDOW_CONFIG
) {
  return orders.filter((order) => isOrderInBusinessWindow(order, now, config));
}

export function getOrdersInOperationalWindow(
  orders: AdminOrderDashboardItem[],
  operationalWindow: Pick<OperationalWindow, "start" | "end">
) {
  return orders.filter((order) => {
    const createdAt = new Date(order.created_at);

    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    return createdAt >= operationalWindow.start && createdAt < operationalWindow.end;
  });
}

export function getLatestOrderCreatedAt(orders: AdminOrderDashboardItem[]) {
  let latestCreatedAt: Date | null = null;

  for (const order of orders) {
    const createdAt = new Date(order.created_at);

    if (Number.isNaN(createdAt.getTime())) {
      continue;
    }

    if (!latestCreatedAt || createdAt > latestCreatedAt) {
      latestCreatedAt = createdAt;
    }
  }

  return latestCreatedAt;
}

export function isOrderFromToday(
  order: Pick<AdminOrderDashboardItem, "created_at">,
  now = new Date()
) {
  return isOrderInBusinessWindow(order, now, DEFAULT_BUSINESS_WINDOW_CONFIG);
}

export function getTodayOrders(orders: AdminOrderDashboardItem[], now = new Date()) {
  return getOrdersInBusinessWindow(orders, now, DEFAULT_BUSINESS_WINDOW_CONFIG);
}

export function getOrdersByStatus(orders: AdminOrderDashboardItem[]) {
  return orders.reduce<Record<AdminOrderStatus, number>>(
    (counts, order) => {
      counts[order.status] += 1;
      return counts;
    },
    {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    }
  );
}

export function getOrdersByDeliveryMethod(orders: AdminOrderDashboardItem[]) {
  return orders.reduce<Record<AdminOrderDeliveryMethod, number>>(
    (counts, order) => {
      counts[order.delivery_method] += 1;
      return counts;
    },
    {
      delivery: 0,
      pickup: 0
    }
  );
}

export function getCompletedOrdersCount(orders: AdminOrderDashboardItem[]) {
  return orders.filter((order) => order.status === "completed").length;
}

export function getActiveOrdersCount(orders: AdminOrderDashboardItem[]) {
  return orders.filter(
    (order) =>
      order.status === "pending" ||
      order.status === "preparing" ||
      order.status === "ready"
  ).length;
}

export function getTotalRevenue(orders: AdminOrderDashboardItem[]) {
  return orders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + order.total_price, 0);
}

export function getAverageTicket(orders: AdminOrderDashboardItem[]) {
  const validOrders = orders.filter((order) => order.status !== "cancelled");

  if (validOrders.length === 0) {
    return 0;
  }

  return getTotalRevenue(validOrders) / validOrders.length;
}

export function getTopProducts(orders: AdminOrderDashboardItem[]) {
  const products = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "cancelled") {
      continue;
    }

    const rootItems = buildDashboardOrderItemTree(order.order_items_preview ?? []).map(
      (node) => node.item
    );

    for (const item of rootItems) {
      const productName = item.product_name.trim();

      if (!productName) {
        continue;
      }

      products.set(productName, (products.get(productName) ?? 0) + item.quantity);
    }
  }

  return [...products.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((left, right) => right.quantity - left.quantity || left.name.localeCompare(right.name));
}

export function buildAdminOrdersAnalytics(orders: AdminOrderDashboardItem[]): AdminOrdersAnalytics {
  const ordersByStatus = getOrdersByStatus(orders);
  const ordersByDeliveryMethod = getOrdersByDeliveryMethod(orders);
  const revenue = getTotalRevenue(orders);
  const validOrdersCount = orders.filter((order) => order.status !== "cancelled").length;
  const topProduct = getTopProducts(orders)[0] ?? null;

  return {
    totalOrders: orders.length,
    activeOrders: getActiveOrdersCount(orders),
    completedOrders: getCompletedOrdersCount(orders),
    cancelledOrders: ordersByStatus.cancelled,
    revenue,
    averageTicket: validOrdersCount > 0 ? revenue / validOrdersCount : 0,
    validOrdersCount,
    ordersByStatus,
    ordersByDeliveryMethod,
    topProduct
  };
}

export function formatOperationalInsightValue(key: string, analytics: AdminOrdersAnalytics) {
  switch (key) {
    case "revenue":
      return formatAdminOrderCurrency(analytics.revenue);
    case "averageTicket":
      return formatAdminOrderCurrency(analytics.averageTicket);
    case "activeOrders":
      return `${analytics.activeOrders} pedidos`;
    case "completedOrders":
      return `${analytics.completedOrders} pedidos`;
    case "deliveryMix":
      return `${analytics.ordersByDeliveryMethod.delivery} / ${analytics.ordersByDeliveryMethod.pickup}`;
    case "topProduct":
      return analytics.topProduct
        ? `${analytics.topProduct.name} · ${analytics.topProduct.quantity}`
        : "Sin datos";
    default:
      return "Sin datos";
  }
}
