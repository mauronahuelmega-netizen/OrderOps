import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type PublicCategory = {
  id: string;
  name: string;
  position: number | null;
};

export type PublicProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  /** Present only when product_customization_enabled is on for the business. */
  customizationSummary?: {
    hasCustomizations: boolean;
    hasPaidCustomizations: boolean;
    hasUpsell: boolean;
    priceFrom: number | null;
  } | null;
};

/**
 * Cookie-free catalog rows loader (service role + business_id filter).
 * Safe for unstable_cache. Prefer getPublicCatalogByBusinessId for dynamic callers.
 */
export async function loadPublicCatalogByBusinessId(businessId: string): Promise<{
  categories: PublicCategory[];
  products: PublicProduct[];
}> {
  const supabase = createSupabaseServiceClient();

  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, position")
        .eq("business_id", businessId)
        .order("position", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
      supabase
        .from("products")
        .select("id, category_id, name, description, price, image_url")
        .eq("business_id", businessId)
        .eq("is_available", true)
        .order("name", { ascending: true })
    ]);

  if (categoriesError) {
    throw new Error(`Failed to load categories: ${categoriesError.message}`);
  }

  if (productsError) {
    throw new Error(`Failed to load products: ${productsError.message}`);
  }

  return {
    categories: categories ?? [],
    products: products ?? []
  };
}

export async function getPublicCatalogByBusinessId(businessId: string): Promise<{
  categories: PublicCategory[];
  products: PublicProduct[];
}> {
  noStore();
  return loadPublicCatalogByBusinessId(businessId);
}
