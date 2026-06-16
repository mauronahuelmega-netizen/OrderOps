"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminContext, requireAdminPermission } from "@/lib/admin/context";
import {
  buildNotificationPreferencesUpdate,
  normalizeNotificationPreferences
} from "@/lib/notifications/preferences";
import { readSerializablePushSubscription } from "@/lib/notifications/push";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export async function updatePublicBusinessSettingsAction(
  _prevState: ActionState,
  formData: FormData
) {
  const description = getOptionalTrimmedString(formData.get("description"));
  const primaryColor = getOptionalTrimmedString(formData.get("primary_color"));
  const incomingLogoUrl = getOptionalTrimmedString(formData.get("logo_url"));
  const incomingCoverImageUrl = getOptionalTrimmedString(formData.get("cover_image_url"));
  const instagramUrl = getOptionalTrimmedString(formData.get("instagram_url"));

  if (primaryColor && !HEX_COLOR_PATTERN.test(primaryColor)) {
    return { error: "Ingresa un color en formato #RRGGBB." };
  }

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const supabase = await createSupabaseServerClient();

    const { data: currentBusiness, error: currentBusinessError } = await supabase
      .from("businesses")
      .select("id, logo_url, cover_image_url")
      .eq("id", adminContext.businessId)
      .maybeSingle();

    if (currentBusinessError) {
      throw new Error("No pudimos cargar la configuracion actual del negocio.");
    }

    if (!currentBusiness) {
      return { error: "No encontramos el negocio que queres actualizar." };
    }

    const nextLogoUrl = incomingLogoUrl ?? currentBusiness.logo_url;
    const nextCoverImageUrl = incomingCoverImageUrl ?? currentBusiness.cover_image_url;

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        description,
        primary_color: primaryColor,
        logo_url: nextLogoUrl,
        cover_image_url: nextCoverImageUrl,
        instagram_url: instagramUrl
      })
      .eq("id", adminContext.businessId);

    if (updateError) {
      throw new Error("No pudimos guardar los cambios.");
    }

    const { data: confirmedBusiness, error: confirmError } = await supabase
      .from("businesses")
      .select("id, logo_url, cover_image_url, description, primary_color, instagram_url")
      .eq("id", adminContext.businessId)
      .maybeSingle();

    if (confirmError || !confirmedBusiness) {
      throw new Error("No pudimos confirmar los cambios del negocio.");
    }

    if (incomingLogoUrl && !matchesStoredValue(confirmedBusiness.logo_url, incomingLogoUrl)) {
      return { error: "No pudimos guardar el logo. Intenta de nuevo." };
    }

    if (
      incomingCoverImageUrl &&
      !matchesStoredValue(confirmedBusiness.cover_image_url, incomingCoverImageUrl)
    ) {
      return { error: "No pudimos guardar la portada del negocio." };
    }

    revalidatePath("/admin/settings/public");
    revalidatePath("/admin/settings/public/landing");
    revalidatePath("/admin/settings/public/catalogo");

    if (adminContext.businessSlug) {
      revalidatePath(`/b/${adminContext.businessSlug}`);
      revalidatePath(`/b/${adminContext.businessSlug}/catalogo`);
    }

    return { success: true };
  } catch (error) {
    logActionFailure("settings.public.updateBusiness", error);
    return {
      error: getActionErrorMessage(error, "No pudimos guardar los cambios. Intenta de nuevo.")
    };
  }
}

export async function updateCatalogHeroSettingsAction(
  _prevState: ActionState,
  formData: FormData
) {
  const catalogHeroHeadline = getOptionalTrimmedString(formData.get("catalog_hero_headline"));
  const catalogHeroBadge = getOptionalTrimmedString(formData.get("catalog_hero_badge"));
  const catalogHeroMicrocopy = getOptionalTrimmedString(formData.get("catalog_hero_microcopy"));

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const supabase = await createSupabaseServerClient();

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        catalog_hero_headline: catalogHeroHeadline,
        catalog_hero_badge: catalogHeroBadge,
        catalog_hero_microcopy: catalogHeroMicrocopy
      })
      .eq("id", adminContext.businessId);

    if (updateError) {
      throw new Error("No pudimos guardar los cambios.");
    }

    revalidatePath("/admin/settings/public");
    revalidatePath("/admin/settings/public/catalogo");

    if (adminContext.businessSlug) {
      revalidatePath(`/b/${adminContext.businessSlug}/catalogo`);
    }

    return { success: true };
  } catch (error) {
    logActionFailure("settings.public.updateCatalogHero", error);
    return {
      error: getActionErrorMessage(error, "No pudimos guardar los cambios. Intenta de nuevo.")
    };
  }
}

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

function getOptionalTrimmedString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function matchesStoredValue(storedValue: string | null, incomingValue: string) {
  return (storedValue ?? "").trim() === incomingValue.trim();
}
