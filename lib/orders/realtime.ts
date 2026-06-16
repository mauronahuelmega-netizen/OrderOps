import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { patchOrderAssignment } from "@/lib/orders/assignment";
import {
  buildOrderOperationalSummary,
  buildOrderRelativeTimeLabel,
  buildOrderUrgencyState,
  getOperationalAging,
  getOperationalTimeline
} from "@/lib/orders/presenter";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import type { Tables } from "@/types/database";

export type AdminOrderRealtimeRow = Tables<"orders">;

export function patchDashboardOrderFromRealtime(
  order: AdminOrderDashboardItem,
  row: Partial<AdminOrderRealtimeRow>
) {
  const nextAssignment = {
    assigned_to: hasRealtimeField(row, "assigned_to") ? row.assigned_to ?? null : order.assigned_to,
    assigned_at: hasRealtimeField(row, "assigned_at") ? row.assigned_at ?? null : order.assigned_at
  };

  const nextBase = {
    ...order,
    created_at: row.created_at ?? order.created_at,
    customer_name: row.customer_name ?? order.customer_name,
    phone: row.phone ?? order.phone,
    delivery_date: row.delivery_date ?? order.delivery_date,
    delivery_method: row.delivery_method ?? order.delivery_method,
    address: row.address ?? order.address,
    status: row.status ?? order.status,
    total_price: row.total_price ?? order.total_price,
    notes: row.notes ?? order.notes,
    ...nextAssignment
  };

  const summary = buildOrderOperationalSummary(
    nextBase.customer_name,
    nextBase.notes,
    nextBase.order_items_preview
  );

  return {
    ...nextBase,
    item_count: summary.itemCount,
    item_summary: summary.itemSummary,
    customer_short_name: summary.customerShortName,
    has_notes: summary.hasNotes,
    notes_preview: summary.notesPreview,
    relative_time_label: buildOrderRelativeTimeLabel({ created_at: nextBase.created_at }),
    urgency_state: buildOrderUrgencyState(nextBase.status, nextBase.created_at),
    operational_aging: getOperationalAging(nextBase.status, nextBase.created_at),
    timeline_steps: getOperationalTimeline(nextBase.status)
  };
}

export function patchWorkspaceOrderFromRealtime(
  order: AdminOrderWorkspaceData,
  row: Partial<AdminOrderRealtimeRow>
) {
  const nextAssignment = patchOrderAssignment(order, {
    assigned_to: hasRealtimeField(row, "assigned_to") ? row.assigned_to ?? null : order.assigned_to,
    assigned_at: hasRealtimeField(row, "assigned_at") ? row.assigned_at ?? null : order.assigned_at
  });

  return {
    ...nextAssignment,
    created_at: row.created_at ?? order.created_at,
    customer_name: row.customer_name ?? order.customer_name,
    phone: row.phone ?? order.phone,
    delivery_date: row.delivery_date ?? order.delivery_date,
    delivery_method: row.delivery_method ?? order.delivery_method,
    address: row.address ?? order.address,
    status: row.status ?? order.status,
    total_price: row.total_price ?? order.total_price,
    notes: row.notes ?? order.notes
  };
}

export function isOrderRealtimePayloadForBusiness(
  payload: {
    new: Partial<AdminOrderRealtimeRow> | null;
    old: Partial<AdminOrderRealtimeRow> | null;
  },
  businessId: string
) {
  const businessValue = payload.new?.business_id ?? payload.old?.business_id;

  return businessValue === businessId;
}

function hasRealtimeField<Key extends keyof AdminOrderRealtimeRow>(
  row: Partial<AdminOrderRealtimeRow>,
  key: Key
) {
  return Object.prototype.hasOwnProperty.call(row, key);
}
