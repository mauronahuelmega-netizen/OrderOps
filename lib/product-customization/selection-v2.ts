/** Quantity-aware customization selection (public cart V2). Pure helpers only. */

import type {
  PublicCustomizationGroup,
  PublicCustomizationOption
} from "@/lib/product-customization/public-shared";

/** groupId → optionId → quantity (>= 1 when selected). */
export type CustomizationSelectionStateV2 = Record<string, Record<string, number>>;

export function getEffectiveAllowsOptionQuantity(
  group: Pick<PublicCustomizationGroup, "selectionType" | "allowsOptionQuantity">
): boolean {
  return group.selectionType === "multiple" && Boolean(group.allowsOptionQuantity);
}

/**
 * @deprecated Total-units group cap removed (LIMITS-GRID-POLISH-1).
 * Kept for API stability — always returns null. Limits are option.maxQuantity
 * and maxSelections (distinct options) only. Column may still exist in DB.
 */
export function getEffectiveMaxTotalQuantity(
  _group: Pick<
    PublicCustomizationGroup,
    "allowsOptionQuantity" | "selectionType" | "maxTotalQuantity" | "maxSelections"
  >
): number | null {
  void _group;
  return null;
}

export function getEffectiveOptionMaxQuantity(
  group: Pick<PublicCustomizationGroup, "selectionType" | "allowsOptionQuantity">,
  option: Pick<PublicCustomizationOption, "maxQuantity">
): number {
  if (!getEffectiveAllowsOptionQuantity(group)) {
    return 1;
  }

  const raw = option.maxQuantity;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 1) {
    return 1;
  }

  return Math.floor(raw);
}

export function getSelectedOptionQuantity(
  selection: CustomizationSelectionStateV2,
  groupId: string,
  optionId: string
): number {
  const qty = selection[groupId]?.[optionId];
  if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 1) {
    return 0;
  }
  return Math.floor(qty);
}

export function getSelectedDistinctCount(
  selection: CustomizationSelectionStateV2,
  groupId: string
): number {
  const groupSelection = selection[groupId];
  if (!groupSelection) {
    return 0;
  }

  let count = 0;
  for (const qty of Object.values(groupSelection)) {
    if (typeof qty === "number" && Number.isFinite(qty) && qty >= 1) {
      count += 1;
    }
  }
  return count;
}

export function getSelectedTotalUnits(
  selection: CustomizationSelectionStateV2,
  groupId: string
): number {
  const groupSelection = selection[groupId];
  if (!groupSelection) {
    return 0;
  }

  let total = 0;
  for (const qty of Object.values(groupSelection)) {
    if (typeof qty === "number" && Number.isFinite(qty) && qty >= 1) {
      total += Math.floor(qty);
    }
  }
  return total;
}

export function normalizeSelectionToV2(
  selection: CustomizationSelectionStateV2,
  groups: PublicCustomizationGroup[]
): CustomizationSelectionStateV2 {
  const next: CustomizationSelectionStateV2 = {};

  for (const group of groups) {
    const raw = selection[group.id] ?? {};
    const allowed = new Map(group.options.map((option) => [option.id, option]));
    const cleaned: Record<string, number> = {};

    if (group.selectionType === "single") {
      const entries = Object.entries(raw).filter(
        ([optionId, qty]) =>
          allowed.has(optionId) &&
          typeof qty === "number" &&
          Number.isFinite(qty) &&
          qty >= 1
      );
      if (entries.length > 0) {
        const [optionId] = entries[0]!;
        cleaned[optionId] = 1;
      }
    } else if (getEffectiveAllowsOptionQuantity(group)) {
      let distinctUsed = 0;
      const maxDistinct = group.maxSelections;

      for (const [optionId, rawQty] of Object.entries(raw)) {
        const option = allowed.get(optionId);
        if (!option) {
          continue;
        }
        if (typeof rawQty !== "number" || !Number.isFinite(rawQty) || rawQty < 1) {
          continue;
        }

        if (maxDistinct !== null && distinctUsed >= maxDistinct) {
          continue;
        }

        const optionMax = getEffectiveOptionMaxQuantity(group, option);
        const qty = Math.min(Math.floor(rawQty), optionMax);

        if (qty < 1) {
          continue;
        }

        cleaned[optionId] = qty;
        distinctUsed += 1;
      }
    } else {
      for (const [optionId, rawQty] of Object.entries(raw)) {
        if (!allowed.has(optionId)) {
          continue;
        }
        if (typeof rawQty !== "number" || !Number.isFinite(rawQty) || rawQty < 1) {
          continue;
        }
        cleaned[optionId] = 1;
      }

      const maxDistinct = group.maxSelections;
      if (maxDistinct !== null) {
        const ids = Object.keys(cleaned);
        if (ids.length > maxDistinct) {
          for (const id of ids.slice(maxDistinct)) {
            delete cleaned[id];
          }
        }
      }
    }

    if (Object.keys(cleaned).length > 0) {
      next[group.id] = cleaned;
    }
  }

  return next;
}

