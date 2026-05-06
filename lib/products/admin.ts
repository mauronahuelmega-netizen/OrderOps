import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  categories: {
    name: string;
  } | null;
};

export async function getAdminProducts(businessId: string): Promise<AdminProduct[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        price,
        description,
        category_id,
        image_url,
        is_available,
        created_at,
        categories (
          name
        )
      `
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    category_id: product.category_id,
    image_url: product.image_url,
    is_available: product.is_available,
    created_at: product.created_at,
    categories: Array.isArray(product.categories)
      ? (product.categories[0] ?? null)
      : (product.categories ?? null)
  })) as AdminProduct[];
}
