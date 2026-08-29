import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";
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
  // Only extract normalizedDigits if the query does not contain letters,
  // preventing alphanumeric order codes like "PGF5" from falling through to single-digit phone matches.
  const hasLetters = /[a-zA-Z]/.test(raw);
  const normalizedDigits = hasLetters ? "" : extractDigits(raw);

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
  rawQuery: string,
  normalizedQuery: string
): boolean {
  const compactOrderId = order.id.replace(/-/g, "").toLowerCase();
  const legacyDisplayRef = buildOrderDisplayRef(order.id).toLowerCase();
  const authoritativeDisplayRef = buildOrderDisplayRef(order).toLowerCase();
  const compactOrderCode = (order.order_code ?? "").toLowerCase();
  const compactQuery = stripOrderNumberDecorators(normalizedQuery).replace(/\s+/g, "");

  if (compactQuery.length > 0) {
    if (compactOrderCode && compactOrderCode.includes(compactQuery)) {
      return true;
    }

    if (compactOrderId.includes(compactQuery)) {
      return true;
    }

    if (legacyDisplayRef.includes(compactQuery)) {
      return true;
    }

    if (authoritativeDisplayRef.includes(compactQuery)) {
      return true;
    }
  }

  return false;
}

function matchesSingleToken(
  order: AdminOrderDashboardItem,
  token: string,
  rawQuery: string
): boolean {
  const cleanToken = stripOrderNumberDecorators(token);
  const hasLetters = /[a-z]/.test(cleanToken);
  const hasDigits = /[0-9]/.test(cleanToken);

  if (hasLetters && hasDigits) {
    return (
      matchesOrderNumber(order, rawQuery, cleanToken) ||
      matchesCustomerName(order, cleanToken)
    );
  }

  if (!hasLetters && hasDigits) {
    return (
      matchesCustomerPhone(order, cleanToken) ||
      matchesOrderNumber(order, rawQuery, cleanToken) ||
      matchesCustomerName(order, cleanToken)
    );
  }

  return (
    matchesCustomerName(order, cleanToken) ||
    matchesOrderNumber(order, rawQuery, cleanToken)
  );
}

export function matchesOperationalSearch({
  order,
  query
}: MatchesOperationalSearchInput): boolean {
  if (!query.normalized && !query.normalizedDigits && !query.raw.trim()) {
    return true;
  }

  const rawTrimmed = query.raw.trim();
  const startsWithHash = rawTrimmed.startsWith("#");

  // Explicit order number / ref intent with leading '#'
  if (startsWithHash) {
    return matchesOrderNumber(order, query.raw, query.normalized);
  }

  // Multi-token or exact whole query match against customer name
  if (matchesCustomerName(order, query.normalized)) {
    return true;
  }

  // Exact whole query match against order code, legacy ref, or UUID
  if (matchesOrderNumber(order, query.raw, query.normalized)) {
    return true;
  }

  // Phone match for digit-only / phone formatted queries
  if (query.normalizedDigits && matchesCustomerPhone(order, query.normalizedDigits)) {
    return true;
  }

  // Multi-token evaluation: all space-separated tokens must match at least one field
  const tokens = query.normalized.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) =>
      matchesSingleToken(order, token, query.raw)
    );
    if (allTokensMatch) {
      return true;
    }
  }

  return false;
}