export function normalizeLegacySelectionToV2(
  selectedOptionsByGroupId: Record<string, string[]>,
  groups?: PublicCustomizationGroup[]
): CustomizationSelectionStateV2 {
  const next: CustomizationSelectionStateV2 = {};

  for (const [groupId, optionIds] of Object.entries(selectedOptionsByGroupId)) {
    const unique = [...new Set(optionIds.filter((id) => typeof id === "string" && id.length > 0))];
    if (unique.length === 0) {
      continue;
    }
    const groupMap: Record<string, number> = {};
    for (const optionId of unique) {
      groupMap[optionId] = 1;
    }
    next[groupId] = groupMap;
  }

  if (groups) {
    return normalizeSelectionToV2(next, groups);
  }

  return next;
}

/** Single-select patch — preserves all other group maps (including qty > 1). */
export function selectSingleOptionInV2(params: {
  selection: CustomizationSelectionStateV2;
  groups: PublicCustomizationGroup[];
  group: PublicCustomizationGroup;
  optionId: string;
}): CustomizationSelectionStateV2 {
  const { selection, groups, group, optionId } = params;
  const allowed = group.options.some((option) => option.id === optionId);
  if (!allowed || group.selectionType !== "single") {
    return selection;
  }

  const tentative: CustomizationSelectionStateV2 = {
    ...selection,
    [group.id]: { [optionId]: 1 }
  };
  return normalizeSelectionToV2(tentative, groups);
}

/** Multi-select toggle — preserves other groups and sibling option quantities. */
export function toggleMultipleOptionInV2(params: {
  selection: CustomizationSelectionStateV2;
  groups: PublicCustomizationGroup[];
  group: PublicCustomizationGroup;
  optionId: string;
}): CustomizationSelectionStateV2 {
  const { selection, groups, group, optionId } = params;
  const allowed = group.options.some((option) => option.id === optionId);
  if (!allowed || group.selectionType !== "multiple") {
    return selection;
  }

  const currentGroup = { ...(selection[group.id] ?? {}) };
  const isSelected = getSelectedOptionQuantity(selection, group.id, optionId) >= 1;

  if (isSelected) {
    delete currentGroup[optionId];
  } else {
    if (group.maxSelections !== null) {
      const distinct = getSelectedDistinctCount(selection, group.id);
      if (distinct >= group.maxSelections) {
        return selection;
      }
    }
    currentGroup[optionId] = 1;
  }

  const tentative: CustomizationSelectionStateV2 = { ...selection };
  if (Object.keys(currentGroup).length === 0) {
    delete tentative[group.id];
  } else {
    tentative[group.id] = currentGroup;
  }
  return normalizeSelectionToV2(tentative, groups);
}

export function selectionV2ToLegacyOptionIds(
  selection: CustomizationSelectionStateV2
): Record<string, string[]> {
  const next: Record<string, string[]> = {};

  for (const [groupId, options] of Object.entries(selection)) {
    const ids = Object.entries(options)
      .filter(([, qty]) => typeof qty === "number" && Number.isFinite(qty) && qty >= 1)
      .map(([optionId]) => optionId);
    if (ids.length > 0) {
      next[groupId] = ids;
    }
  }

  return next;
}

export function canIncrementOptionQuantity(params: {
  selection: CustomizationSelectionStateV2;
  group: PublicCustomizationGroup;
  optionId: string;
}): boolean {
  const { selection, group, optionId } = params;
  if (!getEffectiveAllowsOptionQuantity(group)) {
    return false;
  }

  const option = group.options.find((item) => item.id === optionId);
  if (!option) {
    return false;
  }

  const currentQty = getSelectedOptionQuantity(selection, group.id, optionId);
  const optionMax = getEffectiveOptionMaxQuantity(group, option);
  if (currentQty >= optionMax) {
    return false;
  }

  // Distinct max only blocks adding a *new* option — not incrementing existing qty.
  if (currentQty === 0 && group.maxSelections !== null) {
    const distinct = getSelectedDistinctCount(selection, group.id);
    if (distinct >= group.maxSelections) {
      return false;
    }
  }

  return true;
}

