import ProductGridServer from "@/components/admin/products/product-grid-server";
import ProductTableView from "@/components/admin/products/product-table-view";
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

export default function ProductCatalogViews({
  categories,
  products,
  pagination
}: ProductCatalogViewsProps) {
  return (
    <>
      <div className={styles.desktopOnly}>
        <ProductTableView categories={categories} products={products} pagination={pagination} />
      </div>
      <div className={styles.mobileOnly}>
        <ProductGridServer categories={categories} products={products} pagination={pagination} />
      </div>
    </>
  );
}
