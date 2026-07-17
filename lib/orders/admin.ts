import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  presentOrderTimelineEvent,
  type AdminOrderTimelineEvent
} from "@/lib/orders/events.shared";
import {
  buildOrderOperationalSummary,
  buildOrderRelativeTimeLabel,
  buildOrderUrgencyState,
  buildCustomerOperationalContext,
  getOperationalAging,
  getOperationalTimeline,
  type CustomerOperationalContext,
  type OperationalAgingState,
  type OperationalTimelineStep
} from "@/lib/orders/presenter";

export type {
  ActiveSessionMutationGuardResult,
  OrderMutationErrorCode,
  OrderMutationGuardOrder
} from "@/lib/store-sessions/types";
export {
  ORDER_MUTATION_GUARD_MESSAGES,
  SESSION_MUTATION_BLOCKED_CODES,
  isSessionMutationBlockedCode
} from "@/lib/store-sessions/types";

export type AdminOrderListItem = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  delivery_date: string;
  delivery_time: string | null;
  delivery_method: "delivery" | "pickup";
  address: string | null;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  total_price: number;
  notes: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
};

export type AdminOrderDashboardItem = AdminOrderListItem & {
  order_items_preview: AdminOrderItem[];
  order_events?: AdminOrderTimelineEvent[];
  item_count: number;
  item_summary: string;
  customer_short_name: string;
  has_notes: boolean;
  notes_preview: string | null;
  relative_time_label: string | null;
  urgency_state: "normal" | "medium" | "high" | "resolved";
  operational_aging: OperationalAgingState;
  timeline_steps: OperationalTimelineStep[] | null;
  customer_context: CustomerOperationalContext;
};

export type AdminOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  description: string | null;
  image_url: string | null;
  /** Null/undefined treated as legacy product line. */
  item_kind: "product" | "upsell" | null;
  parent_order_item_id: string | null;
  /** Raw jsonb; dashboard parsers tolerate corrupt payloads. */
  customization_snapshot: unknown;
};

export type AdminOrderDetail = AdminOrderListItem & {
  order_items: AdminOrderItem[];
  order_events?: AdminOrderTimelineEvent[];
};

export type AdminOrderDetailContext = {
  customer_context: CustomerOperationalContext;
};

type DashboardRawOrder = AdminOrderListItem & {
  order_items: RawOrderItem[] | null;
  order_events: RawOrderEvent[] | null;
};

export async function getAdminOrders(businessId: string): Promise<AdminOrderDashboardItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        created_at,
        customer_name,
        phone,
        delivery_date,
        delivery_time,
        delivery_method,
        address,
        status,
        total_price,
        notes,
        assigned_to,
        assigned_at,
        order_events (
          id,
          actor_profile_id,
          event_type,
          payload,
          created_at
        ),
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          item_kind,
          parent_order_item_id,
          customization_snapshot
        )
      `
    )
    .eq("business_id", businessId)
    .order("delivery_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  const ordersData = data ?? [];
  const customerOrdersMap = new Map<
    string,
    Array<{ id: string; created_at: string; delivery_method: "delivery" | "pickup" }>
  >();

  for (const order of ordersData) {
    const customerKey = buildCustomerHistoryKey(order.phone, order.customer_name);
    const customerOrders = customerOrdersMap.get(customerKey) ?? [];

    customerOrders.push({
      id: order.id,
      created_at: order.created_at,
      delivery_method: order.delivery_method
    });

    customerOrdersMap.set(customerKey, customerOrders);
  }

  return ordersData.map((order) =>
    buildAdminOrderDashboardItem(order as DashboardRawOrder, customerOrdersMap)
  );
}

export async function getAdminDashboardOrderById(
  orderId: string,
  businessId: string
): Promise<AdminOrderDashboardItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        created_at,
        customer_name,
        phone,
        delivery_date,
        delivery_time,
        delivery_method,
        address,
        status,
        total_price,
        notes,
        assigned_to,
        assigned_at,
        order_events (
          id,
          actor_profile_id,
          event_type,
          payload,
          created_at
        ),
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          item_kind,
          parent_order_item_id,
          customization_snapshot
        )
      `
    )
    .eq("id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load dashboard order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const customerOrders = await loadDashboardCustomerOrders({
    supabase,
    businessId,
    phone: data.phone,
    customerName: data.customer_name
  });

  return buildAdminOrderDashboardItem(
    data as DashboardRawOrder,
    buildCustomerOrdersMap(data.phone, data.customer_name, customerOrders)
  );
}

