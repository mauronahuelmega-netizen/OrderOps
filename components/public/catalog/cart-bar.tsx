"use client";

import { ShoppingCart } from "lucide-react";
import styles from "./cart-bar.module.css";

type CartBarProps = {
  count: number;
  /** Kept for call-site compatibility; FAB intentionally does not show total. */
  total?: number;
  onOpenCart: () => void;
};

export default function CartBar({ count, onOpenCart }: CartBarProps) {
  if (count <= 0) {
    return null;
  }

  const label = `Ver pedido, ${count} ${count === 1 ? "producto" : "productos"}`;

  return (
    <button
      type="button"
      className={styles.fab}
      onClick={onOpenCart}
      aria-label={label}
      data-preview-pan-ignore
    >
      <ShoppingCart className={styles.icon} aria-hidden="true" />
      <span className={styles.count}>{count}</span>
    </button>
  );
}
