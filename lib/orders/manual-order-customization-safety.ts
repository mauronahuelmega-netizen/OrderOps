import "server-only";

import {
  resolveManualOrderEligibilityFromSummary,
  type ManualOrderProductEligibility
} from "@/lib/orders/manual-order-customization-eligibility";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";
import { loadPublicCustomizationSummariesForProducts } from "@/lib/product-customization/public";

export {
  MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON,
  resolveManualOrderEligibilityFromSummary,
  type ManualOrderProductEligibility
} from "@/lib/orders/manual-order-customization-eligibility";

/**
 * Server-side eligibility map for manual order product IDs (tenant-scoped).
 * Recalculate here — never trust client-supplied availability flags.
 */
export async function resolveManualOrderProductEligibilityMap(
  businessId: string,
  productIds: string[]
): Promise<Map<string, ManualOrderProductEligibility>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  const result = new Map<string, ManualOrderProductEligibility>();

  for (const productId of uniqueIds) {
    result.set(productId, {
      isManualOrderAvailable: true,
      manualOrderUnavailableReason: null
    });
  }

  if (uniqueIds.length === 0) {
    return result;
  }

  const customizationEnabled = await isProductCustomizationEnabled(businessId);

  if (!customizationEnabled) {
    return result;
  }

  const summaries = await loadPublicCustomizationSummariesForProducts({
    businessId,
    productIds: uniqueIds,
    productCustomizationEnabled: true
  });

  for (const productId of uniqueIds) {
    result.set(
      productId,
      resolveManualOrderEligibilityFromSummary(
        true,
        summaries.get(productId) ?? null
      )
    );
  }

  return result;
}
