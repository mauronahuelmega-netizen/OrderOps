import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { getAdminOrders } from "@/lib/orders/admin";

export async function GET() {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getAdminOrders(adminContext.businessId);
    return NextResponse.json({ orders });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const normalizedError =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          : {
              value: String(error)
            };

      console.error("[admin-dashboard-orders] failed to load dashboard orders", normalizedError);
    }

    return NextResponse.json({ error: "Failed to load dashboard orders" }, { status: 500 });
  }
}
