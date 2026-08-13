import type { LocalCartItemV2, LocalCartSelectedGroup } from "@/lib/cart/types";

function normalizeOptionQuantity(quantity: number | undefined): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }
  return Math.floor(quantity);
}

type SignatureSelectedOption = {
  optionId: string;
  quantity?: number;
};

type SignatureGroupInput = {
  groupId: string;
  selectedOptions?: SignatureSelectedOption[];
  /** Legacy ID-only input; treated as quantity 1 each. */
  selectedOptionIds?: string[];
};

function resolveGroupOptions(group: SignatureGroupInput): SignatureSelectedOption[] {
  if (group.selectedOptions && group.selectedOptions.length > 0) {
    return group.selectedOptions;
  }

  return (group.selectedOptionIds ?? []).map((optionId) => ({
    optionId,
    quantity: 1
  }));
}

/**
 * Stable configuration signature for cart dedup.
 * Includes option quantity so Bacon×1 ≠ Bacon×2.
 * Does not include names, prices, or product line quantity.
 *
 * Format: product:{id}|groups:{groupId}:{optionId}x{qty},...;...|upsells:{ids}
 */
export function buildCartConfigurationSignature(input: {
  productId: string;
  selectedGroups: SignatureGroupInput[];
  upsellProductIds: string[];
}): string {
  const groupsPart = [...input.selectedGroups]
    .map((group) => ({
      groupId: group.groupId,
      options: [...resolveGroupOptions(group)]
        .map((option) => ({
          optionId: option.optionId,
          quantity: normalizeOptionQuantity(option.quantity)
        }))
        .sort((a, b) => a.optionId.localeCompare(b.optionId))
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
    .map((group) => {
      const optionsPart = group.options
        .map((option) => `${option.optionId}x${option.quantity}`)
        .join(",");
      return `${group.groupId}:${optionsPart}`;
    })
    .join(";");

  const upsellsPart = [...new Set(input.upsellProductIds)].sort().join(",");

  return `product:${input.productId}|groups:${groupsPart}|upsells:${upsellsPart}`;
}

export function selectedGroupsToSignatureInput(groups: LocalCartSelectedGroup[]) {
  return groups.map((group) => ({
    groupId: group.groupId,
    selectedOptions: group.selectedOptions.map((option) => ({
      optionId: option.optionId,
      quantity: normalizeOptionQuantity(option.quantity)
    })),
    // Keep legacy field for any consumer still reading option IDs only.
    selectedOptionIds: group.selectedOptions.map((option) => option.optionId)
  }));
}

/**
 * Signature a parent would have after including the listed upsell product IDs
 * (deduped + stable order via buildCartConfigurationSignature).
 */
export function buildParentConfigurationSignature(params: {
  productId: string;
  selectedGroups: LocalCartSelectedGroup[];
  upsellProductIds: string[];
}): string {
  return buildCartConfigurationSignature({
    productId: params.productId,
    selectedGroups: selectedGroupsToSignatureInput(params.selectedGroups),
    upsellProductIds: params.upsellProductIds
  });
}

/**
 * Hypothetical parent signature after attaching one additional upsell product.
 */
export function buildCartConfigurationSignatureWithUpsell(params: {
  parent: Pick<LocalCartItemV2, "productId" | "selectedGroups">;
  existingUpsellProductIds: string[];
  additionalUpsellProductId: string;
}): string {
  return buildParentConfigurationSignature({
    productId: params.parent.productId,
    selectedGroups: params.parent.selectedGroups,
    upsellProductIds: [
      ...params.existingUpsellProductIds,
      params.additionalUpsellProductId
    ]
  });
}
