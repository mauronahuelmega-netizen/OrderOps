"use server";

import { logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import {
  getAdminDashboardOrderById,
  type AdminOrderDashboardItem
} from "@/lib/orders/admin";
import { manualCreateTicketLinesToCheckoutCart } from "@/lib/orders/manual-order-customization-payload";
import { resolveManualOrderProductEligibilityMap } from "@/lib/orders/manual-order-customization-safety";
import type {
  ManualOrderCreateTicketLineInput,
  ManualOrderProductOption
} from "@/lib/orders/manual-order-types";
import { getManualOrderProductOptions } from "@/lib/products/admin";
import {
  toCreateOrderRpcJson,
  validateCheckoutCartForCreateOrder
} from "@/lib/product-customization/order-validation";
import { assertActiveStoreSessionForOrderCreation } from "@/lib/store-sessions/admin";
import type { OrderCreationErrorCode } from "@/lib/store-sessions/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type CreateManualOrderInput = {
  customerName: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup";
  address?: string;
  notes?: string;
  /** Legacy simple-only path (still supported). */
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  /** Enriched ticket lines (simple / customized / upsell). Preferred when present. */
  ticketLines?: ManualOrderCreateTicketLineInput[];
};

export type CreateManualOrderActionResult =
  | { ok: true; order: AdminOrderDashboardItem }
  | { ok: false; error: string; code?: OrderCreationErrorCode };

type ValidatedCreateManualOrderCustomer = {
  customerName: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup";
  address: string | null;
  notes: string | null;
};

type ValidatedCreateManualOrderInput =
  | (ValidatedCreateManualOrderCustomer & {
      mode: "legacy";
      items: Array<{ productId: string; quantity: number }>;
    })
  | (ValidatedCreateManualOrderCustomer & {
      mode: "enriched";
      ticketLines: ManualOrderCreateTicketLineInput[];
    });

type CreateManualOrderValidationResult =
  | { ok: true; data: ValidatedCreateManualOrderInput }
  | { ok: false; message: string };

function getOperationalDeliveryDate() {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function mapManualCheckoutValidationError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("adicional") ||
    normalized.includes("plus seleccionado") ||
    normalized.includes("producto principal")
  ) {
    return "Hay un adicional sin producto principal. Revisá el ticket.";
  }

  if (
    normalized.includes("configuración del producto cambió") ||
    normalized.includes("ya no está disponible") ||
    normalized.includes("falta elegir") ||
    normalized.includes("más opciones")
  ) {
    return "La configuración del producto está incompleta o ya no está disponible.";
  }

  if (normalized.includes("carrito")) {
    return "La configuración del producto está incompleta o ya no está disponible.";
  }

  return message;
}

function validateCreateManualOrderInput(
  input: CreateManualOrderInput
): CreateManualOrderValidationResult {
  if (!isNonEmptyTrimmedString(input.customerName)) {
    return { ok: false, message: "El nombre del cliente es obligatorio." };
  }

  if (!isNonEmptyTrimmedString(input.phone)) {
    return { ok: false, message: "El tel\u00e9fono es obligatorio." };
  }

  if (input.deliveryMethod !== "delivery" && input.deliveryMethod !== "pickup") {
    return { ok: false, message: "Seleccion\u00e1 un m\u00e9todo de entrega v\u00e1lido." };
  }

  if (input.deliveryMethod === "delivery" && !isNonEmptyTrimmedString(input.address)) {
    return { ok: false, message: "La direcci\u00f3n es obligatoria para delivery." };
  }

  const customer: ValidatedCreateManualOrderCustomer = {
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    deliveryMethod: input.deliveryMethod,
    address:
      input.deliveryMethod === "delivery" ? (input.address ?? "").trim() : null,
    notes: isNonEmptyTrimmedString(input.notes) ? input.notes.trim() : null
  };

  const hasTicketLines =
    Array.isArray(input.ticketLines) && input.ticketLines.length > 0;

  if (hasTicketLines) {
    const ticketLines: ManualOrderCreateTicketLineInput[] = [];

    for (const line of input.ticketLines ?? []) {
      if (
        !line ||
        (line.kind !== "simple" &&
          line.kind !== "customized" &&
          line.kind !== "upsell")
      ) {
        return { ok: false, message: "El pedido debe tener al menos un producto." };
      }

      if (!isNonEmptyTrimmedString(line.clientLineId)) {
        return { ok: false, message: "El pedido debe tener al menos un producto." };
      }

      if (!isNonEmptyTrimmedString(line.productId)) {
        return { ok: false, message: "El pedido debe tener al menos un producto." };
      }

      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        return { ok: false, message: "La cantidad debe ser mayor a cero." };
      }

      if (line.kind === "simple") {
        ticketLines.push({
          kind: "simple",
          clientLineId: line.clientLineId.trim(),
          productId: line.productId.trim(),
          quantity: line.quantity
        });
        continue;
      }

      if (line.kind === "upsell") {
        if (!isNonEmptyTrimmedString(line.parentClientLineId)) {
          return {
            ok: false,
            message: "Hay un adicional sin producto principal. Revisá el ticket."
          };
        }

        ticketLines.push({
          kind: "upsell",
          clientLineId: line.clientLineId.trim(),
          productId: line.productId.trim(),
          quantity: line.quantity,
          parentClientLineId: line.parentClientLineId.trim()
        });
        continue;
      }

      if (
        !Array.isArray(line.selectedGroups) ||
        line.selectedGroups.length === 0 ||
        !isNonEmptyTrimmedString(line.configurationSignature)
      ) {
        return {
          ok: false,
          message: "Este producto requiere configuración antes de crear el pedido."
        };
      }

      ticketLines.push({
        kind: "customized",
        clientLineId: line.clientLineId.trim(),
        productId: line.productId.trim(),
        quantity: line.quantity,
        selectedGroups: line.selectedGroups,
        configurationSignature: line.configurationSignature.trim()
      });
    }

    return {
      ok: true,
      data: {
        ...customer,
        mode: "enriched",
        ticketLines
      }
    };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, message: "El pedido debe tener al menos un producto." };
  }

  const validatedItems: Array<{ productId: string; quantity: number }> = [];

  for (const item of input.items) {
    if (!isNonEmptyTrimmedString(item.productId)) {
      return { ok: false, message: "El pedido debe tener al menos un producto." };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, message: "La cantidad debe ser mayor a cero." };
    }

    validatedItems.push({
      productId: item.productId.trim(),
      quantity: item.quantity
    });
  }

  return {
    ok: true,
    data: {
      ...customer,
      mode: "legacy",
      items: validatedItems
    }
  };
}

