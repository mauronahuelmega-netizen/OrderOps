"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  buildOrderHistorySummary,
  buildPresentedOrderTimelineEntries,
  filterAssignmentTimelineEvents,
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
  compactEventLimit?: number;
  compactHeading?: string;
  detailHref?: string;
  orderResponsibilityEnabled?: boolean;
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
  compactEventLimit = 5,
  compactHeading = "Actividad reciente",
  detailHref,
  orderResponsibilityEnabled = true
}: OrderHumanTimelineProps) {
  const visibleEvents = useMemo(
    () => filterAssignmentTimelineEvents(events, orderResponsibilityEnabled),
    [events, orderResponsibilityEnabled]
  );

  const timelineEntries = useMemo(
    () => buildPresentedOrderTimelineEntries(visibleEvents, orderCreatedAt),
    [visibleEvents, orderCreatedAt]
  );

  const historySummary = useMemo(
    () =>
      compact ? null : buildOrderHistorySummary(visibleEvents, orderCreatedAt, currentStatus),
    [compact, visibleEvents, orderCreatedAt, currentStatus]
  );

  const { hiddenEventsCount, visibleTimelineEntries } = useMemo(() => {
    const limit = compact ? compactEventLimit : timelineEntries.length;
    const hiddenCount = compact && timelineEntries.length > limit ? timelineEntries.length - limit : 0;

    return {
      hiddenEventsCount: hiddenCount,
      visibleTimelineEntries:
        compact && hiddenCount > 0 ? timelineEntries.slice(-limit) : timelineEntries
    };
  }, [compact, compactEventLimit, timelineEntries]);

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
        <h2>{compact ? compactHeading : "Historial"}</h2>
      </div>

      {historySummary ? (
        <div className={historySummaryClassName}>
          <dl className={timelineStyles["admin-order-history-summary__metrics"]}>
            {historySummary.metrics
              .filter((metric) => orderResponsibilityEnabled || metric.key !== "reassignments")
              .map((metric) => (
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
              {historySummary.signals
            .filter((signal) => orderResponsibilityEnabled || signal.key !== "reassigned")
            .map((signal) => (
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
          <span>Mostrando ultimos {compactEventLimit} movimientos</span>
          {detailHref ? (
            <Link className="admin-secondary-link" href={detailHref}>
              Ver historial completo
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        className={timelineClassName}
        aria-label={compact ? `${compactHeading} del pedido` : "Historial del pedido"}
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
    previous.compactEventLimit !== next.compactEventLimit ||
    previous.compactHeading !== next.compactHeading ||
    previous.detailHref !== next.detailHref ||
    previous.orderResponsibilityEnabled !== next.orderResponsibilityEnabled
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
