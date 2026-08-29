import {
  buildCustomerOrderSummary,
  formatDeliveryContextLines,
  formatIndicacionesLine,
  formatPlainTextCustomerOrderSummary,
  formatWhatsappCustomerOrderProducts
} from "@/lib/orders/customer-order-summary";
import type { OrderItemLike } from "@/lib/product-customization/order-dashboard";

type AdminOrderWhatsappStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type AdminOrderWhatsappMethod = "delivery" | "pickup";

/** Persisted line shape accepted by Contact messaging (snapshot/tree fields optional). */
export type AdminOrderWhatsappItem = {
  id?: string | null;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price?: number;
  description?: string | null;
  item_kind?: "product" | "upsell" | null;
  parent_order_item_id?: string | null;
  customization_snapshot?: unknown;
};

type AdminOrderWhatsappShape = {
  id: string;
  order_code?: string | null;
  customer_name: string;
  phone: string | null;
  delivery_method: AdminOrderWhatsappMethod;
  address: string | null;
  status: AdminOrderWhatsappStatus;
  /** Retained for call-site compatibility; unused in customer contact message bodies. */
  total_price: number;
  notes?: string | null;
  item_summary?: string | null;
  order_items?: AdminOrderWhatsappItem[] | null;
};

export type AdminOrderWhatsappTemplateKey =
  | "received"
  | "preparing"
  | "ready_pickup"
  | "ready_delivery"
  | "on_the_way"
  | "confirm_address"
  | "summary";

export type AdminOrderWhatsappTemplate = {
  key: AdminOrderWhatsappTemplateKey;
  label: string;
  message: string;
};

type BuildWhatsappUrlInput = {
  customerPhone: string;
  message: string;
};

function toOrderItemLike(items: AdminOrderWhatsappItem[] | null | undefined): OrderItemLike[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price ?? 0,
    description: item.description ?? null,
    item_kind: item.item_kind,
    parent_order_item_id: item.parent_order_item_id ?? null,
    customization_snapshot: item.customization_snapshot ?? null
  }));
}

function buildSummaryFromOrder(order: AdminOrderWhatsappShape) {
  return buildCustomerOrderSummary({
    id: order.id,
    order_code: order.order_code,
    customer_name: order.customer_name,
    delivery_method: order.delivery_method,
    address: order.address,
    notes: order.notes,
    order_items: toOrderItemLike(order.order_items)
  });
}

function normalizeCustomerName(customerName: string) {
  return customerName.trim().split(/\s+/)[0] || "cliente";
}

function normalizePhoneDigits(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function sanitizeWhatsappText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\uFFFD/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildGreeting(customerName: string) {
  return `Hola ${customerName}`;
}

/**
 * Structured WhatsApp product body (exported for verifies / transitional callers).
 */
export function buildOrderSummaryText(order: AdminOrderWhatsappShape) {
  return formatWhatsappCustomerOrderProducts(buildSummaryFromOrder(order));
}

export function buildOrderWhatsappMessage(
  template: AdminOrderWhatsappTemplateKey,
  order: AdminOrderWhatsappShape
) {
  const customerName = normalizeCustomerName(order.customer_name);
  const greeting = buildGreeting(customerName);
  const summary = buildSummaryFromOrder(order);
  const orderRefLabel = `#${summary.orderRef}`;
  const products = formatWhatsappCustomerOrderProducts(summary);
  const notesLine = formatIndicacionesLine(summary.notes);
  const address = order.address?.trim() || "Sin dirección registrada";

  switch (template) {
    case "received": {
      const parts = [
        greeting,
        "",
        `Recibimos tu pedido ${orderRefLabel}:`,
        "",
        products
      ];

      if (notesLine) {
        parts.push("", notesLine);
      }

      parts.push("", "Te avisamos apenas comience la preparación.");

      return sanitizeWhatsappText(parts.join("\n"));
    }
    case "preparing":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ${orderRefLabel} ya está en preparación.`
      );
    case "ready_pickup":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ${orderRefLabel} está listo para retirar.

Te esperamos.`
      );
    case "ready_delivery":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ${orderRefLabel} está listo para delivery.`
      );
    case "on_the_way":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ${orderRefLabel} ya está en camino.`
      );
    case "confirm_address":
      return sanitizeWhatsappText(
        `${greeting}

Nos confirmás esta dirección para el envío del pedido ${orderRefLabel}?

${address}`
      );
    case "summary": {
      const parts = [
        greeting,
        "",
        `Te compartimos el resumen de tu pedido ${orderRefLabel}:`,
        "",
        products
      ];

      if (notesLine) {
        parts.push("", notesLine);
      }

      parts.push("", ...formatDeliveryContextLines(summary));

      return sanitizeWhatsappText(parts.join("\n"));
    }
    default:
      return sanitizeWhatsappText(
        `${greeting}

Te escribimos por tu pedido ${orderRefLabel}.`
      );
  }
}

