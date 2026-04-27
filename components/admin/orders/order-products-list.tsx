"use client";

import { useMemo, useState } from "react";
import type { AdminOrderItem } from "@/lib/orders/admin";
import OrderProductModal from "@/components/admin/orders/order-product-modal";

type OrderProductsListProps = {
  items: AdminOrderItem[];
  totalPrice: number;
};

export default function OrderProductsList({ items, totalPrice }: OrderProductsListProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  return (
    <>
      <div className="admin-items-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="admin-item-row admin-item-row--button"
            onClick={() => setSelectedItemId(item.id)}
            aria-label={`Ver detalle de ${item.product_name}`}
          >
            <div>
              <h3>{item.product_name}</h3>
              <p>
                {item.quantity} x {formatCurrency(item.unit_price)}
              </p>
            </div>
            <strong>{formatCurrency(item.quantity * item.unit_price)}</strong>
          </button>
        ))}

        <div className="admin-total-row">
          <span>Total</span>
          <strong>{formatCurrency(totalPrice)}</strong>
        </div>
      </div>

      {selectedItem ? (
        <OrderProductModal item={selectedItem} onClose={() => setSelectedItemId(null)} />
      ) : null}
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
