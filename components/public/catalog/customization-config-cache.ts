import type { PublicProductCustomizationConfig } from "@/lib/product-customization/public-shared";

export type CustomizationLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; config: PublicProductCustomizationConfig }
  | { status: "disabled" };

/** Cacheable session results only — never network/server errors. */
export type CustomizationConfigCacheEntry =
  | { status: "ready"; config: PublicProductCustomizationConfig }
  | { status: "disabled" };

export function customizationCacheKey(slug: string, productId: string): string {
  return `${slug}:${productId}`;
}

export function loadStateFromCacheEntry(
  entry: CustomizationConfigCacheEntry
): CustomizationLoadState {
  if (entry.status === "ready") {
    return { status: "ready", config: entry.config };
  }
  return { status: "disabled" };
}

export function loadStateFromActionResult(result: {
  ok: boolean;
  enabled?: boolean;
  config?: PublicProductCustomizationConfig | null;
  error?: string;
}): {
  loadState: CustomizationLoadState;
  cacheEntry: CustomizationConfigCacheEntry | null;
} {
  if (!result.ok) {
    return {
      loadState: {
        status: "error",
        message: result.error ?? "No pudimos cargar la personalización. Probá de nuevo."
      },
      cacheEntry: null
    };
  }

  if (!result.enabled || !result.config) {
    return {
      loadState: { status: "disabled" },
      cacheEntry: { status: "disabled" }
    };
  }

  return {
    loadState: { status: "ready", config: result.config },
    cacheEntry: { status: "ready", config: result.config }
  };
}