function mapCreateOrderRpcError(error: unknown): {
  code: OrderCreationErrorCode;
  error: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("on_demand_mode is not active")) {
    return {
      code: "NO_ACTIVE_SESSION",
      error: "No hay una sesi\u00f3n activa. Abr\u00ed una nueva sesi\u00f3n para crear pedidos."
    };
  }

  if (
    normalizedMessage.includes("items contain invalid, unavailable, or foreign-business products")
  ) {
    return {
      code: "PRODUCT_UNAVAILABLE",
      error: "Uno o m\u00e1s productos no est\u00e1n disponibles. Revis\u00e1 el pedido e intent\u00e1 nuevamente."
    };
  }

  if (normalizedMessage.includes("insufficient_stock")) {
    return {
      code: "PRODUCT_UNAVAILABLE",
      error:
        "Algunos productos ya no tienen stock suficiente. Revis\u00e1 tu pedido antes de continuar."
    };
  }

  if (normalizedMessage.includes("each item must include product_id and quantity > 0")) {
    return {
      code: "VALIDATION_ERROR",
      error: "La cantidad debe ser mayor a cero."
    };
  }

  if (normalizedMessage.includes("scheduled_mode is not active")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "Este negocio no acepta pedidos programados para fechas futuras."
    };
  }

  if (normalizedMessage.includes("delivery_date cannot be in the past")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "La fecha de entrega no puede ser anterior a hoy."
    };
  }

  if (normalizedMessage.includes("delivery_date falls on a non-operating day")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "Ese d\u00eda el negocio no opera. Eleg\u00ed otra fecha."
    };
  }

  if (normalizedMessage.includes("delivery_date does not meet minimum lead time")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "La fecha elegida no cumple el tiempo m\u00ednimo de anticipaci\u00f3n."
    };
  }

  if (normalizedMessage.includes("delivery_date is past cutoff for next-day orders")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "Ya pas\u00f3 la hora l\u00edmite para pedidos del d\u00eda siguiente."
    };
  }

  if (normalizedMessage.includes("delivery_date exceeds maximum advance window")) {
    return {
      code: "ORDER_CREATE_FAILED",
      error: "La fecha elegida supera la ventana m\u00e1xima de anticipaci\u00f3n."
    };
  }

  return {
    code: "ORDER_CREATE_FAILED",
    error: "No se pudo crear el pedido. Revis\u00e1 los datos e intent\u00e1 nuevamente."
  };
}

