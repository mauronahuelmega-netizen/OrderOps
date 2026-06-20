"use server";

import {
  getScheduledDeliveryDateError,
  normalizeScheduledDeliveryRules
} from "@/lib/business/scheduled-delivery-rules";
import { getPublicBusinessBySlug } from "@/lib/business/public";
import { isBusinessAcceptingPublicOrders } from "@/lib/store-sessions/public.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ORDERS_CLOSED_MESSAGE = "El negocio no está aceptando pedidos en este momento.";

export type CreatePublicCheckoutOrderInput = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryMethod: "delivery" | "pickup";
  address?: string | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type CreatePublicCheckoutOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createPublicCheckoutOrderAction(
  slug: string,
  input: CreatePublicCheckoutOrderInput
): Promise<CreatePublicCheckoutOrderResult> {
  const normalizedSlug = slug.trim().toLowerCase();

  try {
    const business = await getPublicBusinessBySlug(normalizedSlug);

    if (!business) {
      return { ok: false, error: "No pudimos crear el pedido. Intentá nuevamente." };
    }

    const acceptingOrders = await isBusinessAcceptingPublicOrders(business.id);

    if (!acceptingOrders) {
      return { ok: false, error: ORDERS_CLOSED_MESSAGE };
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      return { ok: false, error: "Tu carrito está vacío." };
    }

    const customerName = input.customerName.trim();
    const phone = input.phone.trim();

    if (!customerName) {
      return { ok: false, error: "Ingresá tu nombre." };
    }

    if (!phone) {
      return { ok: false, error: "Ingresá tu teléfono." };
    }

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

    const validatedItems: Array<{ product_id: string; quantity: number }> = [];

    for (const item of input.items) {
      const productId = item.productId.trim();

      if (!productId) {
        return { ok: false, error: "Tu carrito está vacío." };
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return { ok: false, error: "La cantidad debe ser mayor a cero." };
      }

      validatedItems.push({
        product_id: productId,
        quantity: item.quantity
      });
    }

    const supabase = createSupabaseServiceClient();
    const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
      p_business_id: business.id,
      p_customer_name: customerName,
      p_phone: phone,
      p_delivery_date: deliveryDate,
      p_delivery_method: input.deliveryMethod,
      p_address: input.deliveryMethod === "delivery" ? (input.address ?? "").trim() : null,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_items: validatedItems
    });

    if (rpcError) {
      console.error("[public-checkout:create-order:error]", {
        slug: normalizedSlug,
        itemCount: validatedItems.length,
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
      itemCount: Array.isArray(input.items) ? input.items.length : 0,
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

  return "No pudimos crear el pedido. Intentá nuevamente.";
}
