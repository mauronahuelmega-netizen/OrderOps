/**
 * Pure domain helpers for future admin manual-order customization tickets.
 * No React / DOM / Supabase / UI wiring.
 */
import {
  buildCartConfigurationSignature,
  selectedGroupsToSignatureInput
} from "@/lib/cart/signature";
import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import type { CustomizationSnapshotV2 } from "@/lib/product-customization/order-types";
import {
  buildCustomizationSnapshotV2,
  buildDisplaySummaryFromSelectedGroups
} from "@/lib/product-customization/order-snapshot";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";

export type ManualOrderTicketLineKind = "simple" | "customized" | "upsell";

export type ManualOrderTicketLine = {
  clientLineId: string;
  kind: ManualOrderTicketLineKind;
  productId: string;
  productName: string;
  categoryName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** Configuration / identity signature for merge (excludes parent line quantity). */
  signature: string;
  customizationSnapshot: CustomizationSnapshotV2 | null;
  /** Server-submit intent for customized parents (never trust client prices). */
  selectedGroups: LocalCartSelectedGroup[] | null;
  parentClientLineId: string | null;
  displaySummary: string[];
};

export type ManualOrderUpsellProductInput = {
  productId: string;
  productName: string;
  categoryName?: string | null;
  unitPrice: number;
  clientLineId?: string;
};

const MIN_QTY = 1;
const MAX_QTY = 99;

export function normalizeManualTicketQuantity(quantity: number): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return MIN_QTY;
  }
  const floored = Math.floor(quantity);
  if (floored < MIN_QTY) {
    return MIN_QTY;
  }
  if (floored > MAX_QTY) {
    return MAX_QTY;
  }
  return floored;
}

export function createManualClientLineId(prefix = "manual"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function withLineTotal(line: ManualOrderTicketLine): ManualOrderTicketLine {
  return {
    ...line,
    lineTotal: line.unitPrice * line.quantity
  };
}

export function buildManualSimpleSignature(productId: string): string {
  return buildCartConfigurationSignature({
    productId,
    selectedGroups: [],
    upsellProductIds: []
  });
}

export function buildManualUpsellChildSignature(input: {
  productId: string;
  parentClientLineId: string;
}): string {
  return `upsell:${input.productId}|parent:${input.parentClientLineId}`;
}

function computeCustomizationUnitDelta(selectedGroups: LocalCartSelectedGroup[]): number {
  let total = 0;
  for (const group of selectedGroups) {
    for (const option of group.selectedOptions) {
      const qty =
        typeof option.quantity === "number" &&
        Number.isFinite(option.quantity) &&
        option.quantity >= 1
          ? Math.floor(option.quantity)
          : 1;
      total += option.priceDelta * qty;
    }
  }
  return total;
}

export function createManualSimpleTicketLine(input: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  unitPrice: number;
  quantity?: number;
  clientLineId?: string;
}): ManualOrderTicketLine {
  const quantity = normalizeManualTicketQuantity(input.quantity ?? 1);
  const unitPrice = input.unitPrice;

  return withLineTotal({
    clientLineId: input.clientLineId ?? createManualClientLineId("manual-simple"),
    kind: "simple",
    productId: input.productId,
    productName: input.productName,
    categoryName: input.categoryName ?? null,
    quantity,
    unitPrice,
    lineTotal: 0,
    signature: buildManualSimpleSignature(input.productId),
    customizationSnapshot: null,
    selectedGroups: null,
    parentClientLineId: null,
    displaySummary: []
  });
}

export function createManualConfiguredTicketLine(input: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  baseUnitPrice: number;
  quantity?: number;
  clientLineId?: string;
  selectedGroups: LocalCartSelectedGroup[];
  configGroups: PublicCustomizationGroup[];
  /** Upsell product ids already attached (affects parent signature only). */
  upsellProductIds?: string[];
}): ManualOrderTicketLine {
  const quantity = normalizeManualTicketQuantity(input.quantity ?? 1);
  const upsellProductIds = [...new Set(input.upsellProductIds ?? [])];
  const signature = buildCartConfigurationSignature({
    productId: input.productId,
    selectedGroups: selectedGroupsToSignatureInput(input.selectedGroups),
    upsellProductIds
  });
  const customizationTotal = computeCustomizationUnitDelta(input.selectedGroups);
  const unitPrice = input.baseUnitPrice + customizationTotal;
  const snapshot = buildCustomizationSnapshotV2({
    configurationSignature: signature,
    productId: input.productId,
    productName: input.productName,
    baseUnitPrice: input.baseUnitPrice,
    customizationTotal,
    finalUnitPrice: unitPrice,
    selectedGroups: input.selectedGroups,
    configGroups: input.configGroups
  });

  return withLineTotal({
    clientLineId: input.clientLineId ?? createManualClientLineId("manual-cfg"),
    kind: "customized",
    productId: input.productId,
    productName: input.productName,
    categoryName: input.categoryName ?? null,
    quantity,
    unitPrice,
    lineTotal: 0,
    signature,
    customizationSnapshot: snapshot,
    selectedGroups: input.selectedGroups,
    parentClientLineId: null,
    displaySummary: buildDisplaySummaryFromSelectedGroups(input.selectedGroups)
  });
}

