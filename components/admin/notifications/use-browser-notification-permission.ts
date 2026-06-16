"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";

type BrowserPermissionResult = {
  isRequesting: boolean;
  permission: BrowserNotificationPermissionState;
  requestPermission: () => Promise<BrowserNotificationPermissionState>;
};

function resolveBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (typeof window === "undefined") {
    return "unknown";
  }

  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  switch (Notification.permission) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    case "default":
      return "default";
    default:
      return "unknown";
  }
}

export function useBrowserNotificationPermission(): BrowserPermissionResult {
  const [permission, setPermission] = useState<BrowserNotificationPermissionState>("unknown");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(resolveBrowserNotificationPermission());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setPermission(resolveBrowserNotificationPermission());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const requestPermission = useCallback(async () => {
    const currentPermission = resolveBrowserNotificationPermission();

    if (currentPermission === "unsupported" || currentPermission === "denied") {
      setPermission(currentPermission);
      return currentPermission;
    }

    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return "unsupported";
    }

    setIsRequesting(true);

    try {
      const nextPermission = await Notification.requestPermission();
      const resolvedPermission =
        nextPermission === "granted" || nextPermission === "denied" || nextPermission === "default"
          ? nextPermission
          : "unknown";

      setPermission(resolvedPermission);
      return resolvedPermission;
    } catch {
      const fallbackPermission = resolveBrowserNotificationPermission();
      setPermission(fallbackPermission);
      return fallbackPermission;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    isRequesting,
    permission,
    requestPermission
  };
}
