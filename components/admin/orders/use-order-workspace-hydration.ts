"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOrderDashboardItem, AdminOrderDetail } from "@/lib/orders/admin";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import {
  buildAdminOrderInitialDetail,
  type AdminOrderWorkspaceData
} from "@/lib/orders/workspace";

type WorkspaceResponse = {
  order: AdminOrderDetail;
};

const workspaceOrderCache = new Map<string, AdminOrderWorkspaceData>();

type UseOrderWorkspaceHydrationArgs = {
  order: AdminOrderDashboardItem | null;
  isOpen: boolean;
};

type UseOrderWorkspaceHydrationResult = {
  displayOrder: AdminOrderWorkspaceData | null;
  detail: AdminOrderWorkspaceData | null;
  initialDetail: AdminOrderWorkspaceData | null;
  loading: boolean;
  error: string | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  appendTimelineEvent: (event: AdminOrderTimelineEvent) => void;
  updateWorkspaceDetail: (nextDetail: AdminOrderWorkspaceData) => void;
};

export function useOrderWorkspaceHydration({
  order,
  isOpen
}: UseOrderWorkspaceHydrationArgs): UseOrderWorkspaceHydrationResult {
  const [detail, setDetail] = useState<AdminOrderWorkspaceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedDetail = order ? workspaceOrderCache.get(order.id) ?? null : null;
  const initialDetail = useMemo(
    () => (order ? buildAdminOrderInitialDetail(order, cachedDetail) : null),
    [cachedDetail, order]
  );
  const activeDetail = detail?.id === order?.id ? detail : null;
  const displayOrder = activeDetail ?? initialDetail;
  const hasUsableSeed = Boolean(initialDetail);

  const updateWorkspaceDetail = useCallback(
    (nextDetail: AdminOrderWorkspaceData) => {
      if (!order) {
        return;
      }

      workspaceOrderCache.set(order.id, nextDetail);
      setDetail(nextDetail);
    },
    [order]
  );

  const appendTimelineEvent = useCallback(
    (event: AdminOrderTimelineEvent) => {
      if (!order) {
        return;
      }

      setDetail((currentDetail) => {
        const baseDetail =
          currentDetail?.id === order.id
            ? currentDetail
            : buildAdminOrderInitialDetail(order, currentDetail ?? initialDetail ?? null);
        const currentEvents = baseDetail.order_events ?? [];

        if (currentEvents.some((entry) => entry.id === event.id)) {
          return baseDetail;
        }

        const nextDetail = {
          ...baseDetail,
          order_events: [...currentEvents, event]
        };

        workspaceOrderCache.set(order.id, nextDetail);
        return nextDetail;
      });
    },
    [initialDetail, order]
  );

  const loadOrder = useCallback(
    async (signal?: AbortSignal, options?: { force?: boolean }) => {
      if (!order) {
        return;
      }

      if (!options?.force) {
        const existingOrder = workspaceOrderCache.get(order.id);

        if (existingOrder) {
          setDetail(buildAdminOrderInitialDetail(order, existingOrder));
          const isCacheFresh =
            existingOrder.status === order.status &&
            existingOrder.total_price === order.total_price &&
            existingOrder.notes === order.notes &&
            existingOrder.assigned_to === order.assigned_to &&
            existingOrder.assigned_at === order.assigned_at;

          if (isCacheFresh) {
            setLoading(false);
            setError(null);
            return;
          }
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/admin/orders/${order.id}/workspace`, {
          method: "GET",
          cache: "no-store",
          signal
        });

        const rawPayload = await response.text();

        if (!response.ok) {
          console.error("[workspace-hydration] non-ok response", {
            orderId: order.id,
            status: response.status,
            statusText: response.statusText,
            body: rawPayload
          });

          throw new Error("No pudimos actualizar el pedido.");
        }

        let payload: WorkspaceResponse;

        try {
          payload = JSON.parse(rawPayload) as WorkspaceResponse;
        } catch (parseError) {
          console.error("[workspace-hydration] invalid json", {
            orderId: order.id,
            parseError,
            body: rawPayload
          });
          throw new Error("No pudimos actualizar el pedido.");
        }

        if (!payload?.order) {
          console.error("[workspace-hydration] missing order payload", {
            orderId: order.id,
            payload
          });
          throw new Error("No pudimos actualizar el pedido.");
        }

        workspaceOrderCache.set(order.id, payload.order);
        setDetail(payload.order);
        setError(null);
      } catch (fetchError) {
        if (signal?.aborted) {
          return;
        }

        console.error("[workspace-hydration] request failed", {
          orderId: order.id,
          error: fetchError
        });

        if (!hasUsableSeed) {
          setError(
            fetchError instanceof Error ? fetchError.message : "No pudimos cargar el pedido."
          );
        } else {
          setError(null);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [hasUsableSeed, order]
  );

  const refresh = useCallback(
    (options?: { force?: boolean }) => loadOrder(undefined, options),
    [loadOrder]
  );

  useEffect(() => {
    if (!isOpen || !order) {
      return undefined;
    }

    const controller = new AbortController();
    void loadOrder(controller.signal);
    return () => controller.abort();
  }, [isOpen, loadOrder, order]);

  useEffect(() => {
    if (!order) {
      return;
    }

    setDetail((currentDetail) => {
      if (!currentDetail || currentDetail.id !== order.id) {
        return currentDetail;
      }

      const mergedDetail = buildAdminOrderInitialDetail(order, currentDetail);
      workspaceOrderCache.set(order.id, mergedDetail);
      return mergedDetail;
    });
  }, [order]);

  return {
    displayOrder,
    detail: activeDetail,
    initialDetail,
    loading,
    error,
    refresh,
    appendTimelineEvent,
    updateWorkspaceDetail
  };
}
