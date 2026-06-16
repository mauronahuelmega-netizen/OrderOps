import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import {
  getAdminPermissions,
  hasAdminPermission,
  normalizeBusinessAdminRole,
  type AdminPermission
} from "@/lib/admin/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isNewOrderHighlightEnabled,
  isNewOrderBrowserNotificationsEnabled,
  isNewOrderSoundEnabled,
  isNewOrderToastEnabled,
  normalizeNotificationPreferences,
  type NotificationPreferences
} from "@/lib/notifications/preferences";
import type { ProfileRole } from "@/types/database";

type AdminContext = {
  businessId: string;
  businessSlug: string | null;
  profile: {
    notificationPreferences: NotificationPreferences;
    newOrderBrowserNotificationsEnabled: boolean;
    newOrderHighlightEnabled: boolean;
    newOrderSoundEnabled: boolean;
    newOrderToastEnabled: boolean;
    role: ProfileRole;
    businessRole: ReturnType<typeof normalizeBusinessAdminRole>;
  };
  permissions: ReturnType<typeof getAdminPermissions>;
  user: {
    id: string;
    email?: string;
  };
};

export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        business_id,
        notification_preferences,
        role,
        businesses (
          slug
        )
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    return null;
  }

  const role = (profile.role ?? "admin") as ProfileRole;
  const notificationPreferences = normalizeNotificationPreferences(
    profile.notification_preferences as NotificationPreferences | null | undefined
  );

  return {
    businessId: profile.business_id,
    businessSlug: Array.isArray(profile.businesses)
      ? (profile.businesses[0]?.slug ?? null)
      : ((profile.businesses as { slug?: string } | null)?.slug ?? null),
    profile: {
      notificationPreferences,
      newOrderBrowserNotificationsEnabled: isNewOrderBrowserNotificationsEnabled(
        notificationPreferences
      ),
      newOrderHighlightEnabled: isNewOrderHighlightEnabled(notificationPreferences),
      newOrderSoundEnabled: isNewOrderSoundEnabled(notificationPreferences),
      newOrderToastEnabled: isNewOrderToastEnabled(notificationPreferences),
      role,
      businessRole: normalizeBusinessAdminRole(role)
    },
    permissions: getAdminPermissions(role),
    user: {
      id: user.id,
      email: user.email
    }
  };
});

export async function requireAdminContext(): Promise<AdminContext> {
  const adminContext = await getAdminContext();

  if (!adminContext) {
    redirect("/admin/login");
  }

  return adminContext;
}

export async function requireAdminPermission(
  permission: AdminPermission,
  fallbackHref = "/admin/dashboard"
) {
  const adminContext = await requireAdminContext();

  if (!hasAdminPermission(adminContext.profile.role, permission)) {
    redirect(fallbackHref);
  }

  return adminContext;
}
