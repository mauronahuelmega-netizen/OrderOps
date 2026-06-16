import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { SLA_THRESHOLDS } from "@/lib/orders/constants";

export type SLAPromiseStatus = "on-time" | "at-risk" | "breached";

export type SLAComplianceTone = "success" | "attention" | "danger" | "neutral";

export type SLAComplianceResult = {
  compliancePercent: number;
  onTimeCount: number;
  atRiskCount: number;
  breachedCount: number;
  evaluableCount: number;
  tone: SLAComplianceTone;
};

const SLA_ACTIVE_STATUSES = new Set<AdminOrderDashboardItem["status"]>(["pending", "preparing"]);

type SLAEvaluableOrder = Pick<
  AdminOrderDashboardItem,
  "status" | "delivery_date" | "delivery_time"
>;

export function calculateSLACompliance(
  orders: readonly AdminOrderDashboardItem[],
  now = new Date()
): SLAComplianceResult {
  let onTimeCount = 0;
  let atRiskCount = 0;
  let breachedCount = 0;
  let evaluableCount = 0;

  for (const order of orders) {
    if (!SLA_ACTIVE_STATUSES.has(order.status)) {
      continue;
    }

    const promiseAt = resolveOrderPromiseAt(order);

    if (!promiseAt) {
      continue;
    }

    evaluableCount += 1;
    const status = classifyPromiseStatus(promiseAt, now);

    if (status === "on-time") {
      onTimeCount += 1;
    } else if (status === "at-risk") {
      atRiskCount += 1;
    } else {
      breachedCount += 1;
    }
  }

  if (evaluableCount === 0) {
    return {
      compliancePercent: 100,
      onTimeCount: 0,
      atRiskCount: 0,
      breachedCount: 0,
      evaluableCount: 0,
      tone: "neutral"
    };
  }

  const compliancePercent = Math.round((onTimeCount / evaluableCount) * 100);

  return {
    compliancePercent,
    onTimeCount,
    atRiskCount,
    breachedCount,
    evaluableCount,
    tone: resolveSLAComplianceTone({ breachedCount, atRiskCount, compliancePercent })
  };
}

export function formatSLAComplianceMetric(result: SLAComplianceResult) {
  if (result.evaluableCount === 0) {
    return "Sin promesas activas";
  }

  return `${result.compliancePercent}% a tiempo`;
}

export function resolveOrderPromiseAt(order: SLAEvaluableOrder) {
  if (!order.delivery_time?.trim()) {
    return null;
  }

  const datePart = order.delivery_date?.trim();

  if (!datePart) {
    return null;
  }

  const normalizedTime = normalizeDeliveryTime(order.delivery_time);
  const promiseAt = new Date(`${datePart}T${normalizedTime}`);

  if (Number.isNaN(promiseAt.getTime())) {
    return null;
  }

  return promiseAt;
}

function classifyPromiseStatus(promiseAt: Date, now: Date): SLAPromiseStatus {
  const nowTime = now.getTime();
  const promiseTime = promiseAt.getTime();

  if (nowTime >= promiseTime) {
    return "breached";
  }

  const minutesRemaining = Math.round((promiseTime - nowTime) / 60_000);

  if (minutesRemaining <= SLA_THRESHOLDS.PROMISE_AT_RISK_MINUTES) {
    return "at-risk";
  }

  return "on-time";
}

function resolveSLAComplianceTone(input: {
  breachedCount: number;
  atRiskCount: number;
  compliancePercent: number;
}): SLAComplianceTone {
  if (input.breachedCount > 0) {
    return "danger";
  }

  if (input.atRiskCount > 0 || input.compliancePercent < 90) {
    return "attention";
  }

  return "success";
}

function normalizeDeliveryTime(value: string) {
  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(`1970-01-01T${trimmed}`);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(11, 19);
  }

  return trimmed;
}
