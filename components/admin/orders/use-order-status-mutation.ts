"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/[id]/actions";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import { buildOrderStatusSuccessMessage } from "@/lib/orders/presenter";
import { isSessionMutationBlockedCode } from "@/lib/store-sessions/types";
import type { OrderStatus } from "@/types/database";

function notifySessionMutationBlocked(onSessionMutationBlocked?: () => void) {
  onSessionMutationBlocked?.();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orderops:operational-mutation-blocked"));
  }
}

export type OrderStatusMutationOptions = {
  orderId: string;
  initialStatus: OrderStatus;
  canChangeStatus?: boolean;
  readOnlyReason?: string;
  onSessionMutationBlocked?: () => void;
  onSuccess?: (nextStatus: OrderStatus) => void;
  onOptimisticStatusChange?: (nextStatus: OrderStatus, previousStatus: OrderStatus) => void;
  onOptimisticStatusRollback?: (previousStatus: OrderStatus) => void;
  onOptimisticStatusSettled?: (resolution?: {
    succeeded: boolean;
    finalStatus?: OrderStatus;
    event?: AdminOrderTimelineEvent | null;
  }) => void | Promise<void>;
};

export function useOrderStatusMutation({
  orderId,
  initialStatus,
  canChangeStatus = true,
  onSessionMutationBlocked,
  onSuccess,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled
}: OrderStatusMutationOptions) {
  const { pushToast } = useAdminToast();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const submitStatusChange = useCallback(
    (nextStatus: OrderStatus) => {
      if (!canChangeStatus || isPending) {
        return;
      }

      const previousStatus = initialStatus;

      if (nextStatus === previousStatus) {
        pushToast({
          tone: "info",
          message: "No hubo cambios para guardar"
        });
        return;
      }

      onOptimisticStatusChange?.(nextStatus, previousStatus);

      startTransition(async () => {
        let resolution: {
          succeeded: boolean;
          finalStatus?: OrderStatus;
          event?: AdminOrderTimelineEvent | null;
        } = {
          succeeded: false
        };

        try {
          const formData = new FormData();
          formData.set("order_id", orderId);
          formData.set("status", nextStatus);

          const result = await updateOrderStatusAction({}, formData);

          if (result?.error) {
            onOptimisticStatusRollback?.(previousStatus);
            setSelectedStatus(previousStatus);
            if (isSessionMutationBlockedCode(result.code)) {
              notifySessionMutationBlocked(onSessionMutationBlocked);
            }
            pushToast({
              tone: "error",
              message: result.error
            });
            return;
          }

          if (result?.changed === false) {
            pushToast({
              tone: "info",
              message: result.message ?? "No hubo cambios para guardar"
            });
          }

          resolution = {
            succeeded: result?.changed !== false,
            finalStatus: result.order?.status ?? nextStatus,
            event: result.event ?? null
          };
          const finalStatus = resolution.finalStatus ?? nextStatus;

          if (result?.changed !== false) {
            pushToast({
              tone: "success",
              message: buildOrderStatusSuccessMessage(finalStatus)
            });
            onSuccess?.(finalStatus);
          }
        } catch {
          onOptimisticStatusRollback?.(previousStatus);
          setSelectedStatus(previousStatus);
          pushToast({
            tone: "error",
            message: "No pudimos actualizar el pedido"
          });
        } finally {
          await onOptimisticStatusSettled?.(resolution);
        }
      });
    },
    [
      canChangeStatus,
      initialStatus,
      isPending,
      onOptimisticStatusChange,
      onOptimisticStatusRollback,
      onOptimisticStatusSettled,
      onSessionMutationBlocked,
      onSuccess,
      orderId,
      pushToast
    ]
  );

  const submitManualChange = useCallback(() => {
    submitStatusChange(selectedStatus);
  }, [selectedStatus, submitStatusChange]);

  return {
    selectedStatus,
    setSelectedStatus,
    isPending,
    submitStatusChange,
    submitManualChange
  };
}
