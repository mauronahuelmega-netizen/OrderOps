"use client";

import { useEffect, useMemo, useRef, useState, useCallback, type MutableRefObject } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import {
  buildPendingOrderMutationPatch,
  isIncomingStatusStaleAgainstAuthority,
  resolvePendingAssignmentFromState,
  resolvePendingStatusFromState,
  shouldSuppressRealtimeUpdateForPendingMutation,
  type PendingOrderMutationKind,
  type PendingOrderMutationPatch,
  type PendingOrderMutationResolution,
  type PendingOrderMutationState
} from "@/lib/orders/dashboard-order-reconciliation";
import {
  isOrderRealtimePayloadForBusiness,
  type AdminOrderRealtimeRow
} from "@/lib/orders/realtime";
import { traceKanbanTransition } from "@/lib/orders/kanban-transition-trace";

type UseAdminOrdersRealtimeProps = {
  businessId: string;
  onOrderUpdate: (row: AdminOrderRealtimeRow) => void;
  onOrderInsert?: (row: AdminOrderRealtimeRow) => void;
  onOrderDelete?: (orderId: string) => void;
};

export type PendingOrderMutationResolveResult = {
  conflict: boolean;
  finalStatus?: AdminOrderRealtimeRow["status"] | null;
  finalAssignment?: AdminOrderAssignment | null;
  needsRefresh: boolean;
  staleIgnored?: boolean;
};

export type AdminOrdersRealtimeHealth =
  | "connecting"
  | "live"
  | "reconnecting"
  | "disconnected"
  | "error";

const PENDING_MUTATION_TTL_MS = 8000;
const DEBUG_REALTIME = process.env.NODE_ENV === "development";

function debugRealtime(...args: unknown[]) {
  if (DEBUG_REALTIME) {
    console.info(...args);
  }
}

function mapRealtimeHealth(status: string): AdminOrdersRealtimeHealth {
  switch (status) {
    case "SUBSCRIBED":
      return "live";
    case "CHANNEL_ERROR":
      return "error";
    case "TIMED_OUT":
      return "reconnecting";
    case "CLOSED":
      return "disconnected";
    default:
      return "connecting";
  }
}

function getRealtimeLabel(status: AdminOrdersRealtimeHealth) {
  switch (status) {
    case "live":
      return "En vivo";
    case "reconnecting":
      return "Reconectando";
    case "disconnected":
      return "Sin conexion";
    case "error":
      return "Error";
    default:
      return "Conectando";
  }
}

function createMutationId(orderId: string) {
  return `${orderId}:${Date.now()}`;
}

function getActivePendingMutation(
  pendingMutationsRef: MutableRefObject<Map<string, PendingOrderMutationState>>,
  orderId: string
) {
  const pendingMutation = pendingMutationsRef.current.get(orderId);

  if (!pendingMutation) {
    return null;
  }

  const isExpired = Date.now() - pendingMutation.startedAt > PENDING_MUTATION_TTL_MS;

  if (isExpired) {
    if (pendingMutation.status) {
      traceKanbanTransition({
        source: "pending.expired",
        orderId,
        expectedStatus: pendingMutation.status.expectedStatus,
        previousStatus: pendingMutation.status.previousStatus,
        mutationId: pendingMutation.mutationId,
        pendingAgeMs: Date.now() - pendingMutation.startedAt
      });
    }

    pendingMutationsRef.current.delete(orderId);
    return null;
  }

  return pendingMutation;
}

function upsertPendingMutation(
  pendingMutationsRef: MutableRefObject<Map<string, PendingOrderMutationState>>,
  orderId: string,
  updater: (current: PendingOrderMutationState | undefined) => PendingOrderMutationState
) {
  const nextMutation = updater(pendingMutationsRef.current.get(orderId));
  pendingMutationsRef.current.set(orderId, nextMutation);
  return nextMutation.mutationId;
}

function clearPendingMutationKind(
  pendingMutationsRef: MutableRefObject<Map<string, PendingOrderMutationState>>,
  orderId: string,
  kind?: PendingOrderMutationKind
) {
  if (!kind) {
    pendingMutationsRef.current.delete(orderId);
    return;
  }

  const pendingMutation = pendingMutationsRef.current.get(orderId);

  if (!pendingMutation) {
    return;
  }

  if (kind === "status") {
    delete pendingMutation.status;
  } else {
    delete pendingMutation.assignment;
  }

  if (!pendingMutation.status && !pendingMutation.assignment) {
    pendingMutationsRef.current.delete(orderId);
    return;
  }

  pendingMutationsRef.current.set(orderId, pendingMutation);
}

