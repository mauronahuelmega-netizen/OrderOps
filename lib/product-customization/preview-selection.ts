/** Pure selection toggles for Product Customization UI (public modal + admin sandbox). */

import type {
  PublicCustomizationGroup,
  PublicUpsellGroupView
} from "@/lib/product-customization/public-shared";

export function selectSingleOption(
  current: Record<string, string[]>,
  groupId: string,
  optionId: string
): Record<string, string[]> {
  return {
    ...current,
    [groupId]: [optionId]
  };
}

export function toggleMultipleOption(
  current: Record<string, string[]>,
  groupId: string,
  optionId: string,
  maxSelections: number | null
): Record<string, string[]> {
  const existing = current[groupId] ?? [];
  const isSelected = existing.includes(optionId);

  if (isSelected) {
    return {
      ...current,
      [groupId]: existing.filter((id) => id !== optionId)
    };
  }

  if (maxSelections !== null && existing.length >= maxSelections) {
    return current;
  }

  return {
    ...current,
    [groupId]: [...existing, optionId]
  };
}

export function toggleUpsellProduct(
  current: string[],
  productId: string
): string[] {
  return current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
}

/** Drop selected group/option ids that are no longer in the effective config. */
export function pruneSelectedOptionsByGroupId(
  current: Record<string, string[]>,
  groups: PublicCustomizationGroup[]
): Record<string, string[]> {
  const optionIdsByGroup = new Map(
    groups.map((group) => [group.id, new Set(group.options.map((option) => option.id))])
  );
  const next: Record<string, string[]> = {};

  for (const [groupId, optionIds] of Object.entries(current)) {
    const allowed = optionIdsByGroup.get(groupId);
    if (!allowed) {
      continue;
    }
    const kept = optionIds.filter((optionId) => allowed.has(optionId));
    if (kept.length > 0) {
      next[groupId] = kept;
    }
  }

  return next;
}

/** Drop selected upsell product ids that are no longer offered. */
export function pruneSelectedUpsellProductIds(
  current: string[],
  upsellGroup: PublicUpsellGroupView | null | undefined
): string[] {
  if (!upsellGroup || current.length === 0) {
    return [];
  }
  const allowed = new Set(upsellGroup.products.map((product) => product.id));
  return current.filter((productId) => allowed.has(productId));
}
