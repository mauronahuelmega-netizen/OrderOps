/**
 * Shared display helpers for customization snapshots (admin / kitchen summaries).
 * Prefer order-dashboard parse + getCustomizationSummaryLines for UI.
 */

import {
  getCustomizationSummaryLines,
  parseCustomizationSnapshot
} from "@/lib/product-customization/order-dashboard";

export function formatCustomizationOptionLabel(params: {
  optionName: string;
  quantity?: number;
}): string {
  const qty =
    typeof params.quantity === "number" &&
    Number.isFinite(params.quantity) &&
    params.quantity >= 1
      ? Math.floor(params.quantity)
      : 1;

  if (qty > 1) {
    return `${params.optionName} x${qty}`;
  }

  return params.optionName;
}

export function summarizeCustomizationSnapshot(value: unknown): string[] {
  return getCustomizationSummaryLines(parseCustomizationSnapshot(value));
}
