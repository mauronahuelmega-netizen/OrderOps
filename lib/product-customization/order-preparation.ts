/** Presentation-only mapper: persisted order_items → preparation/comanda view model. */

import {
  buildDashboardOrderItemTree,
  parseCustomizationSnapshot,
  type DashboardOrderItemNode,
  type OrderItemLike
} from "@/lib/product-customization/order-dashboard";
import type {
  CustomizationSnapshot,
  CustomizationSnapshotV1,
  CustomizationSnapshotV2
} from "@/lib/product-customization/order-types";

export type PreparationOption = {
  id: string;
  name: string;
  sortOrder: number;
  /** V2 quantity-enabled group option. Derived from snapshot `allows_option_quantity`. */
  isQuantityEnabled?: boolean;
  /** Per configured parent unit. Only for quantity-enabled options. */
  quantityPerUnit?: number;
  /** Total units to prepare across all parent quantities. */
  operationalTotal?: number;
};

export type PreparationGroup = {
  id: string;
  name: string;
  sortOrder: number;
  /** V2 snapshot flag — not inferred from group name. */
  allowsOptionQuantity?: boolean;
  options: PreparationOption[];
};

export type PreparationOrderItem = {
  id: string;
  kind: "product" | "upsell";
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  snapshotVersion: 1 | 2 | null;
  groups: PreparationGroup[];
  children: PreparationOrderItem[];
  isOrphanUpsell?: boolean;
  /** Dense/compact legacy fallback when no structured snapshot. */
  legacyModifiers?: string[];
};

function normalizeOptionQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  return 1;
}

function mapSnapshotToGroups(
  snapshot: CustomizationSnapshot,
  parentQuantity: number
): PreparationGroup[] {
  return snapshot.groups
    .filter((group) => group.selected_options.length > 0)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((group) => {
      const allowsOptionQuantity =
        snapshot.version === 2
          ? Boolean(
              (group as CustomizationSnapshotV2["groups"][number]).allows_option_quantity
            )
          : undefined;

      return {
        id: group.group_id,
        name: group.group_name,
        sortOrder: group.sort_order,
        allowsOptionQuantity,
        options: group.selected_options
          .slice()
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((option) =>
            mapOptionToPreparation(
              option,
              snapshot.version,
              parentQuantity,
              allowsOptionQuantity === true
            )
          )
      };
    });
}

function mapOptionToPreparation(
  option:
    | CustomizationSnapshotV1["groups"][number]["selected_options"][number]
    | CustomizationSnapshotV2["groups"][number]["selected_options"][number],
  snapshotVersion: 1 | 2,
  parentQuantity: number,
  allowsOptionQuantity: boolean
): PreparationOption {
  const base: PreparationOption = {
    id: option.option_id,
    name: option.option_name,
    sortOrder: option.sort_order,
    isQuantityEnabled: false
  };

  const isQuantityEnabled =
    snapshotVersion === 2 && allowsOptionQuantity && "quantity" in option;

  if (!isQuantityEnabled) {
    return base;
  }

  const quantityPerUnit = normalizeOptionQuantity(option.quantity);
  base.isQuantityEnabled = true;

  if (parentQuantity > 1) {
    base.quantityPerUnit = quantityPerUnit;
    base.operationalTotal = quantityPerUnit * parentQuantity;
    return base;
  }

  if (quantityPerUnit > 1) {
    base.quantityPerUnit = quantityPerUnit;
  }

  return base;
}

function mapChildItemToPreparation(child: OrderItemLike): PreparationOrderItem {
  const quantity = child.quantity;
  const unitPrice = child.unit_price;

  return {
    id: typeof child.id === "string" && child.id ? child.id : `child-${child.product_name}`,
    kind: "upsell",
    name: child.product_name,
    quantity,
    unitPrice,
    lineTotal: quantity * unitPrice,
    snapshotVersion: null,
    groups: [],
    children: [],
    isOrphanUpsell: false
  };
}

function splitLegacyDescription(description: string | null | undefined): string[] {
  if (!description?.trim()) {
    return [];
  }

  return description
    .split(/[,;|\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mapNodeToPreparationItem(node: DashboardOrderItemNode): PreparationOrderItem {
  const item = node.item;
  const quantity = item.quantity;
  const unitPrice = item.unit_price;
  const snapshot = node.snapshot;
  const hasStructuredGroups =
    snapshot !== null && snapshot.groups.some((group) => group.selected_options.length > 0);
  const legacyModifiers =
    !hasStructuredGroups && !node.isOrphanUpsell
      ? splitLegacyDescription(item.description)
      : [];

  return {
    id:
      typeof item.id === "string" && item.id
        ? item.id
        : `orphan-${item.product_name}-${quantity}`,
    kind: node.isOrphanUpsell || item.item_kind === "upsell" ? "upsell" : "product",
    name: item.product_name,
    quantity,
    unitPrice,
    lineTotal: quantity * unitPrice,
    snapshotVersion: snapshot?.version ?? null,
    groups: hasStructuredGroups && snapshot ? mapSnapshotToGroups(snapshot, quantity) : [],
    children: node.children.map(mapChildItemToPreparation),
    isOrphanUpsell: node.isOrphanUpsell,
    legacyModifiers: legacyModifiers.length > 0 ? legacyModifiers : undefined
  };
}

/**
 * Builds a deterministic preparation view model from flat order_items.
 * Uses persisted snapshots only — no live product/customization config.
 */
export function buildOrderPreparationItems(items: OrderItemLike[]): PreparationOrderItem[] {
  const tree = buildDashboardOrderItemTree(items);
  return tree.map(mapNodeToPreparationItem);
}

/** Re-export for consumers that need tolerant parse without tree mapping. */
export { parseCustomizationSnapshot };
