import type { ReactNode } from "react";
import styles from "./order-workspace-overview.module.css";

type OrderOverviewFieldProps = {
  label: string;
  value: ReactNode;
  /** Hide the visible micro-label while keeping it for assistive tech. */
  hideVisibleLabel?: boolean;
  valueClassName?: string;
};

export default function OrderOverviewField({
  label,
  value,
  hideVisibleLabel = false,
  valueClassName
}: OrderOverviewFieldProps) {
  return (
    <div className={styles["admin-order-workspace-overview__context-cell"]}>
      <span className={hideVisibleLabel ? "sr-only" : undefined}>{label}</span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}
