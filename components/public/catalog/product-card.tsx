"use client";

import { memo, type KeyboardEvent } from "react";
import type { PublicProduct } from "@/lib/catalog/public";
import {
  formatPublicCatalogCurrency,
  shouldShowPriceFrom
} from "@/lib/product-customization/public-shared";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";

type ProductCardProps = {
  product: PublicProduct;
  quantity: number;
  /** When true, hide legacy quantity controls and always route add through onAddProduct. */
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

  return (
    <article className="catalog-product-card">
      <div
        className="catalog-product-card__hit"
        role="button"
        tabIndex={0}
        onClick={() => onOpenProduct(product.id)}
        onKeyDown={handleKeyDown}
        aria-label={`Ver ${product.name}`}
      >
        <div className="catalog-product-card__media">
          {product.image_url ? (
            <PublicStorageImage
              className="catalog-product-card__image"
              src={product.image_url}
              alt={product.name}
              width={228}
              height={216}
              sizes="114px"
            />
          ) : (
            <div className="catalog-product-card__placeholder">Sin foto</div>
          )}
        </div>

        <div className="catalog-product-card__body">
          <div className="catalog-product-card__copy">
            <h3>{product.name}</h3>
            {product.description ? <p>{product.description}</p> : null}
          </div>
          <div className="catalog-product-card__pricing">
            <strong className="catalog-product-card__price">
              {showFrom ? (
                <span className="catalog-product-card__price-from">Desde </span>
              ) : null}
              {formatPublicCatalogCurrency(displayPrice)}
            </strong>
            {requiresCustomization ? (
              <p className="catalog-product-card__hint">Personalizalo antes de agregar</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="catalog-product-card__actions">
        {!requiresCustomization && quantity > 0 ? (
          <div
            className="catalog-quantity-control"
            aria-label={`Cantidad de ${product.name}`}
            onClick={(event) => event.stopPropagation()}
          >
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
            className="catalog-product-card__add-button"
            aria-label={
              requiresCustomization
                ? `Elegir opciones de ${product.name}`
                : `Agregar ${product.name} al pedido`
            }
            onClick={(event) => {
              event.stopPropagation();
              onAddProduct(product.id);
            }}
          >
            {requiresCustomization ? "Elegir opciones" : "Agregar"}
          </button>
        )}

        <button
          type="button"
          className="catalog-product-card__edit-link"
          aria-label={`Ver detalle de ${product.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenProduct(product.id);
          }}
        >
          Ver detalle
        </button>
      </div>
    </article>
  );
}

ProductCard.displayName = "ProductCard";

export default memo(ProductCard);
