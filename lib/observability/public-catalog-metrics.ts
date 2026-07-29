/**
 * Privacy-safe public catalog metrics contract.
 * No cart, customer, product IDs/names, cookies, or auth data.
 */

export const PUBLIC_CATALOG_METRICS_SOURCE = "public_catalog" as const;
export const PUBLIC_CATALOG_METRICS_VERSION = 1 as const;
export const PUBLIC_CATALOG_METRICS_ENDPOINT =
  "/api/observability/public-catalog" as const;
export const PUBLIC_CATALOG_METRICS_MAX_BYTES = 10 * 1024;

export const PUBLIC_CATALOG_METRIC_ALLOWLIST = [
  "TTFB",
  "FCP",
  "LCP",
  "CLS",
  "INP",
  "FID",
  "Next.js-hydration",
  "Next.js-route-change-to-render",
  "Next.js-render",
  "public_catalog_hydrated_ms",
  "public_catalog_image_debug"
] as const;

export type PublicCatalogMetricName =
  (typeof PUBLIC_CATALOG_METRIC_ALLOWLIST)[number];

export type PublicCatalogViewportBucket = "xs" | "sm" | "md" | "lg" | "xl";

export type PublicCatalogConnectionType =
  | "slow-2g"
  | "2g"
  | "3g"
  | "4g"
  | "unknown";

export type PublicCatalogMetricRating =
  | "good"
  | "needs-improvement"
  | "poor";

export type PublicCatalogMetricPayload = {
  source: typeof PUBLIC_CATALOG_METRICS_SOURCE;
  version: typeof PUBLIC_CATALOG_METRICS_VERSION;
  businessSlug: string;
  isPreview: boolean;
  path: string;
  metric: {
    name: PublicCatalogMetricName;
    value: number;
    rating?: PublicCatalogMetricRating;
    delta?: number;
    id?: string;
    navigationType?: string;
  };
  context: {
    viewport: PublicCatalogViewportBucket;
    connection?: PublicCatalogConnectionType;
    deviceMemory?: number;
  };
  debug?: {
    imageResourceCount?: number;
    renderImageCount?: number;
    objectImageCount?: number;
    fallbackImageCount?: number;
    totalImageTransferKB?: number;
  };
};

const ALLOWLIST_SET = new Set<string>(PUBLIC_CATALOG_METRIC_ALLOWLIST);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const CATALOG_PATH_RE = /^\/b\/[a-z0-9]+(?:-[a-z0-9]+)*\/catalogo\/?$/i;

export function isPublicCatalogObservabilityEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY === "1"
  );
}

export function isPublicCatalogMetricName(
  name: string
): name is PublicCatalogMetricName {
  return ALLOWLIST_SET.has(name);
}

export function sanitizePublicCatalogBusinessSlug(
  raw: unknown
): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const slug = raw.trim().toLowerCase();
  if (!slug || slug.length > 64 || !SLUG_RE.test(slug)) {
    return null;
  }

  return slug;
}

export function sanitizePublicCatalogPath(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  // Pathname only — never query string.
  const path = raw.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!CATALOG_PATH_RE.test(path)) {
    return null;
  }

  // Normalize trailing slash away except root style.
  return path.replace(/\/$/, "") || path;
}

export function getPublicCatalogViewportBucket(
  width: number
): PublicCatalogViewportBucket {
  if (!Number.isFinite(width) || width <= 0) {
    return "md";
  }
  if (width < 390) return "xs";
  if (width < 640) return "sm";
  if (width < 768) return "md";
  if (width < 1024) return "lg";
  return "xl";
}

export function sanitizePublicCatalogConnection(
  raw: unknown
): PublicCatalogConnectionType {
  if (raw === "slow-2g" || raw === "2g" || raw === "3g" || raw === "4g") {
    return raw;
  }
  return "unknown";
}