export async function getAdminOrderById(
  orderId: string,
  businessId: string
): Promise<AdminOrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        created_at,
        customer_name,
        phone,
        delivery_date,
        delivery_time,
        delivery_method,
        address,
        status,
        total_price,
        notes,
        assigned_to,
        assigned_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          item_kind,
          parent_order_item_id,
          customization_snapshot,
          products (
            image_url,
            description
          )
        )
      `
    )
    .eq("id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminOrderListItem),
    order_items: normalizeOrderItems(data.order_items)
  };
}

export async function getAdminOrderCustomerContext(
  order: Pick<AdminOrderDetail, "id" | "created_at" | "delivery_method" | "phone" | "customer_name">,
  businessId: string
): Promise<CustomerOperationalContext> {
  const supabase = await createSupabaseServerClient();
  const normalizedPhone = (order.phone ?? "").replace(/\D/g, "");

  let query = supabase
    .from("orders")
    .select("id, created_at, delivery_method, phone, customer_name")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (normalizedPhone) {
    query = query.eq("phone", order.phone);
  } else {
    query = query.eq("customer_name", order.customer_name);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load customer context: ${error.message}`);
  }

  const customerOrders = (data ?? []).map((entry) => ({
    id: entry.id,
    created_at: entry.created_at,
    delivery_method: entry.delivery_method
  }));

  return buildCustomerOperationalContext(
    {
      id: order.id,
      created_at: order.created_at,
      delivery_method: order.delivery_method
    },
    customerOrders
  );
}

type RawOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  item_kind?: "product" | "upsell" | null;
  parent_order_item_id?: string | null;
  customization_snapshot?: unknown;
  products?:
    | {
        image_url?: string | null;
        description?: string | null;
      }
    | Array<{
        image_url?: string | null;
        description?: string | null;
      }>
    | null;
};

function normalizeOrderItemKind(
  value: RawOrderItem["item_kind"]
): "product" | "upsell" | null {
  if (value === "product" || value === "upsell") {
    return value;
  }

  return null;
}

function normalizeAdminOrderItemFields(item: RawOrderItem): Pick<
  AdminOrderItem,
  "item_kind" | "parent_order_item_id" | "customization_snapshot"
> {
  return {
    item_kind: normalizeOrderItemKind(item.item_kind),
    parent_order_item_id:
      typeof item.parent_order_item_id === "string" && item.parent_order_item_id
        ? item.parent_order_item_id
        : null,
    customization_snapshot: item.customization_snapshot ?? null
  };
}

type RawOrderEvent = {
  id: string;
  actor_profile_id: string | null;
  event_type: string;
  payload: unknown;
  created_at: string;
  business_id?: string;
  order_id?: string;
};

type RawOrderListItem = {
  product_name: string;
  quantity: number;
};

function normalizeOrderItems(items: RawOrderItem[] | null | undefined): AdminOrderItem[] {
  if (!items) {
    return [];
  }

  return items.map((item) => {
    const relatedProduct = Array.isArray(item.products)
      ? item.products[0] ?? null
      : item.products ?? null;

    return {
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      image_url: relatedProduct?.image_url ?? null,
      description: relatedProduct?.description ?? null,
      ...normalizeAdminOrderItemFields(item)
    };
  });
}

function normalizeListOrderItems(items: RawOrderListItem[] | null | undefined) {
  if (!items) {
    return [];
  }

  return items.map((item) => ({
    product_name: item.product_name,
    quantity: item.quantity
  }));
}

function normalizeDashboardOrderItems(items: RawOrderItem[] | null | undefined): AdminOrderItem[] {
  if (!items) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    image_url: null,
    description: null,
    ...normalizeAdminOrderItemFields(item)
  }));
}

