"use client";

import type { PublicProduct } from "@/lib/catalog/public";

type ProductCardProps = {
  product: PublicProduct;
  quantity: number;
  onOpen: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function ProductCard({
  product,
  quantity,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement
}: ProductCardProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article className="catalog-product-card">
      <div
        className="catalog-product-card__hit"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        aria-label={`Ver ${product.name}`}
      >
        <div className="catalog-product-card__media">
          {product.image_url ? (
            <img
              className="catalog-product-card__image"
              src={product.image_url}
              alt={product.name}
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
          <strong className="catalog-product-card__price">
            {formatCurrency(Number(product.price))}
          </strong>
        </div>
      </div>

      <div className="catalog-product-card__actions">
        {quantity > 0 ? (
          <div
            className="catalog-quantity-control"
            aria-label={`Cantidad de ${product.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={onDecrement}>
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={onIncrement}>
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="catalog-product-card__add-button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd();
            }}
          >
            Agregar
          </button>
        )}

        <button
          type="button"
          className="catalog-product-card__edit-link"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          Ver detalle
        </button>
      </div>
    </article>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
