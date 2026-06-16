import type { Json } from "@/types/database";

export type BrowserNotificationPermissionState =
  | "unknown"
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export type NotificationPreferences = {
  new_order_browser_notifications_enabled: boolean;
  new_order_sound_enabled: boolean;
  new_order_toast_enabled: boolean;
  new_order_highlight_enabled: boolean;
};

export type NotificationPreferencesPatch = Partial<NotificationPreferences>;

const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferences = {
  new_order_browser_notifications_enabled: false,
  new_order_sound_enabled: true,
  new_order_toast_enabled: true,
  new_order_highlight_enabled: true
};

export function normalizeNotificationPreferences(
  value: Json | Record<string, unknown> | null | undefined
): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...NOTIFICATION_PREFERENCE_DEFAULTS };
  }

  return {
    new_order_browser_notifications_enabled:
      typeof value["new_order_browser_notifications_enabled"] === "boolean"
        ? value["new_order_browser_notifications_enabled"]
        : NOTIFICATION_PREFERENCE_DEFAULTS.new_order_browser_notifications_enabled,
    new_order_sound_enabled:
      typeof value["new_order_sound_enabled"] === "boolean"
        ? value["new_order_sound_enabled"]
        : NOTIFICATION_PREFERENCE_DEFAULTS.new_order_sound_enabled,
    new_order_toast_enabled:
      typeof value["new_order_toast_enabled"] === "boolean"
        ? value["new_order_toast_enabled"]
        : NOTIFICATION_PREFERENCE_DEFAULTS.new_order_toast_enabled,
    new_order_highlight_enabled:
      typeof value["new_order_highlight_enabled"] === "boolean"
        ? value["new_order_highlight_enabled"]
        : NOTIFICATION_PREFERENCE_DEFAULTS.new_order_highlight_enabled
  };
}

export function buildNotificationPreferencesUpdate(
  value: Json | Record<string, unknown> | null | undefined,
  patch: NotificationPreferencesPatch
) {
  const basePreferences =
    value && typeof value === "object" && !Array.isArray(value)
      ? { ...value }
      : {};

  const nextPreferences = normalizeNotificationPreferences({
    ...basePreferences,
    ...patch
  });

  return {
    ...basePreferences,
    ...nextPreferences
  };
}

export function isNewOrderBrowserNotificationsEnabled(
  value: Json | Record<string, unknown> | null | undefined
) {
  return normalizeNotificationPreferences(value).new_order_browser_notifications_enabled;
}

export function isNewOrderSoundEnabled(value: Json | Record<string, unknown> | null | undefined) {
  return normalizeNotificationPreferences(value).new_order_sound_enabled;
}

export function isNewOrderToastEnabled(value: Json | Record<string, unknown> | null | undefined) {
  return normalizeNotificationPreferences(value).new_order_toast_enabled;
}

export function isNewOrderHighlightEnabled(
  value: Json | Record<string, unknown> | null | undefined
) {
  return normalizeNotificationPreferences(value).new_order_highlight_enabled;
}

export function canUseNewOrderBrowserNotification(
  preferences: NotificationPreferences,
  permission: BrowserNotificationPermissionState
) {
  return permission === "granted" && preferences.new_order_browser_notifications_enabled;
}

export function shouldPlayNewOrderSound(preferences: NotificationPreferences) {
  return preferences.new_order_sound_enabled;
}

export function shouldShowNewOrderToast(preferences: NotificationPreferences) {
  return preferences.new_order_toast_enabled;
}

export function shouldHighlightNewOrder(preferences: NotificationPreferences) {
  return preferences.new_order_highlight_enabled;
}
