import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import type { AdminOrdersQueuePressure } from "@/lib/orders/queue-pressure";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import type { OrderRiskAssessment } from "@/lib/orders/risk-detection";
import type { OrderStatus } from "@/types/database";

export type OperationalLaneKey =
  | AdminOrderDashboardItem["status"]
  | AdminOrderDashboardItem["delivery_method"]
  | "risk"
  | "unassigned"
  | "mine";

export type OperationalLaneMetricTone = "neutral" | "positive" | "attention" | "warning";

export type OperationalLaneMetricItem = {
  id: string;
  label: string;
  value: string;
  emphasize?: boolean;
};

export type OperationalLaneMetrics = {
  id: string;
  laneKey: OperationalLaneKey;
  title: string;
  subtitle: string;
  tone: OperationalLaneMetricTone;
  alert?: string;
  items: OperationalLaneMetricItem[];
};

type BuildOperationalLaneMetricsInput = {
  laneKey: OperationalLaneKey;
  orders: readonly AdminOrderDashboardItem[];
  allOrders: readonly AdminOrderDashboardItem[];
  riskAssessments: ReadonlyMap<string, OrderRiskAssessment>;
  operationalMetrics: AdminOperationalMetrics;
  queuePressure: AdminOrdersQueuePressure;
  now?: Date;
  currentUserId: string;
};

const ACTIVE_STATUSES = new Set<OrderStatus>(["pending", "preparing", "ready"]);

