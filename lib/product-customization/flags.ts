import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Tenant rollout guard for Product Customization V1 (D8).
 *
 * Fail-closed: returns true only when business_settings.product_customization_enabled
 * is explicitly true. Missing row, invalid input, or DB errors → false.
 *
 * Server-only. Does not depend on user session or roles.
 * Does not activate the flag — read-only.
 */
export async function isProductCustomizationEnabled(
  businessId: string
): Promise<boolean> {
  const normalizedBusinessId = businessId.trim();

  if (!normalizedBusinessId) {
    return false;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("business_settings")
      .select("product_customization_enabled")
      .eq("business_id", normalizedBusinessId)
      .maybeSingle();

    if (error) {
      console.error("[product-customization] Failed to read feature flag", {
        businessId: normalizedBusinessId,
        code: error.code,
        message: error.message
      });
      return false;
    }

    return data?.product_customization_enabled === true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown feature flag lookup error";

    console.error("[product-customization] Failed to read feature flag", {
      businessId: normalizedBusinessId,
      message
    });

    return false;
  }
}
