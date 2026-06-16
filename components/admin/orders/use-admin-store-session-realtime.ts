"use client";

import { useEffect, useMemo, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StoreSession } from "@/lib/orders/analytics";

export type StoreSessionHydrationReason =
  | "realtime"
  | "focus"
  | "visibility"
  | "interval"
  | "manual-action"
  | "manual-resync"
  | "pageshow"
  | "resume"
  | "online";

type UseAdminStoreSessionRealtimeProps = {
  businessId: string;
  hydrationIntervalMs?: number;
  onHydrateRequest: (reason: StoreSessionHydrationReason) => boolean | Promise<boolean>;
  onPayloadFallback?: (session: StoreSession | null, reason: "insert" | "update") => void;
};

const DEBUG_REALTIME = process.env.NODE_ENV === "development";

type StoreSessionRowPayload = {
  id?: string;
  business_id?: string;
  opened_at?: string;
  closed_at?: string | null;
  status?: "open" | "closed" | string;
};

function readStoreSessionRow(
  row: StoreSessionRowPayload | undefined,
  fallbackBusinessId: string
): StoreSession | null {
  if (!row?.id || !row.opened_at) {
    return null;
  }

  const status = row.status === "closed" ? "closed" : "open";

  return {
    id: row.id,
    storeId: row.business_id ?? fallbackBusinessId,
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? null,
    status
  };
}

function resolveStoreSessionFromChangePayload(
  payload: { new?: StoreSessionRowPayload; old?: StoreSessionRowPayload },
  businessId: string
) {
  const nextRow = payload.new ?? payload.old;
  const session = readStoreSessionRow(nextRow, businessId);

  if (!session) {
    return null;
  }

  if (session.status === "open" && session.closedAt == null) {
    return session;
  }

  if (session.status === "closed" && session.closedAt != null) {
    return session;
  }

  return null;
}

function debugStoreSessionRealtime(...args: unknown[]) {
  if (DEBUG_REALTIME) {
    console.info(...args);
  }
}

export function useAdminStoreSessionRealtime({
  businessId,
  hydrationIntervalMs = 60_000,
  onHydrateRequest,
  onPayloadFallback
}: UseAdminStoreSessionRealtimeProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const onHydrateRequestRef = useRef(onHydrateRequest);
  const onPayloadFallbackRef = useRef(onPayloadFallback);

  useEffect(() => {
    onHydrateRequestRef.current = onHydrateRequest;
  }, [onHydrateRequest]);

  useEffect(() => {
    onPayloadFallbackRef.current = onPayloadFallback;
  }, [onPayloadFallback]);

  useEffect(() => {
    if (!businessId) {
      if (DEBUG_REALTIME) {
        console.warn("[store-sessions-realtime] missing businessId, hook skipped");
      }
      return undefined;
    }

    const channelName = `store-session-${businessId}`;
    debugStoreSessionRealtime("[store-sessions-realtime] hook mounted", {
      businessId,
      channelName,
      filter: `business_id=eq.${businessId}`
    });

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "store_sessions",
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          debugStoreSessionRealtime("[store-sessions-realtime] payload received", {
            businessId,
            eventType: payload.eventType,
            reason: "realtime",
            sessionId: payload.new?.id ?? null,
            status: payload.new?.status ?? null
          });
          const hydrated = await onHydrateRequestRef.current("realtime");

          if (!hydrated) {
            if (DEBUG_REALTIME) {
              console.warn("[store-sessions-realtime] applying payload fallback after failed hydration", {
                businessId,
                reason: "insert",
                sessionId: payload.new?.id ?? null
              });
            }

            const fallbackSession = resolveStoreSessionFromChangePayload(payload, businessId);
            onPayloadFallbackRef.current?.(fallbackSession, "insert");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "store_sessions",
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          debugStoreSessionRealtime("[store-sessions-realtime] payload received", {
            businessId,
            eventType: payload.eventType,
            reason: "realtime",
            sessionId: payload.new?.id ?? payload.old?.id ?? null,
            newStatus: payload.new?.status ?? null,
            oldStatus: payload.old?.status ?? null
          });
          const hydrated = await onHydrateRequestRef.current("realtime");

          if (!hydrated) {
            if (DEBUG_REALTIME) {
              console.warn("[store-sessions-realtime] applying payload fallback after failed hydration", {
                businessId,
                reason: "update",
                sessionId: payload.new?.id ?? payload.old?.id ?? null,
                newStatus: payload.new?.status ?? null
              });
            }

            const fallbackSession = resolveStoreSessionFromChangePayload(payload, businessId);
            onPayloadFallbackRef.current?.(fallbackSession, "update");
          }
        }
      )
      .subscribe((status) => {
        debugStoreSessionRealtime("[store-sessions-realtime] subscribed", {
          businessId,
          channelName,
          status
        });

        if (status === "CHANNEL_ERROR") {
          console.warn("[store-sessions-realtime] channel error", {
            businessId,
            channelName
          });
        }
      });

    return () => {
      debugStoreSessionRealtime("[store-sessions-realtime] cleanup channel", {
        businessId,
        channelName
      });
      void supabase.removeChannel(channel);
    };
  }, [businessId, supabase]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined" || !businessId) {
      return undefined;
    }

    const requestHydration = (reason: StoreSessionHydrationReason) => {
      debugStoreSessionRealtime("[store-sessions-realtime] hydration requested", {
        businessId,
        reason
      });
      void onHydrateRequestRef.current(reason);
    };

    const handleFocus = () => requestHydration("focus");
    const handlePageShow = () => requestHydration("pageshow");
    const handleOnline = () => requestHydration("online");
    const handleResume = () => requestHydration("resume");
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestHydration("visibility");
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      debugStoreSessionRealtime("[store-sessions-realtime] hydration interval tick", {
        businessId
      });
      void onHydrateRequestRef.current("interval");
    }, hydrationIntervalMs);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("resume", handleResume as EventListener);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("resume", handleResume as EventListener);
      window.clearInterval(intervalId);
    };
  }, [businessId, hydrationIntervalMs]);
}
