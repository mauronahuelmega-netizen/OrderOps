"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/[id]/actions";

type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

type StatusFormProps = {
  orderId: string;
  initialStatus: OrderStatus;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function StatusForm({ orderId, initialStatus }: StatusFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateOrderStatusAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const successMessage = useMemo(
    () => (state.success ? "Estado actualizado." : null),
    [state.success]
  );

  return (
    <form action={formAction} className="admin-status-form">
      <input type="hidden" name="order_id" value={orderId} />
      <label className="admin-field">
        <span>Estado</span>
        <select name="status" defaultValue={initialStatus} disabled={isPending}>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En proceso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </label>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {successMessage ? (
        <p className="admin-feedback admin-feedback--success">{successMessage}</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar estado"}
      </button>
    </form>
  );
}
