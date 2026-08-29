import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  OPERATIONAL_THRESHOLDS,
  RISK_DETECTION_THRESHOLDS
} from "@/lib/orders/constants";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import { getOrderTimelinePresentationKind } from "@/lib/orders/events.shared";
import {
  getOrderLastActivityTimestamp,
  type AdminOperationalMetrics
} from "@/lib/orders/metrics";
import type { OrderStatus } from "@/types/database";

export type OrderRiskLevel = "stable" | "attention" | "warning";

export type OrderRiskSignal =
  | "inactive"
  | "slow-preparation"
  | "regressive"
  | "many-changes"
  | "reassigned"
  | "stalled";

export type OrderRiskAssessment = {
  orderId: string;
  level: OrderRiskLevel;
  signals: OrderRiskSignal[];
  title: string;
  detail?: string;
  score: number;
};

export type RiskAssessableOrder = Pick<
  AdminOrderDashboardItem,
  "id" | "status" | "created_at" | "assigned_at" | "order_events"
>;

const ACTIVE_STATUSES = new Set<OrderStatus>(["pending", "preparing", "ready"]);
const {
  STALLED_INACTIVE_MINUTES,
  INACTIVE_RISK_MINUTES,
  PREPARATION_SLOW_MINUTES
} = OPERATIONAL_THRESHOLDS;
const {
  RECENT_CHANGE_WINDOW_MINUTES,
  MANY_CHANGES_THRESHOLD,
  REASSIGNMENT_ACTIVITY_THRESHOLD,
  ATTENTION_SCORE_MIN
} = RISK_DETECTION_THRESHOLDS;

const RISK_SIGNAL_SCORES: Record<OrderRiskSignal, number> = {
  inactive: 20,
  "slow-preparation": 25,
  "many-changes": 20,
  regressive: 35,
  reassigned: 15,
  stalled: 50
};

export function assessOrderRisk(input: {
  order: RiskAssessableOrder;
  timeline?: AdminOrderTimelineEvent[];
  operationalMetrics?: AdminOperationalMetrics;
  now?: Date;
  includeAssignmentRisk?: boolean;
}): OrderRiskAssessment {
  const now = input.now ?? new Date();
  const order = input.order;
  const timeline = input.timeline ?? order.order_events ?? [];
  const includeAssignmentRisk = input.includeAssignmentRisk ?? true;
  const isActive = ACTIVE_STATUSES.has(order.status);

  if (!isActive) {
    return {
      orderId: order.id,
      level: "stable",
      signals: [],
      title: "Operacion estable",
      detail: "Sin senales operativas relevantes.",
      score: 0
    };
  }

  const signals: OrderRiskSignal[] = [];
  const inactiveMinutes = getElapsedMinutes(
    getOrderLastActivityTimestamp(order) ?? order.created_at,
    now.toISOString()
  );
  const preparationMinutes = getCurrentPreparationMinutes(order, timeline, now);
  const preparationThreshold = resolvePreparationThreshold(input.operationalMetrics);
  const recentStatusChanges = countRecentStatusChanges(timeline, now);
  const hasRegressiveChange = timeline.some(
    (event) => getOrderTimelinePresentationKind(event) === "status_reverted"
  );
  const reassignmentCount = includeAssignmentRisk ? countReassignmentSignals(timeline) : 0;

  if (
    typeof inactiveMinutes === "number" &&
    inactiveMinutes >= INACTIVE_RISK_MINUTES
  ) {
    signals.push("inactive");
  }

  if (
    order.status === "preparing" &&
    typeof preparationMinutes === "number" &&
    preparationMinutes > preparationThreshold
  ) {
    signals.push("slow-preparation");
  }

  if (recentStatusChanges >= MANY_CHANGES_THRESHOLD) {
    signals.push("many-changes");
  }

  if (hasRegressiveChange) {
    signals.push("regressive");
  }

  if (includeAssignmentRisk && reassignmentCount > 0) {
    signals.push("reassigned");
  }

  if (
    typeof inactiveMinutes === "number" &&
    inactiveMinutes >= STALLED_INACTIVE_MINUTES &&
    signals.some((signal) =>
      signal === "slow-preparation" ||
      signal === "many-changes" ||
      signal === "regressive" ||
      signal === "reassigned"
    )
  ) {
    signals.push("stalled");
  }

  const uniqueSignals = [...new Set(signals)];
  const score = uniqueSignals.reduce((sum, signal) => sum + RISK_SIGNAL_SCORES[signal], 0);
  const level = mapRiskLevel(score);
  const copy = buildRiskCopy({
    inactiveMinutes,
    level,
    orderStatus: order.status,
    preparationThreshold,
    reassignmentCount,
    signals: uniqueSignals
  });

  return {
    orderId: order.id,
    level,
    signals: uniqueSignals,
    title: copy.title,
    detail: copy.detail,
    score
  };
}

