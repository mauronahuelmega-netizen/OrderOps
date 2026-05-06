import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminOrderListItem = {
  id: string;
  customer_name: string;
  phone: string;
  delivery_date: string;
  delivery_method: "delivery" | "pickup";
  address: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  total_price: number;
  notes: string | null;
};

export type AdminOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  description: string | null;
  image_url: string | null;
};

export type AdminOrderDetail = AdminOrderListItem & {
  order_items: AdminOrderItem[];
};

export async function getAdminOrders(businessId: string): Promise<AdminOrderListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, phone, delivery_date, delivery_method, address, status, total_price, notes"
    )
    .eq("business_id", businessId)
    .order("delivery_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (data ?? []) as AdminOrderListItem[];
}

export async function getAdminOrderById(
  orderId: string,
  businessId: string
): Promise<AdminOrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_name,
        phone,
        delivery_date,
        delivery_method,
        address,
        status,
        total_price,
        notes,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          products (
            image_url,
            description
          )
        )
      `
    )
    .eq("id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminOrderListItem),
    order_items: normalizeOrderItems(data.order_items)
  };
}

type RawOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  products?:
    | {
        image_url?: string | null;
        description?: string | null;
      }
    | Array<{
        image_url?: string | null;
        description?: string | null;
      }>
    | null;
};

function normalizeOrderItems(items: RawOrderItem[] | null | undefined): AdminOrderItem[] {
  if (!items) {
    return [];
  }

  return items.map((item) => {
    const relatedProduct = Array.isArray(item.products)
      ? item.products[0] ?? null
      : item.products ?? null;

    return {
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      image_url: relatedProduct?.image_url ?? null,
      description: relatedProduct?.description ?? null
    };
  });
}
