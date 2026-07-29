import "server-only";

import { unstable_cache } from "next/cache";
import {
  DEFAULT_SCHEDULED_DELIVERY_RULES,
  normalizeScheduledDeliveryRules
} from "@/lib/business/scheduled-delivery-rules";
import type { PublicBusiness } from "@/lib/business/public";
import {
  publicBusinessTag,
  publicCatalogTag,
  publicCustomizationTag
} from "@/lib/catalog/public-cache-tags";
import {
  loadPublicCatalogByBusinessId,
  type PublicCategory,
  type PublicProduct
} from "@/lib/catalog/public";
import { loadPublicCustomizationSummariesForCatalogProducts } from "@/lib/product-customization/public";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Fallback TTL if a tag invalidation is missed (seconds). */
export const PUBLIC_CATALOG_CACHE_REVALIDATE_SECONDS = 60;

export type PublicCatalogStablePageData = {
  /** Stable public business; on_demand_mode_active is NOT live acceptance. */
  business: PublicBusiness;
  categories: PublicCategory[];
  products: PublicProduct[];
  productCustomizationEnabled: boolean;
};

async function loadPublicBusinessStableBySlug(
  slug: string
): Promise<PublicBusiness | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  // Service client: cookie-free so this can run inside unstable_cache.
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, whatsapp_number, logo_url, description, primary_color, cover_image_url, instagram_url, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy, is_active"
    )
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select(
      "scheduled_mode_active, scheduled_min_lead_time_hours, scheduled_max_days_in_advance, scheduled_cutoff_time, inactive_working_days, product_customization_enabled"
    )
    .eq("business_id", data.id)
    .maybeSingle();

  if (settingsError) {
    console.error("[public-business:cached] settings lookup failed", {
      businessId: data.id,
      code: settingsError.code,
      message: settingsError.message
    });
  }

  const normalizedRules = normalizeScheduledDeliveryRules(settings);

  return {
    ...data,
    // Placeholder — callers must overlay getFreshPublicOrderingStatus.
    on_demand_mode_active: false,
    product_customization_enabled: settings?.product_customization_enabled === true,
    scheduled_mode_active: settings?.scheduled_mode_active ?? false,
    scheduled_min_lead_time_hours:
      normalizedRules.scheduled_min_lead_time_hours ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_min_lead_time_hours,
    scheduled_max_days_in_advance:
      normalizedRules.scheduled_max_days_in_advance ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_max_days_in_advance,
    scheduled_cutoff_time:
      normalizedRules.scheduled_cutoff_time ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_cutoff_time,
    inactive_working_days:
      normalizedRules.inactive_working_days ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.inactive_working_days
  };
}

export function getCachedPublicBusinessStable(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  return unstable_cache(
    async () => loadPublicBusinessStableBySlug(normalizedSlug),
    ["public-business-stable", normalizedSlug],
    {
      revalidate: PUBLIC_CATALOG_CACHE_REVALIDATE_SECONDS,
      tags: [publicBusinessTag(normalizedSlug)]
    }
  )();
}

function getCachedPublicCatalogRows(businessId: string) {
  const normalizedBusinessId = businessId.trim();

  return unstable_cache(
    async () => loadPublicCatalogByBusinessId(normalizedBusinessId),
    ["public-catalog-rows", normalizedBusinessId],
    {
      revalidate: PUBLIC_CATALOG_CACHE_REVALIDATE_SECONDS,
      tags: [publicCatalogTag(normalizedBusinessId)]
    }
  )();
}

function getCachedEnrichedCatalogProducts(params: {
  businessId: string;
  products: PublicProduct[];
  productCustomizationEnabled: boolean;
}) {
  const normalizedBusinessId = params.businessId.trim();

  return unstable_cache(
    async () => {
      if (!params.productCustomizationEnabled || params.products.length === 0) {
        return params.products;
      }

      const summaries = await loadPublicCustomizationSummariesForCatalogProducts({
        businessId: normalizedBusinessId,
        products: params.products.map((product) => ({
          id: product.id,
          category_id: product.category_id,
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url
        })),
        productCustomizationEnabled: true
      });

      return params.products.map((product) => {
        const summary = summaries.get(product.id);
        if (!summary) {
          return product;
        }

        return {
          ...product,
          customizationSummary: {
            hasCustomizations: summary.hasCustomizations,
            hasPaidCustomizations: summary.hasPaidCustomizations,
            hasUpsell: summary.hasUpsell,
            priceFrom: summary.priceFrom
          }
        };
      });
    },
    [
      "public-catalog-enriched-products",
      normalizedBusinessId,
      params.productCustomizationEnabled ? "on" : "off",
      // Invalidate via tags; key includes product fingerprint for safety.
      params.products.map((product) => `${product.id}:${product.price}`).join(",")
    ],
    {
      revalidate: PUBLIC_CATALOG_CACHE_REVALIDATE_SECONDS,
      tags: [
        publicCatalogTag(normalizedBusinessId),
        publicCustomizationTag(normalizedBusinessId)
      ]
    }
  )();
}

/**
 * Cached stable catalog page payload (branding + categories + products + summaries).
 * Does NOT include live store-session / order-acceptance status.
 */
export async function getCachedPublicCatalogPageStableData(
  slug: string
): Promise<PublicCatalogStablePageData | null> {
  const business = await getCachedPublicBusinessStable(slug);
  if (!business) {
    return null;
  }

  const { categories, products } = await getCachedPublicCatalogRows(business.id);
  const productCustomizationEnabled = business.product_customization_enabled === true;
  const enrichedProducts = await getCachedEnrichedCatalogProducts({
    businessId: business.id,
    products,
    productCustomizationEnabled
  });

  return {
    business,
    categories,
    products: enrichedProducts,
    productCustomizationEnabled
  };
}
