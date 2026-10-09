"use client";

import Image from "next/image";
import { memo, useCallback, useState, type KeyboardEvent } from "react";
import Card from "@/components/ui/Card";
import ProductAvailabilityToggle from "@/components/admin/products/product-availability-toggle";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import {
  getSupabaseImageLoader,
  toSupabaseObjectPublicUrl
} from "@/lib/supabase/image-loader";
import type { AdminProductListItem } from "@/lib/products/admin-product-types";
import { isProductArchived } from "@/lib/products/admin-product-types";
import {
  isOptimizableProductImageUrl,
  PRODUCT_SUMMARY_IMAGE_BLUR_DATA_URL
} from "@/lib/products/product-image";
import styles from "./product-card.module.css";

type ProductCardProps = {
  product: AdminProductListItem;
  categoryName: string;
};

function ProductCardComponent({ product, categoryName }: ProductCardProps) {
  const { openEditProduct } = useProductsManagement();
  const imageUrl = product.image_url;
  const optimizableImageUrl = isOptimizableProductImageUrl(imageUrl) ? imageUrl : null;
  const [useOriginFallback, setUseOriginFallback] = useState(false);
  const displaySrc =
    optimizableImageUrl && useOriginFallback
      ? toSupabaseObjectPublicUrl(optimizableImageUrl)
      : optimizableImageUrl ?? "";

  const skuDisplay = product.sku?.trim() ? product.sku.trim() : "—";
  const stockDisplay = product.track_stock
    ? `Stock ${product.stock}`
    : "Sin control de stock";
  const disableEnable = product.track_stock && product.stock <= 0;
  const archived = isProductArchived(product);

  const handleOpen = useCallback(() => {
    openEditProduct(product.id, product.name);
  }, [openEditProduct, product.id, product.name]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  return (
    <Card
      className={`${styles.card} ${styles.interactive}`}
      role="button"
      tabIndex={0}
      aria-label={archived ? `Ver ${product.name}` : `Editar ${product.name}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.media}>
        <span
          className={`admin-status-badge ${styles.badge} ${
            archived
              ? "admin-status-badge--cancelled"
              : product.is_available
                ? "admin-status-badge--completed"
                : "admin-status-badge--cancelled"
          }`}
        >
          {archived ? "Archivado" : product.is_available ? "Disponible" : "No disponible"}
        </span>

        {optimizableImageUrl ? (
          <div className={styles.imageShell}>
            <Image
              src={displaySrc}
              alt={product.name}
              fill
              sizes="(max-width: 479px) 72px, (max-width: 899px) 96px, 50vw"
              className={styles.image}
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
        ) : (
          <div className={styles.placeholder}>Sin foto</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.copy}>
          <p className={styles.category}>{categoryName}</p>
          <h3>{product.name}</h3>
          <p className={styles.metaLine}>
            <span className={styles.sku}>SKU · {skuDisplay}</span>
            <span className={styles.metaSep} aria-hidden="true">
              ·
            </span>
            <span className={styles.stock}>{stockDisplay}</span>
          </p>
          <strong className={styles.price}>{formatCurrency(product.price)}</strong>
        </div>

        <div className={styles.footer}>
          <div className={styles.availability}>
            {archived ? (
              <span className={styles.archivedState} aria-hidden="true">
                Archivado
              </span>
            ) : (
              <ProductAvailabilityToggle
                productId={product.id}
                productName={product.name}
                initialIsAvailable={product.is_available}
                disableEnable={disableEnable}
                showStatusLabel={false}
              />
            )}
          </div>
          <span className={styles.linkHint} aria-hidden="true">
            {archived ? "Ver" : "Gestionar"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function areProductCardPropsEqual(
  previous: ProductCardProps,
  next: ProductCardProps
): boolean {
  return (
    previous.categoryName === next.categoryName &&
    previous.product.id === next.product.id &&
    previous.product.name === next.product.name &&
    previous.product.price === next.product.price &&
    previous.product.category_id === next.product.category_id &&
    previous.product.image_url === next.product.image_url &&
    previous.product.is_available === next.product.is_available &&
    previous.product.sku === next.product.sku &&
    previous.product.stock === next.product.stock &&
    previous.product.track_stock === next.product.track_stock &&
    previous.product.archived_at === next.product.archived_at
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}

export default memo(ProductCardComponent, areProductCardPropsEqual);
