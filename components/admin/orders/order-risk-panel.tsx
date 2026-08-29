"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import {
  assessOrderRisk,
  buildOrderRiskBadgeLabel,
  type OrderRiskAssessment,
  type OrderRiskSignal,
  type RiskAssessableOrder
} from "@/lib/orders/risk-detection";
import styles from "./order-risk-panel.module.css";

type OrderRiskPanelProps = {
  order: RiskAssessableOrder;
  operationalMetrics?: AdminOperationalMetrics;
  compact?: boolean;
  orderResponsibilityEnabled?: boolean;
};

const RISK_LEVEL_CLASS_NAMES = {
  attention: styles["admin-order-risk-panel--attention"],
  warning: styles["admin-order-risk-panel--warning"]
} as const;

const RISK_LEVEL_SURFACE_CLASS_NAMES: Record<OrderRiskAssessment["level"], string | null> = {
  stable: null,
  attention: "order-risk-panel--attention",
  warning: "order-risk-panel--warning"
};

export default function OrderRiskPanel({
  order,
  operationalMetrics,
  compact = false,
  orderResponsibilityEnabled = true
}: OrderRiskPanelProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const assessment = useMemo(
    () =>
      assessOrderRisk({
        order,
        operationalMetrics,
        now,
        includeAssignmentRisk: orderResponsibilityEnabled
      }),
    [now, operationalMetrics, order, orderResponsibilityEnabled]
  );

  if (assessment.level === "stable") {
    return null;
  }

  const levelSurfaceClassName = compact ? RISK_LEVEL_SURFACE_CLASS_NAMES[assessment.level] : null;

  const panelClassName = [
    "order-risk-panel",
    levelSurfaceClassName,
    styles["admin-order-risk-panel"],
    compact ? styles["admin-order-risk-panel--compact"] : null,
    RISK_LEVEL_CLASS_NAMES[assessment.level]
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={panelClassName}
      aria-label="Riesgo operacional"
      data-level={assessment.level}
    >
      <div className={styles["admin-order-risk-panel__header"]}>
        <div className={styles["admin-order-risk-panel__header-copy"]}>
          <p className={styles["admin-order-risk-panel__eyebrow"]}>Riesgo operacional</p>
          <h3 className={styles["admin-order-risk-panel__title"]}>{assessment.title}</h3>
        </div>
        <span className={styles["admin-order-risk-panel__level-badge"]}>
          {buildOrderRiskBadgeLabel(assessment)}
        </span>
      </div>

      {assessment.detail ? (
        <p className={styles["admin-order-risk-panel__description"]}>{assessment.detail}</p>
      ) : null}

      <div className={styles["admin-order-risk-panel__signals"]}>
        {assessment.signals.map((signal) => (
          <span key={signal} className={styles["admin-order-risk-panel__signal"]}>
            {formatRiskSignalLabel(signal)}
          </span>
        ))}
      </div>
    </section>
  );
}

function formatRiskSignalLabel(signal: OrderRiskSignal) {
  switch (signal) {
    case "inactive":
      return "Sin movimiento";
    case "slow-preparation":
      return "Preparacion lenta";
    case "regressive":
      return "Cambio regresivo";
    case "many-changes":
      return "Muchos cambios";
    case "reassigned":
      return "Reasignado";
    case "stalled":
      return "Estancado";
    default:
      return signal;
  }
}
