import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { OPERATIONAL_THRESHOLDS } from "@/lib/orders/constants";
import {
  classifyStatusTransition,
  type AdminOrderTimelineEvent
} from "@/lib/orders/events.shared";
import type { OrderStatus } from "@/types/database";

type ActiveOrderStatus = "pending" | "preparing" | "ready";

export type AdminOperationalMetrics = {
  averageCompletionMinutes: number | null;
  averagePreparationMinutes: number | null;
  stalledCount: number;
  cancelledCount: number;
  reassignmentCount: number;
  longestInactiveMinutes: number | null;
};

export type OperationalInsight = {
  id: string;
  tone: "stable" | "attention" | "warning" | "neutral";
  title: string;
  detail?: string;
  priority: number;
};

const ACTIVE_STATUSES = new Set<ActiveOrderStatus>(["pending", "preparing", "ready"]);
const {
  STALLED_INACTIVE_MINUTES,
  PREPARATION_SLOW_MINUTES,
  DELIVERY_DOMINANCE_RATIO,
  QUIET_ACTIVE_ORDERS_MAX
} = OPERATIONAL_THRESHOLDS;

export function buildOperationalMetrics(
  orders: readonly AdminOrderDashboardItem[],
  now = new Date()
): AdminOperationalMetrics {
  const completionDurations: number[] = [];
  const preparationDurations: number[] = [];
  let stalledCount = 0;
  let cancelledCount = 0;
  let reassignmentCount = 0;
  let longestInactiveMinutes: number | null = null;

  for (const order of orders) {
    const completionMinutes = getOrderCompletionMinutes(order);
    const preparationMinutes = getOrderPreparationMinutes(order);
    const inactiveMinutes = getOrderInactiveMinutes(order, now);

    if (typeof completionMinutes === "number") {
      completionDurations.push(completionMinutes);
    }

    if (typeof preparationMinutes === "number") {
      preparationDurations.push(preparationMinutes);
    }

    if (order.status === "cancelled") {
      cancelledCount += 1;
    }

    reassignmentCount += countOrderReassignments(order);

    if (
      ACTIVE_STATUSES.has(order.status as ActiveOrderStatus) &&
      typeof inactiveMinutes === "number"
    ) {
      longestInactiveMinutes = Math.max(longestInactiveMinutes ?? 0, inactiveMinutes);

      if (inactiveMinutes >= STALLED_INACTIVE_MINUTES) {
        stalledCount += 1;
      }
    }
  }

  return {
    averageCompletionMinutes: averageDuration(completionDurations),
    averagePreparationMinutes: averageDuration(preparationDurations),
    stalledCount,
    cancelledCount,
    reassignmentCount,
    longestInactiveMinutes
  };
}

