"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel, RealtimeChannelSendResponse } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/database";

export type AdminPresenceSurface = "dashboard" | "order_modal" | "order_detail";

export type AdminPresencePayload = {
  userId: string;
  name: string;
  role: ProfileRole;
  businessId: string;
  currentSurface: AdminPresenceSurface;
  currentOrderId: string | null;
  lastActiveAt: string;
};

type AdminPresenceEntry = AdminPresencePayload & {
  presenceKey: string;
};

type UseAdminPresenceOptions = {
  businessId: string;
  userId: string;
  userEmail?: string;
  role: ProfileRole;
  currentSurface: AdminPresenceSurface;
  currentOrderId: string | null;
};

type PresenceStatus = "connecting" | "live" | "disconnected" | "error";

const DEBUG_PRESENCE = process.env.NODE_ENV === "development";
const PRESENCE_STALE_MS = 90_000;
const PRESENCE_HEARTBEAT_MS = 30_000;

function debugPresence(...args: unknown[]) {
  if (DEBUG_PRESENCE) {
    console.info(...args);
  }
}

function normalizePresenceName(email?: string) {
  if (!email) {
    return "Operador";
  }

  const localPart = email.split("@")[0]?.trim();

  if (!localPart) {
    return email.trim() || "Operador";
  }

  const cleanedName = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedName) {
    return email.trim();
  }

  return cleanedName
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function buildAdminPresenceInitials(name: string) {
  const chunks = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (chunks.length === 0) {
    return "OP";
  }

  if (chunks.length === 1) {
    return chunks[0].slice(0, 2).toUpperCase();
  }

  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
}

function parsePresenceTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildPresencePayload({
  businessId,
  currentOrderId,
  currentSurface,
  role,
  userEmail,
  userId
}: UseAdminPresenceOptions): AdminPresencePayload {
  return {
    userId,
    name: normalizePresenceName(userEmail),
    role,
    businessId,
    currentSurface,
    currentOrderId,
    lastActiveAt: new Date().toISOString()
  };
}

