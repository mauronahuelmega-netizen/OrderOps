import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendNewOrderWebPush } from "@/lib/notifications/web-push.server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const RECENT_ORDER_PUSH_WINDOW_MS = 10 * 60 * 1000;
const DUPLICATE_PUSH_WINDOW_MS = 5 * 60 * 1000;
const recentOrderPushAttempts = new Map<string, number>();

function claimRecentOrderPush(orderId: string, now = Date.now()) {
  const previousAttemptAt = recentOrderPushAttempts.get(orderId);

  if (previousAttemptAt && now - previousAttemptAt < DUPLICATE_PUSH_WINDOW_MS) {
    return false;
  }

  recentOrderPushAttempts.set(orderId, now);

  for (const [key, value] of recentOrderPushAttempts) {
    if (now - value >= DUPLICATE_PUSH_WINDOW_MS) {
      recentOrderPushAttempts.delete(key);
    }
  }

  return true;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const now = Date.now();

    if (!claimRecentOrderPush(id, now)) {
      return NextResponse.json({
        duplicated: true,
        success: true
      });
    }

    const serviceSupabase = createSupabaseServiceClient();
    const { data: order, error } = await serviceSupabase
      .from("orders")
      .select("id, business_id, customer_name, delivery_method, total_price, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load order for push: ${error.message}`);
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const createdAt = new Date(order.created_at);

    if (
      Number.isNaN(createdAt.getTime()) ||
      now - createdAt.getTime() > RECENT_ORDER_PUSH_WINDOW_MS
    ) {
      return NextResponse.json({
        reason: "order-too-old",
        success: true
      });
    }

    const result = await sendNewOrderWebPush({
      businessId: order.business_id,
      customerName: order.customer_name,
      deliveryMethod: order.delivery_method,
      orderId: order.id,
      totalPrice: order.total_price
    });

    return NextResponse.json({
      result,
      success: true
    });
  } catch (error) {
    console.error("[web-push] notify route failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: "Failed to notify push subscribers"
    });
  }
}
