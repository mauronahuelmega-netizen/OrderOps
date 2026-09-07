import {
  productNeedsCustomizationModal,
  type PublicProductCustomizationSummary
} from "@/lib/product-customization/public-shared";

/** Short UI badge for blocked manual-order products. */
export const MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON =
  "Requiere personalización";

export type ManualOrderProductEligibility = {
  isManualOrderAvailable: boolean;
  manualOrderUnavailableReason: string | null;
};

/**
 * Pure eligibility from the same criterion public catalog uses to open the
 * customization modal (`productNeedsCustomizationModal`), gated by the tenant flag.
 *
 * - Flag OFF → all products eligible (catalog treats them as simple).
 * - Flag ON → blocked when `hasCustomizations` would open the public modal.
 * - Upsell-only products stay eligible (public uses quick-add, not the modal).
 */
export function resolveManualOrderEligibilityFromSummary(
  customizationEnabled: boolean,
  summary: PublicProductCustomizationSummary | null | undefined
): ManualOrderProductEligibility {
  if (!customizationEnabled) {
    return {
      isManualOrderAvailable: true,
      manualOrderUnavailableReason: null
    };
  }

  if (productNeedsCustomizationModal(summary)) {
    return {
      isManualOrderAvailable: false,
      manualOrderUnavailableReason: MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON
    };
  }

  return {
    isManualOrderAvailable: true,
    manualOrderUnavailableReason: null
  };
}