export function useAdminPresence(options: UseAdminPresenceOptions) {
  const { businessId, userId } = options;
  const [presenceEntries, setPresenceEntries] = useState<AdminPresenceEntry[]>([]);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("connecting");
  const [channelVersion, setChannelVersion] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const syncPresenceSnapshot = useCallback(() => {
    const channel = channelRef.current;

    if (!channel) {
      return;
    }

    // Presence UI is derived from the current snapshot instead of treating join/leave
    // as durable human events. That keeps this layer ephemeral and low-noise.
    const snapshot = channel.presenceState<AdminPresencePayload>();
    const now = Date.now();
    const freshestByUser = new Map<string, AdminPresenceEntry>();

    for (const [presenceKey, presences] of Object.entries(snapshot)) {
      for (const presence of presences ?? []) {
        if (!presence?.userId || presence.businessId !== businessId) {
          continue;
        }

        const lastActiveAt = parsePresenceTimestamp(presence.lastActiveAt);

        if (lastActiveAt > 0 && now - lastActiveAt > PRESENCE_STALE_MS) {
          continue;
        }

        const currentEntry = freshestByUser.get(presence.userId);

        if (
          currentEntry &&
          parsePresenceTimestamp(currentEntry.lastActiveAt) >= lastActiveAt
        ) {
          continue;
        }

        freshestByUser.set(presence.userId, {
          ...presence,
          presenceKey
        });
      }
    }

    const nextEntries = Array.from(freshestByUser.values()).sort((left, right) => {
      const lastActiveDelta =
        parsePresenceTimestamp(right.lastActiveAt) - parsePresenceTimestamp(left.lastActiveAt);

      if (lastActiveDelta !== 0) {
        return lastActiveDelta;
      }

      return left.name.localeCompare(right.name);
    });

    setPresenceEntries(nextEntries);
  }, [businessId]);

  const trackPresence = useCallback(
    async (reason: string) => {
      const channel = channelRef.current;

      if (!channel || !isSubscribedRef.current) {
        return;
      }

      const payload = buildPresencePayload(optionsRef.current);
      const response = (await channel.track(payload)) as RealtimeChannelSendResponse;

      debugPresence("[admin-presence] track", {
        reason,
        businessId: payload.businessId,
        currentOrderId: payload.currentOrderId,
        currentSurface: payload.currentSurface,
        response
      });
    },
    []
  );

  const recoverPresence = useCallback(
    (reason: "visible" | "online" | "focus") => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setPresenceStatus("disconnected");
        return;
      }

      if (!isSubscribedRef.current || !channelRef.current) {
        debugPresence("[admin-presence] resubscribe requested", {
          businessId,
          reason
        });
        setPresenceEntries([]);
        setPresenceStatus("connecting");
        setChannelVersion((current) => current + 1);
        return;
      }

      void trackPresence(reason);
      syncPresenceSnapshot();
    },
    [businessId, syncPresenceSnapshot, trackPresence]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase.channel(`business-presence:${businessId}`, {
        config: {
          presence: {
            key: userId
          }
        }
      });
      channelRef.current = channel;
      setPresenceStatus(navigator.onLine ? "connecting" : "disconnected");

      channel.on("presence", { event: "sync" }, () => {
        debugPresence("[admin-presence] sync", {
          businessId
        });
        syncPresenceSnapshot();
      });

      channel.on("presence", { event: "join" }, () => {
        syncPresenceSnapshot();
      });

      channel.on("presence", { event: "leave" }, () => {
        syncPresenceSnapshot();
      });

      channel.subscribe((status) => {
        debugPresence("[admin-presence] subscribe status", {
          businessId,
          status
        });

        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          setPresenceStatus(navigator.onLine ? "live" : "disconnected");
          void trackPresence("subscribed");
          syncPresenceSnapshot();
          return;
        }

        if (status === "CHANNEL_ERROR") {
          isSubscribedRef.current = false;
          setPresenceStatus(navigator.onLine ? "error" : "disconnected");
          return;
        }

        if (status === "TIMED_OUT" || status === "CLOSED") {
          isSubscribedRef.current = false;
          setPresenceStatus("disconnected");
        }
      });

      return () => {
        isSubscribedRef.current = false;
        setPresenceEntries([]);
        void channel.untrack();
        void supabase.removeChannel(channel);
        channelRef.current = null;
      };
    } catch (error) {
      debugPresence("[admin-presence] failed to initialize", {
        businessId,
        error
      });
      setPresenceStatus("error");
      return undefined;
    }
  }, [businessId, channelVersion, syncPresenceSnapshot, trackPresence, userId]);

  useEffect(() => {
    if (presenceStatus !== "live") {
      return;
    }

    void trackPresence("surface-change");
  }, [
    options.currentOrderId,
    options.currentSurface,
    options.role,
    options.userEmail,
    presenceStatus,
    trackPresence
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOnline = () => {
      recoverPresence("online");
    };

    const handleOffline = () => {
      setPresenceStatus("disconnected");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        recoverPresence("visible");
      }
    };

    const handleFocus = () => {
      if (navigator.onLine) {
        recoverPresence("focus");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [recoverPresence]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible" || !navigator.onLine) {
        return;
      }

      void trackPresence("heartbeat");
    }, PRESENCE_HEARTBEAT_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [trackPresence]);

  const otherOperators = useMemo(
    () => presenceEntries.filter((entry) => entry.userId !== userId),
    [presenceEntries, userId]
  );

  const getOperatorsViewingOrder = useCallback(
    (orderId: string) =>
      otherOperators.filter(
        (entry) =>
          entry.currentOrderId === orderId &&
          (entry.currentSurface === "order_modal" || entry.currentSurface === "order_detail")
      ),
    [otherOperators]
  );

  return {
    onlineOperators: presenceEntries,
    otherOperators,
    onlineCount: presenceEntries.length,
    presenceStatus,
    isPresenceHealthy: presenceStatus === "live",
    getOperatorsViewingOrder
  };
}
