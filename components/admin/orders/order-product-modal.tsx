"use client";

import { useEffect } from "react";
import detailStyles from "./order-detail-surfaces.module.css";
import type { AdminOrderItem } from "@/lib/orders/admin";

type OrderProductModalProps = {
  item: AdminOrderItem;
  onClose: () => void;
};

export default function OrderProductModal({ item, onClose }: OrderProductModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={detailStyles.itemModalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={detailStyles.itemModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-item-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={detailStyles.itemModalHeader}>
          <div>
            <p className="catalog-eyebrow">Producto del pedido</p>
            <h2 id="admin-order-item-modal-title">{item.product_name}</h2>
          </div>
          <button
            type="button"
            className="admin-secondary-link admin-secondary-link--compact"
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>

        <div className={detailStyles.itemModalBody}>
          {item.image_url ? (
            <img
              className={detailStyles.itemModalImage}
              src={item.image_url}
              alt={item.product_name}
            />
          ) : (
            <div className={detailStyles.itemModalPlaceholder}>Sin foto</div>
          )}

          <div className={detailStyles.itemModalDetails}>
            {item.description ? (
              <p className={detailStyles.itemModalDescription}>{item.description}</p>
            ) : null}

            <dl className={detailStyles.itemModalGrid}>
              <div>
                <dt>Precio unitario</dt>
                <dd>{formatCurrency(item.unit_price)}</dd>
              </div>
              <div>
                <dt>Cantidad</dt>
                <dd>{item.quantity}</dd>
              </div>
              <div className={detailStyles.itemModalGridFull}>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(item.quantity * item.unit_price)}</dd>
              </div>
            </dl>
          </div>
        </div>
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