export function getWhatsappTemplatesForOrder(
  order: AdminOrderWhatsappShape
): AdminOrderWhatsappTemplate[] {
  const templates: AdminOrderWhatsappTemplateKey[] = [];

  if (order.status === "pending") {
    templates.push("received");
  }

  if (order.status === "preparing") {
    templates.push("preparing");
  }

  if (order.status === "ready") {
    templates.push(order.delivery_method === "pickup" ? "ready_pickup" : "ready_delivery");
  }

  if (order.delivery_method === "delivery") {
    templates.push("confirm_address", "on_the_way");
  }

  templates.push("summary");

  return Array.from(new Set(templates)).map((key) => ({
    key,
    label: getWhatsappTemplateLabel(key, order.delivery_method),
    message: buildOrderWhatsappMessage(key, order)
  }));
}

export function buildAdminOrderWhatsappUrl(input: BuildWhatsappUrlInput) {
  const cleanedPhone = normalizePhoneDigits(input.customerPhone);
  const message = encodeURIComponent(sanitizeWhatsappText(input.message));

  return `https://wa.me/${cleanedPhone}?text=${message}`;
}

/**
 * Deterministic WhatsApp template preference from operational context.
 * Used by workspace Contacto default selection and contextual URL builder.
 */
export function getPreferredWhatsappTemplateKeyForOrder(input: {
  status: AdminOrderWhatsappStatus | string;
  deliveryMethod: AdminOrderWhatsappMethod | string;
}): AdminOrderWhatsappTemplateKey {
  switch (input.status) {
    case "pending":
      return "received";
    case "preparing":
      return "preparing";
    case "ready":
      if (input.deliveryMethod === "pickup") {
        return "ready_pickup";
      }

      if (input.deliveryMethod === "delivery") {
        return "ready_delivery";
      }

      return "summary";
    case "completed":
    case "cancelled":
      return "summary";
    default:
      return "summary";
  }
}

/**
 * Resolve a preferred key against currently available templates.
 * preferred → summary → first available → empty.
 */
export function resolveWhatsappTemplateKey(
  preferredKey: AdminOrderWhatsappTemplateKey,
  availableKeys: readonly AdminOrderWhatsappTemplateKey[]
): AdminOrderWhatsappTemplateKey | "" {
  if (availableKeys.includes(preferredKey)) {
    return preferredKey;
  }

  if (availableKeys.includes("summary")) {
    return "summary";
  }

  return availableKeys[0] ?? "";
}

export function buildContextualOrderWhatsappUrl(order: AdminOrderWhatsappShape) {
  if (!order.phone) {
    return null;
  }

  const preferredTemplate = getPreferredWhatsappTemplateKeyForOrder({
    status: order.status,
    deliveryMethod: order.delivery_method
  });

  return buildAdminOrderWhatsappUrl({
    customerPhone: order.phone,
    message: buildOrderWhatsappMessage(preferredTemplate, order)
  });
}

export function buildOrderMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function buildOrderCallUrl(phone: string) {
  return `tel:${normalizePhoneDigits(phone)}`;
}

export function buildOrderContactSummary(order: AdminOrderWhatsappShape) {
  return sanitizeWhatsappText(
    formatPlainTextCustomerOrderSummary(buildSummaryFromOrder(order))
  );
}

function getWhatsappTemplateLabel(
  key: AdminOrderWhatsappTemplateKey,
  method: AdminOrderWhatsappMethod
) {
  switch (key) {
    case "received":
      return "Pedido recibido";
    case "preparing":
      return "Avisar preparación";
    case "ready_pickup":
      return "Listo para retirar";
    case "ready_delivery":
      return "Listo para delivery";
    case "on_the_way":
      return "En camino";
    case "confirm_address":
      return method === "delivery" ? "Confirmar dirección" : "Confirmar datos";
    case "summary":
      return "Enviar resumen";
    default:
      return "WhatsApp";
  }
}
