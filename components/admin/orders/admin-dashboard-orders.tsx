"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  closeStoreSessionAction,
  getActiveStoreSessionHydrationAction,
  openStoreSessionAction
} from "@/app/admin/(protected)/dashboard/actions";
import { getManualOrderProductOptionsAction } from "@/app/admin/(protected)/orders/actions";
import listStyles from "./dashboard-list.module.css";
import surfaceStyles from "./dashboard-analytics-surfaces.module.css";
import styles from "./admin-dashboard-orders.module.css";
import filterStyles from "./dashboard-filters.module.css";
import DashboardKanbanBoard from "@/components/admin/orders/DashboardKanbanBoard";
import DashboardMobileOverview from "@/components/admin/orders/DashboardMobileOverview";
import DashboardOverview from "@/components/admin/orders/DashboardOverview";
import DashboardToolbar from "@/components/admin/orders/DashboardToolbar";
import ManualOrderModal, {
  type ManualOrderProductOption
} from "@/components/admin/orders/manual-order-modal";
import LaneMetricsLayer from "@/components/admin/orders/lane-metrics-layer";
import OrderCard from "@/components/admin/orders/order-card";

const AdminOrderWorkspaceModal = dynamic(
  () => import("@/components/admin/orders/admin-order-workspace-modal"),
  { ssr: false }
);
import {
  useBrowserNotificationPermission
} from "@/components/admin/notifications/use-browser-notification-permission";
import {
  useAdminPresence,
  type AdminPresenceSurface
} from "@/components/admin/orders/use-admin-presence";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import {
  getSessionOperationalAudioUnlocked,
  markOperationalAudioSessionUnlocked
} from "@/lib/notifications/audio";
import {
  canUseNewOrderBrowserNotification,
  shouldHighlightNewOrder,
  shouldPlayNewOrderSound,
  shouldShowNewOrderToast,
  type NotificationPreferences
} from "@/lib/notifications/preferences";
import {
  buildNewOrderNotificationPayload,
  showBrowserNotification
} from "@/lib/notifications/browser";
import { claimBrowserNotification } from "@/lib/notifications/dedupe";
import { canShowBrowserNotification } from "@/lib/notifications/should-notify";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  DEFAULT_BUSINESS_WINDOW_CONFIG,
  getLatestOrderCreatedAt,
  getOperationalWindow,
  formatLastClosedSessionReviewLabel,
  resolveDashboardActionPolicy,
  DASHBOARD_REVIEW_MODE_MUTATION_HINT,
  type DashboardActionPolicy,
  type OperationalWindow,
  type BusinessWindowConfig,
  type StoreSession
} from "@/lib/orders/analytics";
import {
  buildOrderContextualPresenceLabel,
  buildOrderAssignmentOwnerLabel,
  type AdminOrderAssignment
} from "@/lib/orders/assignment";
import { buildOperationalMetrics } from "@/lib/orders/metrics";
import { buildDashboardBoardViewModel } from "@/lib/orders/dashboard-board-view-model";
import {
  reconcileDashboardOrdersWithPendingMutations,
  shouldApplyIncomingStatusForOrder,
  type PendingOrderMutationPatch
} from "@/lib/orders/dashboard-order-reconciliation";
import {
  traceKanbanReconcileBatch,
  traceKanbanTransition
} from "@/lib/orders/kanban-transition-trace";
import { assessOrderRisk } from "@/lib/orders/risk-detection";
import {
  buildOperationalLaneMetrics,
  type OperationalLaneKey
} from "@/lib/orders/lane-metrics";
import { buildDashboardTopSectionViewModel } from "@/lib/orders/dashboard-top-section-view-model";
import {
  buildDashboardExecutionToolbarViewModel,
  resolveDashboardExecutionFilter,
  type OrdersFilter
} from "@/lib/orders/dashboard-execution-view-model";
import { buildOrdersQueuePressure } from "@/lib/orders/queue-pressure";
import { patchDashboardOrderFromRealtime } from "@/lib/orders/realtime";
import { sortOrdersForOperationalBoard } from "@/lib/orders/sorting";
import {
  patchAdminOrderDashboardItemAssignment,
  patchAdminOrderDashboardItemStatus
} from "@/lib/orders/workspace";
import type { ProfileRole } from "@/types/database";
import { useAdminOrdersRealtime } from "@/components/admin/orders/use-admin-orders-realtime";
import {
  useAdminStoreSessionRealtime,
  type StoreSessionHydrationReason
} from "@/components/admin/orders/use-admin-store-session-realtime";

type AdminDashboardOrdersProps = {
  orders: AdminOrderDashboardItem[];
  businessId: string;
  canUpdateOrders: boolean;
  canManageStoreSession?: boolean;
  currentUserId: string;
  currentUserEmail?: string;
  notificationPreferences: NotificationPreferences;
  currentUserRole: ProfileRole;
  catalogHref?: string | null;
  canManageProducts?: boolean;
  initialActiveStoreSession?: StoreSession | null;
  initialLastClosedStoreSession?: StoreSession | null;
};

const DASHBOARD_SCROLL_KEY = "admin-dashboard-scroll";

const NEW_ORDER_HIGHLIGHT_MS = 8_000;
const NEW_ORDER_SOUND_SRC = "/sounds/new-order-sound.mp3";
const REALTIME_REFRESH_COOLDOWN_MS = 5_000;
const LIVE_PRESSURE_TICK_MS = 60_000;
const STORE_SESSION_HYDRATION_INTERVAL_MS = 60_000;
const STORE_SESSION_REALTIME_HYDRATION_THROTTLE_MS = 2_000;
const STORE_SESSION_INTERACTIVE_HYDRATION_THROTTLE_MS = 1_500;
const STORE_SESSION_ROUTE_REFRESH_THROTTLE_MS = 12_000;
const OPERATIONAL_SYNC_STALE_AFTER_MS = 5 * 60 * 1000;
const OPERATIONAL_SYNC_OFFLINE_ERROR = "offline";
const OPERATIONAL_SYNC_FAILURE_MESSAGE =
  "No se pudo actualizar el estado operativo.";
const VISIBILITY_REFRESH_INSERT_GUARD_MS = 2_000;
const RECOVERY_EFFECTS_SUPPRESSION_MS = 4_000;
const DEBUG_REALTIME = process.env.NODE_ENV === "development";

function formatBusinessWindowRangeLabel(config: BusinessWindowConfig) {
  const formatUnit = (value: number) => String(value).padStart(2, "0");

  return `${formatUnit(config.startHour)}:${formatUnit(config.startMinute)}\u2013${formatUnit(
    config.endHour
  )}:${formatUnit(config.endMinute)}`;
}

function formatSessionStartLabel(start: Date) {
  return `Sesi\u00f3n activa \u00b7 desde ${start.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })}`;
}

// QA temporal:
// startHour: 18,
// startMinute: 0,
// endHour: 2,
// endMinute: 0,
const BUSINESS_WINDOW_CONFIG: BusinessWindowConfig = DEFAULT_BUSINESS_WINDOW_CONFIG;

function debugRealtime(...args: unknown[]) {
  if (DEBUG_REALTIME) {
    console.info(...args);
  }
}

function debugStoreSessionRealtime(...args: unknown[]) {
  if (DEBUG_REALTIME) {
    console.info(...args);
  }
}

type NormalizedError = {
  name?: string;
  message: string;
  stack?: string;
  value?: string;
  status?: number;
  url?: string;
  body?: unknown;
};

async function readResponseError(response: Response) {
  const clonedResponse = response.clone();

  try {
    const rawBody = await clonedResponse.text();

    if (!rawBody) {
      return {
        body: null,
        errorMessage: `HTTP ${response.status} ${response.statusText}`
      };
    }

    try {
      const parsedBody = JSON.parse(rawBody) as {
        error?: string;
        message?: string;
      };

      return {
        body: parsedBody,
        errorMessage:
          parsedBody?.error ??
          parsedBody?.message ??
          `HTTP ${response.status} ${response.statusText}`
      };
    } catch {
      return {
        body: rawBody,
        errorMessage: rawBody
      };
    }
  } catch (error) {
    return {
      body: null,
      errorMessage: normalizeError(error).message
    };
  }
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const errorWithMeta = error as Error & {
      status?: number;
      url?: string;
      body?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: errorWithMeta.status,
      url: errorWithMeta.url,
      body: errorWithMeta.body
    };
  }

  if (typeof error === "string") {
    return {
      message: error
    };
  }

  if (error && typeof error === "object") {
    try {
      const serializedError = JSON.stringify(error);

      if (serializedError && serializedError !== "{}") {
        return {
          message: serializedError,
          value: serializedError
        };
      }
    } catch {
      // Ignore JSON serialization failures and fall through to String().
    }

    return {
      message: String(error),
      value: String(error)
    };
  }

  return {
    message: "Unknown error",
    value: String(error)
  };
}

function resolveOrderId(orderId: string | null, orders: AdminOrderDashboardItem[]) {
  if (!orderId) {
    return null;
  }

  return orders.some((order) => order.id === orderId) ? orderId : null;
}

function buildGlobalPresenceLabel(onlineCount: number) {
  if (onlineCount <= 1) {
    return "Solo vos";
  }

  return `${onlineCount} online`;
}

