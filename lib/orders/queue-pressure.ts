import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { getOperationalAging } from "@/lib/orders/presenter";

type QueuePressureLevel = "calm" | "active" | "busy" | "critical";

export type AdminOrdersQueuePressure = {
  activeCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  agingCount: number;
  staleCount: number;
  oldestActiveMinutes: number;
  pressureLevel: QueuePressureLevel;
  label: string;
  sublabel: string;
};

const ACTIVE_STATUSES = new Set<AdminOrderDashboardItem["status"]>([
  "pending",
  "preparing",
  "ready"
]);

export function getActiveOrdersInScope(orders: readonly AdminOrderDashboardItem[]) {
  return orders.filter((order) => ACTIVE_STATUSES.has(order.status));
}

export function buildOrdersQueuePressure(
  orders: readonly AdminOrderDashboardItem[],
  now = new Date()
): AdminOrdersQueuePressure {
  const activeOrders = getActiveOrdersInScope(orders);

  let pendingCount = 0;
  let preparingCount = 0;
  let readyCount = 0;
  let agingCount = 0;
  let staleCount = 0;
  let oldestActiveMinutes = 0;

  for (const order of activeOrders) {
    if (order.status === "pending") {
      pendingCount += 1;
    } else if (order.status === "preparing") {
      preparingCount += 1;
    } else if (order.status === "ready") {
      readyCount += 1;
    }

    const createdAt = new Date(order.created_at);

    if (!Number.isNaN(createdAt.getTime())) {
      const ageInMinutes = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000));
      oldestActiveMinutes = Math.max(oldestActiveMinutes, ageInMinutes);
    }

    const agingState = getOperationalAging(order.status, order.created_at, now);

    if (agingState === "aging") {
      agingCount += 1;
    } else if (agingState === "stale") {
      staleCount += 1;
    }
  }

  const activeCount = activeOrders.length;
  const pressureLevel = resolvePressureLevel({
    activeCount,
    staleCount,
    oldestActiveMinutes,
    agingCount
  });

  return {
    activeCount,
    pendingCount,
    preparingCount,
    readyCount,
    agingCount,
    staleCount,
    oldestActiveMinutes,
    pressureLevel,
    label: buildPressureLabel(pressureLevel),
    sublabel: buildPressureSublabel({
      activeCount,
      staleCount,
      oldestActiveMinutes
    })
  };
}

function resolvePressureLevel(input: {
  activeCount: number;
  staleCount: number;
  oldestActiveMinutes: number;
  agingCount: number;
}): QueuePressureLevel {
  if (
    input.activeCount >= 12 ||
    input.staleCount >= 3 ||
    input.oldestActiveMinutes >= 90
  ) {
    return "critical";
  }

  if (
    input.activeCount >= 8 ||
    input.staleCount >= 1 ||
    input.oldestActiveMinutes >= 60 ||
    input.agingCount >= 3
  ) {
    return "busy";
  }

  if (input.activeCount >= 4 || input.agingCount >= 1) {
    return "active";
  }

  return "calm";
}

function buildPressureLabel(level: QueuePressureLevel) {
  switch (level) {
    case "active":
      return "Operación estable";
    case "busy":
      return "Alta carga";
    case "critical":
      return "Requiere atención";
    default:
      return "Sin demoras";
  }
}

function buildPressureSublabel(input: {
  activeCount: number;
  staleCount: number;
  oldestActiveMinutes: number;
}) {
  if (input.activeCount === 0) {
    return "Sin pedidos activos";
  }

  if (input.staleCount > 0) {
    return `${input.staleCount} ${input.staleCount === 1 ? "pedido demorado" : "pedidos demorados"}`;
  }

  if (input.activeCount <= 3) {
    return `${input.activeCount} ${input.activeCount === 1 ? "pedido activo" : "pedidos activos"}`;
  }

  if (input.oldestActiveMinutes > 0) {
    return `Más antiguo: ${input.oldestActiveMinutes} min`;
  }

  return `${input.activeCount} ${input.activeCount === 1 ? "pedido activo" : "pedidos activos"}`;
}