async function rejectBareCustomizableProducts(params: {
  businessId: string;
  productIds: string[];
}): Promise<CreateManualOrderActionResult | null> {
  const uniqueIds = [...new Set(params.productIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return null;
  }

  const eligibilityById = await resolveManualOrderProductEligibilityMap(
    params.businessId,
    uniqueIds
  );

  const blockedProductIds = [
    ...new Set(
      uniqueIds.filter((productId) => {
        const eligibility = eligibilityById.get(productId);
        return eligibility ? !eligibility.isManualOrderAvailable : false;
      })
    )
  ];

  if (blockedProductIds.length === 0) {
    return null;
  }

  const supabaseNames = await createSupabaseServerClient();
  const { data: blockedRows } = await supabaseNames
    .from("products")
    .select("id, name")
    .eq("business_id", params.businessId)
    .in("id", blockedProductIds);

  const named = (blockedRows ?? [])
    .map((row) => row.name)
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
    .slice(0, 3);

  const error =
    named.length === 1
      ? `\u201c${named[0]}\u201d requiere configuraci\u00f3n antes de crear el pedido.`
      : named.length > 1
        ? `Algunos productos requieren configuraci\u00f3n antes de crear el pedido (${named.join(", ")}).`
        : "Este producto requiere configuraci\u00f3n antes de crear el pedido.";

  return {
    ok: false,
    code: "VALIDATION_ERROR",
    error
  };
}

export type GetManualOrderProductOptionsResult =
  | { ok: true; products: ManualOrderProductOption[] }
  | { ok: false; error: string };

export async function getManualOrderProductOptionsAction(): Promise<GetManualOrderProductOptionsResult> {
  try {
    const adminContext = await requireAdminPermission("updateOrders");
    const products = await getManualOrderProductOptions(adminContext.businessId);

    return { ok: true, products };
  } catch (error) {
    logActionFailure("orders.getManualOrderProductOptions", error);

    return {
      ok: false,
      error: "No pudimos cargar los productos disponibles."
    };
  }
}

export async function createManualOrderAction(
  input: CreateManualOrderInput
): Promise<CreateManualOrderActionResult> {
  try {
    const adminContext = await requireAdminPermission("updateOrders");
    const validation = validateCreateManualOrderInput(input);

    if (!validation.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        error: validation.message
      };
    }

    const sessionGuard = await assertActiveStoreSessionForOrderCreation({
      businessId: adminContext.businessId
    });

    if (!sessionGuard.ok) {
      return {
        ok: false,
        code: sessionGuard.reason,
        error: sessionGuard.message
      };
    }

    let pItems: Json;

    if (validation.data.mode === "legacy") {
      // Legacy simple path: still reject any customizable product sent bare.
      const bareReject = await rejectBareCustomizableProducts({
        businessId: adminContext.businessId,
        productIds: validation.data.items.map((item) => item.productId)
      });
      if (bareReject) {
        return bareReject;
      }

      pItems = validation.data.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity
      }));
    } else {
      const cartBuild = manualCreateTicketLinesToCheckoutCart(validation.data.ticketLines);
      if (!cartBuild.ok) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          error: cartBuild.error
        };
      }

      // Bare customizable must not enter create_order as legacy simple lines.
      const bareReject = await rejectBareCustomizableProducts({
        businessId: adminContext.businessId,
        productIds: cartBuild.cart.legacyItems.map((item) => item.productId)
      });
      if (bareReject) {
        return bareReject;
      }

      const validatedCart = await validateCheckoutCartForCreateOrder({
        businessId: adminContext.businessId,
        cart: cartBuild.cart
      });

      if (!validatedCart.ok) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          error: mapManualCheckoutValidationError(validatedCart.error)
        };
      }

      pItems = toCreateOrderRpcJson(validatedCart.rpcItems) as Json;
    }

    const supabase = await createSupabaseServerClient();
    const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
      p_business_id: adminContext.businessId,
      p_customer_name: validation.data.customerName,
      p_phone: validation.data.phone,
      p_delivery_date: getOperationalDeliveryDate(),
      p_delivery_method: validation.data.deliveryMethod,
      p_address: validation.data.address,
      p_notes: validation.data.notes,
      p_items: pItems
    });

    if (rpcError) {
      logActionFailure("orders.createManualOrder.rpc", rpcError, {
        businessId: adminContext.businessId
      });

      const mapped = mapCreateOrderRpcError(rpcError);

      return {
        ok: false,
        code: mapped.code,
        error: mapped.error
      };
    }

    if (typeof orderId !== "string" || !orderId) {
      return {
        ok: false,
        code: "ORDER_CREATE_FAILED",
        error: "No se pudo crear el pedido. Revis\u00e1 los datos e intent\u00e1 nuevamente."
      };
    }

    const order = await getAdminDashboardOrderById(orderId, adminContext.businessId);

    if (!order) {
      return {
        ok: false,
        code: "ORDER_CREATE_FAILED",
        error: "No se pudo crear el pedido. Revis\u00e1 los datos e intent\u00e1 nuevamente."
      };
    }

    return { ok: true, order };
  } catch (error) {
    logActionFailure("orders.createManualOrder", error);

    return {
      ok: false,
      code: "UNKNOWN",
      error: "Ocurri\u00f3 un error inesperado. Por favor, intent\u00e1 de nuevo."
    };
  }
}
