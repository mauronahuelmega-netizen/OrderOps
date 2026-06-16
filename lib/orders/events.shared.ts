import { buildOrderRelativeTimeLabel } from "@/lib/orders/presenter";
import type { Json, OrderStatus, Tables } from "@/types/database";

export type OrderEventType =
  | "order_created"
  | "status_changed"
  | "assignment_taken"
  | "assignment_released";

export type TimelinePresentationKind =
  | "order_created"
  | "status_changed"
  | "status_reverted"
  | "order_completed"
  | "order_cancelled"
  | "assignment_taken"
  | "assignment_transferred"
  | "assignment_released";

export type StatusTransitionKind = "forward" | "backward" | "same" | "unknown";

export type AdminOrderTimelineEvent = {
  id: string;
  event_type: OrderEventType;
  payload: Json;
  created_at: string;
  actor_profile_id: string | null;
  actor_label: string | null;
};

export type AdminOrderTimelineEntry = {
  event: AdminOrderTimelineEvent;
  label: string;
  meta: string;
  deltaLabel: string | null;
  detail: string | null;
  presentationKind: TimelinePresentationKind;
};

export type AdminOrderHistorySignal =
  | "reassigned"
  | "reverted"
  | "stalled"
  | "completed"
  | "cancelled"
  | "simple";

export type AdminOrderHistorySummaryMetric = {
  key: "total" | "lastMovement" | "changes" | "reassignments" | "currentStatus";
  label: string;
  value: string;
};

export type AdminOrderHistoryStageSummary = {
  key: string;
  status: OrderStatus;
  label: string;
  durationLabel: string | null;
  isCurrent: boolean;
};

export type AdminOrderHistorySummary = {
  metrics: AdminOrderHistorySummaryMetric[];
  stageDurations: AdminOrderHistoryStageSummary[];
  signals: Array<{
    key: AdminOrderHistorySignal;
    label: string;
  }>;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  completed: "Completado",
  cancelled: "Cancelado"
};

const STATUS_ORDER: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
  cancelled: 4
};

export function presentOrderTimelineEvent(
  row: Tables<"order_events">,
  actorEmail: string | null
): AdminOrderTimelineEvent {
  return {
    id: row.id,
    event_type: row.event_type as OrderEventType,
    payload: row.payload,
    created_at: row.created_at,
    actor_profile_id: row.actor_profile_id,
    actor_label: resolveOrderEventActorLabel(row.actor_profile_id, actorEmail)
  };
}

export function buildFallbackOrderCreatedEvent(createdAt: string): AdminOrderTimelineEvent {
  return {
    id: "derived-order-created",
    event_type: "order_created",
    payload: {
      source: "checkout",
      derived: true
    },
    created_at: createdAt,
    actor_profile_id: null,
    actor_label: null
  };
}

export function buildOrderTimelineEntries(
  events: AdminOrderTimelineEvent[],
  createdAt: string
) {
  const hasPersistedOrderCreated = events.some((event) => event.event_type === "order_created");
  const timelineEvents = hasPersistedOrderCreated
    ? [...events]
    : [buildFallbackOrderCreatedEvent(createdAt), ...events];

  return timelineEvents.sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );
}

export function buildPresentedOrderTimelineEntries(
  events: AdminOrderTimelineEvent[],
  createdAt: string
): AdminOrderTimelineEntry[] {
  const timelineEvents = buildOrderTimelineEntries(events, createdAt);

  return timelineEvents.map((event, index) => ({
    event,
    label: buildOrderTimelineEventLabel(event),
    meta: buildOrderTimelineEventMeta(event),
    deltaLabel:
      index === 0 ? null : buildTimelineDeltaLabel(timelineEvents[index - 1], timelineEvents[index]),
    detail: buildOrderTimelineEventDetail(event),
    presentationKind: getOrderTimelinePresentationKind(event)
  }));
}

