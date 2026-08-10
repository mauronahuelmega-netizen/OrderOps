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
  /** When true, always route add through onAddProduct (modal/options). */
  requiresCustomization?: boolean;
  onOpenProduct: (productId: string) => void;
  onAddProduct: (productId: string) => void;
  onIncrementProduct: (productId: string) => void;
};

function ProductCard({
  product,
  quantity,
  requiresCustomization = false,
  onOpenProduct,
  onAddProduct,
  onIncrementProduct
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

  const hasQuantity = quantity > 0;
  const canInlineIncrement = !requiresCustomization && hasQuantity;

  const plusLabel = requiresCustomization
    ? hasQuantity
      ? `Elegir opciones para ${product.name}. ${quantity} en el carrito.`
      : `Elegir opciones para ${product.name}`
    : canInlineIncrement
      ? `Agregar otra unidad de ${product.name}. ${quantity} en el carrito.`
      : `Agregar ${product.name} al pedido`;

  function handleQuickAdd() {
    if (canInlineIncrement) {
      onIncrementProduct(product.id);
      return;
    }
    onAddProduct(product.id);
  }

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
          <div className={styles.quickAddSlot}>
            <button
              type="button"
              className={styles.plus}
              aria-label={plusLabel}
              onClick={handleQuickAdd}
            >
              <Plus className={styles.plusIcon} aria-hidden="true" strokeWidth={2.5} />
            </button>
            {hasQuantity ? (
              <span className={styles.quantityBadge} aria-hidden="true">
                {quantity}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

ProductCard.displayName = "ProductCard";

export default memo(ProductCard);
