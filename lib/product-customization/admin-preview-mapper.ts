/**
 * Maps admin customization corpus → PublicProductCustomizationConfig-like preview shape.
 * Client-safe. No public server actions, no writes.
 *
 * Applies product_customization_overrides the same way as public resolveGroupsForProduct:
 * is_enabled === false hides groups / options for that product.
 */

import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup,
  AdminProductCustomizationOverride,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";
import type {
  PublicCustomizationGroup,
  PublicProductCustomizationConfig,
  PublicUpsellGroupView
} from "@/lib/product-customization/public-shared";

export type AdminPreviewMapperInput = {
  product: AdminCatalogProductOption | null;
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  upsellGroups: AdminUpsellGroup[];
  overrides: AdminProductCustomizationOverride[];
  productDescription?: string | null;
};

function overridesForProduct(
  overrides: AdminProductCustomizationOverride[],
  productId: string
): AdminProductCustomizationOverride[] {
  return overrides.filter((row) => row.product_id === productId);
}

function resolvePreviewGroups(params: {
  productId: string;
  categoryId: string | null;
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  overrides: AdminProductCustomizationOverride[];
}): PublicCustomizationGroup[] {
  const groupsById = new Map(params.groups.map((group) => [group.id, group]));

  const disabledGroupIds = new Set(
    params.overrides
      .filter(
        (row) =>
          row.override_type === "group" &&
          row.group_id &&
          row.is_enabled === false
      )
      .map((row) => row.group_id as string)
  );

  const disabledOptionIds = new Set(
    params.overrides
      .filter(
        (row) =>
          row.override_type === "option" &&
          row.option_id &&
          row.is_enabled === false
      )
      .map((row) => row.option_id as string)
  );

  type Resolved = {
    group: AdminCustomizationGroup;
    sortOrder: number;
    createdAt: string;
    source: "category" | "product";
  };

  const resolvedByGroup = new Map<string, Resolved>();

  for (const assignment of params.assignments) {
    if (!assignment.is_enabled) {
      continue;
    }

    const matchesProduct =
      assignment.target_type === "product" && assignment.target_id === params.productId;
    const matchesCategory =
      assignment.target_type === "category" &&
      params.categoryId !== null &&
      assignment.target_id === params.categoryId;

    if (!matchesProduct && !matchesCategory) {
      continue;
    }

    const group = groupsById.get(assignment.group_id);
    if (!group || !group.is_available) {
      continue;
    }

    if (disabledGroupIds.has(group.id)) {
      continue;
    }

    const candidate: Resolved = {
      group,
      sortOrder: assignment.sort_order,
      createdAt: assignment.created_at,
      source: assignment.target_type
    };

    const existing = resolvedByGroup.get(group.id);
    if (!existing) {
      resolvedByGroup.set(group.id, candidate);
      continue;
    }

    if (existing.source === "category" && candidate.source === "product") {
      resolvedByGroup.set(group.id, candidate);
    }
  }

  return [...resolvedByGroup.values()]
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.createdAt.localeCompare(b.createdAt);
    })
    .map((resolved) => {
      const options = [...resolved.group.options]
        .filter(
          (option) => option.is_available && !disabledOptionIds.has(option.id)
        )
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.created_at.localeCompare(b.created_at);
        })
        .map((option) => ({
          id: option.id,
          name: option.name,
          description: option.description,
          priceDelta: Number(option.price_delta)
        }));

      const isRequired = resolved.group.is_required;
      const isBlocked = isRequired && options.length === 0;

      return {
        id: resolved.group.id,
        name: resolved.group.name,
        description: resolved.group.description,
        selectionType: resolved.group.selection_type,
        isRequired,
        minSelections: resolved.group.min_selections,
        maxSelections: resolved.group.max_selections,
        options,
        isBlocked
      } satisfies PublicCustomizationGroup;
    })
    .filter((group) => group.options.length > 0 || group.isRequired);
}

function resolvePreviewUpsell(params: {
  productId: string;
  categoryId: string | null;
  upsellGroups: AdminUpsellGroup[];
}): PublicUpsellGroupView | null {
  const eligible = params.upsellGroups.filter((group) => group.is_available);

  const productMatch = eligible.find(
    (group) =>
      group.target_type === "product" && group.target_id === params.productId
  );
  const categoryMatch =
    !productMatch && params.categoryId
      ? eligible.find(
          (group) =>
            group.target_type === "category" &&
            group.target_id === params.categoryId
        )
      : null;

  const match = productMatch ?? categoryMatch ?? null;

  if (!match) {
    return null;
  }

  const products = [...match.items]
    .filter((item) => item.is_available)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.created_at.localeCompare(b.created_at);
    })
    .map((item) => ({
      id: item.product_id,
      name: item.product_name,
      price: Number(item.product_price),
      imageUrl: null as string | null
    }));

  if (products.length === 0) {
    return null;
  }

  return {
    id: match.id,
    name: match.name,
    description: match.description,
    products
  };
}

/** Pure effective preview config (assignments + overrides). Alias of mapAdminCorpusToPreviewConfig. */
export function resolveAdminEffectivePreviewConfig(
  input: AdminPreviewMapperInput
): PublicProductCustomizationConfig | null {
  return mapAdminCorpusToPreviewConfig(input);
}

export function mapAdminCorpusToPreviewConfig(
  input: AdminPreviewMapperInput
): PublicProductCustomizationConfig | null {
  if (!input.product) {
    return null;
  }

  const productOverrides = overridesForProduct(input.overrides, input.product.id);

  const groups = resolvePreviewGroups({
    productId: input.product.id,
    categoryId: input.product.category_id,
    groups: input.groups,
    assignments: input.assignments,
    overrides: productOverrides
  });

  const upsellGroup = resolvePreviewUpsell({
    productId: input.product.id,
    categoryId: input.product.category_id,
    upsellGroups: input.upsellGroups
  });

  return {
    productId: input.product.id,
    productName: input.product.name,
    productPrice: Number(input.product.price),
    productImageUrl: null,
    productDescription: input.productDescription ?? null,
    groups,
    upsellGroup
  };
}

/** True when the product has at least one disable override (group or option). */
export function productHasDisableOverrides(
  overrides: AdminProductCustomizationOverride[],
  productId: string
): boolean {
  return overridesForProduct(overrides, productId).some(
    (row) => row.is_enabled === false
  );
}