export function useAdminOrdersRealtime({
  businessId,
  onOrderUpdate,
  onOrderInsert,
  onOrderDelete
}: UseAdminOrdersRealtimeProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const onOrderUpdateRef = useRef(onOrderUpdate);
  const onOrderInsertRef = useRef(onOrderInsert);
  const onOrderDeleteRef = useRef(onOrderDelete);
  const pendingMutationsRef = useRef<Map<string, PendingOrderMutationState>>(new Map());
  const [hasMounted, setHasMounted] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<AdminOrdersRealtimeHealth>("connecting");
  const [isBrowserOnline, setIsBrowserOnline] = useState(true);

  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    onOrderInsertRef.current = onOrderInsert;
  }, [onOrderInsert]);

  useEffect(() => {
    onOrderDeleteRef.current = onOrderDelete;
  }, [onOrderDelete]);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setHasMounted(true);
    setIsBrowserOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      setIsBrowserOnline(true);
      debugRealtime("[orders-realtime] browser online", {
        businessId
      });
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      debugRealtime("[orders-realtime] browser offline", {
        businessId
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [businessId]);

  useEffect(() => {
    const channelName = `admin-orders:${businessId}`;

    debugRealtime("[orders-realtime] mount", {
      businessId,
      channelName
    });

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          debugRealtime("[orders-realtime] insert received", {
            businessId,
            orderId: payload.new?.id ?? null,
            payloadBusinessId: payload.new?.business_id ?? null
          });

          if (!isOrderRealtimePayloadForBusiness(payload, businessId)) {
            debugRealtime("[orders-realtime] ignored insert by business filter", {
              businessId,
              payloadBusinessId: payload.new?.business_id ?? null
            });
            return;
          }

          const row = payload.new as Partial<AdminOrderRealtimeRow>;

          if (!row?.id) {
            return;
          }

          onOrderInsertRef.current?.(row as AdminOrderRealtimeRow);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          debugRealtime("[orders-realtime] payload", {
            businessId,
            eventType: payload.eventType,
            payloadBusinessId: payload.new?.business_id ?? payload.old?.business_id ?? null,
            orderId: payload.new?.id ?? payload.old?.id ?? null,
            newStatus: payload.new?.status ?? null,
            oldStatus: payload.old?.status ?? null,
            newAssignedTo: payload.new?.assigned_to ?? null,
            oldAssignedTo: payload.old?.assigned_to ?? null
          });

          if (!isOrderRealtimePayloadForBusiness(payload, businessId)) {
            debugRealtime("[orders-realtime] ignored payload by business filter", {
              businessId,
              payloadBusinessId:
                payload.new?.business_id ?? payload.old?.business_id ?? null
            });
            return;
          }

          const row = payload.new as Partial<AdminOrderRealtimeRow>;

          if (!row?.id) {
            return;
          }

          const pendingMutation = getActivePendingMutation(pendingMutationsRef, row.id);

          if (pendingMutation) {
            const decision = shouldSuppressRealtimeUpdateForPendingMutation(
              row as AdminOrderRealtimeRow,
              pendingMutation
            );

            pendingMutationsRef.current.set(row.id, pendingMutation);

            if (decision === "suppress") {
              const statusEcho =
                pendingMutation.status &&
                pendingMutation.status.expectedStatus === row.status;
              const assignmentEcho =
                pendingMutation.assignment &&
                (row.assigned_to ?? null) ===
                  (pendingMutation.assignment.expectedAssignment.assigned_to ?? null);

              traceKanbanTransition({
                source: "realtime.suppressed",
                orderId: row.id,
                expectedStatus: pendingMutation.status?.expectedStatus ?? null,
                toStatus: row.status ?? null,
                externalStatus: pendingMutation.status?.externalStatus ?? null,
                mutationId: pendingMutation.mutationId,
                reason: statusEcho || assignmentEcho ? "expected-echo" : "conflict"
              });

              debugRealtime("[orders-realtime] pending mutation update suppressed", {
                businessId,
                orderId: row.id,
                mutationId: pendingMutation.mutationId,
                statusEcho: Boolean(statusEcho),
                assignmentEcho: Boolean(assignmentEcho),
                externalStatus: pendingMutation.status?.externalStatus ?? null,
                externalAssignedTo:
                  pendingMutation.assignment?.externalAssignment?.assigned_to ?? null
              });
              return;
            }
          }

          traceKanbanTransition({
            source: "realtime.payload",
            orderId: row.id,
            toStatus: row.status ?? null
          });

          onOrderUpdateRef.current(row as AdminOrderRealtimeRow);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          if (!isOrderRealtimePayloadForBusiness(payload, businessId)) {
            return;
          }

          const deletedOrderId = payload.old?.id;

          if (!deletedOrderId) {
            return;
          }

          pendingMutationsRef.current.delete(deletedOrderId);

          debugRealtime("[orders-realtime] delete received", {
            businessId,
            orderId: deletedOrderId
          });

          onOrderDeleteRef.current?.(deletedOrderId);
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(mapRealtimeHealth(status));
        debugRealtime("[orders-realtime] subscribe status", {
          businessId,
          channelName,
          status
        });
      });

    return () => {
      setRealtimeStatus("disconnected");
      void supabase.removeChannel(channel);
    };
  }, [businessId, supabase]);

  const markPendingStatusMutation = (
    orderId: string,
    expectedStatus: AdminOrderRealtimeRow["status"],
    previousStatus: AdminOrderRealtimeRow["status"]
  ) => {
    const mutationId = upsertPendingMutation(pendingMutationsRef, orderId, (current) => ({
      startedAt: Date.now(),
      mutationId: createMutationId(orderId),
      status: {
        expectedStatus,
        previousStatus
      },
      assignment: current?.assignment
    }));

    debugRealtime("[orders-realtime] pending status mutation started", {
      businessId,
      orderId,
      mutationId,
      expectedStatus,
      previousStatus
    });

    traceKanbanTransition({
      source: "pending.mark",
      orderId,
      previousStatus,
      expectedStatus,
      toStatus: expectedStatus,
      mutationId
    });

    return mutationId;
  };

  const markPendingAssignmentMutation = (
    orderId: string,
    expectedAssignment: AdminOrderAssignment,
    previousAssignment: AdminOrderAssignment
  ) => {
    const mutationId = upsertPendingMutation(pendingMutationsRef, orderId, (current) => ({
      startedAt: Date.now(),
      mutationId: createMutationId(orderId),
      status: current?.status,
      assignment: {
        expectedAssignment,
        previousAssignment
      }
    }));

    debugRealtime("[orders-realtime] pending assignment mutation started", {
      businessId,
      orderId,
      mutationId,
      expectedAssignedTo: expectedAssignment.assigned_to,
      previousAssignedTo: previousAssignment.assigned_to
    });

    return mutationId;
  };

  const markPendingMutation = markPendingStatusMutation;

  const clearPendingMutation = (orderId: string, kind?: PendingOrderMutationKind) => {
    const pendingMutation = pendingMutationsRef.current.get(orderId);

    if (pendingMutation?.status && (!kind || kind === "status")) {
      traceKanbanTransition({
        source: "pending.clear",
        orderId,
        expectedStatus: pendingMutation.status.expectedStatus,
        previousStatus: pendingMutation.status.previousStatus,
        mutationId: pendingMutation.mutationId,
        reason: kind ?? "all"
      });
    }

    clearPendingMutationKind(pendingMutationsRef, orderId, kind);
  };

  const getPendingMutationPatch = (orderId: string): PendingOrderMutationPatch | null => {
    const pendingMutation = getActivePendingMutation(pendingMutationsRef, orderId);
    return buildPendingOrderMutationPatch(pendingMutation);
  };

  const getPendingMutationStatus = (orderId: string) => {
    return getPendingMutationPatch(orderId)?.status ?? null;
  };

  const hasPendingStatusMutation = useCallback((orderId: string) => {
    return Boolean(getActivePendingMutation(pendingMutationsRef, orderId)?.status);
  }, []);

  const resolvePendingStatusMutation = (
    orderId: string,
    resolution: PendingOrderMutationResolution
  ): PendingOrderMutationResolveResult => {
    const pendingMutation = getActivePendingMutation(pendingMutationsRef, orderId);

    if (!pendingMutation?.status) {
      return {
        conflict: false,
        finalStatus: resolution.serverStatus ?? null,
        needsRefresh: false
      };
    }

    const expectedStatus = pendingMutation.status.expectedStatus;

    if (
      resolution.succeeded &&
      resolution.serverStatus &&
      resolution.serverStatus !== expectedStatus &&
      isIncomingStatusStaleAgainstAuthority(resolution.serverStatus, expectedStatus)
    ) {
      traceKanbanTransition({
        source: "pending.resolve",
        orderId,
        expectedStatus,
        previousStatus: pendingMutation.status.previousStatus,
        finalStatus: resolution.serverStatus,
        mutationId: pendingMutation.mutationId,
        reason: "stale-finalize-ignored"
      });

      return {
        conflict: false,
        needsRefresh: false,
        finalStatus: null,
        staleIgnored: true
      };
    }

    const result = resolvePendingStatusFromState(pendingMutation, resolution);

    if (
      result.finalStatus &&
      isIncomingStatusStaleAgainstAuthority(result.finalStatus, expectedStatus)
    ) {
      traceKanbanTransition({
        source: "pending.resolve",
        orderId,
        expectedStatus,
        previousStatus: pendingMutation.status.previousStatus,
        finalStatus: result.finalStatus,
        mutationId: pendingMutation.mutationId,
        reason: "stale-finalize-ignored"
      });

      return {
        conflict: false,
        needsRefresh: false,
        finalStatus: null,
        staleIgnored: true
      };
    }

    clearPendingMutationKind(pendingMutationsRef, orderId, "status");

    traceKanbanTransition({
      source: "pending.resolve",
      orderId,
      expectedStatus: pendingMutation.status.expectedStatus,
      previousStatus: pendingMutation.status.previousStatus,
      finalStatus: result.finalStatus ?? resolution.serverStatus ?? null,
      externalStatus: pendingMutation.status.externalStatus ?? null,
      mutationId: pendingMutation.mutationId,
      reason: resolution.succeeded ? "succeeded" : "failed"
    });

    debugRealtime("[orders-realtime] pending status mutation resolved", {
      businessId,
      orderId,
      mutationId: pendingMutation.mutationId,
      succeeded: resolution.succeeded,
      finalStatus: result.finalStatus ?? null,
      needsRefresh: result.needsRefresh
    });

    return result;
  };

  const resolvePendingAssignmentMutation = (
    orderId: string,
    resolution: PendingOrderMutationResolution
  ): PendingOrderMutationResolveResult => {
    const pendingMutation = getActivePendingMutation(pendingMutationsRef, orderId);

    if (!pendingMutation?.assignment) {
      return {
        conflict: false,
        finalAssignment: resolution.serverAssignment ?? null,
        needsRefresh: false
      };
    }

    const result = resolvePendingAssignmentFromState(pendingMutation, resolution);
    clearPendingMutationKind(pendingMutationsRef, orderId, "assignment");

    debugRealtime("[orders-realtime] pending assignment mutation resolved", {
      businessId,
      orderId,
      mutationId: pendingMutation.mutationId,
      succeeded: resolution.succeeded,
      finalAssignedTo: result.finalAssignment?.assigned_to ?? null,
      needsRefresh: result.needsRefresh
    });

    return result;
  };

  const resolvePendingMutation = resolvePendingStatusMutation;

  const resolvedRealtimeStatus =
    !hasMounted ? "connecting" : isBrowserOnline ? realtimeStatus : "disconnected";

  return {
    markPendingMutation,
    markPendingStatusMutation,
    markPendingAssignmentMutation,
    clearPendingMutation,
    getPendingMutationPatch,
    getPendingMutationStatus,
    hasPendingStatusMutation,
    resolvePendingMutation,
    resolvePendingStatusMutation,
    resolvePendingAssignmentMutation,
    realtimeStatus: resolvedRealtimeStatus,
    realtimeLabel: getRealtimeLabel(resolvedRealtimeStatus),
    isRealtimeLive: resolvedRealtimeStatus === "live"
  };
}
