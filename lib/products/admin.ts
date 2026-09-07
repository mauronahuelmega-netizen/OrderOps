import "server-only";

import { resolveManualOrderProductEligibilityMap } from "@/lib/orders/manual-order-customization-safety";
import type { ManualOrderProductOption } from "@/lib/orders/manual-order-types";
import { getPublicProductCustomizationConfig } from "@/lib/product-customization/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { ManualOrderProductOption };

export const ADMIN_PRODUCTS_PAGE_SIZE = 24;

export type AdminProductListItem = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  sku: string | null;
  stock: number;
};

export type AdminProduct = AdminProductListItem & {
  description: string | null;
  created_at: string;
  track_stock: boolean;
  categories: {
    name: string;
  } | null;
};

export type AdminProductsPageResult = {
  products: AdminProductListItem[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export type AdminProductsOptions = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  stock?: string;
  status?: string;
};

function normalizeCategoryRelation(
  categories: AdminProduct["categories"] | AdminProduct["categories"][] | null | undefined
): AdminProduct["categories"] {
  if (Array.isArray(categories)) {
    return categories[0] ?? null;
  }

  return categories ?? null;
}

export function normalizeAdminProductsPage(page?: number): number {
  if (typeof page !== "number" || !Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export function normalizeAdminProductsLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 1) {
    return ADMIN_PRODUCTS_PAGE_SIZE;
  }

  return Math.min(Math.floor(limit), 100);
}

export function parseAdminProductsPageParam(raw: string | undefined): number {
  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);
  return normalizeAdminProductsPage(parsed);
}

export async function getAdminProducts(
  businessId: string,
  options: AdminProductsOptions = {}
): Promise<AdminProductsPageResult> {
  const page = normalizeAdminProductsPage(options.page);
  const limit = normalizeAdminProductsLimit(options.limit);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const q = options.q?.trim();
  const { categoryId, stock, status } = options;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select("id, name, price, category_id, image_url, is_available, sku, stock", { count: "exact" })
    .eq("business_id", businessId);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (stock === "out") {
    query = query.lte("stock", 0);
  } else if (stock === "low") {
    query = query.gt("stock", 0).lte("stock", 5);
  } else if (stock === "in") {
    query = query.gt("stock", 0);
  }

  if (status === "active") {
    query = query.eq("is_available", true);
  } else if (status === "inactive") {
    query = query.eq("is_available", false);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / limit);

  return {
    products: (data ?? []) as AdminProductListItem[],
    page,
    limit,
    totalCount,
    totalPages
  };
}

export async function getManualOrderProductOptions(
  businessId: string
): Promise<ManualOrderProductOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        price,
        is_available,
        categories (
          name
        )
      `
    )
    .eq("business_id", businessId)
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load manual order products: ${error.message}`);
  }

  const rows = data ?? [];
  const eligibilityById = await resolveManualOrderProductEligibilityMap(
    businessId,
    rows.map((row) => row.id)
  );

  const configurableProductIds = rows
    .filter((row) => !(eligibilityById.get(row.id)?.isManualOrderAvailable ?? true))
    .map((row) => row.id);

  const customizationConfigEntries = await Promise.all(
    configurableProductIds.map(async (productId) => {
      const config = await getPublicProductCustomizationConfig({
        businessId,
        productId
      });
      return [productId, config] as const;
    })
  );
  const customizationConfigById = new Map(customizationConfigEntries);

  return rows.map((row) => {
    const eligibility = eligibilityById.get(row.id) ?? {
      isManualOrderAvailable: true,
      manualOrderUnavailableReason: null
    };
    const publicConfig = customizationConfigById.get(row.id) ?? null;

    return {
      id: row.id,
      name: row.name,
      price: row.price,
      categoryName: normalizeCategoryRelation(row.categories)?.name ?? null,
      isAvailable: row.is_available,
      isManualOrderAvailable: eligibility.isManualOrderAvailable,
      manualOrderUnavailableReason: eligibility.manualOrderUnavailableReason,
      customizationConfig:
        publicConfig && !eligibility.isManualOrderAvailable
          ? {
              productId: publicConfig.productId,
              productName: publicConfig.productName,
              productPrice: publicConfig.productPrice,
              groups: publicConfig.groups,
              upsellGroup: publicConfig.upsellGroup
            }
          : null
    };
  });
}

export async function getAdminProductById(
  businessId: string,
  productId: string
): Promise<AdminProduct | null> {
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
        sku,
        stock,
        track_stock,
        created_at,
        categories (
          name
        )
      `
    )
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    description: data.description,
    category_id: data.category_id,
    image_url: data.image_url,
    is_available: data.is_available,
    sku: data.sku,
    stock: data.stock,
    track_stock: data.track_stock,
    created_at: data.created_at,
    categories: normalizeCategoryRelation(data.categories)
  };
}
