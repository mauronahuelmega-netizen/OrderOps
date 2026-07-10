"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminContext } from "@/lib/admin/context";
import {
  buildNotificationPreferencesUpdate,
  normalizeNotificationPreferences
} from "@/lib/notifications/preferences";
import { readSerializablePushSubscription } from "@/lib/notifications/push";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type NotificationPreferencesActionInput = {
  newOrderBrowserNotificationsEnabled?: boolean;
  newOrderSoundEnabled?: boolean;
  newOrderToastEnabled?: boolean;
  newOrderHighlightEnabled?: boolean;
};

export async function updateNotificationPreferencesAction(
  input: NotificationPreferencesActionInput
) {
  try {
    const notificationPreferencesPatch = {
      ...(typeof input.newOrderBrowserNotificationsEnabled === "boolean"
        ? {
            new_order_browser_notifications_enabled: input.newOrderBrowserNotificationsEnabled
          }
        : {}),
      ...(typeof input.newOrderSoundEnabled === "boolean"
        ? {
            new_order_sound_enabled: input.newOrderSoundEnabled
          }
        : {}),
      ...(typeof input.newOrderToastEnabled === "boolean"
        ? {
            new_order_toast_enabled: input.newOrderToastEnabled
          }
        : {}),
      ...(typeof input.newOrderHighlightEnabled === "boolean"
        ? {
            new_order_highlight_enabled: input.newOrderHighlightEnabled
          }
        : {})
    };

    if (Object.keys(notificationPreferencesPatch).length === 0) {
      return {
        error: "No pudimos interpretar la preferencia que queres guardar."
      };
    }

    const adminContext = await requireAdminContext();

    if (!adminContext.permissions.canManageNotifications) {
      return {
        error: "No tenes permiso para cambiar esta preferencia."
      };
    }

    const serviceSupabase = createSupabaseServiceClient();
    const nextNotificationPreferences = buildNotificationPreferencesUpdate(
      adminContext.profile.notificationPreferences,
      notificationPreferencesPatch
    );

    const { error } = await serviceSupabase
      .from("profiles")
      .update({
        notification_preferences: nextNotificationPreferences
      })
      .eq("id", adminContext.user.id);

    if (error) {
      throw new Error("No pudimos guardar tu preferencia de notificaciones.");
    }

    revalidatePath("/admin/settings/public");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      preferences: normalizeNotificationPreferences(nextNotificationPreferences),
      message: "Preferencias de notificaciones actualizadas."
    };
  } catch (error) {
    logActionFailure("settings.public.updateNotificationPreferences", error);
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos guardar tu preferencia de notificaciones."
      )
    };
  }
}

export async function savePushSubscriptionAction(input: unknown) {
  try {
    const subscription = readSerializablePushSubscription(input);

    if (!subscription) {
      return {
        error: "No pudimos interpretar la suscripcion de este dispositivo."
      };
    }

    const adminContext = await requireAdminContext();

    if (!adminContext.permissions.canManageNotifications) {
      return {
        error: "No tenes permiso para preparar push en este dispositivo."
      };
    }

    const serviceSupabase = createSupabaseServiceClient();
    const now = new Date().toISOString();

    const { error } = await serviceSupabase.from("push_subscriptions").upsert(
      {
        auth: subscription.keys.auth,
        business_id: adminContext.businessId,
        endpoint: subscription.endpoint,
        last_seen_at: now,
        p256dh: subscription.keys.p256dh,
        profile_id: adminContext.user.id,
        revoked_at: null,
        user_agent: subscription.userAgent ?? null
      },
      {
        onConflict: "endpoint"
      }
    );

    if (error) {
      throw new Error("No pudimos guardar la suscripcion push de este dispositivo.");
    }

    revalidatePath("/admin/settings/public");

    return {
      success: true
    };
  } catch (error) {
    logActionFailure("settings.public.savePushSubscription", error);
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos preparar push en este dispositivo."
      )
    };
  }
}

export async function revokePushSubscriptionAction(endpoint: string) {
  try {
    if (typeof endpoint !== "string" || endpoint.trim().length === 0) {
      return {
        error: "No pudimos identificar la suscripcion que queres desactivar."
      };
    }

    const adminContext = await requireAdminContext();

    if (!adminContext.permissions.canManageNotifications) {
      return {
        error: "No tenes permiso para desactivar push en este dispositivo."
      };
    }

    const serviceSupabase = createSupabaseServiceClient();
    const { error } = await serviceSupabase
      .from("push_subscriptions")
      .update({
        revoked_at: new Date().toISOString()
      })
      .eq("endpoint", endpoint.trim())
      .eq("profile_id", adminContext.user.id);

    if (error) {
      throw new Error("No pudimos desactivar la suscripcion push de este dispositivo.");
    }

    revalidatePath("/admin/settings/public");

    return {
      success: true
    };
  } catch (error) {
    logActionFailure("settings.public.revokePushSubscription", error);
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos desactivar push en este dispositivo."
      )
    };
  }
}
