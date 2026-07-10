"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  revokePushSubscriptionAction,
  savePushSubscriptionAction
} from "@/app/admin/(protected)/settings/notifications/actions";
import {
  canUsePushInBrowser,
  getWebPushPublicKey,
  registerPushServiceWorker,
  resolvePushCapabilityState,
  serializePushSubscription,
  urlBase64ToUint8Array,
  type PushCapabilityState
} from "@/lib/notifications/push";
import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";

type UsePushSubscriptionOptions = {
  permission: BrowserNotificationPermissionState;
  requestPermission: () => Promise<BrowserNotificationPermissionState>;
};

type UsePushSubscriptionResult = {
  error: string | null;
  isPending: boolean;
  prepareDevice: () => Promise<void>;
  state: PushCapabilityState;
  supported: boolean;
  unsubscribeDevice: () => Promise<void>;
  vapidConfigured: boolean;
};

export function usePushSubscription({
  permission,
  requestPermission
}: UsePushSubscriptionOptions): UsePushSubscriptionResult {
  const [state, setState] = useState<PushCapabilityState>("unknown");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const vapidPublicKey = useMemo(() => getWebPushPublicKey(), []);
  const supported = useMemo(() => canUsePushInBrowser(), []);

  const refreshState = useCallback(async () => {
    if (!supported) {
      setSubscription(null);
      setState("unsupported");
      return;
    }

    if (!vapidPublicKey) {
      setSubscription(null);
      setState("env_missing");
      return;
    }

    if (permission === "denied") {
      setSubscription(null);
      setState("blocked");
      return;
    }

    try {
      const registration = await registerPushServiceWorker();
      const currentSubscription = await registration.pushManager.getSubscription();

      setSubscription(currentSubscription);
      setState(
        resolvePushCapabilityState({
          hasSubscription: Boolean(currentSubscription),
          permission,
          supported,
          vapidPublicKey
        })
      );
    } catch {
      setSubscription(null);
      setState("unsupported");
    }
  }, [permission, supported, vapidPublicKey]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const prepareDevice = useCallback(async () => {
    setError(null);
    setIsPending(true);

    try {
      if (!supported) {
        setState("unsupported");
        return;
      }

      if (!vapidPublicKey) {
        setState("env_missing");
        return;
      }

      let nextPermission = permission;

      if (nextPermission !== "granted") {
        nextPermission = await requestPermission();
      }

      if (nextPermission !== "granted") {
        setState(nextPermission === "denied" ? "blocked" : "not_configured");
        return;
      }

      const registration = await registerPushServiceWorker();
      const existingSubscription = await registration.pushManager.getSubscription();
      const nextSubscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

      const payload = serializePushSubscription(
        nextSubscription,
        typeof navigator !== "undefined" ? navigator.userAgent : null
      );

      if (!payload) {
        throw new Error("No pudimos preparar la suscripcion de este dispositivo.");
      }

      const result = await savePushSubscriptionAction(payload);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSubscription(nextSubscription);
      setState("configured");
    } catch {
      setError("No pudimos preparar este dispositivo para push.");
    } finally {
      setIsPending(false);
    }
  }, [permission, requestPermission, supported, vapidPublicKey]);

  const unsubscribeDevice = useCallback(async () => {
    setError(null);
    setIsPending(true);

    try {
      const existingSubscription =
        subscription ?? (supported ? await (await registerPushServiceWorker()).pushManager.getSubscription() : null);

      const endpoint = existingSubscription?.endpoint ?? null;

      if (existingSubscription) {
        try {
          await existingSubscription.unsubscribe();
        } catch {
          // Keep revocation best-effort even if browser cleanup fails.
        }
      }

      if (endpoint) {
        const result = await revokePushSubscriptionAction(endpoint);

        if (result?.error) {
          setError(result.error);
          return;
        }
      }

      setSubscription(null);
      setState(
        resolvePushCapabilityState({
          hasSubscription: false,
          permission,
          supported,
          vapidPublicKey
        })
      );
    } catch {
      setError("No pudimos desactivar push en este dispositivo.");
    } finally {
      setIsPending(false);
    }
  }, [permission, subscription, supported, vapidPublicKey]);

  return {
    error,
    isPending,
    prepareDevice,
    state,
    supported,
    unsubscribeDevice,
    vapidConfigured: Boolean(vapidPublicKey)
  };
}