export function createManualUpsellTicketLine(input: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  unitPrice: number;
  parentClientLineId: string;
  /** Defaults to parent quantity when provided. */
  quantity?: number;
  parentQuantity?: number;
  clientLineId?: string;
}): ManualOrderTicketLine {
  if (!input.parentClientLineId) {
    throw new Error("Upsell child requires parentClientLineId.");
  }

  const quantity = normalizeManualTicketQuantity(
    input.quantity ?? input.parentQuantity ?? 1
  );

  return withLineTotal({
    clientLineId: input.clientLineId ?? createManualClientLineId("manual-upsell"),
    kind: "upsell",
    productId: input.productId,
    productName: input.productName,
    categoryName: input.categoryName ?? null,
    quantity,
    unitPrice: input.unitPrice,
    lineTotal: 0,
    signature: buildManualUpsellChildSignature({
      productId: input.productId,
      parentClientLineId: input.parentClientLineId
    }),
    customizationSnapshot: null,
    selectedGroups: null,
    parentClientLineId: input.parentClientLineId,
    displaySummary: []
  });
}

/**
 * Create a configured parent plus linked upsell children with a consistent signature.
 */
export function createManualConfiguredTicketBundle(input: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  baseUnitPrice: number;
  quantity?: number;
  clientLineId?: string;
  selectedGroups: LocalCartSelectedGroup[];
  configGroups: PublicCustomizationGroup[];
  upsells?: ManualOrderUpsellProductInput[];
}): { parent: ManualOrderTicketLine; children: ManualOrderTicketLine[] } {
  const upsells = input.upsells ?? [];
  const parentId = input.clientLineId ?? createManualClientLineId("manual-cfg");
  const quantity = normalizeManualTicketQuantity(input.quantity ?? 1);
  const parent = createManualConfiguredTicketLine({
    ...input,
    clientLineId: parentId,
    quantity,
    upsellProductIds: upsells.map((upsell) => upsell.productId)
  });

  const children = upsells.map((upsell) =>
    createManualUpsellTicketLine({
      productId: upsell.productId,
      productName: upsell.productName,
      categoryName: upsell.categoryName,
      unitPrice: upsell.unitPrice,
      parentClientLineId: parent.clientLineId,
      parentQuantity: parent.quantity,
      clientLineId: upsell.clientLineId
    })
  );

  return { parent, children };
}

function syncChildrenToParentQuantity(
  lines: ManualOrderTicketLine[],
  parentClientLineId: string,
  parentQuantity: number
): ManualOrderTicketLine[] {
  return lines.map((line) => {
    if (line.kind !== "upsell" || line.parentClientLineId !== parentClientLineId) {
      return line;
    }
    return withLineTotal({
      ...line,
      quantity: parentQuantity,
      signature: buildManualUpsellChildSignature({
        productId: line.productId,
        parentClientLineId
      })
    });
  });
}

/**
 * Merge a single incoming line into the ticket.
 * For configured parents that already have children in `lines`, child quantities track the merged parent qty.
 */
