export type KanbanTransitionTraceSource =
  | "optimistic.apply"
  | "optimistic.finalize"
  | "optimistic.rollback"
  | "props-sync.before"
  | "props-sync.after"
  | "silent-refresh.before"
  | "silent-refresh.after"
  | "realtime.payload"
  | "realtime.suppressed"
  | "realtime.apply"
  | "summary.fetch.start"
  | "summary.fetch.success"
  | "summary.fetch.fallback"
  | "pending.mark"
  | "pending.resolve"
  | "pending.clear"
  | "pending.expired"
  | "view-model.render"
  | "quick-action.blocked";

export type KanbanTransitionTraceEvent = {
  ts: number;
  source: KanbanTransitionTraceSource;
  orderId?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  previousStatus?: string | null;
  expectedStatus?: string | null;
  finalStatus?: string | null;
  externalStatus?: string | null;
  mutationId?: string | null;
  pendingAgeMs?: number | null;
  reason?: string;
  note?: string;
};

const TRACE_STORAGE_KEY = "orderops:kanban-transition-trace";
const TRACE_BUFFER_MAX = 400;

type TraceOrderSnapshot = {
  id: string;
  status: string;
};

declare global {
  interface Window {
    __ORDEROPS_KANBAN_TRACE__?: KanbanTransitionTraceEvent[];
  }
}

export function isKanbanTransitionTraceEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(TRACE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function appendTraceEvent(event: KanbanTransitionTraceEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  const buffer = window.__ORDEROPS_KANBAN_TRACE__ ?? [];
  buffer.push(event);

  if (buffer.length > TRACE_BUFFER_MAX) {
    buffer.splice(0, buffer.length - TRACE_BUFFER_MAX);
  }

  window.__ORDEROPS_KANBAN_TRACE__ = buffer;
  console.debug("[kanban-transition]", event);
}

export function traceKanbanTransition(
  event: Omit<KanbanTransitionTraceEvent, "ts"> & { ts?: number }
): void {
  if (!isKanbanTransitionTraceEnabled()) {
    return;
  }

  const { ts, ...rest } = event;
  appendTraceEvent({
    ts: ts ?? Date.now(),
    ...rest
  });
}

export function traceKanbanReconcileBatch(params: {
  source: "props-sync.before" | "props-sync.after" | "silent-refresh.before" | "silent-refresh.after";
  reason?: string;
  serverOrders: TraceOrderSnapshot[];
  reconciledOrders?: TraceOrderSnapshot[];
  getPendingPatch: (orderId: string) => { status?: string } | null;
  getUiStatus?: (orderId: string) => string | null | undefined;
}): void {
  if (!isKanbanTransitionTraceEnabled()) {
    return;
  }

  for (const serverOrder of params.serverOrders) {
    const pendingPatch = params.getPendingPatch(serverOrder.id);
    const uiStatus = params.getUiStatus?.(serverOrder.id) ?? null;
    const reconciledOrder = params.reconciledOrders?.find((order) => order.id === serverOrder.id);
    const reconciledStatus = reconciledOrder?.status ?? null;
    const hasPending = Boolean(pendingPatch?.status);
    const hasUiMismatch = Boolean(uiStatus && uiStatus !== serverOrder.status);
    const hasReconcileDelta = Boolean(reconciledStatus && reconciledStatus !== serverOrder.status);

    if (!hasPending && !hasUiMismatch && !hasReconcileDelta) {
      continue;
    }

    traceKanbanTransition({
      source: params.source,
      orderId: serverOrder.id,
      fromStatus: uiStatus,
      toStatus: reconciledStatus ?? serverOrder.status,
      previousStatus: serverOrder.status,
      expectedStatus: pendingPatch?.status ?? null,
      reason: params.reason
    });
  }
}
