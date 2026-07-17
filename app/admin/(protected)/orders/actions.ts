"use server";

import { logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import {
  getAdminDashboardOrderById,
  type AdminOrderDashboardItem
} from "@/lib/orders/admin";
import type { ManualOrderProductOption } from "@/lib/orders/manual-order-types";
import { getManualOrderProductOptions } from "@/lib/products/admin";
import { assertActiveStoreSessionForOrderCreation } from "@/lib/store-sessions/admin";
import type { OrderCreationErrorCode } from "@/lib/store-sessions/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateManualOrderInput = {
  customerName: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup";
  address?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type CreateManualOrderActionResult =
  | { ok: true; order: AdminOrderDashboardItem }
  | { ok: false; error: string; code?: OrderCreationErrorCode };

type ValidatedCreateManualOrderInput = {
  customerName: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup";
  address: string | null;
  notes: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

type CreateManualOrderValidationResult =
  | { ok: true; data: ValidatedCreateManualOrderInput }
  | { ok: false; message: string };

function getOperationalDeliveryDate() {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, message: "El pedido debe tener al menos un producto." };
  }

  const validatedItems: ValidatedCreateManualOrderInput["items"] = [];

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
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      deliveryMethod: input.deliveryMethod,
      address:
        input.deliveryMethod === "delivery" ? (input.address ?? "").trim() : null,
      notes: isNonEmptyTrimmedString(input.notes) ? input.notes.trim() : null,
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

    const supabase = await createSupabaseServerClient();
    const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
      p_business_id: adminContext.businessId,
      p_customer_name: validation.data.customerName,
      p_phone: validation.data.phone,
      p_delivery_date: getOperationalDeliveryDate(),
      p_delivery_method: validation.data.deliveryMethod,
      p_address: validation.data.address,
      p_notes: validation.data.notes,
      p_items: validation.data.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity
      }))
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
