import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { getAdminOrderById } from "@/lib/orders/admin";
import { getOrderEventsForOrder } from "@/lib/orders/events.server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const adminContext = await getAdminContext();

  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [order, events] = await Promise.all([
    getAdminOrderById(id, adminContext.businessId),
    getOrderEventsForOrder(id, adminContext.businessId)
  ]);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...order,
      order_events: events
    }
  });
}