export function mergeManualTicketLine(
  lines: ManualOrderTicketLine[],
  incoming: ManualOrderTicketLine
): ManualOrderTicketLine[] {
  if (incoming.kind === "upsell") {
    if (!incoming.parentClientLineId) {
      throw new Error("Upsell child requires parentClientLineId.");
    }
    const parent = lines.find(
      (line) =>
        line.clientLineId === incoming.parentClientLineId &&
        (line.kind === "customized" || line.kind === "simple")
    );
    if (!parent) {
      throw new Error("Cannot attach upsell: parent line missing.");
    }

    const existingChild = lines.find(
      (line) =>
        line.kind === "upsell" &&
        line.parentClientLineId === incoming.parentClientLineId &&
        line.productId === incoming.productId
    );
    if (existingChild) {
      return lines;
    }

    return [
      ...lines,
      withLineTotal({
        ...incoming,
        quantity: parent.quantity,
        signature: buildManualUpsellChildSignature({
          productId: incoming.productId,
          parentClientLineId: incoming.parentClientLineId
        })
      })
    ];
  }

  if (incoming.kind === "simple") {
    const index = lines.findIndex(
      (line) => line.kind === "simple" && line.productId === incoming.productId
    );
    if (index === -1) {
      return [...lines, withLineTotal(incoming)];
    }

    const existing = lines[index];
    const nextQuantity = normalizeManualTicketQuantity(
      existing.quantity + incoming.quantity
    );
    const next = [...lines];
    next[index] = withLineTotal({
      ...existing,
      quantity: nextQuantity
    });
    return next;
  }

  // customized
  const index = lines.findIndex(
    (line) =>
      line.kind === "customized" &&
      line.productId === incoming.productId &&
      line.signature === incoming.signature
  );

  if (index === -1) {
    return [...lines, withLineTotal(incoming)];
  }

  const existing = lines[index];
  const nextQuantity = normalizeManualTicketQuantity(
    existing.quantity + incoming.quantity
  );
  const next = [...lines];
  next[index] = withLineTotal({
    ...existing,
    quantity: nextQuantity
  });
  return syncChildrenToParentQuantity(next, existing.clientLineId, nextQuantity);
}

/**
 * Append a configured parent + children, merging when signature matches.
 */
export function mergeManualConfiguredSelection(
  lines: ManualOrderTicketLine[],
  selection: { parent: ManualOrderTicketLine; children: ManualOrderTicketLine[] }
): ManualOrderTicketLine[] {
  const existing = lines.find(
    (line) =>
      line.kind === "customized" &&
      line.productId === selection.parent.productId &&
      line.signature === selection.parent.signature
  );

  if (!existing) {
    let next = mergeManualTicketLine(lines, selection.parent);
    for (const child of selection.children) {
      next = mergeManualTicketLine(next, {
        ...child,
        parentClientLineId: selection.parent.clientLineId,
        quantity: selection.parent.quantity
      });
    }
    return next;
  }

  let next = mergeManualTicketLine(lines, {
    ...selection.parent,
    clientLineId: existing.clientLineId
  });

  for (const child of selection.children) {
    next = mergeManualTicketLine(next, {
      ...child,
      parentClientLineId: existing.clientLineId
    });
  }

  return next;
}

export function removeManualTicketLine(
  lines: ManualOrderTicketLine[],
  clientLineId: string
): ManualOrderTicketLine[] {
  const target = lines.find((line) => line.clientLineId === clientLineId);
  if (!target) {
    return lines;
  }

  if (target.kind === "customized" || target.kind === "simple") {
    return lines.filter(
      (line) =>
        line.clientLineId !== clientLineId &&
        line.parentClientLineId !== clientLineId
    );
  }

  return lines.filter((line) => line.clientLineId !== clientLineId);
}

export function updateManualTicketLineQuantity(
  lines: ManualOrderTicketLine[],
  clientLineId: string,
  nextQuantityRaw: number
): ManualOrderTicketLine[] {
  const nextQuantity = normalizeManualTicketQuantity(nextQuantityRaw);
  const target = lines.find((line) => line.clientLineId === clientLineId);
  if (!target) {
    return lines;
  }

  if (target.kind === "upsell") {
    // Children track parent quantity; direct child qty edits are ignored.
    return lines;
  }

  const next = lines.map((line) => {
    if (line.clientLineId !== clientLineId) {
      return line;
    }
    return withLineTotal({
      ...line,
      quantity: nextQuantity
    });
  });

  if (target.kind === "customized") {
    return syncChildrenToParentQuantity(next, target.clientLineId, nextQuantity);
  }

  return next;
}

export function getManualTicketEstimatedTotal(lines: ManualOrderTicketLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function getManualTicketChildren(
  lines: ManualOrderTicketLine[],
  parentClientLineId: string
): ManualOrderTicketLine[] {
  return lines.filter(
    (line) => line.kind === "upsell" && line.parentClientLineId === parentClientLineId
  );
}