function buildAdminOrderDashboardItem(
  order: DashboardRawOrder,
  customerOrdersMap: Map<
    string,
    Array<{ id: string; created_at: string; delivery_method: "delivery" | "pickup" }>
  >
): AdminOrderDashboardItem {
  const safeCustomerName = normalizeDashboardString(order.customer_name, "Cliente");
  const safePhone = normalizeDashboardString(order.phone, "");
  const safeNotes = normalizeOptionalDashboardString(order.notes);
  const operationalSummary = buildOrderOperationalSummary(
    safeCustomerName,
    safeNotes,
    normalizeListOrderItems(order.order_items)
  );
  const customerKey = buildCustomerHistoryKey(safePhone, safeCustomerName);
  const customerOrders = customerOrdersMap.get(customerKey) ?? [];

  return {
    id: order.id,
    created_at: order.created_at,
    customer_name: safeCustomerName,
    phone: safePhone,
    delivery_date: order.delivery_date,
    delivery_time: order.delivery_time ?? null,
    delivery_method: order.delivery_method,
    address: order.address,
    status: order.status,
    total_price: order.total_price,
    notes: safeNotes,
    assigned_to: order.assigned_to ?? null,
    assigned_at: order.assigned_at ?? null,
    order_items_preview: normalizeDashboardOrderItems(order.order_items),
    item_count: operationalSummary.itemCount,
    item_summary: operationalSummary.itemSummary,
    customer_short_name: operationalSummary.customerShortName,
    has_notes: operationalSummary.hasNotes,
    notes_preview: operationalSummary.notesPreview,
    order_events: normalizeDashboardOrderEvents(order.order_events),
    relative_time_label: buildOrderRelativeTimeLabel({ created_at: order.created_at }),
    urgency_state: buildOrderUrgencyState(order.status, order.created_at),
    operational_aging: getOperationalAging(order.status, order.created_at),
    timeline_steps: getOperationalTimeline(order.status),
    customer_context: buildSafeCustomerOperationalContext(
      {
        id: order.id,
        created_at: order.created_at,
        delivery_method: order.delivery_method
      },
      customerOrders
    )
  };
}

function normalizeDashboardOrderEvents(
  events: RawOrderEvent[] | null | undefined
): AdminOrderTimelineEvent[] {
  if (!events) {
    return [];
  }

  return [...events]
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .map((event) =>
      presentOrderTimelineEvent(
        {
          id: event.id,
          business_id: event.business_id ?? "",
          order_id: event.order_id ?? "",
          actor_profile_id: event.actor_profile_id,
          event_type: event.event_type as "order_created" | "status_changed" | "assignment_taken" | "assignment_released",
          payload: event.payload as never,
          created_at: event.created_at
        },
        null
      )
    );
}

async function loadDashboardCustomerOrders(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  businessId: string;
  phone: string | null | undefined;
  customerName: string | null | undefined;
}) {
  const normalizedPhone = (input.phone ?? "").replace(/\D/g, "");
  const safeCustomerName = normalizeDashboardString(input.customerName, "Cliente");
  let customerQuery = input.supabase
    .from("orders")
    .select("id, created_at, delivery_method, phone, customer_name")
    .eq("business_id", input.businessId)
    .order("created_at", { ascending: false });

  if (normalizedPhone) {
    customerQuery = customerQuery.eq("phone", input.phone ?? "");
  } else {
    customerQuery = customerQuery.eq("customer_name", safeCustomerName);
  }

  const { data, error } = await customerQuery;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-order-summary] customer context fallback", error);
    }

    return [];
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    created_at: entry.created_at,
    delivery_method: entry.delivery_method
  }));
}

function buildCustomerOrdersMap(
  phone: string | null | undefined,
  customerName: string | null | undefined,
  customerOrders: Array<{ id: string; created_at: string; delivery_method: "delivery" | "pickup" }>
) {
  const customerOrdersMap = new Map<
    string,
    Array<{ id: string; created_at: string; delivery_method: "delivery" | "pickup" }>
  >();

  customerOrdersMap.set(
    buildCustomerHistoryKey(
      normalizeDashboardString(phone, ""),
      normalizeDashboardString(customerName, "Cliente")
    ),
    customerOrders
  );

  return customerOrdersMap;
}

function buildSafeCustomerOperationalContext(
  currentOrder: { id: string; created_at: string; delivery_method: "delivery" | "pickup" },
  customerOrders: Array<{ id: string; created_at: string; delivery_method: "delivery" | "pickup" }>
) {
  try {
    return buildCustomerOperationalContext(currentOrder, customerOrders);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-order-summary] customer context build fallback", error);
    }

    return {
      isNewCustomer: customerOrders.length <= 1,
      totalOrders: customerOrders.length,
      previousOrderRelativeLabel: null,
      preferredMethodLabel: null,
      signals: customerOrders.length > 1 ? [`${customerOrders.length} pedidos`] : ["Cliente nuevo"]
    };
  }
}

function normalizeDashboardString(value: string | null | undefined, fallback: string) {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || fallback;
}

function normalizeOptionalDashboardString(value: string | null | undefined) {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || null;
}

function buildCustomerHistoryKey(phone: string | null | undefined, customerName: string) {
  const normalizedPhone = (phone ?? "").replace(/\D/g, "");

  if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }

  return `name:${customerName.trim().toLowerCase()}`;
}