export function buildOperationalLaneMetrics(
  input: BuildOperationalLaneMetricsInput
): OperationalLaneMetrics | null {
  if (input.orders.length === 0) {
    return null;
  }

  const now = input.now ?? new Date();
  const laneOrders = [...input.orders];
  const laneTitle = buildLaneTitle(input.laneKey);
  const countLabel = `${laneOrders.length} ${laneOrders.length === 1 ? "pedido" : "pedidos"}`;
  const riskCount = laneOrders.filter(
    (order) => input.riskAssessments.get(order.id)?.level !== "stable"
  ).length;
  const unassignedCount = laneOrders.filter((order) => !order.assigned_to).length;
  const assignedToCurrentUserCount = laneOrders.filter(
    (order) => order.assigned_to === input.currentUserId
  ).length;
  const avgStateMinutes = averageNumber(
    laneOrders
      .map((order) => getMinutesInCurrentStatus(order, now))
      .filter((value): value is number => typeof value === "number")
  );
  const oldestMinutes = maxNumber(
    laneOrders
      .map((order) => getMinutesInCurrentStatus(order, now))
      .filter((value): value is number => typeof value === "number")
  );

  switch (input.laneKey) {
    case "pending":
      return {
        id: "lane-metrics:pending",
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Ingreso y backlog operativo",
        tone: riskCount > 0 || unassignedCount > 0 ? "attention" : "neutral",
        alert: buildPendingAlert({ riskCount, unassignedCount, oldestMinutes }),
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem("unassigned", "Sin responsable", formatCount(unassignedCount)),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount)),
          buildMetricItem("oldest", "Mas antiguo", formatMinutes(oldestMinutes))
        ]
      };
    case "preparing":
      return {
        id: "lane-metrics:preparing",
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Carga activa en preparacion",
        tone:
          riskCount > 0 || input.queuePressure.pressureLevel === "busy" || input.queuePressure.pressureLevel === "critical"
            ? "warning"
            : "attention",
        alert: buildPreparingAlert({
          riskCount,
          avgStateMinutes,
          queuePressure: input.queuePressure
        }),
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount)),
          buildMetricItem("assigned", "Asignados", `${laneOrders.length - unassignedCount}/${laneOrders.length}`),
          buildMetricItem("average", "Promedio", formatMinutes(avgStateMinutes))
        ]
      };
    case "ready":
      return {
        id: "lane-metrics:ready",
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Salida y cierre parcial",
        tone:
          riskCount > 0 ||
          (typeof oldestMinutes === "number" && oldestMinutes >= 20)
            ? "attention"
            : "neutral",
        alert:
          riskCount > 0
            ? `${riskCount} ${riskCount === 1 ? "pedido listo requiere revision" : "pedidos listos requieren revision"}`
            : typeof oldestMinutes === "number" && oldestMinutes >= 20
              ? "Hay pedidos listos acumulados."
              : undefined,
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount)),
          buildMetricItem("unassigned", "Sin responsable", formatCount(unassignedCount)),
          buildMetricItem("oldest", "Mas antiguo", formatMinutes(oldestMinutes))
        ]
      };
    case "completed":
      return {
        id: "lane-metrics:completed",
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Throughput y cierre del dia",
        tone: "positive",
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem(
            "share",
            "Peso",
            formatPercent(laneOrders.length, input.allOrders.length)
          ),
          buildMetricItem(
            "average-completion",
            "Tiempo prom.",
            formatMinutes(input.operationalMetrics.averageCompletionMinutes)
          ),
          buildMetricItem(
            "mine",
            "A mi cargo",
            formatCount(assignedToCurrentUserCount)
          )
        ]
      };
    case "cancelled":
      return {
        id: "lane-metrics:cancelled",
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Excepcion y revision",
        tone:
          laneOrders.length >= 2 &&
          laneOrders.length / Math.max(input.allOrders.length, 1) >= 0.2
            ? "warning"
            : "neutral",
        alert:
          laneOrders.length >= 2 &&
          laneOrders.length / Math.max(input.allOrders.length, 1) >= 0.2
            ? "El volumen de cancelados ya es relevante."
            : undefined,
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem(
            "share",
            "Peso",
            formatPercent(laneOrders.length, input.allOrders.length)
          ),
          buildMetricItem("risk", "Con riesgo previo", formatCount(riskCount)),
          buildMetricItem(
            "pressure",
            "Cola",
            input.queuePressure.label
          )
        ]
      };
    case "delivery":
    case "pickup": {
      const activeLaneOrders = laneOrders.filter((order) => ACTIVE_STATUSES.has(order.status));
      const readyLaneOrders = laneOrders.filter((order) => order.status === "ready");

      return {
        id: `lane-metrics:${input.laneKey}`,
        laneKey: input.laneKey,
        title: laneTitle,
        subtitle: "Lectura por metodo operativo",
        tone:
          activeLaneOrders.length > 0 && riskCount > 0 ? "attention" : "neutral",
        alert:
          activeLaneOrders.length > 0 && riskCount > 0
            ? `${riskCount} ${riskCount === 1 ? "pedido con riesgo" : "pedidos con riesgo"} en ${laneTitle.toLowerCase()}.`
            : undefined,
        items: [
          buildMetricItem("count", "Pedidos", countLabel, true),
          buildMetricItem("active", "Activos", formatCount(activeLaneOrders.length)),
          buildMetricItem("ready", "Listos", formatCount(readyLaneOrders.length)),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount))
        ]
      };
    }
    case "risk": {
      const riskOrders = laneOrders.filter(
        (order) => input.riskAssessments.get(order.id)?.level !== "stable"
      );

      return {
        id: "lane-metrics:risk",
        laneKey: input.laneKey,
        title: "Con riesgo / Demorados",
        subtitle: "Prioridad operacional critica",
        tone: riskOrders.length > 0 ? "warning" : "neutral",
        alert:
          riskOrders.length > 0
            ? `${riskOrders.length} ${riskOrders.length === 1 ? "pedido requiere revision inmediata" : "pedidos requieren revision inmediata"}.`
            : undefined,
        items: [
          buildMetricItem("count", "Pedidos", formatCount(riskOrders.length), true),
          buildMetricItem("unassigned", "Sin responsable", formatCount(unassignedCount)),
          buildMetricItem("pressure", "Cola", input.queuePressure.label),
          buildMetricItem("oldest", "Mas antiguo", formatMinutes(oldestMinutes))
        ]
      };
    }
    case "unassigned":
      return {
        id: "lane-metrics:unassigned",
        laneKey: input.laneKey,
        title: "Sin responsable",
        subtitle: "Ownership pendiente",
        tone: unassignedCount > 0 ? "attention" : "neutral",
        alert:
          unassignedCount > 0
            ? `${unassignedCount} ${unassignedCount === 1 ? "pedido espera toma" : "pedidos esperan toma"}.`
            : undefined,
        items: [
          buildMetricItem("count", "Pedidos", formatCount(unassignedCount), true),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount)),
          buildMetricItem("pending", "Pendientes", formatCount(laneOrders.filter((order) => order.status === "pending").length)),
          buildMetricItem("oldest", "Mas antiguo", formatMinutes(oldestMinutes))
        ]
      };
    case "mine":
      return {
        id: "lane-metrics:mine",
        laneKey: input.laneKey,
        title: "A mi cargo",
        subtitle: "Foco personal de trabajo",
        tone: riskCount > 0 ? "attention" : "neutral",
        alert:
          riskCount > 0
            ? `${riskCount} ${riskCount === 1 ? "pedido propio requiere revision" : "pedidos propios requieren revision"}.`
            : undefined,
        items: [
          buildMetricItem("count", "Pedidos", formatCount(assignedToCurrentUserCount), true),
          buildMetricItem("risk", "Con riesgo", formatCount(riskCount)),
          buildMetricItem("preparing", "Preparando", formatCount(laneOrders.filter((order) => order.status === "preparing").length)),
          buildMetricItem("ready", "Listos", formatCount(laneOrders.filter((order) => order.status === "ready").length))
        ]
      };
    default:
      return null;
  }
}

