type OrderDeliveryMethod = "delivery" | "pickup";
type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

type OperationalSummaryItem = {
  product_name: string;
  quantity: number;
};

type OrderSummaryInput = {
  notes: string | null;
  delivery_method: OrderDeliveryMethod;
};

type CustomerHistoryOrder = {
  id: string;
  created_at: string;
  delivery_method: OrderDeliveryMethod;
};

type OrderHeaderInput = {
  delivery_date: string;
  delivery_method: OrderDeliveryMethod;
  phone: string;
};

type RelativeTimeInput = {
  created_at: string;
  now?: Date;
};

export type OperationalAgingState = "normal" | "aging" | "stale" | "resolved";
export type OperationalTimelineStepState = "complete" | "current" | "upcoming";
export type OperationalTimelineStep = {
  key: "pending" | "preparing" | "ready";
  label: "Recibido" | "Preparando" | "Listo";
  state: OperationalTimelineStepState;
};

export type CustomerOperationalContext = {
  isNewCustomer: boolean;
  totalOrders: number;
  previousOrderRelativeLabel: string | null;
  preferredMethodLabel: string | null;
  signals: string[];
};

export type OrderOperationalSummary = {
  itemCount: number;
  itemSummary: string;
  customerShortName: string;
  hasNotes: boolean;
  notesPreview: string | null;
};

export function formatAdminOrderDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatAdminOrderCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatAdminDeliveryMethod(method: OrderDeliveryMethod) {
  return method === "delivery" ? "Delivery" : "Retiro";
}

export function buildAdminOrderSummary(input: OrderSummaryInput) {
  if (input.notes && input.notes.trim()) {
    return input.notes.trim();
  }

  return input.delivery_method === "delivery"
    ? "Pedido con entrega a domicilio."
    : "Pedido para retiro en el local.";
}

export function buildOrderStatusSuccessMessage(status: OrderStatus) {
  if (status === "preparing") {
    return "Pedido marcado como preparando";
  }

  if (status === "ready") {
    return "Pedido marcado como listo";
  }

  if (status === "completed") {
    return "Pedido completado";
  }

  if (status === "cancelled") {
    return "Pedido cancelado";
  }

  return "Estado actualizado";
}

export function buildAdminOrderHeaderDescription(input: OrderHeaderInput) {
  return `${formatAdminOrderDate(input.delivery_date)} · ${formatAdminDeliveryMethod(
    input.delivery_method
  )} · ${input.phone}`;
}

export function buildOrderOperationalSummary(
  customerName: string,
  notes: string | null,
  items: OperationalSummaryItem[] | null | undefined
): OrderOperationalSummary {
  const normalizedItems = (items ?? [])
    .filter((item) => item.product_name.trim())
    .map((item) => ({
      productName: item.product_name.trim(),
      quantity: item.quantity
    }));

  const itemCount = normalizedItems.reduce((total, item) => total + item.quantity, 0);
  const itemSummary = buildItemsSummary(normalizedItems);

  return {
    itemCount,
    itemSummary,
    customerShortName: buildCustomerShortName(customerName),
    hasNotes: Boolean(notes?.trim()),
    notesPreview: buildNotesPreview(notes)
  };
}

