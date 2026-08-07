"use client";

import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { Plus } from "lucide-react";
import type { PublicProduct } from "@/lib/catalog/public";
import {
  formatPublicCatalogCurrency,
  shouldShowPriceFrom
} from "@/lib/product-customization/public-shared";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";
import styles from "./product-card.module.css";

type ProductCardProps = {
  product: PublicProduct;
  quantity: number;
  /** When true, hide quantity controls and always route add through onAddProduct. */
  requiresCustomization?: boolean;
  onOpenProduct: (productId: string) => void;
  onAddProduct: (productId: string) => void;
  onIncrementProduct: (productId: string) => void;
  onDecrementProduct: (productId: string) => void;
};

function ProductCard({
  product,
  quantity,
  requiresCustomization = false,
  onOpenProduct,
  onAddProduct,
  onIncrementProduct,
  onDecrementProduct
}: ProductCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenProduct(product.id);
    }
  }

  function stopCardOpen(event: MouseEvent) {
    event.stopPropagation();
  }

  const summary = product.customizationSummary
    ? {
        productId: product.id,
        hasCustomizations: product.customizationSummary.hasCustomizations,
        hasPaidCustomizations: product.customizationSummary.hasPaidCustomizations,
        hasUpsell: product.customizationSummary.hasUpsell,
        priceFrom: product.customizationSummary.priceFrom
      }
    : null;

  const showFrom = shouldShowPriceFrom(summary);
  const displayPrice =
    showFrom && summary?.priceFrom !== null && summary?.priceFrom !== undefined
      ? summary.priceFrom
      : Number(product.price);
  const formattedPrice = formatPublicCatalogCurrency(displayPrice);

  const showQuantityControl = !requiresCustomization && quantity > 0;
  const plusLabel = requiresCustomization
    ? `Elegir opciones para ${product.name}`
    : `Agregar ${product.name} al pedido`;

  return (
    <article className={`catalog-product-card ${styles.card}`}>
      <div
        className={styles.hit}
        role="button"
        tabIndex={0}
        onClick={() => onOpenProduct(product.id)}
        onKeyDown={handleKeyDown}
        aria-label={`Ver ${product.name}`}
      >
        <div className={styles.media}>
          {product.image_url ? (
            <PublicStorageImage
              className={styles.image}
              src={product.image_url}
              alt=""
              fill
              sizes="(max-width: 359px) 100vw, (max-width: 767px) 50vw, (max-width: 1199px) 33vw, 260px"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              Sin foto
            </div>
          )}
        </div>

        <div className={styles.body}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.description ? (
            <p className={styles.description}>{product.description}</p>
          ) : null}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.priceRow}>
          <strong
            className={styles.price}
            aria-label={showFrom ? `Desde ${formattedPrice}` : undefined}
          >
            {formattedPrice}
          </strong>
        </div>
        <div className={styles.quickAction} onClick={stopCardOpen}>
          {showQuantityControl ? (
            <div className={styles.qty} aria-label={`Cantidad de ${product.name}`}>
              <button
                type="button"
                aria-label={`Quitar uno de ${product.name}`}
                onClick={() => onDecrementProduct(product.id)}
              >
                -
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label={`Sumar uno de ${product.name}`}
                onClick={() => onIncrementProduct(product.id)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.plus}
              aria-label={plusLabel}
              onClick={() => onAddProduct(product.id)}
            >
              <Plus className={styles.plusIcon} aria-hidden="true" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

ProductCard.displayName = "ProductCard";

export default memo(ProductCard);