export function buildOrderHistorySummary(
  events: AdminOrderTimelineEvent[],
  createdAt: string,
  currentStatus: OrderStatus,
  now = new Date()
): AdminOrderHistorySummary {
  const timelineEvents = buildOrderTimelineEntries(events, createdAt);
  const changeCount = timelineEvents.filter((event) => event.event_type !== "order_created").length;
  const reassignmentCount = timelineEvents.filter(isAssignmentTransferEvent).length;
  const lastMovementAt = getLastTimelineActivityAt(timelineEvents, createdAt);
  const currentStatusStartedAt = getCurrentStatusStartedAt(timelineEvents, createdAt, currentStatus);
  const totalEndedAt = resolveOrderTimelineEndedAt(timelineEvents, currentStatus, now);
  const currentStatusDurationLabel = currentStatusStartedAt
    ? buildElapsedSinceLabel(currentStatusStartedAt, now, currentStatus === "completed" || currentStatus === "cancelled")
    : null;
  const stageDurations = buildOrderStageDurations(timelineEvents, createdAt, currentStatus, now);
  const signals = buildOrderHistorySignals({
    changeCount,
    currentStatus,
    currentStatusStartedAt,
    now,
    reassignmentCount,
    timelineEvents
  });

  return {
    metrics: [
      {
        key: "total",
        label: "Tiempo total",
        value: formatDurationBetween(createdAt, totalEndedAt) ?? "Sin datos"
      },
      {
        key: "lastMovement",
        label: "Ult. mov.",
        value: lastMovementAt ? buildElapsedSinceLabel(lastMovementAt, now) ?? "Sin datos" : "Sin datos"
      },
      {
        key: "changes",
        label: "Cambios",
        value: String(changeCount)
      },
      {
        key: "reassignments",
        label: "Reasignaciones",
        value: String(reassignmentCount)
      },
      {
        key: "currentStatus",
        label: "En estado actual",
        value: currentStatusDurationLabel ?? STATUS_LABELS[currentStatus]
      }
    ],
    stageDurations,
    signals
  };
}

export function buildOrderTimelineEventLabel(event: AdminOrderTimelineEvent) {
  const actor = event.actor_label ?? resolveTimelineFallbackActor(event);
  const statusPayload = readStatusTransitionPayload(event.payload);

  switch (getOrderTimelinePresentationKind(event)) {
    case "order_created":
      return "Pedido recibido";
    case "order_completed":
      return `${actor} completo el pedido`;
    case "order_cancelled":
      return `${actor} cancelo el pedido`;
    case "status_reverted":
      return `${actor} volvio a ${STATUS_LABELS[statusPayload.toStatus ?? "pending"]}`;
    case "status_changed":
      return `${actor} cambio a ${STATUS_LABELS[statusPayload.toStatus ?? "pending"]}`;
    case "assignment_transferred":
      return actor === "Sistema" ? "Pedido reasignado" : `Pedido reasignado a ${actor}`;
    case "assignment_taken":
      return `${actor} tomo el pedido`;
    case "assignment_released":
      return `${actor} libero el pedido`;
  }
}

