import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicCategory = {
  id: string;
  name: string;
  position: number | null;
};

export type PublicProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
};

export async function getPublicCatalogByBusinessId(businessId: string): Promise<{
  categories: PublicCategory[];
  products: PublicProduct[];
}> {
  noStore();

  const supabase = await createSupabaseServerClient();

  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, position")
        .eq("business_id", businessId)
        .order("position", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
      supabase
        .from("products")
        .select("id, category_id, name, description, price, image_url")
        .eq("business_id", businessId)
        .eq("is_available", true)
        .order("name", { ascending: true })
    ]);

  if (categoriesError) {
    throw new Error(`Failed to load categories: ${categoriesError.message}`);
  }

  if (productsError) {
    throw new Error(`Failed to load products: ${productsError.message}`);
  }

  return {
    categories: categories ?? [],
    products: products ?? []
  };
}