export function setOptionQuantityInSelection(params: {
  selection: CustomizationSelectionStateV2;
  group: PublicCustomizationGroup;
  optionId: string;
  quantity: number;
}): CustomizationSelectionStateV2 {
  const { selection, group, optionId } = params;
  const option = group.options.find((item) => item.id === optionId);
  if (!option) {
    return selection;
  }

  if (group.selectionType === "single") {
    if (params.quantity < 1) {
      const next = { ...selection };
      delete next[group.id];
      return next;
    }
    return {
      ...selection,
      [group.id]: { [optionId]: 1 }
    };
  }

  const nextGroup = { ...(selection[group.id] ?? {}) };
  const desired = Math.floor(params.quantity);

  if (desired < 1) {
    delete nextGroup[optionId];
  } else if (!getEffectiveAllowsOptionQuantity(group)) {
    nextGroup[optionId] = 1;
  } else {
    const optionMax = getEffectiveOptionMaxQuantity(group, option);
    const currentQty = getSelectedOptionQuantity(selection, group.id, optionId);
    const qty = Math.min(desired, optionMax);
    if (
      currentQty === 0 &&
      group.maxSelections !== null &&
      getSelectedDistinctCount(selection, group.id) >= group.maxSelections
    ) {
      return selection;
    }
    if (qty < 1) {
      delete nextGroup[optionId];
    } else {
      nextGroup[optionId] = qty;
    }
  }

  const next: CustomizationSelectionStateV2 = { ...selection };
  if (Object.keys(nextGroup).length === 0) {
    delete next[group.id];
  } else {
    next[group.id] = nextGroup;
  }
  return next;
}

export function incrementOptionQuantity(params: {
  selection: CustomizationSelectionStateV2;
  groups: PublicCustomizationGroup[];
  group: PublicCustomizationGroup;
  optionId: string;
}): CustomizationSelectionStateV2 {
  if (!canIncrementOptionQuantity(params)) {
    return params.selection;
  }

  const current = getSelectedOptionQuantity(
    params.selection,
    params.group.id,
    params.optionId
  );
  const tentative = setOptionQuantityInSelection({
    selection: params.selection,
    group: params.group,
    optionId: params.optionId,
    quantity: current + 1
  });
  return normalizeSelectionToV2(tentative, params.groups);
}

export function decrementOptionQuantity(params: {
  selection: CustomizationSelectionStateV2;
  groups: PublicCustomizationGroup[];
  group: PublicCustomizationGroup;
  optionId: string;
}): CustomizationSelectionStateV2 {
  const current = getSelectedOptionQuantity(
    params.selection,
    params.group.id,
    params.optionId
  );
  if (current < 1) {
    return params.selection;
  }

  const tentative = setOptionQuantityInSelection({
    selection: params.selection,
    group: params.group,
    optionId: params.optionId,
    quantity: current - 1
  });
  return normalizeSelectionToV2(tentative, params.groups);
}

/**
 * True when client quantities already sit within effective limits (no silent clamp).
 * Used by create_order validation — UI drafts may clamp; orders must reject over-limit.
 */
export function isSelectionStrictlyWithinLimits(
  groups: PublicCustomizationGroup[],
  selection: CustomizationSelectionStateV2
): boolean {
  const clamped = normalizeSelectionToV2(selection, groups);

  for (const group of groups) {
    const raw = selection[group.id] ?? {};
    const cleaned = clamped[group.id] ?? {};
    const allowedIds = new Set(group.options.map((option) => option.id));

    for (const optionId of Object.keys(raw)) {
      if (!allowedIds.has(optionId)) {
        return false;
      }
    }

    const rawKeys = Object.keys(raw).sort();
    const cleanedKeys = Object.keys(cleaned).sort();
    if (rawKeys.length !== cleanedKeys.length) {
      return false;
    }

    for (let index = 0; index < rawKeys.length; index += 1) {
      const optionId = rawKeys[index]!;
      if (optionId !== cleanedKeys[index]) {
        return false;
      }
      if (raw[optionId] !== cleaned[optionId]) {
        return false;
      }
    }
  }

  return true;
}

export function formatQuantityGroupMeta(group: PublicCustomizationGroup): string {
  const parts: string[] = [group.isRequired ? "Obligatorio" : "Opcional"];

  if (group.selectionType === "multiple" && group.minSelections > 0) {
    parts.push(`mín. ${group.minSelections}`);
  }

  if (group.selectionType === "multiple" && group.maxSelections !== null) {
    parts.push(
      getEffectiveAllowsOptionQuantity(group)
        ? `máx. ${group.maxSelections} opciones`
        : `máx. ${group.maxSelections}`
    );
  }

  return parts.join(" · ");
}