export function sanitizePublicCatalogRating(
  raw: unknown
): PublicCatalogMetricRating | undefined {
  if (raw === "good" || raw === "needs-improvement" || raw === "poor") {
    return raw;
  }
  return undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeDebug(
  raw: unknown
): PublicCatalogMetricPayload["debug"] | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const input = raw as Record<string, unknown>;
  const debug: NonNullable<PublicCatalogMetricPayload["debug"]> = {};

  if (isFiniteNumber(input.imageResourceCount)) {
    debug.imageResourceCount = Math.max(0, Math.round(input.imageResourceCount));
  }
  if (isFiniteNumber(input.renderImageCount)) {
    debug.renderImageCount = Math.max(0, Math.round(input.renderImageCount));
  }
  if (isFiniteNumber(input.objectImageCount)) {
    debug.objectImageCount = Math.max(0, Math.round(input.objectImageCount));
  }
  if (isFiniteNumber(input.fallbackImageCount)) {
    debug.fallbackImageCount = Math.max(0, Math.round(input.fallbackImageCount));
  }
  if (isFiniteNumber(input.totalImageTransferKB)) {
    debug.totalImageTransferKB = Math.max(
      0,
      Math.round(input.totalImageTransferKB)
    );
  }

  return Object.keys(debug).length > 0 ? debug : undefined;
}

/**
 * Validate + sanitize inbound / outbound payload.
 * Returns null when the payload must be discarded.
 */
export function sanitizePublicCatalogMetricPayload(
  raw: unknown
): PublicCatalogMetricPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const input = raw as Record<string, unknown>;

  if (input.source !== PUBLIC_CATALOG_METRICS_SOURCE) {
    return null;
  }

  if (input.version !== PUBLIC_CATALOG_METRICS_VERSION) {
    return null;
  }

  const businessSlug = sanitizePublicCatalogBusinessSlug(input.businessSlug);
  const path = sanitizePublicCatalogPath(input.path);

  if (!businessSlug || !path) {
    return null;
  }

  const metricRaw =
    input.metric && typeof input.metric === "object"
      ? (input.metric as Record<string, unknown>)
      : null;

  if (!metricRaw || typeof metricRaw.name !== "string") {
    return null;
  }

  if (!isPublicCatalogMetricName(metricRaw.name)) {
    return null;
  }

  if (!isFiniteNumber(metricRaw.value)) {
    return null;
  }

  const contextRaw =
    input.context && typeof input.context === "object"
      ? (input.context as Record<string, unknown>)
      : {};

  const viewport =
    contextRaw.viewport === "xs" ||
    contextRaw.viewport === "sm" ||
    contextRaw.viewport === "md" ||
    contextRaw.viewport === "lg" ||
    contextRaw.viewport === "xl"
      ? contextRaw.viewport
      : "md";

  const payload: PublicCatalogMetricPayload = {
    source: PUBLIC_CATALOG_METRICS_SOURCE,
    version: PUBLIC_CATALOG_METRICS_VERSION,
    businessSlug,
    isPreview: input.isPreview === true,
    path,
    metric: {
      name: metricRaw.name,
      value: metricRaw.value,
      rating: sanitizePublicCatalogRating(metricRaw.rating),
      delta: isFiniteNumber(metricRaw.delta) ? metricRaw.delta : undefined,
      id:
        typeof metricRaw.id === "string" && metricRaw.id.length <= 64
          ? metricRaw.id
          : undefined,
      navigationType:
        typeof metricRaw.navigationType === "string" &&
        metricRaw.navigationType.length <= 32
          ? metricRaw.navigationType
          : undefined
    },
    context: {
      viewport,
      connection: sanitizePublicCatalogConnection(contextRaw.connection),
      deviceMemory: isFiniteNumber(contextRaw.deviceMemory)
        ? Math.min(64, Math.max(0, contextRaw.deviceMemory))
        : undefined
    }
  };

  const debug = sanitizeDebug(input.debug);
  if (debug) {
    payload.debug = debug;
  }

  return payload;
}

export function summarizePublicCatalogMetricForLog(
  payload: PublicCatalogMetricPayload
): Record<string, string | number | boolean | undefined> {
  return {
    name: payload.metric.name,
    value: Math.round(payload.metric.value * 1000) / 1000,
    rating: payload.metric.rating,
    businessSlug: payload.businessSlug,
    isPreview: payload.isPreview,
    viewport: payload.context.viewport,
    connection: payload.context.connection
  };
}
