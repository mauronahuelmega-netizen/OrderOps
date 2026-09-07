/**
 * Pure adapter: manual ticket lines → create_order p_items JSON shape /
 * checkout-compatible cart for server validation.
 * Does not call RPC, Supabase, or server actions.
 *
 * Note: mirrors `toCreateOrderRpcJson` shape without importing
 * `order-validation.ts` (server-only module).
 */
import type { ManualOrderTicketLine } from "@/lib/orders/manual-order-customization-ticket";
import type { ManualOrderCreateTicketLineInput } from "@/lib/orders/manual-order-types";
import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import type {
  CheckoutCartPayload,
  CheckoutCustomizedGroupPayload,
  CustomizationSnapshot,
  ValidatedCreateOrderRpcItem
} from "@/lib/product-customization/order-types";

export type ManualOrderCreateOrderRpcJsonItem =
  | {
      client_line_id: string;
      product_id: string;
      quantity: number;
      item_kind: "product";
      customization_snapshot?: CustomizationSnapshot;
      unit_price?: number;
    }
  | {
      client_line_id: string;
      product_id: string;
      quantity: number;
      item_kind: "upsell";
      parent_client_line_id: string;
    };

export type ManualOrderCreateOrderItemsResult =
  | { ok: true; items: ManualOrderCreateOrderRpcJsonItem[] }
  | { ok: false; error: string };

export type ManualOrderCheckoutCartBuildResult =
  | { ok: true; cart: CheckoutCartPayload }
  | { ok: false; error: string };

export function localSelectedGroupsToCheckoutGroups(
  groups: LocalCartSelectedGroup[]
): CheckoutCustomizedGroupPayload[] {
  return groups.map((group) => {
    const selectedOptions = group.selectedOptions.map((option) => {
      const quantity =
        typeof option.quantity === "number" &&
        Number.isFinite(option.quantity) &&
        option.quantity >= 1
          ? Math.floor(option.quantity)
          : 1;

      return {
        optionId: option.optionId,
        quantity
      };
    });

    return {
      groupId: group.groupId,
      selectedOptionIds: selectedOptions.map((option) => option.optionId),
      selectedOptions
    };
  });
}

/**
 * Map domain ticket lines → server create input (selection intent only).
 * Omits unitPrice / snapshot / product names as authority.
 */
export function manualTicketLinesToCreateInput(
  lines: ManualOrderTicketLine[]
):
  | { ok: true; ticketLines: ManualOrderCreateTicketLineInput[] }
  | { ok: false; error: string } {
  const result: ManualOrderCreateTicketLineInput[] = [];
  const byId = new Map(lines.map((line) => [line.clientLineId, line]));

  for (const line of lines) {
    if (!line.clientLineId || !line.productId) {
      return { ok: false, error: "El ticket tiene líneas incompletas." };
    }

    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, error: "La cantidad debe ser mayor a cero." };
    }

    if (line.kind === "simple") {
      result.push({
        kind: "simple",
        clientLineId: line.clientLineId,
        productId: line.productId,
        quantity: line.quantity
      });
      continue;
    }

    if (line.kind === "customized") {
      if (!line.selectedGroups || line.selectedGroups.length === 0 || !line.signature) {
        return {
          ok: false,
          error: "Este producto requiere configuración antes de crear el pedido."
        };
      }

      result.push({
        kind: "customized",
        clientLineId: line.clientLineId,
        productId: line.productId,
        quantity: line.quantity,
        selectedGroups: localSelectedGroupsToCheckoutGroups(line.selectedGroups),
        configurationSignature: line.signature
      });
      continue;
    }

    if (!line.parentClientLineId) {
      return {
        ok: false,
        error: "Hay un adicional sin producto principal. Revisá el ticket."
      };
    }

    const parent = byId.get(line.parentClientLineId);
    if (!parent || parent.kind !== "customized") {
      return {
        ok: false,
        error: "Hay un adicional sin producto principal. Revisá el ticket."
      };
    }

    result.push({
      kind: "upsell",
      clientLineId: line.clientLineId,
      productId: line.productId,
      quantity: line.quantity,
      parentClientLineId: line.parentClientLineId
    });
  }

  return { ok: true, ticketLines: result };
}

/**
 * Structural normalize: enriched create lines → CheckoutCartPayload.
 * Does not load config or recompute prices (server validation does that).
 */
