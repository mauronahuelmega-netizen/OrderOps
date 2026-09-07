/**
 * Pure eligibility contracts for ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1.
 *
 * Run: npx tsx lib/orders/manual-order-customization-safety.verify.ts
 */
import assert from "node:assert/strict";
import {
  MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON,
  resolveManualOrderEligibilityFromSummary
} from "@/lib/orders/manual-order-customization-eligibility";
import type { PublicProductCustomizationSummary } from "@/lib/product-customization/public-shared";

const simpleSummary: PublicProductCustomizationSummary = {
  productId: "simple",
  hasCustomizations: false,
  hasPaidCustomizations: false,
  hasUpsell: false,
  priceFrom: null
};

const customizableSummary: PublicProductCustomizationSummary = {
  productId: "custom",
  hasCustomizations: true,
  hasPaidCustomizations: true,
  hasUpsell: false,
  priceFrom: 1200
};

const upsellOnlySummary: PublicProductCustomizationSummary = {
  productId: "upsell-only",
  hasCustomizations: false,
  hasPaidCustomizations: false,
  hasUpsell: true,
  priceFrom: 1000
};

const flagOffSimple = resolveManualOrderEligibilityFromSummary(false, customizableSummary);
assert.equal(flagOffSimple.isManualOrderAvailable, true);
assert.equal(flagOffSimple.manualOrderUnavailableReason, null);

const flagOnSimple = resolveManualOrderEligibilityFromSummary(true, simpleSummary);
assert.equal(flagOnSimple.isManualOrderAvailable, true);

const flagOnCustom = resolveManualOrderEligibilityFromSummary(true, customizableSummary);
assert.equal(flagOnCustom.isManualOrderAvailable, false);
assert.equal(
  flagOnCustom.manualOrderUnavailableReason,
  MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON
);

const flagOnUpsellOnly = resolveManualOrderEligibilityFromSummary(true, upsellOnlySummary);
assert.equal(
  flagOnUpsellOnly.isManualOrderAvailable,
  true,
  "Upsell-only matches public: no customization modal"
);

const missingSummary = resolveManualOrderEligibilityFromSummary(true, null);
assert.equal(missingSummary.isManualOrderAvailable, true);

console.log("PASS: manual-order-customization-safety.verify.ts");
