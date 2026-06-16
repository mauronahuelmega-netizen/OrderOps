import type { AdminOrderDashboardItem, AdminOrderDetail } from "@/lib/orders/admin";
import { patchOrderAssignment, type AdminOrderAssignment } from "@/lib/orders/assignment";
import {
  buildOrderUrgencyState,
  getOperationalAging,
  getOperationalTimeline
} from "@/lib/orders/presenter";

export type AdminOrderWorkspaceData = Omit<AdminOrderDetail, "order_items"> & {
  order_items?: AdminOrderDetail["order_items"] | null;
};

type AdminOrderStatus = AdminOrderWorkspaceData["status"];

export function buildAdminOrderInitialDetail(
  order: AdminOrderDashboardItem,
  cachedDetail?: AdminOrderWorkspaceData | null
): AdminOrderWorkspaceData {
  if (cachedDetail) {
    return {
      ...cachedDetail,
      id: order.id,
      created_at: order.created_at,
      customer_name: order.customer_name,
      phone: order.phone,
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time,
      delivery_method: order.delivery_method,
      address: order.address,
      status: order.status,
      total_price: order.total_price,
      notes: order.notes,
      assigned_to: order.assigned_to,
      assigned_at: order.assigned_at,
      order_events: cachedDetail.order_events ?? order.order_events
    };
  }

  return {
    id: order.id,
    created_at: order.created_at,
    customer_name: order.customer_name,
    phone: order.phone,
    delivery_date: order.delivery_date,
    delivery_time: order.delivery_time,
    delivery_method: order.delivery_method,
    address: order.address,
    status: order.status,
    total_price: order.total_price,
    notes: order.notes,
    assigned_to: order.assigned_to,
    assigned_at: order.assigned_at,
    order_items: order.order_items_preview ?? [],
    order_events: order.order_events
  };
}

export function patchAdminOrderDashboardItemStatus(
  order: AdminOrderDashboardItem,
  status: AdminOrderStatus
): AdminOrderDashboardItem {
  return {
    ...order,
    status,
    urgency_state: buildOrderUrgencyState(status, order.created_at),
    operational_aging: getOperationalAging(status, order.created_at),
    timeline_steps: getOperationalTimeline(status)
  };
}

export function patchAdminOrderWorkspaceStatus(
  order: AdminOrderWorkspaceData,
  status: AdminOrderStatus
): AdminOrderWorkspaceData {
  return {
    ...order,
    status
  };
}

export function patchAdminOrderDashboardItemAssignment(
  order: AdminOrderDashboardItem,
  assignment: AdminOrderAssignment
): AdminOrderDashboardItem {
  return patchOrderAssignment(order, assignment);
}

export function patchAdminOrderWorkspaceAssignment(
  order: AdminOrderWorkspaceData,
  assignment: AdminOrderAssignment
): AdminOrderWorkspaceData {
  return patchOrderAssignment(order, assignment);
}
