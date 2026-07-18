/** Pure selection toggles for Product Customization UI (public modal + admin sandbox). */

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
