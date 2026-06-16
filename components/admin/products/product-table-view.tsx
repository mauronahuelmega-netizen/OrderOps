"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import ProductAvailabilityToggle from "@/components/admin/products/product-availability-toggle";
import ProductEmptyStateActions from "@/components/admin/products/product-empty-state-actions";
import ProductPagination from "@/components/admin/products/product-pagination";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProductListItem } from "@/lib/products/admin";
import {
  getSupabaseImageLoader,
  toSupabaseObjectPublicUrl
} from "@/lib/supabase/image-loader";
import {
  isOptimizableProductImageUrl,
  PRODUCT_SUMMARY_IMAGE_BLUR_DATA_URL
} from "@/lib/products/product-image";
import styles from "./product-table-view.module.css";

type ProductTablePagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

type ProductTableViewProps = {
  categories: AdminCategory[];
  products: AdminProductListItem[];
  pagination: ProductTablePagination;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}

function ProductTablePhoto({ product }: { product: AdminProductListItem }) {
  const imageUrl = product.image_url;
  const optimizableImageUrl = isOptimizableProductImageUrl(imageUrl) ? imageUrl : null;
  const [useOriginFallback, setUseOriginFallback] = useState(false);
  const displaySrc =
    optimizableImageUrl && useOriginFallback
      ? toSupabaseObjectPublicUrl(optimizableImageUrl)
      : optimizableImageUrl ?? "";

  if (!optimizableImageUrl) {
    return (
      <div className={styles.avatarShell}>
        <span className={styles.avatarFallback}>Sin foto</span>
      </div>
    );
  }

  return (
    <div className={styles.avatarShell}>
      <Image
        src={displaySrc}
        alt={product.name}
        width={42}
        height={42}
        className={styles.productAvatar}
        placeholder="blur"
        blurDataURL={PRODUCT_SUMMARY_IMAGE_BLUR_DATA_URL}
        loading="lazy"
        {...(useOriginFallback
          ? { unoptimized: true }
          : { loader: getSupabaseImageLoader, quality: 80 })}
        onError={() => {
          if (!useOriginFallback) {
            setUseOriginFallback(true);
          }
        }}
      />
    </div>
  );
}

export default function ProductTableView({
  categories,
  products,
  pagination
}: ProductTableViewProps) {
  const { openEditProduct } = useProductsManagement();
  const { page, limit, totalCount, totalPages } = pagination;

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  if (categories.length === 0) {
    return (
      <div className={styles.dataSurface}>
        <div className={`admin-empty-state ${styles.emptyStateInner}`}>
          <h2>Primero creá una categoría</h2>
          <p>Necesitás al menos una categoría para cargar productos.</p>
          <ProductEmptyStateActions variant="categories" />
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className={styles.dataSurface}>
        <div className={`admin-empty-state ${styles.emptyStateInner}`}>
          <h2>Todavía no hay productos cargados</h2>
          <p>Creá tu primer producto para empezar a mostrarlo en el catálogo.</p>
          <ProductEmptyStateActions variant="products" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`${styles.dataSurface} ${styles.emptyWrap}`}>
        <div className={`admin-empty-state ${styles.emptyStateInner}`}>
          <h2>No hay productos en esta página</h2>
          <p>Volvé a la primera página del catálogo.</p>
        </div>
        <div className={styles.paginationWrap}>
          <Suspense fallback={null}>
            <ProductPagination
              className={styles.paginationEmbedded}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              limit={limit}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dataSurface}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colPhoto} scope="col">
                Foto
              </th>
              <th className={styles.colProduct} scope="col">
                Producto
              </th>
              <th className={styles.colCategory} scope="col">
                Categoría
              </th>
              <th className={`${styles.colPrice} ${styles.alignRight}`} scope="col">
                Precio
              </th>
              <th className={`${styles.colStock} ${styles.alignRight}`} scope="col">
                Stock
              </th>
              <th className={styles.colStatus} scope="col">
                Estado
              </th>
              <th className={styles.colActions} scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const categoryName = categoryNameById.get(product.category_id) ?? "-";

              return (
                <tr key={product.id} className={styles.row}>
                  <td className={styles.photoCell}>
                    <ProductTablePhoto product={product} />
                  </td>
                  <td>
                    <div className={styles.productNameContainer}>
                      <span className={styles.productName}>{product.name}</span>
                      <span className={styles.productSku}>SKU: {product.sku || 'SIN ASIGNAR'}</span>
                    </div>
                  </td>
                  <td className={styles.categoryCell}>{categoryName}</td>
                  <td className={`${styles.priceCell} ${styles.alignRight}`}>
                    {formatCurrency(product.price)}
                  </td>
                  <td className={`${styles.stockCell} ${styles.alignRight}`}>{product.stock}</td>
                  <td className={styles.statusCell}>
                    <div className={styles.statusCellInner}>
                      <ProductAvailabilityToggle
                        productId={product.id}
                        initialIsAvailable={product.is_available}
                      />
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.kebabButton}
                      aria-label={`Acciones para ${product.name}`}
                      onClick={() => openEditProduct(product.id, product.name)}
                    >
                      <MoreHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationWrap}>
        <Suspense fallback={null}>
          <ProductPagination
            className={styles.paginationEmbedded}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
          />
        </Suspense>
      </div>
    </div>
  );
}
