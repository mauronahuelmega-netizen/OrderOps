import "server-only";

import {
  buildCartConfigurationSignature,
  selectedGroupsToSignatureInput
} from "@/lib/cart/signature";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";
import {
  buildCustomizationSnapshotV1,
  buildSelectedGroupsFromConfig
} from "@/lib/product-customization/order-snapshot";
import type {
  CheckoutCartPayload,
  ValidatedCreateOrderRpcItem
} from "@/lib/product-customization/order-types";
import { getPublicProductCustomizationConfig } from "@/lib/product-customization/public";
import { validateCustomizationSelection } from "@/lib/product-customization/public-shared";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const MAX_LINE_QUANTITY = 99;

export type ValidateCheckoutCartResult =
  | { ok: true; rpcItems: ValidatedCreateOrderRpcItem[] }
  | { ok: false; error: string };

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function validateCheckoutCartForCreateOrder(params: {
  businessId: string;
  cart: CheckoutCartPayload;
}): Promise<ValidateCheckoutCartResult> {
  const legacyItems = Array.isArray(params.cart.legacyItems)
    ? params.cart.legacyItems
    : [];
  const customizedItems = Array.isArray(params.cart.customizedItems)
    ? params.cart.customizedItems
    : [];

  if (legacyItems.length === 0 && customizedItems.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  if (customizedItems.length > 0) {
    const enabled = await isProductCustomizationEnabled(params.businessId);
    if (!enabled) {
      return {
        ok: false,
        error: "Los opcionales no están habilitados para este negocio."
      };
    }
  }

  const supabase = createSupabaseServiceClient();
  const rpcItems: ValidatedCreateOrderRpcItem[] = [];

  // --- Legacy items ---
  for (const item of legacyItems) {
    const productId = typeof item.productId === "string" ? item.productId.trim() : "";
    if (!productId) {
      return { ok: false, error: "Tu carrito está vacío." };
    }

    if (!isPositiveInt(item.quantity) || item.quantity > MAX_LINE_QUANTITY) {
      return { ok: false, error: "La cantidad debe ser mayor a cero." };
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, price, is_available, business_id")
      .eq("id", productId)
      .eq("business_id", params.businessId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: "No pudimos crear el pedido. Intentá nuevamente." };
    }

    if (!product || !product.is_available) {
      return { ok: false, error: "El producto ya no está disponible." };
    }

    rpcItems.push({
      client_line_id: `legacy:${productId}`,
      product_id: product.id,
      quantity: item.quantity,
      item_kind: "product",
      customization_snapshot: null
    });
  }

  // --- Customized parents + upsells ---
  for (const item of customizedItems) {
    const productId = typeof item.productId === "string" ? item.productId.trim() : "";
    const cartLineId =
      typeof item.cartLineId === "string" ? item.cartLineId.trim() : "";

    if (!productId || !cartLineId) {
      return { ok: false, error: "La configuración del producto cambió. Revisá el carrito." };
    }

    if (!isPositiveInt(item.quantity) || item.quantity > MAX_LINE_QUANTITY) {
      return { ok: false, error: "La cantidad debe ser mayor a cero." };
    }

    const config = await getPublicProductCustomizationConfig({
      businessId: params.businessId,
      productId
    });

    if (!config) {
      return { ok: false, error: "El producto ya no está disponible." };
    }

    const selectedOptionsByGroupId: Record<string, string[]> = {};
    for (const group of item.selectedGroups ?? []) {
      if (!group || typeof group.groupId !== "string") {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }
      const optionIds = Array.isArray(group.selectedOptionIds)
        ? group.selectedOptionIds.filter((id): id is string => typeof id === "string")
        : [];
      selectedOptionsByGroupId[group.groupId] = [...new Set(optionIds)];
    }

    // Reject unknown groups from client.
    const applicableGroupIds = new Set(config.groups.map((group) => group.id));
    for (const groupId of Object.keys(selectedOptionsByGroupId)) {
      if (!applicableGroupIds.has(groupId)) {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }
    }

    const validation = validateCustomizationSelection(
      config.groups,
      selectedOptionsByGroupId
    );

    if (!validation.valid) {
      const firstIssue = validation.issues[0];
      if (firstIssue?.message.includes("no tiene opciones")) {
        return { ok: false, error: firstIssue.message };
      }
      if (firstIssue?.message.includes("hasta")) {
        return { ok: false, error: "Seleccionaste más opciones de las permitidas." };
      }
      return {
        ok: false,
        error: firstIssue?.message ?? "Falta elegir una opción requerida."
      };
    }

    const selectedGroups = buildSelectedGroupsFromConfig(
      config.groups,
      selectedOptionsByGroupId
    );

    const customizationTotal = selectedGroups.reduce(
      (sum, group) =>
        sum +
        group.selectedOptions.reduce(
          (optionSum, option) => optionSum + option.priceDelta,
          0
        ),
      0
    );

    const baseUnitPrice = config.productPrice;
    const finalUnitPrice = baseUnitPrice + customizationTotal;

    const upsellPayload = Array.isArray(item.upsellItems) ? item.upsellItems : [];
    const allowedUpsellIds = new Set(
      (config.upsellGroup?.products ?? []).map((product) => product.id)
    );

    const normalizedUpsells: Array<{
      cartLineId: string;
      productId: string;
      quantity: number;
    }> = [];

    for (const upsell of upsellPayload) {
      const upsellProductId =
        typeof upsell.productId === "string" ? upsell.productId.trim() : "";
      const upsellLineId =
        typeof upsell.cartLineId === "string" ? upsell.cartLineId.trim() : "";
      const parentId =
        typeof upsell.parentCartLineId === "string"
          ? upsell.parentCartLineId.trim()
          : "";

      if (!upsellProductId || !upsellLineId) {
        return { ok: false, error: "El plus seleccionado ya no está disponible." };
      }

      if (parentId !== cartLineId) {
        return {
          ok: false,
          error: "La configuración del producto cambió. Revisá el carrito."
        };
      }

      if (upsellProductId === productId) {
        return { ok: false, error: "El plus seleccionado ya no está disponible." };
      }

      if (!allowedUpsellIds.has(upsellProductId)) {
        return { ok: false, error: "El plus seleccionado ya no está disponible." };
      }

      // CART-1 rule: upsell qty synced to parent (normalize server-side).
      normalizedUpsells.push({
        cartLineId: upsellLineId,
        productId: upsellProductId,
        quantity: item.quantity
      });
    }

    // Deduplicate upsell product ids.
    const seenUpsellProducts = new Set<string>();
    const uniqueUpsells = [];
    for (const upsell of normalizedUpsells) {
      if (seenUpsellProducts.has(upsell.productId)) {
        continue;
      }
      seenUpsellProducts.add(upsell.productId);
      uniqueUpsells.push(upsell);
    }

    const serverSignature = buildCartConfigurationSignature({
      productId,
      selectedGroups: selectedGroupsToSignatureInput(selectedGroups),
      upsellProductIds: uniqueUpsells.map((upsell) => upsell.productId)
    });

    const clientSignature =
      typeof item.configurationSignature === "string"
        ? item.configurationSignature.trim()
        : "";

    if (!clientSignature || clientSignature !== serverSignature) {
      return {
        ok: false,
        error: "La configuración del producto cambió. Revisá el carrito."
      };
    }

    const snapshot = buildCustomizationSnapshotV1({
      configurationSignature: serverSignature,
      productId: config.productId,
      productName: config.productName,
      baseUnitPrice,
      customizationTotal,
      finalUnitPrice,
      selectedGroups
    });

    rpcItems.push({
      client_line_id: cartLineId,
      product_id: config.productId,
      quantity: item.quantity,
      item_kind: "product",
      customization_snapshot: snapshot,
      unit_price: finalUnitPrice
    });

    for (const upsell of uniqueUpsells) {
      rpcItems.push({
        client_line_id: upsell.cartLineId,
        product_id: upsell.productId,
        quantity: upsell.quantity,
        item_kind: "upsell",
        parent_client_line_id: cartLineId,
        customization_snapshot: null
      });
    }
  }

  if (rpcItems.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  return { ok: true, rpcItems };
}

export function toCreateOrderRpcJson(items: ValidatedCreateOrderRpcItem[]) {
  return items.map((item) => {
    if (item.item_kind === "upsell") {
      return {
        client_line_id: item.client_line_id,
        product_id: item.product_id,
        quantity: item.quantity,
        item_kind: "upsell",
        parent_client_line_id: item.parent_client_line_id
      };
    }

    const base: Record<string, unknown> = {
      client_line_id: item.client_line_id,
      product_id: item.product_id,
      quantity: item.quantity,
      item_kind: "product"
    };

    if (item.customization_snapshot) {
      base.customization_snapshot = item.customization_snapshot;
      base.unit_price = item.unit_price;
    }

    return base;
  });
}
