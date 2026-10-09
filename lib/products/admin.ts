import "server-only";

import { resolveManualOrderProductEligibilityMap } from "@/lib/orders/manual-order-customization-safety";
import type { ManualOrderProductOption } from "@/lib/orders/manual-order-types";
import { getPublicProductCustomizationConfig } from "@/lib/product-customization/public";
import {
  type AdminProduct,
  type AdminProductListItem,
  isProductArchived
} from "@/lib/products/admin-product-types";
import { buildAdminProductsSearchFilter } from "@/lib/products/products-list-contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { ManualOrderProductOption, AdminProduct, AdminProductListItem };
export { isProductArchived };

export const ADMIN_PRODUCTS_PAGE_SIZE = 24;

export type AdminProductsPageResult = {
  products: AdminProductListItem[];
  page: number;
  limit: number;
  /**
   * Rows matching the active filters (`q`/`categoryId`/`stock`/`status`) — the filtered
   * result size. Never a catalog-existence signal; use `getAdminProductsCatalogCount`.
   */
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
    .select(
      "id, name, price, category_id, image_url, is_available, sku, stock, track_stock, archived_at",
      {
        count: "exact"
      }
    )
    .eq("business_id", businessId);

  if (q) {
    query = query.or(buildAdminProductsSearchFilter(q));
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

  // Lifecycle axis (orthogonal to merchandising availability):
  // - default / active / inactive → non-archived only
  // - archived → archived only
  if (status === "archived") {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
    if (status === "active") {
      query = query.eq("is_available", true);
    } else if (status === "inactive") {
      query = query.eq("is_available", false);
    }
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

/**
 * Total products owned by the tenant, ignoring list filters INCLUDING archived rows.
 * Catalog existence signal for first-run Create auto-open (must include archived).
 *
 * Count-only (`head: true`) — no rows are transferred.
 */
export async function getAdminProductsCatalogCount(businessId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) {
    throw new Error(`Failed to load catalog product count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Non-archived products owned by the tenant (ignores availability / search filters).
 * Distinguishes "only archived remain" from true first-run empty.
 */
export async function getAdminProductsActiveLifecycleCount(
  businessId: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .is("archived_at", null);

  if (error) {
    throw new Error(`Failed to load active-lifecycle product count: ${error.message}`);
  }

  return count ?? 0;
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
    .is("archived_at", null)
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
        archived_at,
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
    archived_at: data.archived_at ?? null,
    created_at: data.created_at,
    categories: normalizeCategoryRelation(data.categories)
  };
}
