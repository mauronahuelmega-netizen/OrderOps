/** Client-safe types and pure helpers for public Product Customization (no server-only). */

export type PublicCustomizationSelectionType = "single" | "multiple";

export type PublicProductCustomizationSummary = {
  productId: string;
  hasCustomizations: boolean;
  hasPaidCustomizations: boolean;
  hasUpsell: boolean;
  priceFrom: number | null;
};

export type PublicCustomizationOption = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
};

export type PublicCustomizationGroup = {
  id: string;
  name: string;
  description: string | null;
  selectionType: PublicCustomizationSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  options: PublicCustomizationOption[];
  /** Required group with no selectable options after filters/overrides. */
  isBlocked: boolean;
};

export type PublicUpsellSuggestedProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

export type PublicUpsellGroupView = {
  id: string;
  name: string;
  description: string | null;
  products: PublicUpsellSuggestedProduct[];
};

export type PublicProductCustomizationConfig = {
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl: string | null;
  productDescription: string | null;
  groups: PublicCustomizationGroup[];
  upsellGroup: PublicUpsellGroupView | null;
};

export type PublicCustomizationSelectionDraft = {
  productId: string;
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedUpsellProductIds: string[];
  visualTotal: number;
};

export function productNeedsCustomizationModal(
  summary: PublicProductCustomizationSummary | null | undefined
): boolean {
  if (!summary) {
    return false;
  }

  return summary.hasCustomizations || summary.hasUpsell;
}

export function shouldShowPriceFrom(
  summary: PublicProductCustomizationSummary | null | undefined
): boolean {
  if (!summary) {
    return false;
  }

  return (
    summary.hasCustomizations ||
    summary.hasPaidCustomizations ||
    summary.hasUpsell ||
    (summary.priceFrom !== null && Number.isFinite(summary.priceFrom))
  );
}

export function computeMinimumRequiredDelta(groups: PublicCustomizationGroup[]): number {
  let total = 0;

  for (const group of groups) {
    if (group.isBlocked || group.options.length === 0) {
      continue;
    }

    if (!group.isRequired && group.minSelections <= 0) {
      continue;
    }

    const sortedDeltas = [...group.options]
      .map((option) => option.priceDelta)
      .sort((a, b) => a - b);

    if (group.selectionType === "single") {
      if (group.isRequired || group.minSelections >= 1) {
        total += sortedDeltas[0] ?? 0;
      }
      continue;
    }

    const needed = Math.max(group.isRequired ? Math.max(group.minSelections, 1) : group.minSelections, 0);
    if (needed <= 0) {
      continue;
    }

    total += sortedDeltas.slice(0, needed).reduce((sum, delta) => sum + delta, 0);
  }

  return total;
}

export function computeVisualCustomizationTotal(params: {
  basePrice: number;
  groups: PublicCustomizationGroup[];
  selectedOptionsByGroupId: Record<string, string[]>;
  upsellProducts: PublicUpsellSuggestedProduct[];
  selectedUpsellProductIds: string[];
}): number {
  const optionById = new Map<string, PublicCustomizationOption>();
  for (const group of params.groups) {
    for (const option of group.options) {
      optionById.set(option.id, option);
    }
  }

  let total = params.basePrice;

  for (const optionIds of Object.values(params.selectedOptionsByGroupId)) {
    for (const optionId of optionIds) {
      total += optionById.get(optionId)?.priceDelta ?? 0;
    }
  }

  const upsellById = new Map(params.upsellProducts.map((product) => [product.id, product]));
  for (const productId of params.selectedUpsellProductIds) {
    total += upsellById.get(productId)?.price ?? 0;
  }

  return total;
}

export type GroupValidationIssue = {
  groupId: string;
  message: string;
};

export function validateCustomizationSelection(
  groups: PublicCustomizationGroup[],
  selectedOptionsByGroupId: Record<string, string[]>
): { valid: boolean; issues: GroupValidationIssue[] } {
  const issues: GroupValidationIssue[] = [];

  for (const group of groups) {
    if (group.isBlocked) {
      issues.push({
        groupId: group.id,
        message: `“${group.name}” no tiene opciones disponibles.`
      });
      continue;
    }

    const selected = selectedOptionsByGroupId[group.id] ?? [];
    const uniqueSelected = [...new Set(selected)];
    const allowedIds = new Set(group.options.map((option) => option.id));

    if (uniqueSelected.some((id) => !allowedIds.has(id))) {
      issues.push({
        groupId: group.id,
        message: `Hay una opción inválida en “${group.name}”.`
      });
      continue;
    }

    if (group.selectionType === "single") {
      if (uniqueSelected.length > 1) {
        issues.push({
          groupId: group.id,
          message: `Elegí solo una opción en “${group.name}”.`
        });
      } else if ((group.isRequired || group.minSelections >= 1) && uniqueSelected.length === 0) {
        issues.push({
          groupId: group.id,
          message: `Elegí una opción en “${group.name}”.`
        });
      }
      continue;
    }

    const min = group.isRequired ? Math.max(group.minSelections, 1) : group.minSelections;
    const max = group.maxSelections;

    if (uniqueSelected.length < min) {
      issues.push({
        groupId: group.id,
        message:
          min === 1
            ? `Elegí al menos 1 opción en “${group.name}”.`
            : `Elegí al menos ${min} opciones en “${group.name}”.`
      });
    }

    if (max !== null && uniqueSelected.length > max) {
      issues.push({
        groupId: group.id,
        message: `Podés elegir hasta ${max} opciones en “${group.name}”.`
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function formatPublicCatalogCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}

/** Seam for CART-1 — do not persist in CATALOG-1. */
export type OnConfirmCustomizationSelection = (
  draft: PublicCustomizationSelectionDraft
) => void;
