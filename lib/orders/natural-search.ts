import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { OrderStatus } from "@/types/database";

export const BOARD_OPERATIONAL_SEARCH_PLACEHOLDER =
  "Buscar por nombre, tel\u00e9fono o n\u00famero de pedido...";
export const BOARD_OPERATIONAL_SEARCH_ARIA_LABEL =
  "Buscar por nombre, tel\u00e9fono o n\u00famero de pedido";

export type OperationalSearchQuery = {
  raw: string;
  normalized: string;
  normalizedDigits: string;
  statuses: OrderStatus[];
  deliveryMethods: Array<"delivery" | "pickup">;
  riskOnly: boolean;
  customerQuery?: string;
  highValue: boolean;
  unassignedOnly: boolean;
  assignedToMeOnly: boolean;
  recentOnly: boolean;
  completedOnly: boolean;
  cancelledOnly: boolean;
  chips: string[];
};

type MatchesOperationalSearchInput = {
  order: AdminOrderDashboardItem;
  query: OperationalSearchQuery;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function stripOrderNumberDecorators(value: string): string {
  return value.replace(/#/g, "").trim();
}

function buildOrderDisplayRef(orderId: string): string {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}

function createEmptyOperationalSearchQuery(
  raw: string,
  normalized: string,
  normalizedDigits: string
): OperationalSearchQuery {
  return {
    raw,
    normalized,
    normalizedDigits,
    statuses: [],
    deliveryMethods: [],
    riskOnly: false,
    highValue: false,
    unassignedOnly: false,
    assignedToMeOnly: false,
    recentOnly: false,
    completedOnly: false,
    cancelledOnly: false,
    chips: []
  };
}

export function parseOperationalSearch(input: string): OperationalSearchQuery {
  const raw = input ?? "";
  const normalized = normalizeText(stripOrderNumberDecorators(raw));
  const normalizedDigits = extractDigits(raw);

  if (!normalized && !normalizedDigits) {
    return createEmptyOperationalSearchQuery(raw, "", "");
  }

  return createEmptyOperationalSearchQuery(raw, normalized, normalizedDigits);
}

function matchesCustomerName(order: AdminOrderDashboardItem, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return false;
  }

  const customerSearchSpace = normalizeText(
    [order.customer_name, order.customer_short_name].filter(Boolean).join(" ")
  );

  return customerSearchSpace.includes(normalizedQuery);
}

function matchesCustomerPhone(order: AdminOrderDashboardItem, normalizedDigits: string): boolean {
  if (!normalizedDigits) {
    return false;
  }

  const orderPhoneDigits = extractDigits(order.phone);
  if (!orderPhoneDigits) {
    return false;
  }

  return orderPhoneDigits.includes(normalizedDigits);
}

function matchesOrderNumber(
  order: AdminOrderDashboardItem,
  normalizedQuery: string,
  normalizedDigits: string
): boolean {
  const compactOrderId = order.id.replace(/-/g, "").toLowerCase();
  const displayRef = buildOrderDisplayRef(order.id).toLowerCase();
  const compactQuery = stripOrderNumberDecorators(normalizedQuery).replace(/\s+/g, "");

  if (compactQuery.length > 0) {
    if (compactOrderId.includes(compactQuery)) {
      return true;
    }

    if (displayRef.includes(compactQuery)) {
      return true;
    }
  }

  if (!normalizedDigits) {
    return false;
  }

  if (compactOrderId.includes(normalizedDigits)) {
    return true;
  }

  return displayRef.includes(normalizedDigits);
}

export function matchesOperationalSearch({
  order,
  query
}: MatchesOperationalSearchInput): boolean {
  if (!query.normalized && !query.normalizedDigits) {
    return true;
  }

  return (
    matchesCustomerName(order, query.normalized) ||
    matchesCustomerPhone(order, query.normalizedDigits) ||
    matchesOrderNumber(order, query.normalized, query.normalizedDigits)
  );
}
