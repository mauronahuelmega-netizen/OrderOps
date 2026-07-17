/** Client-safe helpers for admin dashboard Product Customization display. */

import type { CustomizationSnapshotV1 } from "@/lib/product-customization/order-types";

export type { CustomizationSnapshotV1 };

export type OrderItemLike = {
  id?: string | null;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  description?: string | null;
  image_url?: string | null;
  item_kind?: "product" | "upsell" | null;
  parent_order_item_id?: string | null;
  customization_snapshot?: unknown;
};

export type DashboardOrderItemNode = {
  item: OrderItemLike;
  snapshot: CustomizationSnapshotV1 | null;
  customizationSummary: string[];
  children: OrderItemLike[];
  /** Upsell whose parent_order_item_id is missing from the payload. */
  isOrphanUpsell: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function formatPlainDelta(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2
  }).format(value);
}

function buildSummaryFromGroups(
  groups: CustomizationSnapshotV1["groups"]
): string[] {
  return groups
    .filter((group) => group.selected_options.length > 0)
    .map((group) => {
      const optionsLabel = group.selected_options
        .map((option) => {
          if (option.price_delta > 0) {
            return `${option.option_name} +$${formatPlainDelta(option.price_delta)}`;
          }

          return option.option_name;
        })
        .join(", ");

      return `${group.group_name}: ${optionsLabel}`;
    });
}

/**
 * Tolerant parser for persisted customization_snapshot v1.
 * Returns null for missing/corrupt payloads so callers degrade to legacy render.
 */
export function parseCustomizationSnapshot(
  value: unknown
): CustomizationSnapshotV1 | null {
  if (!isRecord(value)) {
    return null;
  }

  const version = asFiniteNumber(value.version, Number.NaN);
  if (version !== 1) {
    return null;
  }

  const product = isRecord(value.product) ? value.product : {};
  const pricing = isRecord(value.pricing) ? value.pricing : {};

  const rawGroups = Array.isArray(value.groups) ? value.groups : [];
  const groups: CustomizationSnapshotV1["groups"] = [];

  for (const rawGroup of rawGroups) {
    if (!isRecord(rawGroup)) {
      continue;
    }

    const rawOptions = Array.isArray(rawGroup.selected_options)
      ? rawGroup.selected_options
      : [];
    const selectedOptions: CustomizationSnapshotV1["groups"][number]["selected_options"] =
      [];

    for (const rawOption of rawOptions) {
      if (!isRecord(rawOption)) {
        continue;
      }

      const optionName = asString(rawOption.option_name).trim();
      if (!optionName) {
        continue;
      }

      selectedOptions.push({
        option_id: asString(rawOption.option_id),
        option_name: optionName,
        price_delta: Math.max(0, asFiniteNumber(rawOption.price_delta, 0)),
        sort_order: asFiniteNumber(rawOption.sort_order, selectedOptions.length)
      });
    }

    selectedOptions.sort((left, right) => left.sort_order - right.sort_order);

    const groupName = asString(rawGroup.group_name).trim();
    if (!groupName && selectedOptions.length === 0) {
      continue;
    }

    const selectionType =
      rawGroup.selection_type === "multiple" ? "multiple" : "single";
    const maxSelectionsRaw = rawGroup.max_selections;
    const maxSelections =
      maxSelectionsRaw === null || maxSelectionsRaw === undefined
        ? null
        : asFiniteNumber(maxSelectionsRaw, 1);

    groups.push({
      group_id: asString(rawGroup.group_id),
      group_name: groupName || "Opciones",
      selection_type: selectionType,
      is_required: Boolean(rawGroup.is_required),
      min_selections: Math.max(0, asFiniteNumber(rawGroup.min_selections, 0)),
      max_selections: maxSelections,
      sort_order: asFiniteNumber(rawGroup.sort_order, groups.length),
      selected_options: selectedOptions
    });
  }

  groups.sort((left, right) => left.sort_order - right.sort_order);

  const rawSummary = Array.isArray(value.summary) ? value.summary : [];
  const summary = rawSummary
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    version: 1,
    source: "public_checkout",
    configuration_signature: asString(value.configuration_signature),
    product: {
      id: asString(product.id),
      name: asString(product.name)
    },
    groups,
    pricing: {
      base_unit_price: asFiniteNumber(pricing.base_unit_price, 0),
      customization_total: asFiniteNumber(pricing.customization_total, 0),
      final_unit_price: asFiniteNumber(pricing.final_unit_price, 0)
    },
    summary
  };
}

export function getCustomizationSummaryLines(
  snapshot: CustomizationSnapshotV1 | null
): string[] {
  if (!snapshot) {
    return [];
  }

  if (snapshot.summary.length > 0) {
    return snapshot.summary;
  }

  return buildSummaryFromGroups(snapshot.groups);
}

function isUpsellChild(item: OrderItemLike): boolean {
  return item.item_kind === "upsell" && Boolean(item.parent_order_item_id);
}

function isStandaloneOrphanUpsell(item: OrderItemLike): boolean {
  return item.item_kind === "upsell" && !item.parent_order_item_id;
}

/**
 * Groups flat order_items into parent nodes + attached upsell children.
 * Preserves original order for parents and orphans; children keep relative order.
 */
export function buildDashboardOrderItemTree(
  items: OrderItemLike[]
): DashboardOrderItemNode[] {
  const safeItems = Array.isArray(items) ? items : [];
  const byId = new Map<string, OrderItemLike>();

  for (const item of safeItems) {
    if (typeof item.id === "string" && item.id) {
      byId.set(item.id, item);
    }
  }

  const childrenByParentId = new Map<string, OrderItemLike[]>();
  const orphans: OrderItemLike[] = [];
  const parentsInOrder: OrderItemLike[] = [];

  for (const item of safeItems) {
    if (isUpsellChild(item)) {
      const parentId = item.parent_order_item_id as string;
      if (byId.has(parentId)) {
        const bucket = childrenByParentId.get(parentId) ?? [];
        bucket.push(item);
        childrenByParentId.set(parentId, bucket);
      } else {
        orphans.push(item);
      }
      continue;
    }

    if (isStandaloneOrphanUpsell(item)) {
      orphans.push(item);
      continue;
    }

    parentsInOrder.push(item);
  }

  const nodes: DashboardOrderItemNode[] = parentsInOrder.map((item) => {
    const snapshot = parseCustomizationSnapshot(item.customization_snapshot);
    const children =
      typeof item.id === "string" && item.id
        ? childrenByParentId.get(item.id) ?? []
        : [];

    return {
      item,
      snapshot,
      customizationSummary: getCustomizationSummaryLines(snapshot),
      children,
      isOrphanUpsell: false
    };
  });

  for (const orphan of orphans) {
    nodes.push({
      item: orphan,
      snapshot: null,
      customizationSummary: [],
      children: [],
      isOrphanUpsell: true
    });
  }

  return nodes;
}
