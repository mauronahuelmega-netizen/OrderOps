"use server";

import {
  CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE,
  shouldBlockCatalogPreviewOrder
} from "@/lib/admin/catalog-preview";
import {
  getScheduledDeliveryDateError,
  normalizeScheduledDeliveryRules
} from "@/lib/business/scheduled-delivery-rules";
import { getPublicBusinessBySlug } from "@/lib/business/public";
import type { CheckoutCartPayload } from "@/lib/product-customization/order-types";
import {
  toCreateOrderRpcJson,
  validateCheckoutCartForCreateOrder
} from "@/lib/product-customization/order-validation";
import { isBusinessAcceptingPublicOrders } from "@/lib/store-sessions/public.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parseArgentineMobilePhone } from "@/lib/checkout/argentine-phone";
import type { Json } from "@/types/database";

const ORDERS_CLOSED_MESSAGE = "El negocio no está aceptando pedidos en este momento.";

export type CreatePublicCheckoutOrderInput = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryMethod: "delivery" | "pickup";
  address?: string | null;
  notes?: string | null;
  /** Client-declared preview flag (defense-in-depth; cookie is primary). */
  isPreview?: boolean;
  /** @deprecated Prefer `cart`. Kept for transitional callers. */
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  cart?: CheckoutCartPayload;
};

export type CreatePublicCheckoutOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

function normalizeCartPayload(input: CreatePublicCheckoutOrderInput): CheckoutCartPayload {
  if (input.cart) {
    return {
      legacyItems: Array.isArray(input.cart.legacyItems) ? input.cart.legacyItems : [],
      customizedItems: Array.isArray(input.cart.customizedItems)
        ? input.cart.customizedItems
        : []
    };
  }

  return {
    legacyItems: Array.isArray(input.items) ? input.items : [],
    customizedItems: []
  };
}

export async function createPublicCheckoutOrderAction(
  slug: string,
  input: CreatePublicCheckoutOrderInput
): Promise<CreatePublicCheckoutOrderResult> {
  const normalizedSlug = slug.trim().toLowerCase();
  const cart = normalizeCartPayload(input);

  try {
    const business = await getPublicBusinessBySlug(normalizedSlug);

    if (!business) {
      return { ok: false, error: "No pudimos crear el pedido. Intentá nuevamente." };
    }

    const blockPreviewOrder = await shouldBlockCatalogPreviewOrder({
      businessId: business.id,
      clientDeclaredPreview: input.isPreview === true
    });

    if (blockPreviewOrder) {
      return { ok: false, error: CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE };
    }

    const acceptingOrders = await isBusinessAcceptingPublicOrders(business.id);

    if (!acceptingOrders) {
      return { ok: false, error: ORDERS_CLOSED_MESSAGE };
    }

    const customerName = input.customerName.trim();
    const parsedPhone = parseArgentineMobilePhone(input.phone);

    if (!customerName) {
      return { ok: false, error: "Ingresá tu nombre." };
    }

    if (!parsedPhone.ok) {
      return {
        ok: false,
        error:
          parsedPhone.reason === "empty"
            ? "Ingresá tu teléfono."
            : "Ingresá un número de celular argentino válido."
      };
    }
    const phone = parsedPhone.e164;

    if (input.deliveryMethod !== "delivery" && input.deliveryMethod !== "pickup") {
      return { ok: false, error: "Seleccioná un método de entrega válido." };
    }

    if (input.deliveryMethod === "delivery" && !(input.address ?? "").trim()) {
      return { ok: false, error: "Ingresá la dirección de entrega." };
    }

    const today = new Date().toISOString().slice(0, 10);
    const deliveryDate = business.scheduled_mode_active ? input.deliveryDate.trim() : today;

    if (business.scheduled_mode_active) {
      if (!deliveryDate) {
        return { ok: false, error: "Seleccioná una fecha de entrega." };
      }

      const scheduledRules = normalizeScheduledDeliveryRules({
        scheduled_min_lead_time_hours: business.scheduled_min_lead_time_hours,
        scheduled_max_days_in_advance: business.scheduled_max_days_in_advance,
        scheduled_cutoff_time: business.scheduled_cutoff_time,
        inactive_working_days: business.inactive_working_days
      });
      const deliveryDateError = getScheduledDeliveryDateError(deliveryDate, scheduledRules);

      if (deliveryDateError) {
        return { ok: false, error: deliveryDateError };
      }
    }

    const validated = await validateCheckoutCartForCreateOrder({
      businessId: business.id,
      cart
    });

    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }

    const rpcPayload = toCreateOrderRpcJson(validated.rpcItems);
    const rpcItemCount = rpcPayload.length;

    const supabase = createSupabaseServiceClient();
    const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
      p_business_id: business.id,
      p_customer_name: customerName,
      p_phone: phone,
      p_delivery_date: deliveryDate,
      p_delivery_method: input.deliveryMethod,
      p_address: input.deliveryMethod === "delivery" ? (input.address ?? "").trim() : null,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_items: rpcPayload as Json
    });

    if (rpcError) {
      console.error("[public-checkout:create-order:error]", {
        slug: normalizedSlug,
        itemCount: rpcItemCount,
        message: rpcError.message,
        code: rpcError.code,
        details: "details" in rpcError ? rpcError.details : undefined,
        hint: "hint" in rpcError ? rpcError.hint : undefined,
        status: "status" in rpcError ? rpcError.status : undefined
      });

      return { ok: false, error: mapCreateOrderRpcError(rpcError.message) };
    }

    if (typeof orderId !== "string" || !orderId) {
      return { ok: false, error: "No pudimos crear el pedido. Intentá nuevamente." };
    }

    return { ok: true, orderId };
  } catch (error) {
    console.error("[public-checkout:create-order:error]", {
      slug: normalizedSlug,
      itemCount:
        cart.legacyItems.length +
        cart.customizedItems.length +
        cart.customizedItems.reduce((sum, item) => sum + item.upsellItems.length, 0),
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined
    });

    return { ok: false, error: "No pudimos crear el pedido. Intentá nuevamente." };
  }
}

function mapCreateOrderRpcError(message: string): string {
  if (message.includes("on_demand_mode is not active")) {
    return ORDERS_CLOSED_MESSAGE;
  }

  if (message.includes("scheduled_mode is not active")) {
    return "Este negocio no acepta pedidos programados para fechas futuras.";
  }

  if (message.includes("delivery_date cannot be in the past")) {
    return "La fecha de entrega no puede ser anterior a hoy.";
  }

  if (message.includes("delivery_date falls on a non-operating day")) {
    return "Ese día el negocio no opera. Elegí otra fecha.";
  }

  if (message.includes("delivery_date does not meet minimum lead time")) {
    return "La fecha elegida no cumple el tiempo mínimo de anticipación.";
  }

  if (message.includes("delivery_date is past cutoff for next-day orders")) {
    return "Ya pasó la hora límite para pedidos del día siguiente.";
  }

  if (message.includes("delivery_date exceeds maximum advance window")) {
    return "La fecha elegida supera la ventana máxima de anticipación.";
  }

  if (message.includes("invalid, unavailable, or foreign-business products")) {
    return "El producto ya no está disponible.";
  }

  if (
    message.includes("INSUFFICIENT_STOCK") ||
    message.toLowerCase().includes("insufficient_stock")
  ) {
    return "Algunos productos ya no tienen stock suficiente. Revisá tu pedido antes de continuar.";
  }

  if (message.includes("upsell items require a valid parent")) {
    return "La configuración del producto cambió. Revisá el carrito.";
  }

  return "No pudimos crear el pedido. Intentá nuevamente.";
}
