/**
 * Durable Products stock ↔ availability contract (PROD-P1-4 / PROD-P2-10).
 *
 * Stock governs availability ONLY when track_stock is enabled.
 * Restock never auto-reactivates. Manual unavailable stays unavailable.
 * The DB trigger is defense in depth; app payloads must agree with this helper.
 */

export function resolveEffectiveProductAvailability(input: {
  trackStock: boolean;
  stock: number;
  requestedAvailable: boolean;
}): boolean {
  if (input.trackStock && input.stock <= 0) {
    return false;
  }

  return input.requestedAvailable;
}

export const TRACKED_ZERO_STOCK_ENABLE_ERROR =
  "No podés marcar este producto como disponible mientras el control de stock está activo y no hay stock.";

export const STOCK_TRACKING_HELPER_COPY =
  "Al activar el control, el stock se descuenta automáticamente con cada pedido. Si llega a 0, el producto deja de estar disponible. Al reponer stock, volvé a marcarlo como disponible cuando quieras publicarlo.";
