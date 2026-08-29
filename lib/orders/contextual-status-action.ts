import type { OrderStatus } from "@/types/database";

export type ContextualStatusTransition = {
  label: string;
  targetStatus: OrderStatus;
};

export function getContextualStatusTransition(
  status: OrderStatus
): ContextualStatusTransition | null {
  switch (status) {
    case "pending":
      return { label: "Empezar preparación", targetStatus: "preparing" };
    case "preparing":
      return { label: "Marcar como listo", targetStatus: "ready" };
    case "ready":
      return { label: "Completar pedido", targetStatus: "completed" };
    default:
      return null;
  }
}

export function getTerminalStatusContext(status: OrderStatus): string | null {
  switch (status) {
    case "completed":
      return "Pedido completado";
    case "cancelled":
      return "Pedido cancelado";
    default:
      return null;
  }
}