function buildMetricItem(
  id: string,
  label: string,
  value: string,
  emphasize = false
): OperationalLaneMetricItem {
  return {
    id,
    label,
    value,
    emphasize
  };
}

function buildLaneTitle(laneKey: OperationalLaneKey) {
  switch (laneKey) {
    case "pending":
      return "Pending / Nuevo";
    case "preparing":
      return "Preparing / En preparacion";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "delivery":
      return "Delivery";
    case "pickup":
      return "Pickup / Retiro";
    case "risk":
      return "Con riesgo / Demorados";
    case "unassigned":
      return "Sin responsable";
    case "mine":
      return "A mi cargo";
    default:
      return laneKey;
  }
}

function buildPendingAlert(input: {
  riskCount: number;
  unassignedCount: number;
  oldestMinutes: number | null;
}) {
  if (input.unassignedCount > 0) {
    return `${input.unassignedCount} ${input.unassignedCount === 1 ? "pedido espera responsable" : "pedidos esperan responsable"}.`;
  }

  if (input.riskCount > 0) {
    return `${input.riskCount} ${input.riskCount === 1 ? "pedido pendiente requiere revision" : "pedidos pendientes requieren revision"}.`;
  }

  if (typeof input.oldestMinutes === "number" && input.oldestMinutes >= 15) {
    return "Hay espera acumulada en pendientes.";
  }

  return undefined;
}

function buildPreparingAlert(input: {
  riskCount: number;
  avgStateMinutes: number | null;
  queuePressure: AdminOrdersQueuePressure;
}) {
  if (input.riskCount > 0) {
    return `${input.riskCount} ${input.riskCount === 1 ? "pedido en preparacion tiene riesgo" : "pedidos en preparacion tienen riesgo"}.`;
  }

  if (
    input.queuePressure.pressureLevel === "busy" ||
    input.queuePressure.pressureLevel === "critical"
  ) {
    return input.queuePressure.sublabel;
  }

  if (typeof input.avgStateMinutes === "number" && input.avgStateMinutes >= 25) {
    return "El tiempo en preparacion ya esta por encima de lo deseable.";
  }

  return undefined;
}

function getMinutesInCurrentStatus(order: AdminOrderDashboardItem, now: Date) {
  const statusStartedAt = getStatusStartedAt(order) ?? order.created_at;
  const start = new Date(statusStartedAt).getTime();
  const end = now.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
}

function getStatusStartedAt(order: AdminOrderDashboardItem) {
  const matchingEvent = [...(order.order_events ?? [])]
    .reverse()
    .find((event) => {
      if (event.event_type !== "status_changed") {
        return false;
      }

      const nextStatus = readStatusPayload(event, "to_status");
      return nextStatus === order.status;
    });

  return matchingEvent?.created_at ?? null;
}

function readStatusPayload(
  event: AdminOrderTimelineEvent,
  key: "from_status" | "to_status"
) {
  if (!event?.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    return null;
  }

  const value = event.payload[key];
  return typeof value === "string" ? (value as OrderStatus) : null;
}

function averageNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function maxNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function formatCount(value: number) {
  return `${value}`;
}

function formatMinutes(value: number | null) {
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

function formatPercent(part: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((part / total) * 100)}%`;
}
