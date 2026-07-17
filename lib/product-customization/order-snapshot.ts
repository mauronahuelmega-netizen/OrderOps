import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import type { CustomizationSnapshotV1 } from "@/lib/product-customization/order-types";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";

function formatPlainAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2
  }).format(value);
}

export function buildDisplaySummaryFromSelectedGroups(
  groups: LocalCartSelectedGroup[]
): string[] {
  return groups
    .filter((group) => group.selectedOptions.length > 0)
    .map((group) => {
      const optionsLabel = group.selectedOptions
        .map((option) => {
          if (option.priceDelta > 0) {
            return `${option.optionName} (+$${formatPlainAmount(option.priceDelta)})`;
          }
          return option.optionName;
        })
        .join(", ");

      return `${group.groupName}: ${optionsLabel}`;
    });
}

export function buildCustomizationSnapshotV1(params: {
  configurationSignature: string;
  productId: string;
  productName: string;
  baseUnitPrice: number;
  customizationTotal: number;
  finalUnitPrice: number;
  selectedGroups: LocalCartSelectedGroup[];
}): CustomizationSnapshotV1 {
  return {
    version: 1,
    source: "public_checkout",
    configuration_signature: params.configurationSignature,
    product: {
      id: params.productId,
      name: params.productName
    },
    groups: params.selectedGroups.map((group) => ({
      group_id: group.groupId,
      group_name: group.groupName,
      selection_type: group.selectionType,
      is_required: group.isRequired,
      min_selections: group.minSelections,
      max_selections: group.maxSelections,
      sort_order: group.sortOrder,
      selected_options: group.selectedOptions.map((option) => ({
        option_id: option.optionId,
        option_name: option.optionName,
        price_delta: option.priceDelta,
        sort_order: option.sortOrder
      }))
    })),
    pricing: {
      base_unit_price: params.baseUnitPrice,
      customization_total: params.customizationTotal,
      final_unit_price: params.finalUnitPrice
    },
    summary: buildDisplaySummaryFromSelectedGroups(params.selectedGroups)
  };
}

export function buildSelectedGroupsFromConfig(
  groups: PublicCustomizationGroup[],
  selectedOptionsByGroupId: Record<string, string[]>
): LocalCartSelectedGroup[] {
  const result: LocalCartSelectedGroup[] = [];

  groups.forEach((group, groupIndex) => {
    const selectedIds = [...new Set(selectedOptionsByGroupId[group.id] ?? [])];
    if (selectedIds.length === 0) {
      return;
    }

    const optionById = new Map(group.options.map((option) => [option.id, option]));
    const selectedOptions = selectedIds
      .map((optionId, optionIndex) => {
        const option = optionById.get(optionId);
        if (!option) {
          return null;
        }

        return {
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.priceDelta,
          sortOrder: optionIndex
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    if (selectedOptions.length === 0) {
      return;
    }

    result.push({
      groupId: group.id,
      groupName: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      sortOrder: groupIndex,
      selectedOptions
    });
  });

  return result;
}