export function formatOperationalTime({ created_at, now = new Date() }: RelativeTimeInput) {
  const createdAt = new Date(created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  const diffMinutes = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000));

  if (diffMinutes < 1) {
    return "Recien ingresado";
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Hace ${diffDays} d`;
}

export function buildOrderRelativeTimeLabel(input: RelativeTimeInput) {
  return formatOperationalTime(input);
}

export function getOperationalAging(
  status: OrderStatus,
  created_at: string,
  now = new Date()
): OperationalAgingState {
  if (status === "completed" || status === "cancelled") {
    return "resolved";
  }

  const createdAt = new Date(created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return "normal";
  }

  const diffMinutes = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000));

  if (status === "pending") {
    if (diffMinutes >= 90) {
      return "stale";
    }

    if (diffMinutes >= 45) {
      return "aging";
    }

    return "normal";
  }

  if (status === "preparing") {
    if (diffMinutes >= 45) {
      return "stale";
    }

    if (diffMinutes >= 25) {
      return "aging";
    }

    return "normal";
  }

  if (status === "ready") {
    if (diffMinutes >= 40) {
      return "stale";
    }

    if (diffMinutes >= 20) {
      return "aging";
    }
  }

  return "normal";
}

export function buildOrderUrgencyState(status: OrderStatus, created_at: string) {
  const aging = getOperationalAging(status, created_at);

  if (aging === "resolved") {
    return "resolved" as const;
  }

  if (aging === "stale") {
    return "high" as const;
  }

  if (aging === "aging") {
    return "medium" as const;
  }

  return "normal" as const;
}

export function getOperationalTimeline(status: OrderStatus): OperationalTimelineStep[] | null {
  if (status === "cancelled") {
    return null;
  }

  const timeline: OperationalTimelineStep[] = [
    { key: "pending", label: "Recibido", state: "upcoming" },
    { key: "preparing", label: "Preparando", state: "upcoming" },
    { key: "ready", label: "Listo", state: "upcoming" }
  ];

  if (status === "pending") {
    timeline[0].state = "current";
    return timeline;
  }

  if (status === "preparing") {
    timeline[0].state = "complete";
    timeline[1].state = "current";
    return timeline;
  }

  timeline[0].state = "complete";
  timeline[1].state = "complete";
  timeline[2].state = status === "ready" ? "current" : "complete";
  return timeline;
}

export function buildCustomerOperationalContext(
  currentOrder: CustomerHistoryOrder,
  customerOrders: CustomerHistoryOrder[]
): CustomerOperationalContext {
  const sortedOrders = [...customerOrders]
    .filter((order) => order.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalOrders = sortedOrders.length;
  const isNewCustomer = totalOrders <= 1;
  const previousOrder = sortedOrders.find((order) => order.id !== currentOrder.id) ?? null;
  const previousOrderRelativeLabel = previousOrder
    ? buildPreviousOrderRelativeLabel(previousOrder.created_at)
    : null;
  const preferredMethodLabel = buildPreferredMethodLabel(sortedOrders);

  const signals: string[] = [];

  if (isNewCustomer) {
    signals.push("Cliente nuevo");
  } else {
    signals.push(`${totalOrders} pedidos`);

    if (preferredMethodLabel) {
      signals.push(preferredMethodLabel);
    } else if (previousOrderRelativeLabel) {
      signals.push(previousOrderRelativeLabel);
    }
  }

  return {
    isNewCustomer,
    totalOrders,
    previousOrderRelativeLabel,
    preferredMethodLabel,
    signals: signals.slice(0, 2)
  };
}

function buildItemsSummary(items: Array<{ productName: string; quantity: number }>) {
  if (items.length === 0) {
    return "Pedido sin items resumidos";
  }

  const visibleItems = items.slice(0, 2).map((item) => `${item.quantity}x ${item.productName}`);
  const hiddenItemsCount = items.length - visibleItems.length;

  if (hiddenItemsCount > 0) {
    visibleItems.push(`+${hiddenItemsCount} mas`);
  }

  return visibleItems.join(" · ");
}

function buildCustomerShortName(customerName: string) {
  const parts = customerName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return parts.slice(0, 2).join(" ");
}

function buildNotesPreview(notes: string | null, maxLength = 80) {
  if (!notes?.trim()) {
    return null;
  }

  const trimmedNotes = notes.trim();

  if (trimmedNotes.length <= maxLength) {
    return trimmedNotes;
  }

  return `${trimmedNotes.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildPreviousOrderRelativeLabel(created_at: string, now = new Date()) {
  const createdAt = new Date(created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  const diffDays = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 86400000));

  if (diffDays < 1) {
    return "Ultimo hoy";
  }

  if (diffDays < 14) {
    return `Ult. ${diffDays} d`;
  }

  const diffWeeks = Math.round(diffDays / 7);

  if (diffWeeks < 8) {
    return `Ult. ${diffWeeks} sem`;
  }

  const diffMonths = Math.round(diffDays / 30);
  return `Ult. ${diffMonths} mes`;
}

function buildPreferredMethodLabel(orders: CustomerHistoryOrder[]) {
  if (orders.length < 3) {
    return null;
  }

  const deliveryCount = orders.filter((order) => order.delivery_method === "delivery").length;
  const pickupCount = orders.length - deliveryCount;
  const dominantCount = Math.max(deliveryCount, pickupCount);

  if (dominantCount / orders.length < 0.75) {
    return null;
  }

  return deliveryCount > pickupCount ? "Prefiere delivery" : "Retira en local";
}
