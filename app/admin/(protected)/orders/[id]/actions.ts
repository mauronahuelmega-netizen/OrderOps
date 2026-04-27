"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";
type ActionState = {
  error?: string;
  success?: boolean;
};

export async function updateOrderStatusAction(
  _prevState: ActionState,
  formData: FormData
) {
  const orderIdValue = formData.get("order_id");
  const statusValue = formData.get("status");

  const orderId = typeof orderIdValue === "string" ? orderIdValue : "";
  const status = typeof statusValue === "string" ? statusValue : "";

  if (!orderId) {
    return { error: "Falta el identificador del pedido." };
  }

  if (!["pending", "in_progress", "completed", "cancelled"].includes(status)) {
    return { error: "Estado invalido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: status as OrderStatus })
    .eq("id", orderId);

  if (error) {
    return { error: error.message || "No pudimos actualizar el estado." };
  }

  return { success: true };
}
