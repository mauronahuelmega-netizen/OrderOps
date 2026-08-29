import { notFound } from "next/navigation";
import OrderDetailPageClient from "@/components/admin/orders/order-detail-page-client";
import { isOrderAssignmentEnabled } from "@/lib/orders/assignment-flags";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminOrderById, getAdminOrderCustomerContext } from "@/lib/orders/admin";
import { getOrderEventsForOrder } from "@/lib/orders/events.server";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    from?: string;
    filter?: string;
    order?: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: AdminOrderDetailPageProps) {
  const adminContext = await requireAdminContext();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [order, orderEvents, orderResponsibilityEnabled] = await Promise.all([
    getAdminOrderById(id, adminContext.businessId),
    getOrderEventsForOrder(id, adminContext.businessId),
    isOrderAssignmentEnabled(adminContext.businessId)
  ]);

  if (!order) {
    notFound();
  }

  const customerContext = await getAdminOrderCustomerContext(order, adminContext.businessId);
  const backParams = new URLSearchParams();

  if (resolvedSearchParams?.from === "dashboard" && resolvedSearchParams.filter) {
    backParams.set("filter", resolvedSearchParams.filter);
  }

  const dashboardHref = backParams.toString()
    ? `/admin/dashboard?${backParams.toString()}`
    : "/admin/dashboard";

  return (
    <OrderDetailPageClient
      order={{
        ...order,
        order_events: orderEvents
      }}
      customerSignals={customerContext.signals}
      dashboardHref={dashboardHref}
      businessId={adminContext.businessId}
      canUpdateOrders={adminContext.permissions.canUpdateOrders}
      currentUserId={adminContext.user.id}
      currentUserEmail={adminContext.user.email}
      currentUserRole={adminContext.profile.role}
      orderResponsibilityEnabled={orderResponsibilityEnabled}
    />
  );
}