export default function AdminDashboardOrders({
  orders,
  businessId,
  canUpdateOrders,
  canManageStoreSession = false,
  currentUserId,
  currentUserEmail,
  notificationPreferences,
  currentUserRole,
  initialActiveStoreSession = null,
  initialLastClosedStoreSession = null
}: AdminDashboardOrdersProps) {
  const router = useRouter();
  const { pushToast } = useAdminToast();
  const { permission: browserNotificationPermission } = useBrowserNotificationPermission();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilter = resolveDashboardExecutionFilter(searchParams.get("filter"));
  const initialOrderId = resolveOrderId(searchParams.get("order"), orders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [selectedOrderSeed, setSelectedOrderSeed] = useState<AdminOrderDashboardItem | null>(
    initialOrderId ? orders.find((order) => order.id === initialOrderId) ?? null : null
  );
  const [activeFilter, setActiveFilter] = useState<OrdersFilter>(urlFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [optimisticOrders, setOptimisticOrders] = useState<AdminOrderDashboardItem[]>(
    sortOrdersForOperationalBoard(orders)
  );
  const [activeStoreSessionState, setActiveStoreSessionState] = useState<StoreSession | null>(
    initialActiveStoreSession
  );
  const [lastClosedStoreSessionState, setLastClosedStoreSessionState] = useState<StoreSession | null>(
    initialLastClosedStoreSession
  );
  const [storeSessionError, setStoreSessionError] = useState<string | null>(null);
  const [operationalSyncError, setOperationalSyncError] = useState<string | null>(null);
  const [isManualOperationalResyncing, setIsManualOperationalResyncing] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState(true);
  const [lastSuccessfulOperationalSyncedAt, setLastSuccessfulOperationalSyncedAt] = useState(
    () => Date.now()
  );
  const [syncFreshnessTick, setSyncFreshnessTick] = useState(0);
  const [isStoreSessionPending, startStoreSessionTransition] = useTransition();
  const [pendingStoreSessionAction, setPendingStoreSessionAction] = useState<
    "opening" | "closing" | null
  >(null);
  const [newArrivalOrderIds, setNewArrivalOrderIds] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [manualOrderProducts, setManualOrderProducts] = useState<ManualOrderProductOption[]>([]);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [isRefreshingManualOrderProducts, setIsRefreshingManualOrderProducts] = useState(false);
  const [manualOrderProductsError, setManualOrderProductsError] = useState<string | null>(null);
  const optimisticOrdersRef = useRef(optimisticOrders);
  const getPendingMutationPatchRef = useRef<
    (orderId: string) => PendingOrderMutationPatch | null
  >(() => null);
  const selectedOrderIdRef = useRef(selectedOrderId);
  const newArrivalTimersRef = useRef(new Map<string, number>());
  const newArrivalOrderIdsRef = useRef(new Set<string>());
  const hiddenArrivalOrderIdsRef = useRef(new Set<string>());
  const newOrderSoundPlayedRef = useRef(new Set<string>());
  const newOrderToastShownRef = useRef(new Set<string>());
  const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);
  const storeSessionRealtimeHydrationAtRef = useRef(0);
  const storeSessionInteractiveHydrationAtRef = useRef(0);
  const storeSessionRouteRefreshAtRef = useRef(0);
  const lastRealtimeInsertAtRef = useRef(0);
  const suppressRealtimeEffectsUntilRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const previousVisibilityStateRef = useRef<string | null>(null);
  const previousRealtimeStatusRef = useRef<string>("connecting");
  const currentPresenceSurface: AdminPresenceSurface = selectedOrderId ? "order_modal" : "dashboard";

  useEffect(() => {
    setActiveStoreSessionState(initialActiveStoreSession);
  }, [initialActiveStoreSession]);

  useEffect(() => {
    setLastClosedStoreSessionState(initialLastClosedStoreSession);
  }, [initialLastClosedStoreSession]);

  useEffect(() => {
    const updateOnlineState = () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      setIsBrowserOnline(online);

      if (online) {
        setOperationalSyncError((current) =>
          current === OPERATIONAL_SYNC_OFFLINE_ERROR ? null : current
        );
      }
    };

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSyncFreshnessTick((value) => value + 1);
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const isOperationalSyncing = isManualOperationalResyncing;

  const isOperationalSyncStale = useMemo(() => {
    if (!isBrowserOnline) {
      return false;
    }

    if (isOperationalSyncing) {
      return false;
    }

    if (operationalSyncError) {
      return false;
    }

    void syncFreshnessTick;

    return Date.now() - lastSuccessfulOperationalSyncedAt > OPERATIONAL_SYNC_STALE_AFTER_MS;
  }, [
    isBrowserOnline,
    isOperationalSyncing,
    lastSuccessfulOperationalSyncedAt,
    operationalSyncError,
    syncFreshnessTick
  ]);

  const requestStoreSessionRouteRefresh = useCallback(
    (reason: StoreSessionHydrationReason) => {
      const nowMs = Date.now();

      if (nowMs - storeSessionRouteRefreshAtRef.current < STORE_SESSION_ROUTE_REFRESH_THROTTLE_MS) {
        debugStoreSessionRealtime("[store-sessions-hydration] route refresh skipped by throttle", {
          businessId,
          reason,
          lastRouteRefreshAt: storeSessionRouteRefreshAtRef.current,
          nextAttemptAt: nowMs
        });
        return;
      }

      storeSessionRouteRefreshAtRef.current = nowMs;
      debugStoreSessionRealtime("[store-sessions-hydration] router.refresh()", {
        businessId,
        reason
      });
      router.refresh();
    },
    [businessId, router]
  );

  const hydrateStoreSession = useCallback(
    async (reason: StoreSessionHydrationReason) => {
      if (!businessId) {
        if (DEBUG_REALTIME) {
          console.warn("[store-sessions-hydration] skipped without businessId", {
            reason
          });
        }
        return false;
      }

      const isManualReason = reason === "manual-resync" || reason === "manual-action";

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsBrowserOnline(false);
        return false;
      }

      const nowMs = Date.now();
      const isRealtimeReason = reason === "realtime" || reason === "interval";
      const throttleRef = isRealtimeReason
        ? storeSessionRealtimeHydrationAtRef
        : storeSessionInteractiveHydrationAtRef;
      const throttleMs = isRealtimeReason
        ? STORE_SESSION_REALTIME_HYDRATION_THROTTLE_MS
        : STORE_SESSION_INTERACTIVE_HYDRATION_THROTTLE_MS;

      if (!isManualReason && nowMs - throttleRef.current < throttleMs) {
        debugStoreSessionRealtime("[store-sessions-hydration] skipped by throttle", {
          businessId,
          reason,
          lastHydrationAt: throttleRef.current,
          nextAttemptAt: nowMs
        });
        return false;
      }

      if (!isManualReason) {
        throttleRef.current = nowMs;
      }
      debugStoreSessionRealtime("[store-sessions-hydration] requested", {
        businessId,
        reason
      });

      try {
        const result = await getActiveStoreSessionHydrationAction();

        if (!result.ok) {
          if (DEBUG_REALTIME) {
            console.warn("[store-sessions-hydration] non-redirecting hydration skipped", {
              businessId,
              reason,
              resultReason: result.reason ?? "unknown"
            });
          }
          return false;
        }

        const hydratedSession = result.session ?? null;
        const hydratedLastClosedSession = result.lastClosedSession ?? null;
        setActiveStoreSessionState(hydratedSession);
        setLastClosedStoreSessionState(hydratedLastClosedSession);
        debugStoreSessionRealtime("[store-sessions-hydration] session resolved", {
          businessId,
          reason,
          sessionId: result.session?.id ?? null,
          status: result.session?.status ?? null,
          lastClosedSessionId: result.lastClosedSession?.id ?? null
        });
        debugStoreSessionRealtime("[store-sessions-hydration] state updated", {
          businessId,
          reason,
          hasSession: Boolean(result.session),
          hasLastClosedSession: Boolean(result.lastClosedSession)
        });

        if (reason === "realtime" || reason === "manual-action") {
          requestStoreSessionRouteRefresh(reason);
        }
        return true;
      } catch (error) {
        if (DEBUG_REALTIME) {
          console.warn("[store-sessions-hydration] request failed", {
            businessId,
            reason,
            error
          });
        }
        return false;
      }
    },
    [businessId, requestStoreSessionRouteRefresh]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOperationalMutationBlocked = () => {
      void hydrateStoreSession("manual-action");
    };

    window.addEventListener(
      "orderops:operational-mutation-blocked",
      handleOperationalMutationBlocked
    );

    return () => {
      window.removeEventListener(
        "orderops:operational-mutation-blocked",
        handleOperationalMutationBlocked
      );
    };
  }, [hydrateStoreSession]);

  useAdminStoreSessionRealtime({
    businessId,
    hydrationIntervalMs: STORE_SESSION_HYDRATION_INTERVAL_MS,
    onHydrateRequest: hydrateStoreSession,
    onPayloadFallback: (session) => {
      if (session?.status === "open" && session.closedAt == null) {
        setActiveStoreSessionState(session);
      } else if (session?.status === "closed" && session.closedAt != null) {
        setActiveStoreSessionState(null);
        setLastClosedStoreSessionState(session);
      } else {
        setActiveStoreSessionState(null);
      }

      if (DEBUG_REALTIME) {
        console.warn("[store-sessions-hydration] local state updated from realtime payload fallback", {
          businessId,
          hasSession: Boolean(session),
          sessionId: session?.id ?? null,
          status: session?.status ?? null
        });
      }
    }
  });

  useEffect(() => {
    optimisticOrdersRef.current = optimisticOrders;
  }, [optimisticOrders]);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    newArrivalOrderIdsRef.current = new Set(newArrivalOrderIds);
  }, [newArrivalOrderIds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, LIVE_PRESSURE_TICK_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const ensureNewOrderAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const audio = newOrderAudioRef.current ?? new Audio(NEW_ORDER_SOUND_SRC);

    if (!newOrderAudioRef.current) {
      audio.preload = "auto";
      audio.volume = 0.55;
      newOrderAudioRef.current = audio;
    }

    return audio;
  }, []);

  const playNewOrderSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!getSessionOperationalAudioUnlocked()) {
      debugRealtime("[audio-unlock] session state", {
        sessionAudioUnlocked: false
      });
      debugRealtime("[orders] new order sound: skipped without session unlock", {
        src: NEW_ORDER_SOUND_SRC
      });
      return;
    }

    const audio = ensureNewOrderAudio();

    if (!audio) {
      return;
    }

    debugRealtime("[orders] new order sound: play attempt", {
      src: NEW_ORDER_SOUND_SRC
    });

    audio.currentTime = 0;
    void audio
      .play()
      .then(() => {
        debugRealtime("[orders] new order sound: played", {
          src: NEW_ORDER_SOUND_SRC
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          markOperationalAudioSessionUnlocked(false);
          debugRealtime("[audio-unlock] playback blocked, session invalidated", {
            name: error.name,
            message: error.message
          });
        }

        console.warn("[orders] new order sound: blocked", error);
      });
  }, [ensureNewOrderAudio]);

  const playNewOrderSoundOnce = useCallback(
    (orderId: string) => {
      if (!shouldPlayNewOrderSound(notificationPreferences)) {
        debugRealtime("[orders-realtime] new order sound skipped by preference", {
          businessId,
          orderId
        });
        return false;
      }

      if (newOrderSoundPlayedRef.current.has(orderId)) {
        debugRealtime("[orders-realtime] new order sound skipped duplicate", {
          businessId,
          orderId
        });
        return false;
      }

      newOrderSoundPlayedRef.current.add(orderId);
      playNewOrderSound();
      return true;
    },
    [businessId, notificationPreferences, playNewOrderSound]
  );

  const pushNewOrderToastOnce = useCallback(
    (order: AdminOrderDashboardItem) => {
      if (!shouldShowNewOrderToast(notificationPreferences)) {
        debugRealtime("[orders-realtime] new order toast skipped by preference", {
          businessId,
          orderId: order.id
        });
        return false;
      }

      if (newOrderToastShownRef.current.has(order.id)) {
        debugRealtime("[orders-realtime] new order toast skipped duplicate", {
          businessId,
          orderId: order.id
        });
        return false;
      }

      newOrderToastShownRef.current.add(order.id);
      pushToast({
        tone: "info",
        message: order.customer_short_name
          ? `Nuevo pedido de ${order.customer_short_name}`
          : "Nuevo pedido recibido"
      });

      debugRealtime("[orders-realtime] toast triggered for new order", {
        businessId,
        orderId: order.id
      });
      return true;
    },
    [businessId, notificationPreferences, pushToast]
  );

  const markOrderAsNewArrival = useCallback((orderId: string) => {
    if (!shouldHighlightNewOrder(notificationPreferences)) {
      debugRealtime("[orders-realtime] new order highlight skipped by preference", {
        businessId,
        orderId
      });
      return false;
    }

    if (typeof window === "undefined" || newArrivalOrderIdsRef.current.has(orderId)) {
      return false;
    }

    newArrivalOrderIdsRef.current.add(orderId);
    setNewArrivalOrderIds((currentIds) =>
      currentIds.includes(orderId) ? currentIds : [...currentIds, orderId]
    );

    const existingTimer = newArrivalTimersRef.current.get(orderId);

    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      newArrivalTimersRef.current.delete(orderId);
      newArrivalOrderIdsRef.current.delete(orderId);
      setNewArrivalOrderIds((currentIds) => currentIds.filter((id) => id !== orderId));
    }, NEW_ORDER_HIGHLIGHT_MS);

    newArrivalTimersRef.current.set(orderId, timer);
    return true;
  }, [businessId, notificationPreferences]);

  const triggerNewOrderArrivalEffects = useCallback(
    (order: AdminOrderDashboardItem) => {
      const wasMarkedAsNew = markOrderAsNewArrival(order.id);
      const didToast = pushNewOrderToastOnce(order);
      const didSound = playNewOrderSoundOnce(order.id);
      debugRealtime("[orders-realtime] new order effects triggered", {
        businessId,
        orderId: order.id,
        markedAsNew: wasMarkedAsNew,
        didSound,
        didToast
      });

      return true;
    },
    [businessId, markOrderAsNewArrival, playNewOrderSoundOnce, pushNewOrderToastOnce]
  );

  const guardIncomingDashboardOrderStatus = useCallback(
    (
      orderId: string,
      incomingStatus: AdminOrderDashboardItem["status"],
      traceSource: "optimistic.finalize" | "realtime.apply" | "summary.fetch.success",
      traceReason:
        | "stale-finalize-ignored"
        | "stale-realtime-ignored"
        | "stale-summary-ignored"
    ) => {
      const currentUiStatus =
        optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;
      const pendingExpectedStatus =
        getPendingMutationPatchRef.current(orderId)?.status ?? null;
      const decision = shouldApplyIncomingStatusForOrder({
        currentStatus: currentUiStatus,
        incomingStatus,
        pendingExpectedStatus
      });

      if (decision.shouldApply) {
        return true;
      }

      traceKanbanTransition({
        source: traceSource,
        orderId,
        fromStatus: currentUiStatus,
        toStatus: incomingStatus,
        expectedStatus: pendingExpectedStatus,
        reason: traceReason,
        note: decision.reason
      });

      return false;
    },
    []
  );

  const insertRealtimeOrderIntoState = useCallback(
    (order: AdminOrderDashboardItem) => {
      if (optimisticOrdersRef.current.some((currentOrder) => currentOrder.id === order.id)) {
        debugRealtime("[orders-realtime] new order duplicate ignored", {
          businessId,
          orderId: order.id
        });
        return false;
      }

      const nextOrders = sortOrdersForOperationalBoard([
        ...optimisticOrdersRef.current,
        order
      ]);

      optimisticOrdersRef.current = nextOrders;
      setOptimisticOrders(nextOrders);
      setNow(new Date());
      debugRealtime("[orders-realtime] new order inserted into state", {
        businessId,
        orderId: order.id
      });
      return true;
    },
    [businessId]
  );

  const replaceRealtimeOrderInState = useCallback(
    (order: AdminOrderDashboardItem) => {
      const currentUiStatus =
        optimisticOrdersRef.current.find((currentOrder) => currentOrder.id === order.id)?.status ??
        null;

      if (
        !guardIncomingDashboardOrderStatus(
          order.id,
          order.status,
          "realtime.apply",
          "stale-summary-ignored"
        )
      ) {
        return;
      }

      traceKanbanTransition({
        source: "realtime.apply",
        orderId: order.id,
        fromStatus: currentUiStatus,
        toStatus: order.status,
        note: "summary-replace"
      });

      setOptimisticOrders((currentOrders) => {
        const nextOrders = sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === order.id ? order : currentOrder
          )
        );

        optimisticOrdersRef.current = nextOrders;
        return nextOrders;
      });

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== order.id) {
          return currentSeed;
        }

        return order;
      });

      setNow(new Date());
    },
    [guardIncomingDashboardOrderStatus]
  );

  const fetchDashboardOrderSummary = useCallback(
    async (orderId: string) => {
      traceKanbanTransition({
        source: "summary.fetch.start",
        orderId
      });

      const response = await fetch(`/admin/orders/${orderId}/summary`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin"
      });

      const responseText = await response.text();

      debugRealtime("[orders-realtime] summary response", {
        businessId,
        orderId,
        status: response.status,
        ok: response.ok,
        bodyPreview: responseText.slice(0, 300)
      });

      if (!response.ok) {
        throw new Error(`Summary request failed with ${response.status}`);
      }

      const payload = JSON.parse(responseText) as { order?: AdminOrderDashboardItem };

      if (!payload.order) {
        throw new Error("Summary payload missing order");
      }

      traceKanbanTransition({
        source: "summary.fetch.success",
        orderId,
        toStatus: payload.order.status
      });

      return payload.order;
    },
    [businessId]
  );

  const shouldSuppressRealtimeInsertEffects = useCallback(
    (_receivedAt: number, source: "visible" | "hidden" | "recovery") => {
      return source !== "visible";
    },
    []
  );

  const maybeShowNewOrderBrowserNotification = useCallback(
    (
      order: AdminOrderDashboardItem,
      receivedAt: number,
      source: "visible" | "hidden" | "recovery"
    ) => {
      const isDocumentVisible =
        typeof document === "undefined" ? true : document.visibilityState === "visible";
      const isRecoverySuppressed = receivedAt < suppressRealtimeEffectsUntilRef.current;

      if (
        !canShowBrowserNotification({
          enabled: canUseNewOrderBrowserNotification(
            notificationPreferences,
            browserNotificationPermission
          ),
          isDocumentVisible,
          isLiveInsert: source === "hidden" || source === "visible",
          isRecoverySuppressed,
          permission: browserNotificationPermission,
          role: currentUserRole
        })
      ) {
        debugRealtime("[orders-realtime] browser notification skipped", {
          businessId,
          orderId: order.id,
          permission: browserNotificationPermission,
          preferenceEnabled: notificationPreferences.new_order_browser_notifications_enabled,
          source,
          isDocumentVisible,
          isRecoverySuppressed
        });
        return false;
      }

      if (!claimBrowserNotification(order.id, receivedAt)) {
        debugRealtime("[orders-realtime] browser notification deduped", {
          businessId,
          orderId: order.id
        });
        return false;
      }

      showBrowserNotification(buildNewOrderNotificationPayload(order));
      debugRealtime("[orders-realtime] browser notification shown", {
        businessId,
        orderId: order.id,
        source
      });
      return true;
    },
    [
      browserNotificationPermission,
      businessId,
      currentUserRole,
      notificationPreferences
    ]
  );

  const markHiddenOrderArrival = useCallback(
    (orderId: string) => {
      hiddenArrivalOrderIdsRef.current.add(orderId);
      debugRealtime("[orders-realtime] hidden arrival tracked", {
        businessId,
        orderId
      });
    },
    [businessId]
  );

  const {
    markPendingMutation,
    markPendingAssignmentMutation,
    getPendingMutationPatch,
    hasPendingStatusMutation,
    resolvePendingMutation,
    resolvePendingAssignmentMutation,
    clearPendingMutation,
    realtimeStatus,
    realtimeLabel
  } = useAdminOrdersRealtime({
    businessId,
    onOrderDelete: (deletedOrderId) => {
      setOptimisticOrders((currentOrders) => {
        const nextOrders = sortOrdersForOperationalBoard(
          currentOrders.filter((order) => order.id !== deletedOrderId)
        );

        optimisticOrdersRef.current = nextOrders;
        return nextOrders;
      });

      clearPendingMutation(deletedOrderId);

      if (selectedOrderIdRef.current === deletedOrderId) {
        setSelectedOrderId(null);
        setSelectedOrderSeed(null);

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          params.delete("order");
          const query = params.toString();
          const nextHref = query ? `${pathname}?${query}` : pathname;
          const currentHref = `${pathname}${window.location.search}`;

          if (currentHref !== nextHref) {
            window.history.replaceState(window.history.state, "", nextHref);
          }
        }
      }
    },
    onOrderUpdate: async (row) => {
      const currentUiStatus =
        optimisticOrdersRef.current.find((currentOrder) => currentOrder.id === row.id)?.status ??
        null;

      traceKanbanTransition({
        source: "realtime.apply",
        orderId: row.id,
        fromStatus: currentUiStatus,
        toStatus: row.status ?? null,
        note: "payload-received"
      });

      if (
        row.status &&
        !guardIncomingDashboardOrderStatus(
          row.id,
          row.status,
          "realtime.apply",
          "stale-realtime-ignored"
        )
      ) {
        return;
      }

      try {
        const order = await fetchDashboardOrderSummary(row.id);
        replaceRealtimeOrderInState(order);
        return;
      } catch (error) {
        console.warn("[orders-realtime] failed to fetch updated order summary", {
          businessId,
          orderId: row.id,
          error
        });

        traceKanbanTransition({
          source: "summary.fetch.fallback",
          orderId: row.id,
          toStatus: row.status ?? null
        });
      }

      setOptimisticOrders((currentOrders) => {
        const patchedOrder = currentOrders.find((currentOrder) => currentOrder.id === row.id);
        const nextStatus = row.status ?? patchedOrder?.status ?? null;

        if (
          nextStatus &&
          !guardIncomingDashboardOrderStatus(
            row.id,
            nextStatus,
            "realtime.apply",
            "stale-realtime-ignored"
          )
        ) {
          return currentOrders;
        }

        traceKanbanTransition({
          source: "realtime.apply",
          orderId: row.id,
          fromStatus: patchedOrder?.status ?? null,
          toStatus: nextStatus,
          note: "patch-fallback"
        });

        const nextOrders = sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === row.id
              ? patchDashboardOrderFromRealtime(currentOrder, row)
              : currentOrder
          )
        );

        optimisticOrdersRef.current = nextOrders;
        return nextOrders;
      });

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== row.id) {
          return currentSeed;
        }

        return patchDashboardOrderFromRealtime(currentSeed, row);
      });

      setNow(new Date());
    },
    onOrderInsert: async (row) => {
      const receivedAt = Date.now();
      const isDocumentVisible =
        typeof document === "undefined" ? true : document.visibilityState === "visible";
      const source =
        receivedAt < suppressRealtimeEffectsUntilRef.current
          ? "recovery"
          : isDocumentVisible
            ? "visible"
            : "hidden";

      lastRealtimeInsertAtRef.current = receivedAt;
      debugRealtime("[orders-realtime] new order insert pipeline started", {
        businessId,
        orderId: row.id,
        source
      });

      if (hiddenArrivalOrderIdsRef.current.has(row.id)) {
        debugRealtime("[orders-realtime] new order in-flight duplicate ignored", {
          businessId,
          orderId: row.id
        });
        return;
      }

      const existingOrder = optimisticOrdersRef.current.find(
        (currentOrder) => currentOrder.id === row.id
      );

      if (existingOrder) {
        debugRealtime("[orders-realtime] new order duplicate ignored", {
          businessId,
          orderId: row.id
        });
        return;
      }

      hiddenArrivalOrderIdsRef.current.add(row.id);

      debugRealtime("[orders-realtime] fetching new order summary", {
        businessId,
        orderId: row.id,
        url: `/admin/orders/${row.id}/summary`
      });

      let preserveHiddenArrival = false;

      try {
        const order = await fetchDashboardOrderSummary(row.id);
        const inserted = insertRealtimeOrderIntoState(order);

        if (!inserted) {
          return;
        }

        if (shouldSuppressRealtimeInsertEffects(receivedAt, source)) {
          if (source === "hidden") {
            preserveHiddenArrival = true;
            playNewOrderSoundOnce(order.id);
            markHiddenOrderArrival(order.id);
            maybeShowNewOrderBrowserNotification(order, receivedAt, source);
          }

          debugRealtime("[orders-realtime] new order visible effects suppressed", {
            businessId,
            orderId: row.id,
            source
          });
          return;
        }

        triggerNewOrderArrivalEffects(order);
      } catch (error) {
        console.error("[orders-realtime] failed to fetch new order summary", {
          businessId,
          orderId: row.id,
          error
        });
      } finally {
        if (!preserveHiddenArrival) {
          hiddenArrivalOrderIdsRef.current.delete(row.id);
        }
      }
    }
  });

  getPendingMutationPatchRef.current = getPendingMutationPatch;

  const hasPendingStatusMutationRef = useRef(hasPendingStatusMutation);
  hasPendingStatusMutationRef.current = hasPendingStatusMutation;

  const isOrderStatusPending = useCallback((orderId: string) => {
    return hasPendingStatusMutationRef.current(orderId);
  }, []);

  useEffect(() => {
    const getUiStatus = (orderId: string) =>
      optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;

    traceKanbanReconcileBatch({
      source: "props-sync.before",
      serverOrders: orders.map((order) => ({ id: order.id, status: order.status })),
      getPendingPatch: (orderId) => getPendingMutationPatchRef.current(orderId),
      getUiStatus
    });

    const reconciledOrders = reconcileDashboardOrdersWithPendingMutations(
      orders,
      (orderId) => getPendingMutationPatchRef.current(orderId)
    );

    traceKanbanReconcileBatch({
      source: "props-sync.after",
      serverOrders: orders.map((order) => ({ id: order.id, status: order.status })),
      reconciledOrders: reconciledOrders.map((order) => ({
        id: order.id,
        status: order.status
      })),
      getPendingPatch: (orderId) => getPendingMutationPatchRef.current(orderId),
      getUiStatus
    });

    setOptimisticOrders(sortOrdersForOperationalBoard(reconciledOrders));
  }, [orders]);

  useEffect(() => {
    for (const order of optimisticOrders) {
      const pendingPatch = getPendingMutationPatchRef.current(order.id);

      if (!pendingPatch?.status) {
        continue;
      }

      traceKanbanTransition({
        source: "view-model.render",
        orderId: order.id,
        toStatus: order.status,
        expectedStatus: pendingPatch.status
      });
    }
  }, [optimisticOrders]);

  const { onlineOperators, onlineCount, getOperatorsViewingOrder } =
    useAdminPresence({
    businessId,
    userId: currentUserId,
    userEmail: currentUserEmail,
    role: currentUserRole,
    currentSurface: currentPresenceSurface,
    currentOrderId: selectedOrderId
    });

  const refreshOrdersSilently = useCallback(
    async (
      reason:
        | "reconnect"
        | "visibility"
        | "online"
        | "conflict"
        | "manual-operational-resync"
    ): Promise<boolean> => {
      if (typeof window === "undefined") {
        return false;
      }

      const isManualOperationalResync = reason === "manual-operational-resync";
      const now = Date.now();

      // Recovery refreshes only reconcile data. They must never replay new-order UX effects.
      if (
        !isManualOperationalResync &&
        reason === "visibility" &&
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        debugRealtime("[orders-realtime] visibility refresh skipped while hidden", {
          businessId
        });
        return false;
      }

      if (
        !isManualOperationalResync &&
        (reason === "visibility" || reason === "online" || reason === "reconnect") &&
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        debugRealtime("[orders-realtime] refresh skipped while offline", {
          businessId,
          reason
        });
        return false;
      }

      if (
        !isManualOperationalResync &&
        reason === "online" &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        debugRealtime("[orders-realtime] online refresh skipped while hidden", {
          businessId
        });
        return false;
      }

      if (
        !isManualOperationalResync &&
        reason === "visibility" &&
        now - lastRealtimeInsertAtRef.current < VISIBILITY_REFRESH_INSERT_GUARD_MS
      ) {
        debugRealtime("[orders-realtime] visibility refresh skipped after recent insert", {
          businessId,
          sinceInsertMs: now - lastRealtimeInsertAtRef.current
        });
        return false;
      }

      if (isRefreshingRef.current) {
        debugRealtime("[orders-realtime] refresh skipped in flight", {
          businessId,
          reason
        });
        return false;
      }

      if (
        !isManualOperationalResync &&
        now - lastRefreshAtRef.current < REALTIME_REFRESH_COOLDOWN_MS
      ) {
        debugRealtime("[orders-realtime] refresh skipped cooldown", {
          businessId,
          reason,
          sinceLastRefreshMs: now - lastRefreshAtRef.current
        });
        return false;
      }

      isRefreshingRef.current = true;
      lastRefreshAtRef.current = now;
      if (
        !isManualOperationalResync &&
        (reason === "visibility" || reason === "online" || reason === "reconnect")
      ) {
        suppressRealtimeEffectsUntilRef.current = Math.max(
          suppressRealtimeEffectsUntilRef.current,
          now + RECOVERY_EFFECTS_SUPPRESSION_MS
        );
      }
      debugRealtime(`[orders-realtime] ${reason} refresh triggered`, {
        businessId,
        url: "/admin/dashboard/orders"
      });

      try {
        const refreshUrl = "/admin/dashboard/orders";
        const response = await fetch(refreshUrl, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin"
        });

        if (!response.ok) {
          const responseError = await readResponseError(response);
          throw Object.assign(
            new Error(
              responseError.errorMessage || `Dashboard refresh failed with ${response.status}`
            ),
            {
              status: response.status,
              url: response.url || refreshUrl,
              body: responseError.body
            }
          );
        }

        let payload: {
          orders?: AdminOrderDashboardItem[];
        };

        try {
          payload = (await response.json()) as {
            orders?: AdminOrderDashboardItem[];
          };
        } catch (error) {
          const normalizedError = normalizeError(error);

          throw new Error(
            `Dashboard refresh returned invalid JSON: ${normalizedError.message}`
          );
        }

        if (!Array.isArray(payload.orders)) {
          throw new Error("Dashboard refresh payload missing orders");
        }

        const getUiStatus = (orderId: string) =>
          optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;

        traceKanbanReconcileBatch({
          source: "silent-refresh.before",
          reason,
          serverOrders: payload.orders.map((order) => ({ id: order.id, status: order.status })),
          getPendingPatch: getPendingMutationPatch,
          getUiStatus
        });

        const reconciledOrders = sortOrdersForOperationalBoard(
          reconcileDashboardOrdersWithPendingMutations(payload.orders, getPendingMutationPatch)
        );

        traceKanbanReconcileBatch({
          source: "silent-refresh.after",
          reason,
          serverOrders: payload.orders.map((order) => ({ id: order.id, status: order.status })),
          reconciledOrders: reconciledOrders.map((order) => ({
            id: order.id,
            status: order.status
          })),
          getPendingPatch: getPendingMutationPatch,
          getUiStatus
        });

        setOptimisticOrders(reconciledOrders);
        optimisticOrdersRef.current = reconciledOrders;
        setNow(new Date());

        const activeSelectedOrderId = selectedOrderIdRef.current;

        if (activeSelectedOrderId) {
          const nextSelectedOrder =
            reconciledOrders.find((order) => order.id === activeSelectedOrderId) ?? null;

          setSelectedOrderSeed(nextSelectedOrder);
        }

        return true;
      } catch (error) {
        const normalizedError = normalizeError(error);
        const refreshLog = {
          businessId,
          reason,
          url: normalizedError.url ?? "/admin/dashboard/orders",
          status: normalizedError.status,
          body: normalizedError.body,
          message: normalizedError.message,
          name: normalizedError.name,
          stack: normalizedError.stack,
          value: normalizedError.value
        };

        if (normalizedError.name === "AbortError") {
          debugRealtime("[orders-realtime] silent refresh aborted", refreshLog);
          return false;
        }

        const logMethod =
          reason === "visibility" || reason === "online" || reason === "reconnect"
            ? console.warn
            : console.error;

        logMethod("[orders-realtime] silent refresh failed", refreshLog);
        return false;
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [businessId, getPendingMutationPatch]
  );

  useEffect(() => {
    const timers = newArrivalTimersRef.current;
    const arrivalIds = newArrivalOrderIdsRef.current;

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }

      timers.clear();
      arrivalIds.clear();
    };
  }, []);

  useEffect(() => {
    const previousStatus = previousRealtimeStatusRef.current;

    if (
      realtimeStatus === "live" &&
      (previousStatus === "reconnecting" ||
        previousStatus === "disconnected" ||
        previousStatus === "error")
    ) {
      suppressRealtimeEffectsUntilRef.current = Math.max(
        suppressRealtimeEffectsUntilRef.current,
        Date.now() + RECOVERY_EFFECTS_SUPPRESSION_MS
      );
      void refreshOrdersSilently("reconnect");
    }

    previousRealtimeStatusRef.current = realtimeStatus;
  }, [realtimeStatus, refreshOrdersSilently]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    previousVisibilityStateRef.current = document.visibilityState;

    const handleVisibilityChange = () => {
      const previousVisibilityState = previousVisibilityStateRef.current;
      const nextVisibilityState = document.visibilityState;

      previousVisibilityStateRef.current = nextVisibilityState;

      if (previousVisibilityState === "hidden" && nextVisibilityState === "visible") {
        const hiddenArrivalOrderIds = [...hiddenArrivalOrderIdsRef.current];

        hiddenArrivalOrderIdsRef.current.clear();

        for (const orderId of hiddenArrivalOrderIds) {
          markOrderAsNewArrival(orderId);
        }

        suppressRealtimeEffectsUntilRef.current = Math.max(
          suppressRealtimeEffectsUntilRef.current,
          Date.now() + RECOVERY_EFFECTS_SUPPRESSION_MS
        );
        void refreshOrdersSilently("visibility");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [markOrderAsNewArrival, refreshOrdersSilently]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      suppressRealtimeEffectsUntilRef.current = Math.max(
        suppressRealtimeEffectsUntilRef.current,
        Date.now() + RECOVERY_EFFECTS_SUPPRESSION_MS
      );
      void refreshOrdersSilently("online");
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [refreshOrdersSilently]);

  const liveOperationalNow = useMemo(() => {
    if (
      !activeStoreSessionState ||
      activeStoreSessionState.status !== "open" ||
      activeStoreSessionState.closedAt != null
    ) {
      return now;
    }

    const latestOrderCreatedAt = getLatestOrderCreatedAt(optimisticOrders);

    if (!latestOrderCreatedAt || latestOrderCreatedAt <= now) {
      return now;
    }

    return new Date(latestOrderCreatedAt.getTime() + 1_000);
  }, [activeStoreSessionState, now, optimisticOrders]);

  const operationalWindow = useMemo<OperationalWindow>(
    () =>
      getOperationalWindow(
        liveOperationalNow,
        BUSINESS_WINDOW_CONFIG,
        activeStoreSessionState,
        lastClosedStoreSessionState
      ),
    [activeStoreSessionState, lastClosedStoreSessionState, liveOperationalNow]
  );

  const orderActionPolicy = useMemo<DashboardActionPolicy>(
    () => resolveDashboardActionPolicy(operationalWindow.source),
    [operationalWindow.source]
  );

  const canMutateOrdersInScope = canUpdateOrders && orderActionPolicy.canMutateOrders;
  const canUseQuickActionsInScope = canUpdateOrders && orderActionPolicy.canUseQuickActions;
  const canCreateManualOrder =
    canUpdateOrders &&
    orderActionPolicy.canMutateOrders &&
    operationalWindow.source === "store-session" &&
    Boolean(activeStoreSessionState);

  const manualOrderDisabledReason = useMemo(() => {
    if (!canUpdateOrders) {
      return "No ten\u00e9s permisos para crear pedidos.";
    }

    if (orderActionPolicy.isReviewingLastClosedSession) {
      return "Est\u00e1s revisando una sesi\u00f3n cerrada. Abr\u00ed una nueva sesi\u00f3n para crear pedidos.";
    }

    if (operationalWindow.source !== "store-session" || !activeStoreSessionState) {
      return "Abr\u00ed una sesi\u00f3n activa para crear pedidos.";
    }

    return null;
  }, [
    activeStoreSessionState,
    canUpdateOrders,
    operationalWindow.source,
    orderActionPolicy.isReviewingLastClosedSession
  ]);

  const boardViewModel = useMemo(
    () =>
      buildDashboardBoardViewModel({
        orders: optimisticOrders,
        activeFilter,
        searchQuery,
        operationalWindow,
        now,
        currentUserId
      }),
    [activeFilter, currentUserId, now, operationalWindow, optimisticOrders, searchQuery]
  );

  const {
    visibleOperationalOrders,
    filteredOrders,
    groupedOrders,
    parsedSearchQuery,
    renderMode,
    isOperationalEmpty,
    hasVisibleOrders,
    hasSearchQuery,
    shouldRenderPersistentEmptyKanban
  } = boardViewModel;

  const isSearchEmptyKanban =
    renderMode === "kanban" && hasSearchQuery && filteredOrders.length === 0;

  const shouldRenderKanbanBoard = renderMode === "kanban" || shouldRenderPersistentEmptyKanban;

  const businessWindowRangeLabel = useMemo(
    () => formatBusinessWindowRangeLabel(BUSINESS_WINDOW_CONFIG),
    []
  );

  const hasActiveStoreSession = useMemo(
    () =>
      Boolean(
        activeStoreSessionState &&
          activeStoreSessionState.status === "open" &&
          activeStoreSessionState.closedAt == null
      ),
    [activeStoreSessionState]
  );

  const operationalWindowLabel = useMemo(() => {
    if (operationalWindow.source === "store-session") {
      return formatSessionStartLabel(operationalWindow.start);
    }

    if (operationalWindow.source === "last-closed-store-session") {
      return formatLastClosedSessionReviewLabel(operationalWindow.start, operationalWindow.end);
    }

    return `Jornada actual \u00b7 ${businessWindowRangeLabel}`;
  }, [businessWindowRangeLabel, operationalWindow]);

  const hasActiveOrdersInProgress = useMemo(
    () =>
      visibleOperationalOrders.some(
        (order) =>
          order.status === "pending" ||
          order.status === "preparing" ||
          order.status === "ready"
      ),
    [visibleOperationalOrders]
  );

  const operationalMetrics = useMemo(
    () => buildOperationalMetrics(filteredOrders, now),
    [filteredOrders, now]
  );

  const orderRiskAssessments = useMemo(
    () =>
      filteredOrders.map((order) =>
        assessOrderRisk({
          order,
          operationalMetrics,
          now
        })
      ),
    [filteredOrders, now, operationalMetrics]
  );

  const orderRiskAssessmentMap = useMemo(
    () => new Map(orderRiskAssessments.map((assessment) => [assessment.orderId, assessment])),
    [orderRiskAssessments]
  );

  const queuePressure = useMemo(
    () => buildOrdersQueuePressure(filteredOrders, now),
    [filteredOrders, now]
  );

  const selectedOrder = useMemo(
    () => {
      if (!selectedOrderId) {
        return null;
      }

      const liveOrder = optimisticOrders.find((order) => order.id === selectedOrderId) ?? null;

      if (liveOrder) {
        return liveOrder;
      }

      if (selectedOrderSeed?.id === selectedOrderId) {
        return selectedOrderSeed;
      }

      return null;
    },
    [optimisticOrders, selectedOrderId, selectedOrderSeed]
  );

  const globalPresenceLabel = useMemo(
    () => buildGlobalPresenceLabel(onlineCount),
    [onlineCount]
  );

  const shouldShowGlobalPresence = onlineCount > 0;

  const topBarRealtimeLabel = useMemo(() => {
    if (realtimeStatus === "error" && shouldShowGlobalPresence) {
      return "En vivo";
    }

    return realtimeLabel;
  }, [realtimeLabel, realtimeStatus, shouldShowGlobalPresence]);

  const dashboardTopSectionViewModel = useMemo(
    () =>
      buildDashboardTopSectionViewModel({
        orders: visibleOperationalOrders,
        operationalWindow,
        now,
        liveLabel: topBarRealtimeLabel,
        realtimeStatus,
        onlineCount,
        presenceLabel: globalPresenceLabel
      }),
    [
      globalPresenceLabel,
      now,
      onlineCount,
      operationalWindow,
      realtimeStatus,
      topBarRealtimeLabel,
      visibleOperationalOrders
    ]
  );

  const selectedOrderPresenceNames = useMemo(
    () => (selectedOrderId ? getOperatorsViewingOrder(selectedOrderId).map((entry) => entry.name) : []),
    [getOperatorsViewingOrder, selectedOrderId]
  );

  const selectedOrderPresenceLabel = useMemo(
    () =>
      buildOrderContextualPresenceLabel({
        viewingNames: selectedOrderPresenceNames,
        assignedTo: selectedOrder?.assigned_to ?? null,
        onlineOperators
      }),
    [onlineOperators, selectedOrder?.assigned_to, selectedOrderPresenceNames]
  );

  const selectedOrderAssignmentLabel = useMemo(
    () =>
      selectedOrder
        ? buildOrderAssignmentOwnerLabel({
            assignedTo: selectedOrder.assigned_to,
            currentUserId,
            onlineOperators
          })
        : null,
    [currentUserId, onlineOperators, selectedOrder]
  );

  const filteredLaneMetrics = useMemo(() => {
    if (activeFilter === "all" || !hasVisibleOrders) {
      return null;
    }

    return buildOperationalLaneMetrics({
      laneKey: activeFilter as OperationalLaneKey,
      orders: filteredOrders,
      allOrders: filteredOrders,
      riskAssessments: orderRiskAssessmentMap,
      operationalMetrics,
      queuePressure,
      now,
      currentUserId
    });
  }, [
    activeFilter,
    currentUserId,
    filteredOrders,
    hasVisibleOrders,
    now,
    operationalMetrics,
    orderRiskAssessmentMap,
    queuePressure
  ]);

  const scrollStorageKey = useCallback(
    (filter: OrdersFilter) => `${DASHBOARD_SCROLL_KEY}:${pathname}:${filter}`,
    [pathname]
  );

  const buildDashboardHref = useCallback(
    (filter: OrdersFilter, orderId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (filter === "all") {
        params.delete("filter");
      } else {
        params.set("filter", filter);
      }

      if (orderId) {
        params.set("order", orderId);
      } else {
        params.delete("order");
      }

      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams]
  );

  const persistScrollPosition = useCallback(
    (filter: OrdersFilter = activeFilter) => {
      if (typeof window === "undefined") {
        return;
      }

      sessionStorage.setItem(scrollStorageKey(filter), String(window.scrollY));
    },
    [activeFilter, scrollStorageKey]
  );

  useEffect(() => {
    if (activeFilter !== urlFilter) {
      setActiveFilter(urlFilter);
    }
  }, [activeFilter, urlFilter]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const orderIdFromLocation = resolveOrderId(params.get("order"), optimisticOrders);

      setSelectedOrderId(orderIdFromLocation);
      setSelectedOrderSeed(
        orderIdFromLocation
          ? optimisticOrders.find((order) => order.id === orderIdFromLocation) ?? null
          : null
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [optimisticOrders]);

  useEffect(() => {
    if (!canUpdateOrders) {
      setManualOrderProducts([]);
      setManualOrderProductsError(null);
      return undefined;
    }

    let cancelled = false;

    void getManualOrderProductOptionsAction().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setManualOrderProducts(result.products);
        setManualOrderProductsError(null);
        return;
      }

      setManualOrderProductsError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [businessId, canUpdateOrders]);

  const refreshManualOrderProducts = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!canUpdateOrders) {
        setManualOrderProducts([]);
        setManualOrderProductsError(null);
        return false;
      }

      setIsRefreshingManualOrderProducts(true);

      try {
        const result = await getManualOrderProductOptionsAction();

        if (result.ok) {
          setManualOrderProducts(result.products);
          setManualOrderProductsError(null);
          return true;
        }

        setManualOrderProductsError(result.error);

        if (!options?.silent) {
          pushToast({
            tone: "info",
            message: result.error
          });
        }

        return false;
      } catch {
        const message = "No pudimos actualizar los productos disponibles.";

        setManualOrderProductsError(message);

        if (!options?.silent) {
          pushToast({
            tone: "info",
            message
          });
        }

        return false;
      } finally {
        setIsRefreshingManualOrderProducts(false);
      }
    },
    [canUpdateOrders, pushToast]
  );

  const handleManualOrderCreated = useCallback(
    (order: AdminOrderDashboardItem) => {
      insertRealtimeOrderIntoState(order);
      pushToast({
        tone: "success",
        message: "Pedido creado."
      });

      void fetch(`/api/internal/orders/${encodeURIComponent(order.id)}/push`, {
        method: "POST",
        credentials: "same-origin",
        keepalive: true
      }).catch(() => {
        // Push delivery is best-effort. Never block manual order success on this call.
      });
    },
    [insertRealtimeOrderIntoState, pushToast]
  );

  const handleOpenManualOrderModal = useCallback(() => {
    if (!canCreateManualOrder) {
      pushToast({
        tone: "info",
        message:
          manualOrderDisabledReason ?? "Abr\u00ed una sesi\u00f3n activa para crear pedidos."
      });
      return;
    }

    setIsManualOrderModalOpen(true);
    void refreshManualOrderProducts({ silent: true });
  }, [canCreateManualOrder, manualOrderDisabledReason, pushToast, refreshManualOrderProducts]);

  const handleManualOrderSessionBlocked = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orderops:operational-mutation-blocked"));
    }
  }, []);

  const applyOptimisticStatusChange = useCallback(
    (
      orderId: string,
      nextStatus: AdminOrderDashboardItem["status"],
      previousStatus: AdminOrderDashboardItem["status"]
    ) => {
      if (!canMutateOrdersInScope) {
        pushToast({
          tone: "info",
          message: DASHBOARD_REVIEW_MODE_MUTATION_HINT
        });
        return;
      }

      markPendingMutation(orderId, nextStatus, previousStatus);

      const currentUiStatus =
        optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;

      traceKanbanTransition({
        source: "optimistic.apply",
        orderId,
        fromStatus: currentUiStatus,
        toStatus: nextStatus,
        previousStatus,
        expectedStatus: nextStatus
      });

      setOptimisticOrders((currentOrders) =>
        sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId
              ? patchAdminOrderDashboardItemStatus(currentOrder, nextStatus)
              : currentOrder
          )
        )
      );

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== orderId) {
          return currentSeed;
        }

        return patchAdminOrderDashboardItemStatus(currentSeed, nextStatus);
      });
    },
    [canMutateOrdersInScope, markPendingMutation, pushToast]
  );

  const rollbackOptimisticStatusChange = useCallback(
    (orderId: string, previousStatus: AdminOrderDashboardItem["status"]) => {
      const currentUiStatus =
        optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;

      traceKanbanTransition({
        source: "optimistic.rollback",
        orderId,
        fromStatus: currentUiStatus,
        toStatus: previousStatus,
        previousStatus,
        reason: "server-error"
      });

      setOptimisticOrders((currentOrders) =>
        sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId
              ? patchAdminOrderDashboardItemStatus(currentOrder, previousStatus)
              : currentOrder
          )
        )
      );

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== orderId) {
          return currentSeed;
        }

        return patchAdminOrderDashboardItemStatus(currentSeed, previousStatus);
      });
    },
    []
  );

  const finalizeOptimisticStatusChange = useCallback(
    async (
      orderId: string,
      resolution?: {
        succeeded: boolean;
        finalStatus?: AdminOrderDashboardItem["status"];
      }
    ) => {
      const currentUiStatus =
        optimisticOrdersRef.current.find((order) => order.id === orderId)?.status ?? null;
      const pendingExpectedStatus =
        getPendingMutationPatchRef.current(orderId)?.status ?? null;

      traceKanbanTransition({
        source: "optimistic.finalize",
        orderId,
        fromStatus: currentUiStatus,
        finalStatus: resolution?.finalStatus ?? null,
        expectedStatus: pendingExpectedStatus,
        reason: resolution?.succeeded === false ? "failed" : "success",
        note: "before-resolve"
      });

      const pendingResolution = resolvePendingMutation(orderId, {
        succeeded: resolution?.succeeded ?? true,
        serverStatus: resolution?.finalStatus
      });

      if (pendingResolution.staleIgnored) {
        traceKanbanTransition({
          source: "optimistic.finalize",
          orderId,
          fromStatus: currentUiStatus,
          finalStatus: resolution?.finalStatus ?? null,
          expectedStatus: pendingExpectedStatus,
          reason: "stale-finalize-ignored"
        });
        return;
      }

      if (pendingResolution.finalStatus) {
        if (
          !guardIncomingDashboardOrderStatus(
            orderId,
            pendingResolution.finalStatus,
            "optimistic.finalize",
            "stale-finalize-ignored"
          )
        ) {
          return;
        }

        traceKanbanTransition({
          source: "optimistic.finalize",
          orderId,
          fromStatus: currentUiStatus,
          toStatus: pendingResolution.finalStatus,
          finalStatus: pendingResolution.finalStatus,
          reason: pendingResolution.needsRefresh ? "needs-refresh" : "applied"
        });

        setOptimisticOrders((currentOrders) =>
          sortOrdersForOperationalBoard(
            currentOrders.map((currentOrder) =>
              currentOrder.id === orderId
                ? patchAdminOrderDashboardItemStatus(currentOrder, pendingResolution.finalStatus!)
                : currentOrder
            )
          )
        );

        setSelectedOrderSeed((currentSeed) => {
          if (!currentSeed || currentSeed.id !== orderId) {
            return currentSeed;
          }

          return patchAdminOrderDashboardItemStatus(currentSeed, pendingResolution.finalStatus!);
        });
      }

      if (pendingResolution.needsRefresh) {
        await refreshOrdersSilently("conflict");
      }
    },
    [guardIncomingDashboardOrderStatus, refreshOrdersSilently, resolvePendingMutation]
  );

  const applyOptimisticAssignmentChange = useCallback(
    (
      orderId: string,
      nextAssignment: AdminOrderAssignment,
      previousAssignment: AdminOrderAssignment
    ) => {
      if (!canMutateOrdersInScope) {
        pushToast({
          tone: "info",
          message: DASHBOARD_REVIEW_MODE_MUTATION_HINT
        });
        return;
      }

      markPendingAssignmentMutation(orderId, nextAssignment, previousAssignment);
      setOptimisticOrders((currentOrders) =>
        sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId
              ? patchAdminOrderDashboardItemAssignment(currentOrder, nextAssignment)
              : currentOrder
          )
        )
      );

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== orderId) {
          return currentSeed;
        }

        return patchAdminOrderDashboardItemAssignment(currentSeed, nextAssignment);
      });
    },
    [canMutateOrdersInScope, markPendingAssignmentMutation, pushToast]
  );

  const rollbackOptimisticAssignmentChange = useCallback(
    (orderId: string, previousAssignment: AdminOrderAssignment) => {
      clearPendingMutation(orderId, "assignment");
      setOptimisticOrders((currentOrders) =>
        sortOrdersForOperationalBoard(
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId
              ? patchAdminOrderDashboardItemAssignment(currentOrder, previousAssignment)
              : currentOrder
          )
        )
      );

      setSelectedOrderSeed((currentSeed) => {
        if (!currentSeed || currentSeed.id !== orderId) {
          return currentSeed;
        }

        return patchAdminOrderDashboardItemAssignment(currentSeed, previousAssignment);
      });
    },
    [clearPendingMutation]
  );

  const finalizeOptimisticAssignmentChange = useCallback(
    async (
      orderId: string,
      resolution?: {
        succeeded: boolean;
        finalAssignment?: AdminOrderAssignment;
      }
    ) => {
      const pendingResolution = resolvePendingAssignmentMutation(orderId, {
        succeeded: resolution?.succeeded ?? Boolean(resolution?.finalAssignment),
        serverAssignment: resolution?.finalAssignment
      });

      if (pendingResolution.finalAssignment) {
        setOptimisticOrders((currentOrders) =>
          sortOrdersForOperationalBoard(
            currentOrders.map((currentOrder) =>
              currentOrder.id === orderId
                ? patchAdminOrderDashboardItemAssignment(
                    currentOrder,
                    pendingResolution.finalAssignment!
                  )
                : currentOrder
            )
          )
        );

        setSelectedOrderSeed((currentSeed) => {
          if (!currentSeed || currentSeed.id !== orderId) {
            return currentSeed;
          }

          return patchAdminOrderDashboardItemAssignment(
            currentSeed,
            pendingResolution.finalAssignment!
          );
        });
      }

      if (pendingResolution.needsRefresh) {
        await refreshOrdersSilently("conflict");
      }
    },
    [refreshOrdersSilently, resolvePendingAssignmentMutation]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let frame: number | null = null;

    const handleScroll = () => {
      if (frame !== null) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = null;
        persistScrollPosition();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      persistScrollPosition();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [persistScrollPosition]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedScroll = sessionStorage.getItem(scrollStorageKey(activeFilter));

    if (!savedScroll) {
      return;
    }

    const top = Number(savedScroll);

    if (!Number.isFinite(top)) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeFilter, scrollStorageKey]);

  const handleFilterChange = useCallback(
    (filter: OrdersFilter) => {
      if (filter === activeFilter) {
        return;
      }

      persistScrollPosition(activeFilter);
      setActiveFilter(filter);
      router.replace(buildDashboardHref(filter, selectedOrderId), { scroll: false });
    },
    [
      activeFilter,
      buildDashboardHref,
      persistScrollPosition,
      router,
      selectedOrderId
    ]
  );

  const handleFilterMenuSelect = useCallback(
    (filter: OrdersFilter) => {
      if (filter === activeFilter) {
        return;
      }

      handleFilterChange(filter);
    },
    [activeFilter, handleFilterChange]
  );

  const searchHasValue = parsedSearchQuery.normalized.length > 0;

  const dashboardExecutionToolbarViewModel = useMemo(
    () =>
      buildDashboardExecutionToolbarViewModel({
        activeFilter,
        operationalWindowLabel,
        hasActiveStoreSession,
        canManageStoreSession,
        businessId,
        isStoreSessionPending,
        pendingStoreSessionAction,
        storeSessionError,
        isOnline: isBrowserOnline,
        isOperationalSyncing,
        operationalSyncError,
        isOperationalSyncStale
      }),
    [
      activeFilter,
      operationalWindowLabel,
      hasActiveStoreSession,
      canManageStoreSession,
      businessId,
      isStoreSessionPending,
      pendingStoreSessionAction,
      storeSessionError,
      isBrowserOnline,
      isOperationalSyncing,
      operationalSyncError,
      isOperationalSyncStale
    ]
  );

  const handleOpenStoreSession = useCallback(() => {
    if (!canManageStoreSession || isStoreSessionPending || hasActiveStoreSession) {
      return;
    }

    setStoreSessionError(null);
    setPendingStoreSessionAction("opening");
    startStoreSessionTransition(async () => {
      try {
        const result = await openStoreSessionAction();

        if (result.error || !result.success) {
          setStoreSessionError(
            result.error ?? "No pudimos abrir la sesi\u00f3n del negocio."
          );
          return;
        }

        setActiveStoreSessionState(result.session ?? null);
        await hydrateStoreSession("manual-action");
      } finally {
        setPendingStoreSessionAction(null);
      }
    });
  }, [
    canManageStoreSession,
    hasActiveStoreSession,
    hydrateStoreSession,
    isStoreSessionPending,
    startStoreSessionTransition
  ]);

  const handleCloseStoreSession = useCallback(() => {
    if (!canManageStoreSession || isStoreSessionPending || !hasActiveStoreSession) {
      return;
    }

    const sessionId = activeStoreSessionState?.id;

    if (!sessionId) {
      return;
    }

    if (
      hasActiveOrdersInProgress &&
      typeof window !== "undefined" &&
      !window.confirm("Hay pedidos activos en curso. \u00bfCerrar la sesi\u00f3n igual?")
    ) {
      return;
    }

    setStoreSessionError(null);
    setPendingStoreSessionAction("closing");
    startStoreSessionTransition(async () => {
      try {
        const result = await closeStoreSessionAction(sessionId);

        if (result.error || !result.success) {
          setStoreSessionError(
            result.error ?? "No pudimos cerrar la sesi\u00f3n del negocio."
          );
          return;
        }

        setActiveStoreSessionState(null);
        if (result.session) {
          setLastClosedStoreSessionState(result.session);
        }
        await hydrateStoreSession("manual-action");
      } finally {
        setPendingStoreSessionAction(null);
      }
    });
  }, [
    activeStoreSessionState?.id,
    canManageStoreSession,
    hasActiveOrdersInProgress,
    hasActiveStoreSession,
    hydrateStoreSession,
    isStoreSessionPending,
    startStoreSessionTransition
  ]);

  const handleManualOperationalResync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsBrowserOnline(false);
      setOperationalSyncError(OPERATIONAL_SYNC_OFFLINE_ERROR);
      return;
    }

    if (isManualOperationalResyncing) {
      return;
    }

    debugStoreSessionRealtime("[operational-sync] manual resync clicked", {
      businessId
    });

    setOperationalSyncError(null);
    setIsManualOperationalResyncing(true);

    try {
      const sessionOk = await hydrateStoreSession("manual-resync");
      const ordersOk = await refreshOrdersSilently("manual-operational-resync");

      if (!sessionOk || !ordersOk) {
        setOperationalSyncError(OPERATIONAL_SYNC_FAILURE_MESSAGE);
        return;
      }

      setLastSuccessfulOperationalSyncedAt(Date.now());
      setOperationalSyncError(null);
    } catch (error) {
      setOperationalSyncError(
        error instanceof Error ? error.message : OPERATIONAL_SYNC_FAILURE_MESSAGE
      );
    } finally {
      setIsManualOperationalResyncing(false);
    }
  }, [businessId, hydrateStoreSession, isManualOperationalResyncing, refreshOrdersSilently]);

  const openOrder = useCallback(
    (order: AdminOrderDashboardItem) => {
      persistScrollPosition();
      setSelectedOrderId(order.id);
      setSelectedOrderSeed(order);
      window.history.pushState(window.history.state, "", buildDashboardHref(activeFilter, order.id));
    },
    [activeFilter, buildDashboardHref, persistScrollPosition]
  );

  const closeOrder = useCallback(() => {
    persistScrollPosition();
    setSelectedOrderId(null);
    setSelectedOrderSeed(null);
    const cleanHref = buildDashboardHref(activeFilter, null);
    const currentHref = `${pathname}${window.location.search}`;

    if (currentHref === cleanHref) {
      return;
    }

    window.history.replaceState(window.history.state, "", cleanHref);
  }, [activeFilter, buildDashboardHref, pathname, persistScrollPosition]);

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, orderId: string) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const order = optimisticOrdersRef.current.find((candidate) => candidate.id === orderId);

        if (order) {
          openOrder(order);
        }
      }
    },
    [openOrder]
  );

  const renderOrderCard = (order: AdminOrderDashboardItem) => (
    <OrderCard
      key={order.id}
      order={order}
      currentUserId={currentUserId}
      onlineOperators={onlineOperators}
      riskAssessment={orderRiskAssessmentMap.get(order.id)}
      isNewArrival={newArrivalOrderIds.includes(order.id)}
      canUpdateOrders={canMutateOrdersInScope}
      canUseQuickActions={canUseQuickActionsInScope}
      isOrderStatusPending={isOrderStatusPending}
      now={now}
      onOpen={openOrder}
      onCardKeyDown={handleCardKeyDown}
      onOptimisticStatusChange={applyOptimisticStatusChange}
      onOptimisticStatusRollback={rollbackOptimisticStatusChange}
      onOptimisticStatusSettled={finalizeOptimisticStatusChange}
    />
  );

  const renderKanbanBoard = () => (
    <DashboardKanbanBoard
      groupedOrders={groupedOrders}
      currentUserId={currentUserId}
      onlineOperators={onlineOperators}
      orderRiskAssessmentMap={orderRiskAssessmentMap}
      newArrivalOrderIds={newArrivalOrderIds}
      canUpdateOrders={canMutateOrdersInScope}
      now={now}
      onOpen={openOrder}
      onCardKeyDown={handleCardKeyDown}
      isOrderStatusPending={isOrderStatusPending}
      onOptimisticStatusChange={applyOptimisticStatusChange}
      onOptimisticStatusRollback={rollbackOptimisticStatusChange}
      onOptimisticStatusSettled={finalizeOptimisticStatusChange}
      emptyLaneLabel={hasSearchQuery ? "Sin resultados" : "Sin pedidos"}
      isSearchEmpty={isSearchEmptyKanban}
      isEmptyBoard={shouldRenderPersistentEmptyKanban}
    />
  );

  const renderOperationalEmptyState = () => (
    <div className={surfaceStyles.emptyContext} aria-live="polite">
      <div className={surfaceStyles.emptyContextCopy}>
        <strong>
          {renderMode === "day-scope-empty"
            ? operationalWindow.source === "last-closed-store-session"
              ? "No hay pedidos en la \u00faltima sesi\u00f3n cerrada"
              : operationalWindow.source === "store-session"
                ? "No hay pedidos en la sesi\u00f3n activa"
                : "No hay pedidos en la jornada actual"
            : "Todavia no hay pedidos"}
        </strong>
        <p>{"Los nuevos ingresos aparecer\u00e1n ac\u00e1 autom\u00e1ticamente."}</p>
      </div>
    </div>
  );

  const renderFilteredEmptyState = () => (
    <div className={filterStyles["admin-orders-filter-empty"]} aria-live="polite">
      {searchHasValue ? (
        <>
          <p>No hay pedidos que coincidan con esta busqueda o filtro.</p>
          <span>Proba con otra combinacion o limpia la busqueda para volver al tablero completo.</span>
        </>
      ) : (
        <>
          <p>No hay pedidos en este filtro.</p>
          <span>Cambia el filtro o volve a &quot;Todos&quot; para revisar el resto de la operacion.</span>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className={styles["admin-orders-structure"]}>
        <div className={styles.dashboardMobileTopSection}>
          <DashboardMobileOverview viewModel={dashboardTopSectionViewModel} />
        </div>

        <section
          className={`${styles["admin-orders-section"]} ${styles["admin-orders-section--overview"]} ${styles.dashboardTopSection}${
            isOperationalEmpty ? ` ${styles["admin-orders-section--empty-overview"]}` : ""
          }`}
        >
          <DashboardOverview viewModel={dashboardTopSectionViewModel} />
        </section>

        <section
          className={`${styles["admin-orders-section"]} ${styles.executionSection} ${styles.dashboardExecutionSection}${
            isOperationalEmpty ? ` ${styles["admin-orders-section--empty-execution"]}` : ""
          }`}
          data-section="execution"
        >
          <div className={styles.dashboardExecutionChrome}>
            <DashboardToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewModel={dashboardExecutionToolbarViewModel}
              reviewModeHint={
                orderActionPolicy.isReviewingLastClosedSession ? "Modo revisión" : null
              }
              onFilterSelect={handleFilterMenuSelect}
              onOpenStoreSession={handleOpenStoreSession}
              onCloseStoreSession={handleCloseStoreSession}
              onManualOperationalResync={handleManualOperationalResync}
              showManualOrderButton={canUpdateOrders}
              canCreateManualOrder={canCreateManualOrder}
              onCreateManualOrder={handleOpenManualOrderModal}
              manualOrderDisabledReason={manualOrderDisabledReason}
              isKanbanBoardVisible={shouldRenderKanbanBoard}
            />
          </div>

          <div className={styles["admin-orders-execution-flow"]}>
            {shouldRenderKanbanBoard ? (
              renderKanbanBoard()
            ) : renderMode === "operational-empty" || renderMode === "day-scope-empty" ? (
              renderOperationalEmptyState()
            ) : renderMode === "filtered-empty" ? (
              renderFilteredEmptyState()
            ) : (
              <>
                {filteredLaneMetrics ? <LaneMetricsLayer metrics={filteredLaneMetrics} /> : null}
                <div className={listStyles.listWrapper}>
                  {filteredOrders.map((order) => renderOrderCard(order))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {selectedOrder ? (
        <AdminOrderWorkspaceModal
          order={selectedOrder}
          isOpen
          activeFilter={activeFilter}
          onClose={closeOrder}
          dashboardHref={buildDashboardHref(activeFilter, null)}
          canUpdateOrders={canUpdateOrders}
          orderActionPolicy={orderActionPolicy}
          currentUserId={currentUserId}
          operationalMetrics={operationalMetrics}
          assignmentLabel={selectedOrderAssignmentLabel}
          orderPresenceLabel={selectedOrderPresenceLabel}
          orderPresenceNames={selectedOrderPresenceNames}
          onOptimisticStatusChange={applyOptimisticStatusChange}
          onOptimisticStatusRollback={rollbackOptimisticStatusChange}
          onOptimisticStatusSettled={finalizeOptimisticStatusChange}
          onOptimisticAssignmentChange={applyOptimisticAssignmentChange}
          onOptimisticAssignmentRollback={rollbackOptimisticAssignmentChange}
          onOptimisticAssignmentSettled={finalizeOptimisticAssignmentChange}
        />
      ) : null}

      <ManualOrderModal
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        onCreated={handleManualOrderCreated}
        onSessionMutationBlocked={handleManualOrderSessionBlocked}
        canCreateOrder={canCreateManualOrder}
        products={manualOrderProducts}
        isProductsLoading={isRefreshingManualOrderProducts}
        productsError={manualOrderProductsError}
        onRefreshProducts={() => {
          void refreshManualOrderProducts();
        }}
      />
    </>
  );
}
