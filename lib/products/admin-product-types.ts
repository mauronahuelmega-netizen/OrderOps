/**
 * Client-safe product lifecycle helpers / list projection types.
 * Keep server query owners in `lib/products/admin.ts` (server-only).
 */

export type AdminProductListItem = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  sku: string | null;
  stock: number;
  track_stock: boolean;
  /** NULL = active lifecycle; non-null = archived (reversible). */
  archived_at: string | null;
};

export function isProductArchived(
  product: Pick<AdminProductListItem, "archived_at">
): boolean {
  return product.archived_at != null;
}

export type AdminProduct = AdminProductListItem & {
  description: string | null;
  created_at: string;
  categories: {
    name: string;
  } | null;
};
