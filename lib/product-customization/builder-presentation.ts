/**
 * Pure presentation helpers for the admin customization builder shell.
 * Client-safe: no server-only imports, no writes.
 */

import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";

export type BuilderCategoryRef = {
  id: string;
  name: string;
};

export type BuilderSectionSummary = {
  groupId: string;
  groupName: string;
  source: "category" | "product";
  isEnabled: boolean;
  options: Array<{
    optionId: string;
    optionName: string;
    priceDelta: number;
    isAvailable: boolean;
  }>;
};

export type BuilderProductRow = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  categoryId: string | null;
  categoryName: string | null;
  sectionCount: number;
  enabledSectionCount: number;
  hasUpsell: boolean;
  sections: BuilderSectionSummary[];
  upsellLabel: string | null;
};

export type BuilderCategoryRow = {
  id: string;
  name: string;
  productCount: number;
  sections: BuilderSectionSummary[];
  hasUpsell: boolean;
};

function resolveProductSections(
  product: AdminCatalogProductOption,
  assignments: AdminCustomizationAssignment[],
  groupsById: Map<string, AdminCustomizationGroup>
): BuilderSectionSummary[] {
  const relevant = assignments.filter(
    (assignment) =>
      (assignment.target_type === "product" && assignment.target_id === product.id) ||
      (assignment.target_type === "category" &&
        product.category_id !== null &&
        assignment.target_id === product.category_id)
  );

  const resolvedByGroup = new Map<
    string,
    {
      groupId: string;
      source: "category" | "product";
      isEnabled: boolean;
      sortOrder: number;
      createdAt: string;
    }
  >();

  for (const assignment of relevant) {
    const candidate = {
      groupId: assignment.group_id,
      source: assignment.target_type,
      isEnabled: assignment.is_enabled,
      sortOrder: assignment.sort_order,
      createdAt: assignment.created_at
    };
    const existing = resolvedByGroup.get(assignment.group_id);
    if (!existing) {
      resolvedByGroup.set(assignment.group_id, candidate);
      continue;
    }
    if (existing.source === "category" && candidate.source === "product") {
      resolvedByGroup.set(assignment.group_id, candidate);
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
      const group = groupsById.get(resolved.groupId);
      return {
        groupId: resolved.groupId,
        groupName: group?.name ?? "Sección",
        source: resolved.source,
        isEnabled: resolved.isEnabled && (group?.is_available ?? true),
        options: (group?.options ?? []).map((option) => ({
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.price_delta,
          isAvailable: option.is_available
        }))
      };
    });
}

export function buildProductRows(input: {
  products: AdminCatalogProductOption[];
  categories: BuilderCategoryRef[];
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  upsellGroups: AdminUpsellGroup[];
}): BuilderProductRow[] {
  const categoriesById = new Map(input.categories.map((category) => [category.id, category.name]));
  const groupsById = new Map(input.groups.map((group) => [group.id, group]));

  return input.products.map((product) => {
    const sections = resolveProductSections(product, input.assignments, groupsById);
    const upsell =
      input.upsellGroups.find(
        (group) =>
          group.is_available &&
          ((group.target_type === "product" && group.target_id === product.id) ||
            (group.target_type === "category" &&
              product.category_id !== null &&
              group.target_id === product.category_id))
      ) ?? null;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      isAvailable: product.is_available,
      categoryId: product.category_id,
      categoryName: product.category_id
        ? (categoriesById.get(product.category_id) ?? null)
        : null,
      sectionCount: sections.length,
      enabledSectionCount: sections.filter((section) => section.isEnabled).length,
      hasUpsell: Boolean(upsell),
      sections,
      upsellLabel: upsell?.name ?? null
    };
  });
}

export function buildCategoryRows(input: {
  categories: BuilderCategoryRef[];
  products: AdminCatalogProductOption[];
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  upsellGroups: AdminUpsellGroup[];
}): BuilderCategoryRow[] {
  const groupsById = new Map(input.groups.map((group) => [group.id, group]));

  return input.categories.map((category) => {
    const productCount = input.products.filter(
      (product) => product.category_id === category.id
    ).length;
    const categoryAssignments = input.assignments
      .filter(
        (assignment) =>
          assignment.target_type === "category" && assignment.target_id === category.id
      )
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.created_at.localeCompare(b.created_at);
      });

    const sections: BuilderSectionSummary[] = categoryAssignments.map((assignment) => {
      const group = groupsById.get(assignment.group_id);
      return {
        groupId: assignment.group_id,
        groupName: group?.name ?? assignment.group_name,
        source: "category" as const,
        isEnabled: assignment.is_enabled && (group?.is_available ?? true),
        options: (group?.options ?? []).map((option) => ({
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.price_delta,
          isAvailable: option.is_available
        }))
      };
    });

    const hasUpsell = input.upsellGroups.some(
      (group) =>
        group.is_available &&
        group.target_type === "category" &&
        group.target_id === category.id
    );

    return {
      id: category.id,
      name: category.name,
      productCount,
      sections,
      hasUpsell
    };
  });
}

export function formatBuilderPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}
