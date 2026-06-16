import {
  formatAdminDeliveryMethod,
  formatAdminOrderCurrency
} from "@/lib/orders/presenter";

type NewOrderNotificationOrder = {
  customer_name: string;
  customer_short_name: string;
  delivery_method: "delivery" | "pickup";
  id: string;
  item_count: number;
  total_price: number;
};

export type BrowserNotificationPayload = {
  body?: string;
  tag: string;
  title: string;
};

export function buildNewOrderNotificationPayload(
  order: NewOrderNotificationOrder
): BrowserNotificationPayload {
  const customerLabel = normalizeNotificationText(order.customer_short_name || order.customer_name);
  const deliveryMethodLabel = normalizeNotificationText(
    formatAdminDeliveryMethod(order.delivery_method)
  );
  const totalLabel =
    typeof order.total_price === "number" && Number.isFinite(order.total_price)
      ? formatAdminOrderCurrency(order.total_price)
      : null;

  const primaryBody = [customerLabel, deliveryMethodLabel, totalLabel]
    .filter(Boolean)
    .join(" - ");

  if (primaryBody) {
    return {
      title: "Nuevo pedido",
      body: primaryBody,
      tag: buildNewOrderNotificationTag(order.id)
    };
  }

  const itemCountLabel =
    typeof order.item_count === "number" && Number.isFinite(order.item_count)
      ? `${order.item_count} ${order.item_count === 1 ? "producto" : "productos"}`
      : null;
  const fallbackBody = [itemCountLabel, deliveryMethodLabel].filter(Boolean).join(" - ");

  return {
    title: "Nuevo pedido",
    body: fallbackBody || "Revisa el dashboard para ver el pedido.",
    tag: buildNewOrderNotificationTag(order.id)
  };
}

export function showBrowserNotification(payload: BrowserNotificationPayload) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return null;
  }

  const notification = new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

function buildNewOrderNotificationTag(orderId: string) {
  return `orderops:new-order:${orderId}`;
}

function normalizeNotificationText(value: string | null | undefined) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";
  return trimmedValue || null;
}
