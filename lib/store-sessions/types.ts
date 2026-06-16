export type OrderMutationErrorCode =
  | "NO_ACTIVE_SESSION"
  | "ORDER_OUTSIDE_ACTIVE_SESSION"
  | "ORDER_NOT_FOUND"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export type OrderCreationErrorCode =
  | "NO_ACTIVE_SESSION"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "PRODUCT_UNAVAILABLE"
  | "ORDER_CREATE_FAILED"
  | "UNKNOWN";

export type ActiveSessionMutationGuardResult =
  | { ok: true; session: import("@/lib/orders/analytics").StoreSession }
  | { ok: false; reason: OrderMutationErrorCode; message: string };

export type ActiveSessionCreationGuardResult =
  | { ok: true; session: import("@/lib/orders/analytics").StoreSession }
  | {
      ok: false;
      reason: Extract<OrderCreationErrorCode, "NO_ACTIVE_SESSION" | "UNAUTHORIZED" | "UNKNOWN">;
      message: string;
    };

export type OrderMutationGuardOrder = {
  id: string;
  created_at: string;
  business_id?: string;
  store_session_id?: string | null;
};

export const ORDER_CREATION_GUARD_MESSAGES: Record<
  Extract<OrderCreationErrorCode, "NO_ACTIVE_SESSION" | "UNAUTHORIZED">,
  string
> = {
  NO_ACTIVE_SESSION:
    "No hay una sesi\u00f3n activa. Abr\u00ed una nueva sesi\u00f3n para crear pedidos.",
  UNAUTHORIZED: "No ten\u00e9s permisos para crear pedidos."
};

export const ORDER_MUTATION_GUARD_MESSAGES: Record<
  Exclude<OrderMutationErrorCode, "UNKNOWN">,
  string
> = {
  NO_ACTIVE_SESSION:
    "No hay una sesi\u00f3n activa. Abr\u00ed una nueva sesi\u00f3n para operar pedidos.",
  ORDER_OUTSIDE_ACTIVE_SESSION:
    "Este pedido pertenece a una sesi\u00f3n cerrada o fuera de la sesi\u00f3n activa.",
  ORDER_NOT_FOUND: "Este pedido ya no existe o pertenece a otro negocio.",
  UNAUTHORIZED: "No ten\u00e9s permisos para operar este pedido."
};

export const SESSION_MUTATION_BLOCKED_CODES = new Set<OrderMutationErrorCode>([
  "NO_ACTIVE_SESSION",
  "ORDER_OUTSIDE_ACTIVE_SESSION"
]);

export function isSessionMutationBlockedCode(
  code: string | undefined
): code is OrderMutationErrorCode {
  return Boolean(code && SESSION_MUTATION_BLOCKED_CODES.has(code as OrderMutationErrorCode));
}
