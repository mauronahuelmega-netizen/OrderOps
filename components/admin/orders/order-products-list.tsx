"use client";

import { useMemo, useState } from "react";
import type { AdminOrderItem } from "@/lib/orders/admin";
import OrderProductModal from "@/components/admin/orders/order-product-modal";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import styles from "./order-items.module.css";

type OrderProductsListProps = {
  items: AdminOrderItem[];
  totalPrice: number;
  compact?: boolean;
  dense?: boolean;
  showTotal?: boolean;
};

export default function OrderProductsList({
  items,
  totalPrice,
  compact = false,
  dense = false,
  showTotal = true
}: OrderProductsListProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const listClassName = [
    styles["admin-items-list"],
    compact ? styles["admin-items-list--compact"] : null,
    dense ? styles["admin-items-list--dense"] : null
  ]
    .filter(Boolean)
    .join(" ");

  const rowClassName = `${styles["admin-item-row"]} ${styles["admin-item-row--button"]}`;

  const renderItemModifiers = (description: string | null) => {
    const modifiers = description
      ?.split(/[,;|\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!modifiers?.length) {
      return null;
    }

    return (
      <div className={styles["admin-item-modifiers"]}>
        {modifiers.map((modifier, index) => (
          <span key={`${modifier}-${index}`} className={styles["admin-item-modifier"]}>
            {modifier}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={listClassName}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={rowClassName}
            onClick={() => setSelectedItemId(item.id)}
            aria-label={`Ver detalle de ${item.product_name}`}
          >
            <div>
              <h3 className={compact ? styles["admin-item-title--compact"] : undefined}>
                {compact ? (
                  <>
                    <span className={styles["admin-item-quantity"]}>{item.quantity}x</span>
                    <span>{item.product_name}</span>
                  </>
                ) : (
                  item.product_name
                )}
              </h3>
              {!compact ? (
                <p>
                  {item.quantity} x {formatAdminOrderCurrency(item.unit_price)}
                </p>
              ) : null}
              {dense ? renderItemModifiers(item.description) : null}
            </div>
            <strong>{formatAdminOrderCurrency(item.quantity * item.unit_price)}</strong>
          </button>
        ))}

        {showTotal ? (
          <div className={styles["admin-total-row"]}>
            <span>Total</span>
            <strong>{formatAdminOrderCurrency(totalPrice)}</strong>
          </div>
        ) : null}
      </div>

      {selectedItem ? (
        <OrderProductModal item={selectedItem} onClose={() => setSelectedItemId(null)} />
      ) : null}
    </>
  );
}
