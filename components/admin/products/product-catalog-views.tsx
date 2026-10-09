"use client";

import { Suspense } from "react";
import ProductGridServer from "@/components/admin/products/product-grid-server";
import ProductPagination from "@/components/admin/products/product-pagination";
import ProductTableView from "@/components/admin/products/product-table-view";
import { useProductsDesktopCollection } from "@/components/admin/products/use-products-desktop-collection";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProductListItem } from "@/lib/products/admin";
import styles from "./product-catalog-views.module.css";

type ProductCatalogViewsProps = {
  categories: AdminCategory[];
  products: AdminProductListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

/**
 * Single active collection tree.
 * SSR + first hydration: mobile cards (deterministic).
 * After hydration: table when matchMedia (min-width: 900px) matches.
 * Pagination is owned once, below the active renderer — never duplicated.
 */
export default function ProductCatalogViews({
  categories,
  products,
  pagination
}: ProductCatalogViewsProps) {
  const isDesktopCollection = useProductsDesktopCollection();

  return (
    <div className={styles.collection}>
      {isDesktopCollection ? (
        <ProductTableView categories={categories} products={products} pagination={pagination} />
      ) : (
        <ProductGridServer categories={categories} products={products} pagination={pagination} />
      )}

      <div className={styles.paginationWrap}>
        <Suspense fallback={null}>
          <ProductPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            limit={pagination.limit}
          />
        </Suspense>
      </div>
    </div>
  );
}
