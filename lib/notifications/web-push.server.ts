import "server-only";

import webpush from "web-push";
import { canManageNotifications } from "@/lib/admin/permissions";
import {
  formatAdminDeliveryMethod,
  formatAdminOrderCurrency
} from "@/lib/orders/presenter";
import { normalizeNotificationPreferences } from "@/lib/notifications/preferences";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json, ProfileRole } from "@/types/database";

export type NewOrderPushPayload = {
  type: "new_order";
  orderId: string;
  businessId: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  data: {
    businessId: string;
    orderId: string;
    type: "new_order";
    url: string;
  };
};

type SendNewOrderWebPushResult = {
  attempted: number;
  revoked: number;
  sent: number;
  skipped: number;
  reason?: "missing-vapid-config";
};

type PushSubscriptionRow = {
  auth: string;
  business_id: string;
  endpoint: string;
  id: string;
  p256dh: string;
  profile_id: string;
};

type ProfilePushPreferenceRow = {
  id: string;
  notification_preferences: Json;
  role: ProfileRole;
};

let vapidConfigured = false;

function getWebPushConfig() {
  const publicKey =
    typeof process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY === "string" &&
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY.trim().length > 0
      ? process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY.trim()
      : null;
  const privateKey =
    typeof process.env.WEB_PUSH_VAPID_PRIVATE_KEY === "string" &&
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY.trim().length > 0
      ? process.env.WEB_PUSH_VAPID_PRIVATE_KEY.trim()
      : null;
  const contact =
    typeof process.env.WEB_PUSH_CONTACT === "string" &&
    process.env.WEB_PUSH_CONTACT.trim().length > 0
      ? process.env.WEB_PUSH_CONTACT.trim()
      : null;

  if (!publicKey || !privateKey || !contact) {
    return null;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(contact, publicKey, privateKey);
    vapidConfigured = true;
  }

  return {
    contact,
    privateKey,
    publicKey
  };
}

function buildNewOrderPushPayload(input: {
  businessId: string;
  customerName?: string | null;
  deliveryMethod?: string | null;
  orderId: string;
  totalPrice?: number | null;
}): NewOrderPushPayload {
  const customerLabel =
    typeof input.customerName === "string" && input.customerName.trim().length > 0
      ? input.customerName.trim()
      : null;
  const deliveryMethodLabel =
    input.deliveryMethod === "delivery" || input.deliveryMethod === "pickup"
      ? formatAdminDeliveryMethod(input.deliveryMethod)
      : null;
  const totalLabel =
    typeof input.totalPrice === "number" && Number.isFinite(input.totalPrice)
      ? formatAdminOrderCurrency(input.totalPrice)
      : null;
  const body = [customerLabel, deliveryMethodLabel, totalLabel].filter(Boolean).join(" - ");
  const url = "/admin/dashboard";

  return {
    type: "new_order",
    orderId: input.orderId,
    businessId: input.businessId,
    title: "Nuevo pedido",
    body: body || "Nuevo pedido recibido",
    url,
    tag: `new-order:${input.orderId}`,
    data: {
      businessId: input.businessId,
      orderId: input.orderId,
      type: "new_order",
      url
    }
  };
}

export async function sendNewOrderWebPush(input: {
  businessId: string;
  orderId: string;
  customerName?: string | null;
  deliveryMethod?: string | null;
  totalPrice?: number | null;
}): Promise<SendNewOrderWebPushResult> {
  const config = getWebPushConfig();

  if (!config) {
    console.warn("[web-push] skipped new order push: missing VAPID config", {
      businessId: input.businessId,
      orderId: input.orderId
    });

    return {
      attempted: 0,
      revoked: 0,
      sent: 0,
      skipped: 0,
      reason: "missing-vapid-config"
    };
  }

  const serviceSupabase = createSupabaseServiceClient();
  const { data: subscriptions, error: subscriptionsError } = await serviceSupabase
    .from("push_subscriptions")
    .select("id, business_id, profile_id, endpoint, p256dh, auth")
    .eq("business_id", input.businessId)
    .is("revoked_at", null);

  if (subscriptionsError) {
    console.error("[web-push] failed to load active subscriptions", {
      businessId: input.businessId,
      message: subscriptionsError.message,
      orderId: input.orderId
    });

    return {
      attempted: 0,
      revoked: 0,
      sent: 0,
      skipped: 0
    };
  }

  const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRow[];

  if (activeSubscriptions.length === 0) {
    return {
      attempted: 0,
      revoked: 0,
      sent: 0,
      skipped: 0
    };
  }

  const profileIds = [...new Set(activeSubscriptions.map((subscription) => subscription.profile_id))];
  const { data: profiles, error: profilesError } = await serviceSupabase
    .from("profiles")
    .select("id, role, notification_preferences")
    .in("id", profileIds);

  if (profilesError) {
    console.error("[web-push] failed to load profile preferences", {
      businessId: input.businessId,
      message: profilesError.message,
      orderId: input.orderId
    });

    return {
      attempted: 0,
      revoked: 0,
      sent: 0,
      skipped: activeSubscriptions.length
    };
  }

  const profileMap = new Map(
    ((profiles ?? []) as ProfilePushPreferenceRow[]).map((profile) => [profile.id, profile])
  );
  const payload = buildNewOrderPushPayload(input);
  const payloadJson = JSON.stringify(payload);
  const revokedSubscriptionIds: string[] = [];

  let attempted = 0;
  let sent = 0;
  let skipped = 0;

  for (const subscription of activeSubscriptions) {
    const profile = profileMap.get(subscription.profile_id);

    if (!profile || !canManageNotifications(profile.role)) {
      skipped += 1;
      continue;
    }

    const preferences = normalizeNotificationPreferences(profile.notification_preferences);

    if (!preferences.new_order_browser_notifications_enabled) {
      skipped += 1;
      continue;
    }

    attempted += 1;

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh
          }
        },
        payloadJson
      );
      sent += 1;
    } catch (error) {
      const normalizedError =
        error && typeof error === "object"
          ? (error as {
              body?: string;
              message?: string;
              statusCode?: number;
            })
          : null;

      if (
        normalizedError?.statusCode === 404 ||
        normalizedError?.statusCode === 410
      ) {
        revokedSubscriptionIds.push(subscription.id);
      } else {
        console.error("[web-push] send failed", {
          businessId: input.businessId,
          endpoint: subscription.endpoint,
          message: normalizedError?.message ?? String(error),
          orderId: input.orderId,
          statusCode: normalizedError?.statusCode ?? null
        });
      }
    }
  }

  if (revokedSubscriptionIds.length > 0) {
    const { error: revokeError } = await serviceSupabase
      .from("push_subscriptions")
      .update({
        revoked_at: new Date().toISOString()
      })
      .in("id", revokedSubscriptionIds);

    if (revokeError) {
      console.error("[web-push] failed to revoke invalid subscriptions", {
        businessId: input.businessId,
        ids: revokedSubscriptionIds,
        message: revokeError.message,
        orderId: input.orderId
      });
    }
  }

  return {
    attempted,
    revoked: revokedSubscriptionIds.length,
    sent,
    skipped
  };
}
