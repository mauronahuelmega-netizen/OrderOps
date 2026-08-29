import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

type IsOrderAssignmentEnabledOptions = {
  /** When provided, skips a second business_settings read (per-request dedupe). */
  orderAssignmentEnabled?: boolean;
};

/**
 * Tenant rollout guard for order responsibility / assignment.
 *
 * Fail-closed: returns true only when business_settings.order_assignment_enabled
 * is explicitly true. Missing row, invalid input, or DB errors → false.
 */
export async function isOrderAssignmentEnabled(
  businessId: string,
  options?: IsOrderAssignmentEnabledOptions
): Promise<boolean> {
  if (typeof options?.orderAssignmentEnabled === "boolean") {
    return options.orderAssignmentEnabled;
  }

  const normalizedBusinessId = businessId.trim();

  if (!normalizedBusinessId) {
    return false;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("business_settings")
      .select("order_assignment_enabled")
      .eq("business_id", normalizedBusinessId)
      .maybeSingle();

    if (error) {
      console.error("[order-assignment] Failed to read feature flag", {
        businessId: normalizedBusinessId,
        code: error.code,
        message: error.message
      });
      return false;
    }

    return data?.order_assignment_enabled === true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown feature flag lookup error";

    console.error("[order-assignment] Failed to read feature flag", {
      businessId: normalizedBusinessId,
      message
    });

    return false;
  }
}