export function buildOrderRiskBadgeLabel(assessment: OrderRiskAssessment) {
  const primarySignal = assessment.signals[0];

  switch (primarySignal) {
    case "stalled":
      return "Revisar";
    case "regressive":
      return "Cambio regresivo";
    case "slow-preparation":
      return "Preparacion lenta";
    case "many-changes":
      return "Muchos cambios";
    case "inactive":
      return "Sin movimiento";
    case "reassigned":
      return "Reasignado";
    default:
      return "Estable";
  }
}

function mapRiskLevel(score: number): OrderRiskLevel {
  if (score >= 60) {
    return "warning";
  }

  if (score >= ATTENTION_SCORE_MIN) {
    return "attention";
  }

  return "stable";
}

function buildRiskCopy(input: {
  inactiveMinutes: number | null;
  level: OrderRiskLevel;
  orderStatus: OrderStatus;
  preparationThreshold: number;
  reassignmentCount: number;
  signals: OrderRiskSignal[];
}) {
  if (input.signals.includes("stalled")) {
    return {
      title: "Pedido necesita atencion",
      detail: "El pedido parece estancado."
    };
  }

  if (input.signals.includes("regressive")) {
    return {
      title: "Cambio regresivo detectado",
      detail: "El pedido volvio a un estado previo."
    };
  }

  if (input.signals.includes("slow-preparation")) {
    return {
      title: "Preparacion mas lenta",
      detail:
        input.orderStatus === "preparing"
          ? "Este pedido supera el tiempo promedio actual."
          : `Este pedido supera ${input.preparationThreshold} min de referencia.`
    };
  }

  if (input.signals.includes("many-changes")) {
    return {
      title: "Muchos cambios recientes",
      detail: "El pedido cambio varias veces de estado."
    };
  }

  if (input.signals.includes("inactive")) {
    return {
      title: "Sin movimiento reciente",
      detail:
        typeof input.inactiveMinutes === "number"
          ? `Este pedido no tuvo actividad hace ${input.inactiveMinutes} min.`
          : "Este pedido no tuvo actividad reciente."
    };
  }

  if (input.signals.includes("reassigned")) {
    return {
      title: "Movimiento entre operadores",
      detail:
        input.reassignmentCount > 1
          ? "Este pedido cambio de responsable mas de una vez."
          : "Este pedido cambio de responsable."
    };
  }

  if (input.level === "stable") {
    return {
      title: "Operacion estable",
      detail: "Sin senales operativas relevantes."
    };
  }

  return {
    title: "Atencion operativa",
    detail: "Hay senales suaves para revisar."
  };
}

function resolvePreparationThreshold(metrics?: AdminOperationalMetrics) {
  if (
    typeof metrics?.averagePreparationMinutes === "number" &&
    Number.isFinite(metrics.averagePreparationMinutes)
  ) {
    return Math.max(PREPARATION_SLOW_MINUTES, metrics.averagePreparationMinutes);
  }

  return PREPARATION_SLOW_MINUTES;
}

function getCurrentPreparationMinutes(
  order: RiskAssessableOrder,
  timeline: AdminOrderTimelineEvent[],
  now: Date
) {
  if (order.status !== "preparing") {
    return null;
  }

  const preparingStartedAt = [...timeline]
    .reverse()
    .find((event) => {
      if (event.event_type !== "status_changed") {
        return false;
      }

      const toStatus = readStatusPayload(event, "to_status");
      return toStatus === "preparing";
    })?.created_at;

  return getElapsedMinutes(preparingStartedAt ?? order.created_at, now.toISOString());
}

function countRecentStatusChanges(timeline: AdminOrderTimelineEvent[], now: Date) {
  return timeline.filter((event) => {
    if (event.event_type !== "status_changed") {
      return false;
    }

    const elapsedMinutes = getElapsedMinutes(event.created_at, now.toISOString());
    return typeof elapsedMinutes === "number" && elapsedMinutes <= RECENT_CHANGE_WINDOW_MINUTES;
  }).length;
}

function countReassignmentSignals(timeline: AdminOrderTimelineEvent[]) {
  const transferCount = timeline.filter(
    (event) => getOrderTimelinePresentationKind(event) === "assignment_transferred"
  ).length;
  const assignmentEventsCount = timeline.filter(
    (event) =>
      event.event_type === "assignment_taken" || event.event_type === "assignment_released"
  ).length;

  if (transferCount > 0) {
    return transferCount;
  }

  return assignmentEventsCount >= REASSIGNMENT_ACTIVITY_THRESHOLD ? 1 : 0;
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

function getElapsedMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
}
