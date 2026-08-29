"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import { useOrderStatusMutation } from "@/components/admin/orders/use-order-status-mutation";
import type { OrderStatus } from "@/types/database";
import styles from "./status-form.module.css";

type StatusFormProps = {
  orderId: string;
  initialStatus: OrderStatus;
  variant?: "default" | "modal" | "page" | "workstation";
  /** Presentation-only: keep the accessible field label, hide the visible duplicate. */
  hideFieldLabel?: boolean;
  canChangeStatus?: boolean;
  readOnlyReason?: string;
  onSessionMutationBlocked?: () => void;
  onSuccess?: (nextStatus: OrderStatus) => void;
  onOptimisticStatusChange?: (nextStatus: OrderStatus, previousStatus: OrderStatus) => void;
  onOptimisticStatusRollback?: (previousStatus: OrderStatus) => void;
  onOptimisticStatusSettled?: (resolution?: {
    succeeded: boolean;
    finalStatus?: OrderStatus;
    event?: import("@/lib/orders/events.shared").AdminOrderTimelineEvent | null;
  }) => void | Promise<void>;
  mutation?: ReturnType<typeof useOrderStatusMutation>;
};

export default function StatusForm({
  orderId,
  initialStatus,
  variant = "default",
  hideFieldLabel = false,
  canChangeStatus = true,
  readOnlyReason,
  onSessionMutationBlocked,
  onSuccess,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled,
  mutation: externalMutation
}: StatusFormProps) {
  const internalMutation = useOrderStatusMutation({
    orderId,
    initialStatus,
    canChangeStatus,
    onSessionMutationBlocked,
    onSuccess,
    onOptimisticStatusChange,
    onOptimisticStatusRollback,
    onOptimisticStatusSettled
  });

  const mutation = externalMutation ?? internalMutation;
  const isWorkstation = variant === "workstation";
  const showFieldLabel = !hideFieldLabel && !isWorkstation;
  const [isCancellationConfirmationOpen, setIsCancellationConfirmationOpen] = useState(false);
  const hasManualChange = mutation.selectedStatus !== initialStatus;
  const isSaveDisabled = mutation.isPending || !canChangeStatus || !hasManualChange;

  useEffect(() => {
    setIsCancellationConfirmationOpen(false);
  }, [orderId]);

  useEffect(() => {
    if (mutation.selectedStatus !== "cancelled") {
      setIsCancellationConfirmationOpen(false);
    }
  }, [mutation.selectedStatus]);

  useEffect(() => {
    if (initialStatus === "cancelled") {
      setIsCancellationConfirmationOpen(false);
    }
  }, [initialStatus]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canChangeStatus || mutation.isPending || !hasManualChange) {
      return;
    }

    if (mutation.selectedStatus === "cancelled" && initialStatus !== "cancelled") {
      setIsCancellationConfirmationOpen(true);
      return;
    }

    mutation.submitManualChange();
  };

  const handleStatusSelectChange = (nextStatus: OrderStatus) => {
    mutation.setSelectedStatus(nextStatus);

    if (nextStatus !== "cancelled") {
      setIsCancellationConfirmationOpen(false);
    }
  };

  const handleDismissCancellation = () => {
    if (mutation.isPending) {
      return;
    }

    setIsCancellationConfirmationOpen(false);
    mutation.setSelectedStatus(initialStatus);
  };

  const handleConfirmCancellation = () => {
    if (mutation.isPending || !canChangeStatus) {
      return;
    }

    mutation.submitStatusChange("cancelled");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        styles["admin-status-form"],
        variant === "modal" ? styles["admin-status-form--modal"] : null,
        isWorkstation ? styles["admin-status-form--workstation-manual"] : null,
        isCancellationConfirmationOpen ? styles["admin-status-form--confirming-cancel"] : null
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label className={`admin-field ${styles["admin-status-form__field"]}`}>
        <span className={showFieldLabel ? undefined : "sr-only"}>
          {isWorkstation ? "Estado manual" : "Estado"}
        </span>
        <span className={styles["admin-status-form__select-shell"]}>
          <select
            name="status"
            className={styles["admin-status-form__select"]}
            value={mutation.selectedStatus}
            onChange={(event) => handleStatusSelectChange(event.target.value as OrderStatus)}
            disabled={mutation.isPending || !canChangeStatus}
            data-syncing={mutation.isPending ? "true" : undefined}
            aria-readonly={!canChangeStatus ? true : undefined}
          >
            <option value="pending">Pendiente</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Listo</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <ChevronDown
            className={styles["admin-status-form__select-chevron"]}
            aria-hidden="true"
            size={16}
            strokeWidth={2}
          />
        </span>
      </label>

      {canChangeStatus && isCancellationConfirmationOpen ? (
        <div className={styles["admin-status-form__cancel-confirm"]} role="group" aria-labelledby="status-cancel-confirm-title">
          <h4 id="status-cancel-confirm-title" className={styles["admin-status-form__cancel-confirm-title"]}>
            Cancelar pedido
          </h4>
          <p className={styles["admin-status-form__cancel-confirm-body"]}>
            Esta acción cancela el pedido y puede devolver stock de productos con inventario
            controlado.
          </p>
          <div className={styles["admin-status-form__cancel-confirm-actions"]}>
            <Button
              type="button"
              className={styles["admin-status-form__cancel-back"]}
              disabled={mutation.isPending}
              onClick={handleDismissCancellation}
            >
              Volver
            </Button>
            <Button
              type="button"
              className={styles["admin-status-form__cancel-confirm-action"]}
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
              onClick={handleConfirmCancellation}
            >
              {mutation.isPending ? "Cancelando…" : "Cancelar pedido"}
            </Button>
          </div>
        </div>
      ) : canChangeStatus ? (
        <Button
          type="submit"
          className={
            isWorkstation ? styles["admin-status-form__manual-save"] : "admin-primary-button"
          }
          disabled={isSaveDisabled}
          aria-busy={mutation.isPending}
        >
          {mutation.isPending ? "Sincronizando..." : isWorkstation ? "Guardar" : "Guardar estado"}
        </Button>
      ) : readOnlyReason ? (
        <p className={styles["admin-status-form__read-only-note"]}>{readOnlyReason}</p>
      ) : null}
    </form>
  );
}
