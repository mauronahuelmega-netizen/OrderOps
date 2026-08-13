import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import type {
  CustomizationSnapshotV1,
  CustomizationSnapshotV2
} from "@/lib/product-customization/order-types";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";
import { getEffectiveAllowsOptionQuantity } from "@/lib/product-customization/selection-v2";

function formatPlainAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2
  }).format(value);
}

function normalizeOptionQuantity(quantity: number | undefined): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }
  return Math.floor(quantity);
}

export function buildDisplaySummaryFromSelectedGroups(
  groups: LocalCartSelectedGroup[]
): string[] {
  return groups
    .filter((group) => group.selectedOptions.length > 0)
    .map((group) => {
      const optionsLabel = group.selectedOptions
        .map((option) => {
          const qty = normalizeOptionQuantity(option.quantity);
          const namePart = qty > 1 ? `${option.optionName} x${qty}` : option.optionName;
          const lineDelta = option.priceDelta * qty;
          if (lineDelta > 0) {
            return `${namePart} (+$${formatPlainAmount(lineDelta)})`;
          }
          return namePart;
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

export function buildCustomizationSnapshotV2(params: {
  configurationSignature: string;
  productId: string;
  productName: string;
  baseUnitPrice: number;
  customizationTotal: number;
  finalUnitPrice: number;
  selectedGroups: LocalCartSelectedGroup[];
  configGroups: PublicCustomizationGroup[];
}): CustomizationSnapshotV2 {
  const configById = new Map(params.configGroups.map((group) => [group.id, group]));

  return {
    version: 2,
    source: "public_checkout",
    configuration_signature: params.configurationSignature,
    product: {
      id: params.productId,
      name: params.productName
    },
    groups: params.selectedGroups.map((group) => {
      const configGroup = configById.get(group.groupId);
      const allowsOptionQuantity = configGroup
        ? getEffectiveAllowsOptionQuantity(configGroup)
        : Boolean(group.allowsOptionQuantity);

      return {
        group_id: group.groupId,
        group_name: group.groupName,
        selection_type: group.selectionType,
        allows_option_quantity: allowsOptionQuantity,
        is_required: group.isRequired,
        min_selections: group.minSelections,
        max_selections: group.maxSelections,
        max_total_quantity: configGroup?.maxTotalQuantity ?? null,
        sort_order: group.sortOrder,
        selected_options: group.selectedOptions.map((option) => {
          const quantity = normalizeOptionQuantity(option.quantity);
          return {
            option_id: option.optionId,
            option_name: option.optionName,
            price_delta: option.priceDelta,
            quantity,
            total_price_delta: option.priceDelta * quantity,
            sort_order: option.sortOrder
          };
        })
      };
    }),
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
  selectedOptionsByGroupId: Record<string, string[]>,
  selectedQuantitiesByGroupId?: Record<string, Record<string, number>>
): LocalCartSelectedGroup[] {
  const result: LocalCartSelectedGroup[] = [];

  groups.forEach((group, groupIndex) => {
    const quantities = selectedQuantitiesByGroupId?.[group.id];
    const selectedIds = quantities
      ? Object.keys(quantities).filter(
          (optionId) =>
            typeof quantities[optionId] === "number" &&
            Number.isFinite(quantities[optionId]) &&
            (quantities[optionId] as number) >= 1
        )
      : [...new Set(selectedOptionsByGroupId[group.id] ?? [])];

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

        const rawQty = quantities?.[optionId];
        const quantity = getEffectiveAllowsOptionQuantity(group)
          ? normalizeOptionQuantity(rawQty)
          : 1;

        return {
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.priceDelta,
          quantity,
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
      allowsOptionQuantity: getEffectiveAllowsOptionQuantity(group),
      sortOrder: groupIndex,
      selectedOptions
    });
  });

  return result;
}
