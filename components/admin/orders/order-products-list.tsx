"use client";

import { useMemo } from "react";
import type { AdminOrderItem } from "@/lib/orders/admin";
import OrderPreparationItems from "@/components/admin/orders/order-preparation-items";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import { buildOrderPreparationItems } from "@/lib/product-customization/order-preparation";
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
  const preparationItems = useMemo(() => buildOrderPreparationItems(items), [items]);

  const listClassName = [
    styles["admin-items-list"],
    compact ? styles["admin-items-list--compact"] : null,
    dense ? styles["admin-items-list--dense"] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={listClassName}>
      <OrderPreparationItems
        items={preparationItems}
        dense={dense}
      />

      {showTotal ? (
        <div className={styles["admin-total-row"]}>
          <span>Total</span>
          <strong>{formatAdminOrderCurrency(totalPrice)}</strong>
        </div>
      ) : null}
    </div>
  );
}
