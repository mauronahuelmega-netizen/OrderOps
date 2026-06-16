import "server-only";

import { presentOrderTimelineEvent, type AdminOrderTimelineEvent, type OrderEventType } from "@/lib/orders/events.shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json, Tables } from "@/types/database";

type CreateOrderEventInput = {
  businessId: string;
  orderId: string;
  actorProfileId: string | null;
  eventType: OrderEventType;
  payload?: Json;
};

export async function createOrderEvent({
  businessId,
  orderId,
  actorProfileId,
  eventType,
  payload = {}
}: CreateOrderEventInput): Promise<Tables<"order_events"> | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("order_events")
    .insert({
      business_id: businessId,
      order_id: orderId,
      actor_profile_id: actorProfileId,
      event_type: eventType,
      payload
    })
    .select("id, business_id, order_id, actor_profile_id, event_type, payload, created_at")
    .single();

  if (error) {
    console.error("[order-events] failed to create event", {
      businessId,
      orderId,
      eventType,
      error
    });
    return null;
  }

  return data;
}

export async function getOrderEventsForOrder(
  orderId: string,
  businessId: string,
  limit = 30
): Promise<AdminOrderTimelineEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("order_events")
    .select("id, business_id, order_id, actor_profile_id, event_type, payload, created_at")
    .eq("business_id", businessId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load order events: ${error.message}`);
  }

  const rows = [...(data ?? [])].reverse();
  const actorIds = Array.from(
    new Set(
      rows
        .map((row) => row.actor_profile_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (actorIds.length === 0) {
    return rows.map((row) => presentOrderTimelineEvent(row, null));
  }

  const serviceSupabase = createSupabaseServiceClient();
  const { data: authUsers, error: authError } = await serviceSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) {
    console.error("[order-events] failed to resolve actor emails", {
      businessId,
      orderId,
      error: authError
    });

    return rows.map((row) => presentOrderTimelineEvent(row, null));
  }

  const emailByUserId = new Map(
    (authUsers.users ?? []).map((user) => [user.id, user.email ?? null] as const)
  );

  return rows.map((row) =>
    presentOrderTimelineEvent(
      row,
      row.actor_profile_id ? (emailByUserId.get(row.actor_profile_id) ?? null) : null
    )
  );
}
