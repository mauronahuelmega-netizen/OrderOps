import type { LocalCartItemV2, LocalCartSelectedGroup } from "@/lib/cart/types";

/**
 * Stable configuration signature for cart dedup.
 * Does not include names, prices, or quantity.
 */
export function buildCartConfigurationSignature(input: {
  productId: string;
  selectedGroups: Array<{
    groupId: string;
    selectedOptionIds: string[];
  }>;
  upsellProductIds: string[];
}): string {
  const groupsPart = [...input.selectedGroups]
    .map((group) => ({
      groupId: group.groupId,
      optionIds: [...group.selectedOptionIds].sort()
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
    .map((group) => `${group.groupId}:${group.optionIds.join(",")}`)
    .join(";");

  const upsellsPart = [...new Set(input.upsellProductIds)].sort().join(",");

  return `product:${input.productId}|groups:${groupsPart}|upsells:${upsellsPart}`;
}

export function selectedGroupsToSignatureInput(groups: LocalCartSelectedGroup[]) {
  return groups.map((group) => ({
    groupId: group.groupId,
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
