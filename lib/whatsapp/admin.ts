type AdminOrderWhatsappStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type AdminOrderWhatsappMethod = "delivery" | "pickup";

type AdminOrderWhatsappItem = {
  product_name: string;
  quantity: number;
};

type AdminOrderWhatsappShape = {
  id: string;
  customer_name: string;
  phone: string | null;
  delivery_method: AdminOrderWhatsappMethod;
  address: string | null;
  status: AdminOrderWhatsappStatus;
  total_price: number;
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

function formatWhatsappCurrency(value: number) {
  const formattedValue = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

  return `$${formattedValue}`;
}

function buildGreeting(customerName: string) {
  return `Hola ${customerName}`;
}

export function buildOrderSummaryText(order: AdminOrderWhatsappShape) {
  const lines = (order.order_items ?? [])
    .filter((item) => item.product_name.trim())
    .map((item) => `- ${item.quantity}x ${item.product_name.trim()}`);

  if (lines.length > 0) {
    return lines.join("\n");
  }

  if (order.item_summary?.trim()) {
    return `- ${order.item_summary.trim()}`;
  }

  return "- Pedido sin resumen disponible";
}

export function buildOrderWhatsappMessage(
  template: AdminOrderWhatsappTemplateKey,
  order: AdminOrderWhatsappShape
) {
  const customerName = normalizeCustomerName(order.customer_name);
  const summary = buildOrderSummaryText(order);
  const total = formatWhatsappCurrency(order.total_price);
  const address = order.address?.trim() || "Sin dirección registrada";
  const greeting = buildGreeting(customerName);

  switch (template) {
    case "received":
      return sanitizeWhatsappText(
        `${greeting}

Recibimos tu pedido:

${summary}

Total: ${total}

Te avisamos apenas comience la preparación.`
      );
    case "preparing":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ya está en preparación.

${summary}

Total: ${total}`
      );
    case "ready_pickup":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ya está listo para retirar.

${summary}

Total: ${total}
        
Te esperamos.`
      );
    case "ready_delivery":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ya está listo y pronto saldrá a delivery.

${summary}

Total: ${total}`
      );
    case "on_the_way":
      return sanitizeWhatsappText(
        `${greeting}

Tu pedido ya está en camino.

${summary}

Total: ${total}`
      );
    case "confirm_address":
      return sanitizeWhatsappText(
        `${greeting}

Nos confirmás esta dirección para el envío?

${address}`
      );
    case "summary":
      return sanitizeWhatsappText(
        `${greeting}

Te compartimos el resumen de tu pedido:

${summary}

Total: ${total}`
      );
    default:
      return sanitizeWhatsappText(
        `${greeting}

Te escribimos por tu pedido.`
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

export function buildContextualOrderWhatsappUrl(order: AdminOrderWhatsappShape) {
  if (!order.phone) {
    return null;
  }

  const preferredTemplate =
    order.status === "pending"
      ? "received"
      : order.status === "preparing"
        ? "preparing"
        : order.status === "ready"
          ? order.delivery_method === "pickup"
            ? "ready_pickup"
            : "ready_delivery"
          : "summary";

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
  const parts = [
    `Pedido de ${order.customer_name}`,
    buildOrderSummaryText(order),
    `Total: ${formatWhatsappCurrency(order.total_price)}`,
    `Método: ${order.delivery_method === "delivery" ? "Delivery" : "Retiro"}`
  ];

  if (order.address?.trim()) {
    parts.push(`Dirección: ${order.address.trim()}`);
  }

  return sanitizeWhatsappText(parts.join("\n"));
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
