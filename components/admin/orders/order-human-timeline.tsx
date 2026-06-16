"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  buildOrderHistorySummary,
  buildPresentedOrderTimelineEntries,
  type AdminOrderTimelineEvent
} from "@/lib/orders/events.shared";
import type { OrderStatus } from "@/types/database";
import timelineStyles from "./order-human-timeline.module.css";
import workspaceStyles from "./order-workspace.module.css";

type OrderHumanTimelineProps = {
  events: AdminOrderTimelineEvent[];
  orderCreatedAt: string;
  currentStatus: OrderStatus;
  compact?: boolean;
  detailHref?: string;
};

const HISTORY_SIGNAL_CLASS_NAMES: Record<string, string | undefined> = {
  cancelled: timelineStyles["admin-order-history-signal--cancelled"],
  completed: timelineStyles["admin-order-history-signal--completed"]
};

function OrderHumanTimelineComponent({
  events,
  orderCreatedAt,
  currentStatus,
  compact = false,
  detailHref
}: OrderHumanTimelineProps) {
  const timelineEntries = useMemo(
    () => buildPresentedOrderTimelineEntries(events, orderCreatedAt),
    [events, orderCreatedAt]
  );

  const historySummary = useMemo(
    () =>
      compact ? null : buildOrderHistorySummary(events, orderCreatedAt, currentStatus),
    [compact, events, orderCreatedAt, currentStatus]
  );

  const { hiddenEventsCount, visibleTimelineEntries } = useMemo(() => {
    const hiddenCount = compact && timelineEntries.length > 5 ? timelineEntries.length - 5 : 0;

    return {
      hiddenEventsCount: hiddenCount,
      visibleTimelineEntries:
        compact && hiddenCount > 0 ? timelineEntries.slice(-5) : timelineEntries
    };
  }, [compact, timelineEntries]);

  const timelineClassName = [
    timelineStyles["admin-order-human-timeline"],
    compact ? timelineStyles["admin-order-human-timeline--compact"] : null,
    compact ? timelineStyles["admin-order-human-timeline--bare"] : null
  ]
    .filter(Boolean)
    .join(" ");

  const panelClassName = [
    workspaceStyles["admin-detail-panel"],
    workspaceStyles["admin-detail-panel--timeline"],
    compact ? workspaceStyles["admin-detail-panel--timeline-compact"] : null,
    compact ? timelineStyles["admin-order-human-timeline-panel--bare"] : null
  ]
    .filter(Boolean)
    .join(" ");

  const historySummaryClassName = [
    timelineStyles["admin-order-history-summary"],
    compact ? timelineStyles["admin-order-history-summary--compact"] : null
  ]
    .filter(Boolean)
    .join(" ");

  const timelineContent = (
    <>
      <div
        className={
          compact
            ? timelineStyles["admin-order-human-timeline-section-header"]
            : workspaceStyles["admin-detail-header"]
        }
      >
        <h2>{compact ? "Actividad reciente" : "Historial"}</h2>
      </div>

      {historySummary ? (
        <div className={historySummaryClassName}>
          <dl className={timelineStyles["admin-order-history-summary__metrics"]}>
            {historySummary.metrics.map((metric) => (
              <div key={metric.key} className={timelineStyles["admin-order-history-summary__metric"]}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>

          {historySummary.signals.length > 0 ? (
            <div
              className={timelineStyles["admin-order-history-summary__signals"]}
              aria-label="Senales del pedido"
            >
              {historySummary.signals.map((signal) => (
                <span
                  key={signal.key}
                  className={[
                    timelineStyles["admin-order-history-signal"],
                    HISTORY_SIGNAL_CLASS_NAMES[signal.key]
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {signal.label}
                </span>
              ))}
            </div>
          ) : null}

          {historySummary.stageDurations.length > 0 ? (
            <div
              className={timelineStyles["admin-order-history-stages"]}
              aria-label="Duracion por etapa"
            >
              {historySummary.stageDurations.map((stage) => (
                <div key={stage.key} className={timelineStyles["admin-order-history-stages__item"]}>
                  <strong>{stage.label}</strong>
                  <span>{stage.durationLabel ?? (stage.isCurrent ? "Actual" : "Sin datos")}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {hiddenEventsCount > 0 ? (
        <div className={timelineStyles["admin-order-human-timeline__meta"]}>
          <span>Mostrando ultimos 5 movimientos</span>
          {detailHref ? (
            <Link className="admin-secondary-link" href={detailHref}>
              Ver historial completo
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        className={timelineClassName}
        aria-label={compact ? "Actividad reciente del pedido" : "Historial del pedido"}
      >
        {visibleTimelineEntries.map((entry) => (
          <article
            key={entry.event.id}
            className={timelineStyles["admin-order-human-timeline__item"]}
            data-kind={entry.presentationKind}
          >
            <div className={timelineStyles["admin-order-human-timeline__marker"]} aria-hidden="true">
              <span className={timelineStyles["admin-order-human-timeline__dot"]} />
            </div>
            <div className={timelineStyles["admin-order-human-timeline__copy"]}>
              <strong>{entry.label}</strong>
              {entry.detail ? <span>{entry.detail}</span> : null}
              {entry.deltaLabel ? <span>{entry.deltaLabel}</span> : null}
              <span className={timelineStyles["admin-order-human-timeline__meta-line"]}>
                {entry.meta}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  if (compact) {
    return <div className={panelClassName}>{timelineContent}</div>;
  }

  return <Card className={panelClassName}>{timelineContent}</Card>;
}

function areOrderHumanTimelinePropsEqual(
  previous: OrderHumanTimelineProps,
  next: OrderHumanTimelineProps
) {
  if (
    previous.orderCreatedAt !== next.orderCreatedAt ||
    previous.currentStatus !== next.currentStatus ||
    previous.compact !== next.compact ||
    previous.detailHref !== next.detailHref
  ) {
    return false;
  }

  if (previous.events === next.events) {
    return true;
  }

  if (previous.events.length !== next.events.length) {
    return false;
  }

  for (let index = 0; index < previous.events.length; index += 1) {
    const previousEvent = previous.events[index];
    const nextEvent = next.events[index];

    if (
      previousEvent.id !== nextEvent.id ||
      previousEvent.created_at !== nextEvent.created_at ||
      previousEvent.event_type !== nextEvent.event_type
    ) {
      return false;
    }
  }

  return true;
}

const OrderHumanTimeline = memo(OrderHumanTimelineComponent, areOrderHumanTimelinePropsEqual);

export default OrderHumanTimeline;
