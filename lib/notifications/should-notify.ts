import { canManageNotifications } from "@/lib/admin/permissions";
import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";
import type { ProfileRole } from "@/types/database";

type CanShowBrowserNotificationInput = {
  enabled: boolean;
  isDocumentVisible: boolean;
  isLiveInsert: boolean;
  isRecoverySuppressed: boolean;
  permission: BrowserNotificationPermissionState;
  role: ProfileRole;
};

export function canShowBrowserNotification(input: CanShowBrowserNotificationInput) {
  if (!canManageNotifications(input.role)) {
    return false;
  }

  if (!input.enabled) {
    return false;
  }

  if (input.permission !== "granted") {
    return false;
  }

  if (input.isDocumentVisible) {
    return false;
  }

  if (!input.isLiveInsert) {
    return false;
  }

  if (input.isRecoverySuppressed) {
    return false;
  }

  return true;
}
