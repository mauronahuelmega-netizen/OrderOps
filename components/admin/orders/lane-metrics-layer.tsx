"use client";

import type {
  OperationalLaneMetricTone,
  OperationalLaneMetrics
} from "@/lib/orders/lane-metrics";
import styles from "./lane-metrics-layer.module.css";

type LaneMetricsLayerProps = {
  compact?: boolean;
  metrics: OperationalLaneMetrics;
  minimal?: boolean;
};

const laneMetricsToneClassNames: Record<
  Exclude<OperationalLaneMetricTone, "neutral">,
  string
> = {
  positive: styles["admin-orders-lane-metrics--positive"],
  attention: styles["admin-orders-lane-metrics--attention"],
  warning: styles["admin-orders-lane-metrics--warning"]
};

export default function LaneMetricsLayer({
  compact = false,
  metrics,
  minimal = false
}: LaneMetricsLayerProps) {
  const visibleItems = minimal ? metrics.items.slice(0, 3) : metrics.items;
  const inlineSummary = visibleItems
    .map((item) => `${item.value} ${item.label.toLowerCase()}`)
    .join(" · ");
  const toneClassName =
    metrics.tone === "neutral" ? null : laneMetricsToneClassNames[metrics.tone];

  return (
    <div
      className={[
        styles["admin-orders-lane-metrics"],
        toneClassName,
        compact ? styles["admin-orders-lane-metrics--compact"] : null,
        minimal ? styles["admin-orders-lane-metrics--minimal"] : null
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Metricas de lane ${metrics.title}`}
    >
      {!minimal ? (
        <div className={styles["admin-orders-lane-metrics__header"]}>
          <div className={styles["admin-orders-lane-metrics__copy"]}>
            <strong>{metrics.title}</strong>
            <span>{metrics.subtitle}</span>
          </div>
          {metrics.alert ? (
            <p className={styles["admin-orders-lane-metrics__alert"]}>{metrics.alert}</p>
          ) : null}
        </div>
      ) : null}

      {minimal ? (
        <p className={styles["admin-orders-lane-metrics__inline-summary"]}>{inlineSummary}</p>
      ) : (
        <div className={styles["admin-orders-lane-metrics__strip"]}>
          {visibleItems.map((item) => (
            <article
              key={`${metrics.id}:${item.id}`}
              className={[
                styles["admin-orders-lane-metrics__item"],
                item.emphasize ? styles["admin-orders-lane-metrics__item--emphasize"] : null
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
