"use client";

import { useMemo, useState } from "react";
import type { AdminOrderItem } from "@/lib/orders/admin";
import OrderProductModal from "@/components/admin/orders/order-product-modal";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import { buildDashboardOrderItemTree } from "@/lib/product-customization/order-dashboard";
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

  const itemTree = useMemo(() => buildDashboardOrderItemTree(items), [items]);

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
        {itemTree.map((node) => {
          const item = node.item as AdminOrderItem;
          const itemKey =
            typeof item.id === "string" && item.id
              ? item.id
              : `orphan-${item.product_name}-${item.quantity}`;

          return (
            <div key={itemKey} className={styles.orderItemNode}>
              <button
                type="button"
                className={rowClassName}
                onClick={() => {
                  if (typeof item.id === "string" && item.id) {
                    setSelectedItemId(item.id);
                  }
                }}
                aria-label={
                  node.isOrphanUpsell
                    ? `Ver detalle de Plus ${item.product_name}`
                    : `Ver detalle de ${item.product_name}`
                }
              >
                <div>
                  <h3 className={compact ? styles["admin-item-title--compact"] : undefined}>
                    {compact ? (
                      <>
                        {node.isOrphanUpsell ? (
                          <span className={styles.orderItemUpsellBadge}>Plus</span>
                        ) : null}
                        <span className={styles["admin-item-quantity"]}>{item.quantity}x</span>
                        <span>{item.product_name}</span>
                      </>
                    ) : (
                      <>
                        {node.isOrphanUpsell ? (
                          <span className={styles.orderItemUpsellBadge}>Plus</span>
                        ) : null}
                        {item.product_name}
                      </>
                    )}
                  </h3>
                  {!compact ? (
                    <p>
                      {item.quantity} x {formatAdminOrderCurrency(item.unit_price)}
                    </p>
                  ) : null}
                  {node.customizationSummary.length > 0 ? (
                    <ul className={styles.orderItemCustomizationSummary}>
                      {node.customizationSummary.map((line, index) => (
                        <li
                          key={`${itemKey}-summary-${index}`}
                          className={styles.orderItemCustomizationLine}
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : dense ? (
                    renderItemModifiers(item.description ?? null)
                  ) : null}
                </div>
                <strong>{formatAdminOrderCurrency(item.quantity * item.unit_price)}</strong>
              </button>

              {node.children.length > 0 ? (
                <ul className={styles.orderItemUpsellChildren}>
                  {node.children.map((child, childIndex) => {
                    const childItem = child as AdminOrderItem;
                    const childKey =
                      typeof childItem.id === "string" && childItem.id
                        ? childItem.id
                        : `${itemKey}-upsell-${childIndex}`;

                    return (
                      <li key={childKey} className={styles.orderItemUpsell}>
                        <button
                          type="button"
                          className={styles.orderItemUpsellButton}
                          onClick={() => {
                            if (typeof childItem.id === "string" && childItem.id) {
                              setSelectedItemId(childItem.id);
                            }
                          }}
                          aria-label={`Ver detalle de Plus ${childItem.product_name}`}
                        >
                          <span className={styles.orderItemUpsellLabel}>
                            <span className={styles.orderItemUpsellBadge}>Plus</span>
                            <span>
                              + {childItem.product_name} ×{childItem.quantity}
                            </span>
                          </span>
                          <strong>
                            {formatAdminOrderCurrency(
                              childItem.quantity * childItem.unit_price
                            )}
                          </strong>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}

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
