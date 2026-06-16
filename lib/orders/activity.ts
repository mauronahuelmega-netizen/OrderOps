import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { ACTIVITY_THRESHOLDS } from "@/lib/orders/constants";
import {
  buildOrderTimelineEntries,
  buildOrderTimelineEventDetail,
  buildOrderTimelineEventLabel,
  getOrderTimelinePresentationKind,
  type AdminOrderTimelineEvent,
  type TimelinePresentationKind
} from "@/lib/orders/events.shared";
import { buildOrderRelativeTimeLabel } from "@/lib/orders/presenter";

export type OperationalActivityItem = {
  id: string;
  kind: TimelinePresentationKind;
  orderId: string;
  title: string;
  detail?: string;
  occurredAt: string;
  relativeTimeLabel: string;
  tone: "neutral" | "positive" | "attention" | "warning";
  priority: number;
};

const { RECENT_WINDOW_MS, MAX_ITEMS } = ACTIVITY_THRESHOLDS;

export function buildRecentOperationalActivity(
  orders: readonly AdminOrderDashboardItem[],
  now = new Date()
) {
  const nowTime = now.getTime();
  const activityItems: OperationalActivityItem[] = [];

  for (const order of orders) {
    const timelineEvents = buildOrderTimelineEntries(order.order_events ?? [], order.created_at);

    for (const event of timelineEvents) {
      if (!isRelevantActivityEvent(event)) {
        continue;
      }

      const occurredTime = new Date(event.created_at).getTime();

      if (!Number.isFinite(occurredTime) || nowTime - occurredTime > RECENT_WINDOW_MS) {
        continue;
      }

      activityItems.push({
        id: `${order.id}:${event.id}`,
        kind: getOrderTimelinePresentationKind(event),
        orderId: order.id,
        title: buildOrderTimelineEventLabel(event),
        detail: buildActivityDetail(order, event),
        occurredAt: event.created_at,
        relativeTimeLabel:
          buildOrderRelativeTimeLabel({ created_at: event.created_at }) ??
          "Hace instantes",
        tone: mapActivityTone(event),
        priority: mapActivityPriority(event)
      });
    }
  }

  return activityItems
    .sort((left, right) => {
      const leftTime = new Date(left.occurredAt).getTime();
      const rightTime = new Date(right.occurredAt).getTime();

      return rightTime - leftTime || right.priority - left.priority;
    })
    .slice(0, MAX_ITEMS);
}

function isRelevantActivityEvent(event: AdminOrderTimelineEvent) {
  const presentationKind = getOrderTimelinePresentationKind(event);

  return (
    presentationKind === "order_created" ||
    presentationKind === "status_changed" ||
    presentationKind === "status_reverted" ||
    presentationKind === "order_completed" ||
    presentationKind === "order_cancelled" ||
    presentationKind === "assignment_taken" ||
    presentationKind === "assignment_transferred" ||
    presentationKind === "assignment_released"
  );
}

function buildActivityDetail(order: AdminOrderDashboardItem, event: AdminOrderTimelineEvent) {
  const presentationKind = getOrderTimelinePresentationKind(event);
  const eventDetail = buildOrderTimelineEventDetail(event);
  const orderContext = [order.customer_short_name, order.item_summary].filter(Boolean).join(" · ");

  if (presentationKind === "order_created") {
    return orderContext || "Pedido";
  }

  if (eventDetail && !eventDetail.startsWith("Hace ")) {
    return orderContext ? `${orderContext} · ${eventDetail}` : eventDetail;
  }

  return orderContext || undefined;
}

function mapActivityTone(event: AdminOrderTimelineEvent): OperationalActivityItem["tone"] {
  switch (getOrderTimelinePresentationKind(event)) {
    case "order_cancelled":
    case "status_reverted":
      return "warning";
    case "assignment_transferred":
      return "attention";
    case "order_completed":
      return "positive";
    default:
      return "neutral";
  }
}

function mapActivityPriority(event: AdminOrderTimelineEvent) {
  switch (getOrderTimelinePresentationKind(event)) {
    case "status_reverted":
      return 90;
    case "order_cancelled":
      return 85;
    case "assignment_transferred":
      return 80;
    case "order_completed":
      return 70;
    case "assignment_released":
      return 60;
    case "assignment_taken":
      return 55;
    case "status_changed":
      return 50;
    case "order_created":
      return 40;
    default:
      return 20;
  }
}
