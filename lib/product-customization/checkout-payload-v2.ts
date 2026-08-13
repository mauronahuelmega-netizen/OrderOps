/** Checkout payload V2 helpers: normalize selected options with quantity. */

export type SelectedCustomizationOptionInputV2 = {
  optionId: string;
  quantity: number;
};

export type SelectedCustomizationGroupInputV2 = {
  groupId: string;
  selectedOptions?: SelectedCustomizationOptionInputV2[];
  /** Legacy bridge — unique option IDs with implied quantity 1. */
  selectedOptionIds?: string[];
};

export type NormalizedGroupSelection = {
  groupId: string;
  /** optionId → quantity (>= 1) */
  quantities: Record<string, number>;
  /** Unique option IDs for legacy bridges. */
  optionIds: string[];
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

/**
 * Prefer selectedOptions with quantity; fall back to selectedOptionIds @ qty 1.
 * Duplicate optionIds in selectedOptions are summed then validated later.
 */
export function normalizeCheckoutGroupSelection(
  group: SelectedCustomizationGroupInputV2
):
  | { ok: true; value: NormalizedGroupSelection }
  | { ok: false; error: string } {
  const groupId = typeof group.groupId === "string" ? group.groupId.trim() : "";
  if (!groupId) {
    return { ok: false, error: "La configuración del producto cambió. Revisá el carrito." };
  }

  const quantities: Record<string, number> = {};

  if (Array.isArray(group.selectedOptions) && group.selectedOptions.length > 0) {
    for (const raw of group.selectedOptions) {
      if (!raw || typeof raw !== "object") {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }

      const optionId =
        typeof raw.optionId === "string" ? raw.optionId.trim() : "";
      if (!optionId) {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }

      if (!isPositiveInt(raw.quantity)) {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }

      quantities[optionId] = (quantities[optionId] ?? 0) + raw.quantity;
    }
  } else if (Array.isArray(group.selectedOptionIds)) {
    for (const rawId of group.selectedOptionIds) {
      if (typeof rawId !== "string" || !rawId.trim()) {
        continue;
      }
      const optionId = rawId.trim();
      quantities[optionId] = (quantities[optionId] ?? 0) + 1;
    }
  }

  // Drop zeros (should not happen after positive-int checks).
  for (const [optionId, qty] of Object.entries(quantities)) {
    if (!isPositiveInt(qty)) {
      delete quantities[optionId];
    }
  }

  const optionIds = Object.keys(quantities);
  return {
    ok: true,
    value: {
      groupId,
      quantities,
      optionIds
    }
  };
}

export function normalizeCheckoutGroups(
  groups: SelectedCustomizationGroupInputV2[] | undefined
):
  | { ok: true; byGroupId: Record<string, NormalizedGroupSelection> }
  | { ok: false; error: string } {
  const byGroupId: Record<string, NormalizedGroupSelection> = {};

  for (const group of groups ?? []) {
    const normalized = normalizeCheckoutGroupSelection(group);
    if (!normalized.ok) {
      return normalized;
    }

    if (normalized.value.optionIds.length === 0) {
      continue;
    }

    byGroupId[normalized.value.groupId] = normalized.value;
  }

  return { ok: true, byGroupId };
}

export function selectionMapsFromNormalizedGroups(
  byGroupId: Record<string, NormalizedGroupSelection>
): {
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedQuantitiesByGroupId: Record<string, Record<string, number>>;
} {
  const selectedOptionsByGroupId: Record<string, string[]> = {};
  const selectedQuantitiesByGroupId: Record<string, Record<string, number>> = {};

  for (const [groupId, selection] of Object.entries(byGroupId)) {
    selectedOptionsByGroupId[groupId] = [...selection.optionIds];
    selectedQuantitiesByGroupId[groupId] = { ...selection.quantities };
  }

  return { selectedOptionsByGroupId, selectedQuantitiesByGroupId };
}
