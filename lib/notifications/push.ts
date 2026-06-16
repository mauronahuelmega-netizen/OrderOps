import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";

export type SerializablePushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  userAgent?: string | null;
};

export type PushCapabilityState =
  | "unknown"
  | "unsupported"
  | "env_missing"
  | "blocked"
  | "not_configured"
  | "configured";

export function getWebPushPublicKey() {
  const value = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function canUsePushInBrowser() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export function resolvePushCapabilityState(input: {
  hasSubscription: boolean;
  permission: BrowserNotificationPermissionState;
  supported: boolean;
  vapidPublicKey: string | null;
}): PushCapabilityState {
  if (!input.supported) {
    return "unsupported";
  }

  if (!input.vapidPublicKey) {
    return "env_missing";
  }

  if (input.permission === "denied") {
    return "blocked";
  }

  return input.hasSubscription ? "configured" : "not_configured";
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function registerPushServiceWorker() {
  if (!canUsePushInBrowser()) {
    throw new Error("Push web no esta disponible en este navegador.");
  }

  return navigator.serviceWorker.register("/sw.js");
}

export function serializePushSubscription(
  subscription: PushSubscription,
  userAgent?: string | null
): SerializablePushSubscription | null {
  const jsonValue = subscription.toJSON();
  const endpoint = typeof jsonValue.endpoint === "string" ? jsonValue.endpoint.trim() : "";
  const p256dh =
    typeof jsonValue.keys?.p256dh === "string" ? jsonValue.keys.p256dh.trim() : "";
  const auth = typeof jsonValue.keys?.auth === "string" ? jsonValue.keys.auth.trim() : "";

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    keys: {
      auth,
      p256dh
    },
    userAgent: typeof userAgent === "string" && userAgent.trim().length > 0 ? userAgent : null
  };
}

export function readSerializablePushSubscription(
  input: unknown
): SerializablePushSubscription | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const inputRecord = input as Record<string, unknown>;
  const endpoint =
    typeof inputRecord.endpoint === "string" ? inputRecord.endpoint.trim() : "";
  const keysValue =
    inputRecord.keys && typeof inputRecord.keys === "object"
      ? (inputRecord.keys as Record<string, unknown>)
      : null;
  const p256dh =
    keysValue && typeof keysValue.p256dh === "string"
      ? keysValue.p256dh.trim()
      : "";
  const auth =
    keysValue && typeof keysValue.auth === "string"
      ? keysValue.auth.trim()
      : "";
  const userAgent =
    typeof inputRecord.userAgent === "string" && inputRecord.userAgent.trim().length > 0
      ? inputRecord.userAgent.trim()
      : null;

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    keys: {
      auth,
      p256dh
    },
    userAgent
  };
}
