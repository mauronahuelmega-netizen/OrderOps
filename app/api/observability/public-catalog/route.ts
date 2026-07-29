import {
  PUBLIC_CATALOG_METRICS_MAX_BYTES,
  sanitizePublicCatalogMetricPayload,
  summarizePublicCatalogMetricForLog
} from "@/lib/observability/public-catalog-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shouldLogMetrics(): boolean {
  if (process.env.ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS === "1") {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

function emptyOk(): Response {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (
        Number.isFinite(contentLength) &&
        contentLength > PUBLIC_CATALOG_METRICS_MAX_BYTES
      ) {
        return new Response(null, { status: 413 });
      }
    }

    const rawText = await request.text();
    if (rawText.length > PUBLIC_CATALOG_METRICS_MAX_BYTES) {
      return new Response(null, { status: 413 });
    }

    if (!rawText.trim()) {
      return emptyOk();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      return emptyOk();
    }

    const payload = sanitizePublicCatalogMetricPayload(parsed);
    if (!payload) {
      return emptyOk();
    }

    if (shouldLogMetrics()) {
      console.info(
        "[public-catalog-metric]",
        summarizePublicCatalogMetricForLog(payload)
      );
    }

    return emptyOk();
  } catch {
    // Never fail the catalog UX because of metrics.
    return emptyOk();
  }
}

export async function GET(): Promise<Response> {
  return new Response(null, { status: 405 });
}
