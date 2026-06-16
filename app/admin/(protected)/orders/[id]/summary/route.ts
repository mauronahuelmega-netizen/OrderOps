import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { getAdminDashboardOrderById } from "@/lib/orders/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await getAdminDashboardOrderById(id, adminContext.businessId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-order-summary] failed to build summary", error);
    }

    return NextResponse.json({ error: "Failed to load order summary" }, { status: 500 });
  }
}