export function buildOrderTimelineEventMeta(event: AdminOrderTimelineEvent) {
  const eventDate = new Date(event.created_at);

  if (Number.isNaN(eventDate.getTime())) {
    return "Fecha no disponible";
  }

  const now = new Date();
  const isSameDay =
    eventDate.getFullYear() === now.getFullYear() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getDate() === now.getDate();

  return new Intl.DateTimeFormat("es-AR", {
    ...(isSameDay
      ? {
          hour: "2-digit",
          minute: "2-digit"
        }
      : {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
  }).format(eventDate);
}

export function buildOrderTimelineEventDetail(event: AdminOrderTimelineEvent) {
  if (event.event_type === "status_changed") {
    const { fromStatus, toStatus } = readStatusTransitionPayload(event.payload);

    if (!toStatus) {
      return null;
    }

    if (!fromStatus) {
      return `Estado actual: ${STATUS_LABELS[toStatus]}`;
    }

    if (fromStatus === toStatus) {
      return `Sin cambio real (${STATUS_LABELS[toStatus]})`;
    }

    return `${STATUS_LABELS[fromStatus]} -> ${STATUS_LABELS[toStatus]}`;
  }

  if (event.event_type === "assignment_taken" && isAssignmentTransferEvent(event)) {
    return "Habia otro responsable antes de esta accion";
  }

  if (event.event_type === "assignment_released") {
    const releasedFrom = readStringPayload(event.payload, "released_from");
    return releasedFrom ? "Se libero el responsable actual" : null;
  }

  return buildOrderRelativeTimeLabel({ created_at: event.created_at });
}

export function classifyStatusTransition(
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus | null
): StatusTransitionKind {
  if (!fromStatus || !toStatus) {
    return "unknown";
  }

  if (fromStatus === toStatus) {
    return "same";
  }

  const fromOrder = STATUS_ORDER[fromStatus];
  const toOrder = STATUS_ORDER[toStatus];

  if (typeof fromOrder !== "number" || typeof toOrder !== "number") {
    return "unknown";
  }

  return toOrder > fromOrder ? "forward" : "backward";
}

export function getOrderTimelinePresentationKind(
  event: AdminOrderTimelineEvent
): TimelinePresentationKind {
  if (event.event_type === "order_created") {
    return "order_created";
  }

  if (event.event_type === "assignment_released") {
    return "assignment_released";
  }

  if (event.event_type === "assignment_taken") {
    return isAssignmentTransferEvent(event) ? "assignment_transferred" : "assignment_taken";
  }

  const { fromStatus, toStatus } = readStatusTransitionPayload(event.payload);

  if (toStatus === "completed") {
    return "order_completed";
  }

  if (toStatus === "cancelled") {
    return "order_cancelled";
  }

  if (classifyStatusTransition(fromStatus, toStatus) === "backward") {
    return "status_reverted";
  }

  return "status_changed";
}

function resolveOrderEventActorLabel(actorProfileId: string | null, actorEmail: string | null) {
  if (!actorProfileId) {
    return null;
  }

  if (!actorEmail) {
    return "Operador";
  }

  const localPart = actorEmail.split("@")[0]?.trim();

  if (!localPart) {
    return "Operador";
  }

  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function resolveTimelineFallbackActor(event: AdminOrderTimelineEvent) {
  return event.actor_profile_id ? "Operador" : "Sistema";
}

function buildOrderHistorySignals({
  changeCount,
  currentStatus,
  currentStatusStartedAt,
  now,
  reassignmentCount,
  timelineEvents
}: {
  changeCount: number;
  currentStatus: OrderStatus;
  currentStatusStartedAt: string;
  now: Date;
  reassignmentCount: number;
  timelineEvents: AdminOrderTimelineEvent[];
}) {
  const hasReversion = timelineEvents.some(
    (event) => getOrderTimelinePresentationKind(event) === "status_reverted"
  );
  const currentStatusMinutes = getDurationMinutes(currentStatusStartedAt, now.toISOString());
  const isStalled =
    (currentStatus === "pending" || currentStatus === "preparing" || currentStatus === "ready") &&
    typeof currentStatusMinutes === "number" &&
    currentStatusMinutes >= 20;
  const isSimpleOperation =
    currentStatus !== "cancelled" &&
    reassignmentCount === 0 &&
    !hasReversion &&
    !isStalled &&
    changeCount <= 2;

  const candidates: Array<{ key: AdminOrderHistorySignal; label: string; enabled: boolean }> = [
    { key: "cancelled", label: "Cancelado", enabled: currentStatus === "cancelled" },
    { key: "completed", label: "Completado", enabled: currentStatus === "completed" },
    { key: "stalled", label: "Estancado", enabled: isStalled },
    { key: "reassigned", label: "Reasignado", enabled: reassignmentCount > 0 },
    { key: "reverted", label: "Cambio regresivo", enabled: hasReversion },
    { key: "simple", label: "Operacion simple", enabled: isSimpleOperation }
  ];

  return candidates.filter((signal) => signal.enabled).slice(0, 3).map(({ key, label }) => ({
    key,
    label
  }));
}

function readStatusTransitionPayload(payload: Json) {
  const fromStatus = readStatusPayload(payload, "from_status");
  const toStatus = readStatusPayload(payload, "to_status");

  return { fromStatus, toStatus };
}

function readStatusPayload(payload: Json, key: "from_status" | "to_status") {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload[key];
  return typeof value === "string" ? (value as OrderStatus) : null;
}

function readStringPayload(payload: Json, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function isAssignmentTransferEvent(event: AdminOrderTimelineEvent) {
  if (event.event_type !== "assignment_taken") {
    return false;
  }

  const previousAssignedTo = readStringPayload(event.payload, "previous_assigned_to");
  const assignedTo = readStringPayload(event.payload, "assigned_to");

  return Boolean(previousAssignedTo && previousAssignedTo !== assignedTo);
}

function buildOrderStageDurations(
  timelineEvents: AdminOrderTimelineEvent[],
  createdAt: string,
  currentStatus: OrderStatus,
  now: Date
) {
  const segments: AdminOrderHistoryStageSummary[] = [];
  let activeStatus: OrderStatus = "pending";
  let segmentStartedAt = createdAt;

  for (const event of timelineEvents) {
    if (event.event_type !== "status_changed") {
      continue;
    }

    const { fromStatus, toStatus } = readStatusTransitionPayload(event.payload);

    if (!toStatus) {
      continue;
    }

    const segmentStatus = fromStatus ?? activeStatus;
    segments.push({
      key: `${segmentStatus}-${event.id}`,
      status: segmentStatus,
      label: STATUS_LABELS[segmentStatus],
      durationLabel: formatDurationBetween(segmentStartedAt, event.created_at) ?? "Seguido",
      isCurrent: false
    });

    activeStatus = toStatus;
    segmentStartedAt = event.created_at;
  }

  const finalStageStatus = currentStatus;
  const finalEndedAt = resolveOrderTimelineEndedAt(timelineEvents, currentStatus, now);
  const finalDurationLabel =
    finalStageStatus === "completed" || finalStageStatus === "cancelled"
      ? null
      : formatDurationBetween(segmentStartedAt, finalEndedAt) ?? "Seguido";

  segments.push({
    key: `${finalStageStatus}-current`,
    status: finalStageStatus,
    label: STATUS_LABELS[finalStageStatus],
    durationLabel: finalDurationLabel,
    isCurrent: true
  });

  return collapseRepeatedStageDurations(segments);
}

function collapseRepeatedStageDurations(segments: AdminOrderHistoryStageSummary[]) {
  return segments.filter((segment, index) => {
    const previousSegment = segments[index - 1];

    return !(
      previousSegment &&
      previousSegment.status === segment.status &&
      previousSegment.durationLabel === segment.durationLabel &&
      previousSegment.isCurrent === segment.isCurrent
    );
  });
}

function buildTimelineDeltaLabel(
  previousEvent: AdminOrderTimelineEvent,
  currentEvent: AdminOrderTimelineEvent
) {
  return formatDurationBetween(previousEvent.created_at, currentEvent.created_at, "despues");
}

function resolveOrderTimelineEndedAt(
  timelineEvents: AdminOrderTimelineEvent[],
  currentStatus: OrderStatus,
  now: Date
) {
  if (currentStatus !== "completed" && currentStatus !== "cancelled") {
    return now.toISOString();
  }

  const terminalEvent = [...timelineEvents]
    .reverse()
    .find((event) => event.event_type === "status_changed" && readStatusTransitionPayload(event.payload).toStatus === currentStatus);

  return terminalEvent?.created_at ?? getLastTimelineActivityAt(timelineEvents, now.toISOString()) ?? now.toISOString();
}

function getCurrentStatusStartedAt(
  timelineEvents: AdminOrderTimelineEvent[],
  createdAt: string,
  currentStatus: OrderStatus
) {
  const matchingTransition = [...timelineEvents]
    .reverse()
    .find(
      (event) =>
        event.event_type === "status_changed" &&
        readStatusTransitionPayload(event.payload).toStatus === currentStatus
    );

  return matchingTransition?.created_at ?? createdAt;
}

function getLastTimelineActivityAt(
  timelineEvents: AdminOrderTimelineEvent[],
  fallbackCreatedAt: string
) {
  const lastEvent = timelineEvents[timelineEvents.length - 1];
  return lastEvent?.created_at ?? fallbackCreatedAt;
}

function buildElapsedSinceLabel(timestamp: string, now: Date, allowZero = false) {
  const elapsedMinutes = getDurationMinutes(timestamp, now.toISOString());

  if (typeof elapsedMinutes !== "number") {
    return null;
  }

  if (elapsedMinutes < 1) {
    return allowZero ? "Hace instantes" : "Seguido";
  }

  if (elapsedMinutes < 60) {
    return `Hace ${elapsedMinutes} min`;
  }

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `Hace ${hours} h ${minutes} min` : `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `Hace ${days} d ${remainingHours} h` : `Hace ${days} d`;
}

function formatDurationBetween(
  startAt: string,
  endAt: string,
  suffix?: "despues"
) {
  const diffMinutes = getDurationMinutes(startAt, endAt);

  if (typeof diffMinutes !== "number") {
    return null;
  }

  if (diffMinutes < 1) {
    return "Seguido";
  }

  if (diffMinutes < 60) {
    return suffix ? `${diffMinutes} min ${suffix}` : `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    if (suffix) {
      return minutes > 0
        ? `${hours} h ${minutes} min ${suffix}`
        : `${hours} h ${suffix}`;
    }

    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (suffix) {
    return remainingHours > 0
      ? `${days} d ${remainingHours} h ${suffix}`
      : `${days} d ${suffix}`;
  }

  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}

function getDurationMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
}