export function manualCreateTicketLinesToCheckoutCart(
  lines: ManualOrderCreateTicketLineInput[]
): ManualOrderCheckoutCartBuildResult {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "El pedido debe tener al menos un producto." };
  }

  const seenIds = new Set<string>();
  for (const line of lines) {
    const id = typeof line.clientLineId === "string" ? line.clientLineId.trim() : "";
    if (!id) {
      return { ok: false, error: "El pedido debe tener al menos un producto." };
    }
    if (seenIds.has(id)) {
      return { ok: false, error: "El ticket tiene líneas duplicadas. Revisá el pedido." };
    }
    seenIds.add(id);
  }

  const byId = new Map(lines.map((line) => [line.clientLineId.trim(), line]));
  const parents = lines.filter((line) => line.kind !== "upsell");
  const children = lines.filter((line) => line.kind === "upsell");

  for (const child of children) {
    const parentId =
      typeof child.parentClientLineId === "string"
        ? child.parentClientLineId.trim()
        : "";
    if (!parentId) {
      return {
        ok: false,
        error: "Hay un adicional sin producto principal. Revisá el ticket."
      };
    }
    const parent = byId.get(parentId);
    if (!parent || parent.kind !== "customized") {
      return {
        ok: false,
        error: "Hay un adicional sin producto principal. Revisá el ticket."
      };
    }
  }

  const legacyItems: CheckoutCartPayload["legacyItems"] = [];
  const customizedItems: CheckoutCartPayload["customizedItems"] = [];

  for (const line of parents) {
    const productId =
      typeof line.productId === "string" ? line.productId.trim() : "";
    const clientLineId =
      typeof line.clientLineId === "string" ? line.clientLineId.trim() : "";

    if (!productId || !clientLineId) {
      return { ok: false, error: "El pedido debe tener al menos un producto." };
    }

    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, error: "La cantidad debe ser mayor a cero." };
    }

    if (line.kind === "simple") {
      legacyItems.push({
        productId,
        quantity: line.quantity
      });
      continue;
    }

    if (
      !Array.isArray(line.selectedGroups) ||
      line.selectedGroups.length === 0 ||
      typeof line.configurationSignature !== "string" ||
      !line.configurationSignature.trim()
    ) {
      return {
        ok: false,
        error: "Este producto requiere configuración antes de crear el pedido."
      };
    }

    const upsellItems = children
      .filter((child) => child.parentClientLineId.trim() === clientLineId)
      .map((child) => ({
        cartLineId: child.clientLineId.trim(),
        productId: child.productId.trim(),
        quantity: child.quantity,
        parentCartLineId: clientLineId
      }));

    customizedItems.push({
      cartLineId: clientLineId,
      productId,
      quantity: line.quantity,
      configurationSignature: line.configurationSignature.trim(),
      selectedGroups: line.selectedGroups,
      upsellItems
    });
  }

  if (legacyItems.length === 0 && customizedItems.length === 0) {
    return { ok: false, error: "El pedido debe tener al menos un producto." };
  }

  return {
    ok: true,
    cart: {
      legacyItems,
      customizedItems
    }
  };
}

function toValidatedItems(
  lines: ManualOrderTicketLine[]
): { ok: true; rpcItems: ValidatedCreateOrderRpcItem[] } | { ok: false; error: string } {
  const byId = new Map(lines.map((line) => [line.clientLineId, line]));
  const parents = lines.filter((line) => line.kind !== "upsell");
  const children = lines.filter((line) => line.kind === "upsell");
  const rpcItems: ValidatedCreateOrderRpcItem[] = [];

  for (const line of parents) {
    if (line.kind === "simple") {
      rpcItems.push({
        client_line_id: line.clientLineId,
        product_id: line.productId,
        quantity: line.quantity,
        item_kind: "product",
        customization_snapshot: null
      });
      continue;
    }

    if (!line.customizationSnapshot) {
      return {
        ok: false,
        error: "Configured parent is missing customization_snapshot."
      };
    }

    rpcItems.push({
      client_line_id: line.clientLineId,
      product_id: line.productId,
      quantity: line.quantity,
      item_kind: "product",
      customization_snapshot: line.customizationSnapshot,
      unit_price: line.unitPrice
    });
  }

  for (const child of children) {
    if (!child.parentClientLineId) {
      return { ok: false, error: "Upsell child is missing parent_client_line_id." };
    }
    const parent = byId.get(child.parentClientLineId);
    if (!parent || parent.kind === "upsell") {
      return { ok: false, error: "Upsell child references a missing parent line." };
    }

    rpcItems.push({
      client_line_id: child.clientLineId,
      product_id: child.productId,
      quantity: child.quantity,
      item_kind: "upsell",
      parent_client_line_id: child.parentClientLineId,
      customization_snapshot: null
    });
  }

  if (rpcItems.length === 0) {
    return { ok: false, error: "Ticket is empty." };
  }

  return { ok: true, rpcItems };
}

/**
 * Mirror of public `toCreateOrderRpcJson` — keep in sync when that serializer changes.
 */
export function toManualOrderCreateOrderRpcJson(
  items: ValidatedCreateOrderRpcItem[]
): ManualOrderCreateOrderRpcJsonItem[] {
  return items.map((item) => {
    if (item.item_kind === "upsell") {
      return {
        client_line_id: item.client_line_id,
        product_id: item.product_id,
        quantity: item.quantity,
        item_kind: "upsell" as const,
        parent_client_line_id: item.parent_client_line_id
      };
    }

    const base: ManualOrderCreateOrderRpcJsonItem = {
      client_line_id: item.client_line_id,
      product_id: item.product_id,
      quantity: item.quantity,
      item_kind: "product"
    };

    if (item.customization_snapshot) {
      return {
        ...base,
        customization_snapshot: item.customization_snapshot,
        unit_price: item.unit_price
      };
    }

    return base;
  });
}

/**
 * Map already-built domain ticket lines to create_order `p_items`.
 * Preview/domain use only — server create must validate via
 * `validateCheckoutCartForCreateOrder` + `toCreateOrderRpcJson`.
 */
export function toManualOrderCreateOrderItems(
  lines: ManualOrderTicketLine[]
): ManualOrderCreateOrderItemsResult {
  const validated = toValidatedItems(lines);
  if (!validated.ok) {
    return validated;
  }

  return {
    ok: true,
    items: toManualOrderCreateOrderRpcJson(validated.rpcItems)
  };
}
