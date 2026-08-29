/** Canonical admin short order reference (UUID → last 4 hex, uppercase; order_code → 6-char alphanumeric). */

const ORDER_CODE_REGEX = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export type OrderDisplayRefSource = {
  id: string;
  order_code?: string | null;
};

export function normalizeOrderCode(orderCode?: string | null): string | null {
  if (!orderCode || typeof orderCode !== "string") {
    return null;
  }
  const trimmed = orderCode.trim().toUpperCase();
  if (ORDER_CODE_REGEX.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function buildOrderDisplayRef(orderOrId: string | OrderDisplayRefSource): string {
  if (typeof orderOrId === "object" && orderOrId !== null) {
    const code = normalizeOrderCode(orderOrId.order_code);
    if (code) {
      return code;
    }
    return buildOrderDisplayRef(orderOrId.id);
  }

  if (typeof orderOrId === "string") {
    return orderOrId.replace(/-/g, "").slice(-4).toUpperCase();
  }

  return "";
}

export function buildOrderDisplayRefFromOrder(order: OrderDisplayRefSource): string {
  return buildOrderDisplayRef(order);
}
