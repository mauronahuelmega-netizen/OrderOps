"use client";

import Image from "next/image";
import { memo, useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import {
  getSupabaseImageLoader,
  toSupabaseObjectPublicUrl
} from "@/lib/supabase/image-loader";
import type { AdminProductListItem } from "@/lib/products/admin";
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

  const handleOpen = useCallback(() => {
    openEditProduct(product.id, product.name);
  }, [openEditProduct, product.id, product.name]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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
      aria-label={`Editar ${product.name}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.media}>
        <span
          className={`admin-status-badge ${styles.badge} ${
            product.is_available ? "admin-status-badge--completed" : "admin-status-badge--cancelled"
          }`}
        >
          {product.is_available ? "Activo" : "Inactivo"}
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
          <strong className={styles.price}>{formatCurrency(product.price)}</strong>
        </div>

        <div className={styles.footer}>
          <span className={styles.linkHint} aria-hidden="true">
            Gestionar
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
    previous.product.is_available === next.product.is_available
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
