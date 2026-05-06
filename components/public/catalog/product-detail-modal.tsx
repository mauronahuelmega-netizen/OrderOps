"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/catalog/public";

type ProductDetailModalProps = {
  product: PublicProduct;
  currentQuantity: number;
  onClose: () => void;
  onSaveQuantity: (quantity: number) => void;
};

export default function ProductDetailModal({
  product,
  currentQuantity,
  onClose,
  onSaveQuantity
}: ProductDetailModalProps) {
  const [draftQuantity, setDraftQuantity] = useState(Math.max(currentQuantity, 1));

  useEffect(() => {
    setDraftQuantity(Math.max(currentQuantity, 1));
  }, [currentQuantity, product.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const primaryLabel = useMemo(() => {
    if (currentQuantity === 0) {
      return "Agregar al pedido";
    }

    if (draftQuantity === 0) {
      return "Quitar del pedido";
    }

    return "Actualizar pedido";
  }, [currentQuantity, draftQuantity]);

  function submitQuantity() {
    onSaveQuantity(draftQuantity);
    onClose();
  }

  return (
    <div
      className="catalog-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="catalog-modal__scroll">
          <header className="catalog-modal__header">
            <div>
              <p className="catalog-modal__eyebrow">Producto</p>
              <h2 id="catalog-product-modal-title">{product.name}</h2>
            </div>
            <button
              type="button"
              className="catalog-modal__close"
              onClick={onClose}
            >
              Cerrar
            </button>
          </header>

          <div className="catalog-modal__media">
            {product.image_url ? (
              <img
                className="catalog-modal__image"
                src={product.image_url}
                alt={product.name}
              />
            ) : (
              <div className="catalog-modal__placeholder">Sin foto</div>
            )}
          </div>

          <div className="catalog-modal__content">
            <div className="catalog-modal__summary">
              <strong>{formatCurrency(Number(product.price))}</strong>
              {product.description ? <p>{product.description}</p> : null}
            </div>

            <div className="catalog-modal__quantity-block">
              <span>Cantidad</span>
              <div className="catalog-quantity-control catalog-quantity-control--large">
                <button
                  type="button"
                  onClick={() => setDraftQuantity((current) => Math.max(current - 1, 0))}
                >
                  -
                </button>
                <span>{draftQuantity}</span>
                <button
                  type="button"
                  onClick={() => setDraftQuantity((current) => current + 1)}
                >
                  +
                </button>
              </div>
              {draftQuantity === 0 ? (
                <p className="catalog-modal__helper">
                  Si guardás con cero, el producto se elimina del pedido.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <footer className="catalog-modal__footer">
          <div className="catalog-modal__footer-copy">
            <strong>{draftQuantity > 0 ? `${draftQuantity} item(s)` : "Sin items"}</strong>
            <span>
              {formatCurrency(Number(product.price) * Math.max(draftQuantity, 0))}
            </span>
          </div>
          <button
            type="button"
            className="catalog-modal__submit"
            onClick={submitQuantity}
          >
            {primaryLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
