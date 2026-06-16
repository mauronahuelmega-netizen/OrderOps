import type { ReactNode } from "react";
import styles from "./order-workspace-overview.module.css";

type OrderOverviewFieldProps = {
  label: string;
  value: ReactNode;
};

export default function OrderOverviewField({ label, value }: OrderOverviewFieldProps) {
  return (
    <div className={styles["admin-order-workspace-overview__context-cell"]}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
