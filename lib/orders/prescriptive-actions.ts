import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import { assessOrderRisk } from "@/lib/orders/risk-detection";

export type PrescriptiveActionTone = "success" | "danger" | "neutral";

export type PrescriptiveActionState = {
  tone: PrescriptiveActionTone;
  label: string;
  atRiskCount: number;
};

const ACTIVE_STATUSES = new Set<AdminOrderDashboardItem["status"]>([
  "pending",
  "preparing",
  "ready"
]);

type BuildPrescriptiveActionsInput = {
  orders: readonly AdminOrderDashboardItem[];
  operationalMetrics?: AdminOperationalMetrics;
  now?: Date;
};

export function buildPrescriptiveActions({
  orders,
  operationalMetrics,
  now = new Date()
}: BuildPrescriptiveActionsInput): PrescriptiveActionState {
  if (orders.length === 0) {
    return {
      tone: "neutral",
      label: "Sin movimientos",
      atRiskCount: 0
    };
  }

  const atRiskCount = orders.reduce((count, order) => {
    if (!ACTIVE_STATUSES.has(order.status)) {
      return count;
    }

    const assessment = assessOrderRisk({
      order,
      operationalMetrics,
      now
    });

    return assessment.level !== "stable" ? count + 1 : count;
  }, 0);

  if (atRiskCount > 0) {
    return {
      tone: "danger",
      label: `Atencion requerida en ${atRiskCount} ${atRiskCount === 1 ? "pedido" : "pedidos"}`,
      atRiskCount
    };
  }

  return {
    tone: "success",
    label: "Operacion fluida",
    atRiskCount: 0
  };
}

export function formatPrescriptiveActionMetricValue(state: PrescriptiveActionState) {
  return state.label;
}
