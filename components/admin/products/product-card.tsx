"use client";

import type { AdminProduct } from "@/lib/products/admin";

type ProductCardProps = {
  product: AdminProduct;
  onEdit: () => void;
};

export default function ProductCard({
  product,
  onEdit
}: ProductCardProps) {
  return (
    <button
      type="button"
      className="admin-product-summary-card"
      onClick={onEdit}
      aria-label={`Editar ${product.name}`}
    >
      <div className="admin-product-summary-media">
        <span
          className={`admin-status-badge admin-product-summary-badge ${
            product.is_available
              ? "admin-status-badge--completed"
              : "admin-status-badge--cancelled"
          }`}
        >
          {product.is_available ? "Activo" : "Inactivo"}
        </span>

        {product.image_url ? (
          <img
            className="admin-product-summary-image"
            src={product.image_url}
            alt={product.name}
          />
        ) : (
          <div className="admin-product-summary-placeholder">Sin foto</div>
        )}
      </div>

      <div className="admin-product-summary-content">
        <div className="admin-product-summary-copy">
          <h3>{product.name}</h3>
          <strong className="admin-product-summary-price">
            {formatCurrency(product.price)}
          </strong>
        </div>

        <div className="admin-product-summary-footer">
          <span
            className="admin-product-summary-link"
            aria-hidden="true"
          >
            Gestionar
          </span>
        </div>
      </div>
    </button>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