export function getOrderLastActivityTimestamp(order: Pick<
  AdminOrderDashboardItem,
  "created_at" | "assigned_at" | "order_events"
>) {
  const timestamps = [order.created_at, order.assigned_at, ...(order.order_events ?? []).map((event) => event.created_at)]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export function buildLastActivityLabel(
  order: Pick<AdminOrderDashboardItem, "created_at" | "assigned_at" | "order_events">,
  now = new Date()
) {
  const lastActivityAt = getOrderLastActivityTimestamp(order);

  if (!lastActivityAt) {
    return null;
  }

  return formatElapsedLabel(lastActivityAt, now);
}

export function formatOperationalMetricMinutes(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Sin datos";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function formatStalledMetricValue(metrics: AdminOperationalMetrics) {
  if (metrics.stalledCount === 0) {
    return "Sin demoras";
  }

  return `${metrics.stalledCount} estancados`;
}

export function formatCancelledMetricValue(metrics: AdminOperationalMetrics) {
  return `${metrics.cancelledCount}`;
}

export function formatReassignmentMetricValue(metrics: AdminOperationalMetrics) {
  if (metrics.reassignmentCount === 0) {
    return "Sin cambios";
  }

  return `${metrics.reassignmentCount} reasignaciones`;
}

export function formatLongestInactiveMetricValue(metrics: AdminOperationalMetrics) {
  if (typeof metrics.longestInactiveMinutes !== "number") {
    return "Sin activos";
  }

  return formatOperationalMetricMinutes(metrics.longestInactiveMinutes);
}

export function buildOperationalDashboardInsights(
  orders: readonly AdminOrderDashboardItem[],
  metrics: AdminOperationalMetrics
) {
  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUSES.has(order.status as ActiveOrderStatus)
  );
  const revertedOrdersCount = countOrdersWithRevertedStatus(orders);
  const deliveryCount = orders.filter((order) => order.delivery_method === "delivery").length;
  const pickupCount = orders.filter((order) => order.delivery_method === "pickup").length;
  const insights: OperationalInsight[] = [];

  if (metrics.stalledCount > 0) {
    insights.push({
      id: "stalled-orders",
      tone: "warning",
      title: "Revisar pedidos demorados",
      detail: `${metrics.stalledCount} ${metrics.stalledCount === 1 ? "pedido sin movimiento" : "pedidos sin movimiento"}`,
      priority: 100
    });
  }

  if (revertedOrdersCount > 0) {
    insights.push({
      id: "reverted-orders",
      tone: "attention",
      title: "Cambios regresivos",
      detail: `${revertedOrdersCount} ${revertedOrdersCount === 1 ? "pedido volvio a un estado anterior" : "pedidos volvieron a un estado anterior"}`,
      priority: 90
    });
  }

  if (
    typeof metrics.averagePreparationMinutes === "number" &&
    metrics.averagePreparationMinutes > PREPARATION_SLOW_MINUTES
  ) {
    insights.push({
      id: "slow-preparation",
      tone: "attention",
      title: "Preparacion lenta",
      detail: `Promedio sobre ${PREPARATION_SLOW_MINUTES} min`,
      priority: 80
    });
  }

  if (metrics.reassignmentCount > 0) {
    insights.push({
      id: "reassignments",
      tone: "neutral",
      title: "Reasignaciones activas",
      detail: `${metrics.reassignmentCount} ${metrics.reassignmentCount === 1 ? "cambio de responsable hoy" : "cambios de responsable hoy"}`,
      priority: 70
    });
  }

  const totalDeliveryMix = deliveryCount + pickupCount;

  if (totalDeliveryMix > 0) {
    const deliveryRatio = deliveryCount / totalDeliveryMix;
    const pickupRatio = pickupCount / totalDeliveryMix;

    if (deliveryRatio >= DELIVERY_DOMINANCE_RATIO) {
      insights.push({
        id: "delivery-dominance",
        tone: "neutral",
        title: "Delivery domina hoy",
        detail: `${deliveryCount} de ${totalDeliveryMix} pedidos`,
        priority: 60
      });
    } else if (pickupRatio >= DELIVERY_DOMINANCE_RATIO) {
      insights.push({
        id: "pickup-dominance",
        tone: "neutral",
        title: "Retiro domina hoy",
        detail: `${pickupCount} de ${totalDeliveryMix} pedidos`,
        priority: 60
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: activeOrders.length <= QUIET_ACTIVE_ORDERS_MAX ? "calm-ops" : "stable-ops",
      tone: "stable",
      title:
        activeOrders.length <= QUIET_ACTIVE_ORDERS_MAX
          ? "Operacion tranquila"
          : "Operacion estable",
      detail:
        activeOrders.length <= QUIET_ACTIVE_ORDERS_MAX
          ? "Sin pedidos activos demorados"
          : "Sin senales criticas ahora",
      priority: 10
    });
  }

  return insights.sort((left, right) => right.priority - left.priority).slice(0, 3);
}

function getOrderCompletionMinutes(order: AdminOrderDashboardItem) {
  const completedEvent = (order.order_events ?? []).find(
    (event) => event.event_type === "status_changed" && readStatusPayload(event, "to_status") === "completed"
  );

  if (!completedEvent) {
    return null;
  }

  return getElapsedMinutes(order.created_at, completedEvent.created_at);
}

function getOrderPreparationMinutes(order: AdminOrderDashboardItem) {
  const readyEvent = (order.order_events ?? []).find(
    (event) => event.event_type === "status_changed" && readStatusPayload(event, "to_status") === "ready"
  );

  if (!readyEvent) {
    return null;
  }

  const preparingEvent = (order.order_events ?? []).find(
    (event) => event.event_type === "status_changed" && readStatusPayload(event, "to_status") === "preparing"
  );

  const startAt = preparingEvent?.created_at ?? order.created_at;
  return getElapsedMinutes(startAt, readyEvent.created_at);
}

function getOrderInactiveMinutes(
  order: Pick<AdminOrderDashboardItem, "created_at" | "assigned_at" | "order_events">,
  now: Date
) {
  const lastActivityAt = getOrderLastActivityTimestamp(order);

  if (!lastActivityAt) {
    return null;
  }

  return getElapsedMinutes(lastActivityAt, now.toISOString());
}

function countOrderReassignments(order: Pick<AdminOrderDashboardItem, "order_events">) {
  return (order.order_events ?? []).filter(
    (event) =>
      event.event_type === "assignment_taken" &&
      Boolean(readStringPayload(event, "previous_assigned_to"))
  ).length;
}

function countOrdersWithRevertedStatus(
  orders: readonly Pick<AdminOrderDashboardItem, "order_events">[]
) {
  return orders.filter((order) =>
    (order.order_events ?? []).some((event) => isRevertedStatusEvent(event))
  ).length;
}

function averageDuration(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getElapsedMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.max(0, Math.round((end - start) / 60000));
}

function formatElapsedLabel(timestamp: string, now: Date) {
  const diffMinutes = getElapsedMinutes(timestamp, now.toISOString());

  if (typeof diffMinutes !== "number") {
    return null;
  }

  if (diffMinutes < 1) {
    return "Hace instantes";
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `Hace ${hours} h ${minutes} min` : `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function readStatusPayload(
  event: AdminOrderTimelineEvent,
  key: "from_status" | "to_status"
) {
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    return null;
  }

  const value = event.payload[key];
  return typeof value === "string" ? (value as OrderStatus) : null;
}

function readStringPayload(event: AdminOrderTimelineEvent, key: string) {
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    return null;
  }

  const value = event.payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function isRevertedStatusEvent(event: AdminOrderTimelineEvent) {
  if (event.event_type !== "status_changed") {
    return false;
  }

  const fromStatus = readStatusPayload(event, "from_status");
  const toStatus = readStatusPayload(event, "to_status");

  return classifyStatusTransition(fromStatus, toStatus) === "backward";
}
