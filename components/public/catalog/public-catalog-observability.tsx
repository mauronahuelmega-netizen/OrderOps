"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import {
  PUBLIC_CATALOG_METRICS_ENDPOINT,
  getPublicCatalogViewportBucket,
  isPublicCatalogMetricName,
  isPublicCatalogObservabilityEnabled,
  sanitizePublicCatalogBusinessSlug,
  sanitizePublicCatalogConnection,
  sanitizePublicCatalogMetricPayload,
  sanitizePublicCatalogPath,
  sanitizePublicCatalogRating,
  type PublicCatalogMetricPayload
} from "@/lib/observability/public-catalog-metrics";

type PublicCatalogObservabilityProps = {
  businessSlug: string;
  isPreview?: boolean;
};

type NetworkInformationLike = {
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
};

function readDebugFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      new URLSearchParams(window.location.search).get("orderopsMetrics") === "1"
    );
  } catch {
    return false;
  }
}

function buildContext(): PublicCatalogMetricPayload["context"] {
  const nav = navigator as NavigatorWithConnection;
  return {
    viewport: getPublicCatalogViewportBucket(window.innerWidth || 0),
    connection: sanitizePublicCatalogConnection(nav.connection?.effectiveType),
    deviceMemory:
      typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined
  };
}

function collectImageDebug(): PublicCatalogMetricPayload["debug"] | undefined {
  if (typeof performance === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  try {
    const resources = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];

    let imageResourceCount = 0;
    let totalTransfer = 0;

    for (const entry of resources) {
      const name = entry.name || "";
      if (
        !name.includes("/storage/v1/object/") &&
        !name.includes("/storage/v1/render/image/") &&
        !/\.(avif|webp|jpe?g|png|gif)(\?|$)/i.test(name)
      ) {
        continue;
      }

      imageResourceCount += 1;
      const transfer =
        typeof entry.transferSize === "number" ? entry.transferSize : 0;
      totalTransfer += Math.max(0, transfer);
    }

    let renderImageCount = 0;
    let objectImageCount = 0;
    let fallbackImageCount = 0;

    for (const img of Array.from(document.images)) {
      const src = img.currentSrc || img.src || "";
      if (src.includes("/storage/v1/render/image/")) {
        renderImageCount += 1;
      } else if (src.includes("/storage/v1/object/")) {
        objectImageCount += 1;
        // Object after attempted transform is treated as aggregate fallback signal.
        fallbackImageCount += 1;
      }
    }

    return {
      imageResourceCount,
      renderImageCount,
      objectImageCount,
      fallbackImageCount,
      totalImageTransferKB: Math.round(totalTransfer / 1024)
    };
  } catch {
    return undefined;
  }
}

function sendMetric(payload: PublicCatalogMetricPayload, debug: boolean) {
  const safe = sanitizePublicCatalogMetricPayload(payload);
  if (!safe) {
    return;
  }

  if (debug) {
    try {
      console.table([
        {
          name: safe.metric.name,
          value: safe.metric.value,
          rating: safe.metric.rating ?? "",
          viewport: safe.context.viewport,
          connection: safe.context.connection ?? "",
          preview: safe.isPreview
        }
      ]);
    } catch {
      // ignore console failures
    }
  }

  const body = JSON.stringify(safe);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const queued = navigator.sendBeacon(PUBLIC_CATALOG_METRICS_ENDPOINT, blob);
      if (queued) {
        return;
      }
    }
  } catch {
    // fall through to fetch
  }

  try {
    void fetch(PUBLIC_CATALOG_METRICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      cache: "no-store"
    });
  } catch {
    // never throw into catalog render path
  }
}

export default function PublicCatalogObservability({
  businessSlug,
  isPreview = false
}: PublicCatalogObservabilityProps) {
  const mountMsRef = useRef<number>(
    typeof performance !== "undefined" ? performance.now() : 0
  );
  const hydratedSentRef = useRef(false);
  const imageDebugSentRef = useRef(false);

  const slug = sanitizePublicCatalogBusinessSlug(businessSlug);

  useReportWebVitals((metric) => {
    try {
      const debug = readDebugFlag();
      const enabled = isPublicCatalogObservabilityEnabled() || debug;

      if (!enabled || !slug) {
        return;
      }

      if (!isPublicCatalogMetricName(metric.name)) {
        return;
      }

      const path =
        sanitizePublicCatalogPath(window.location.pathname) ??
        `/b/${slug}/catalogo`;

      sendMetric(
        {
          source: "public_catalog",
          version: 1,
          businessSlug: slug,
          isPreview,
          path,
          metric: {
            name: metric.name,
            value: metric.value,
            rating: sanitizePublicCatalogRating(metric.rating),
            delta:
              typeof metric.delta === "number" ? metric.delta : undefined,
            id: typeof metric.id === "string" ? metric.id : undefined,
            navigationType:
              typeof metric.navigationType === "string"
                ? metric.navigationType
                : undefined
          },
          context: buildContext()
        },
        debug
      );
    } catch {
      // swallow
    }
  });

  useEffect(() => {
    const debug = readDebugFlag();
    const enabled = isPublicCatalogObservabilityEnabled() || debug;

    if (!enabled || !slug) {
      return;
    }

    const path =
      sanitizePublicCatalogPath(window.location.pathname) ??
      `/b/${slug}/catalogo`;

    if (!hydratedSentRef.current) {
      hydratedSentRef.current = true;
      const hydratedMs = Math.max(
        0,
        Math.round(performance.now() - mountMsRef.current)
      );

      sendMetric(
        {
          source: "public_catalog",
          version: 1,
          businessSlug: slug,
          isPreview,
          path,
          metric: {
            name: "public_catalog_hydrated_ms",
            value: hydratedMs
          },
          context: buildContext()
        },
        debug
      );
    }

    if (debug && !imageDebugSentRef.current) {
      imageDebugSentRef.current = true;
      // Defer slightly so image resources have a chance to register.
      const timer = window.setTimeout(() => {
        const debugSummary = collectImageDebug();
        sendMetric(
          {
            source: "public_catalog",
            version: 1,
            businessSlug: slug,
            isPreview,
            path,
            metric: {
              name: "public_catalog_image_debug",
              value: debugSummary?.totalImageTransferKB ?? 0
            },
            context: buildContext(),
            debug: debugSummary
          },
          true
        );
      }, 1500);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [slug, isPreview]);

  return null;
}
