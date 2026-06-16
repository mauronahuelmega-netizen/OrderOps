"use client";

import { useEffect, useState, useTransition } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import Button from "@/components/ui/Button";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/[id]/actions";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import { buildOrderStatusSuccessMessage } from "@/lib/orders/presenter";
import { isSessionMutationBlockedCode } from "@/lib/store-sessions/types";
import styles from "./status-form.module.css";

function notifySessionMutationBlocked(onSessionMutationBlocked?: () => void) {
  onSessionMutationBlocked?.();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orderops:operational-mutation-blocked"));
  }
}

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

type StatusFormProps = {
  orderId: string;
  initialStatus: OrderStatus;
  variant?: "default" | "modal" | "page";
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

export default function StatusForm({
  orderId,
  initialStatus,
  variant = "default",
  canChangeStatus = true,
  readOnlyReason,
  onSessionMutationBlocked,
  onSuccess,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled
}: StatusFormProps) {
  const { pushToast } = useAdminToast();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canChangeStatus) {
      return;
    }

    const nextStatus = selectedStatus;
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
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        styles["admin-status-form"],
        variant === "modal" ? styles["admin-status-form--modal"] : null
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label className="admin-field">
        <span>Estado</span>
        <select
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
          disabled={isPending || !canChangeStatus}
          data-syncing={isPending ? "true" : undefined}
          aria-readonly={!canChangeStatus ? true : undefined}
        >
          <option value="pending">Pendiente</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Listo</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </label>

      {canChangeStatus ? (
        <Button
          type="submit"
          className="admin-primary-button"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Sincronizando..." : "Guardar estado"}
        </Button>
      ) : readOnlyReason ? (
        <p className={styles["admin-status-form__read-only-note"]}>{readOnlyReason}</p>
      ) : null}
    </form>
  );
}
