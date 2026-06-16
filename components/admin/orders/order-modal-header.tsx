import Badge from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/database";
import styles from "./admin-order-modal.module.css";

type OrderModalHeaderLeadingProps = {
  orderRef: string;
  customerLabel: string;
  status: OrderStatus;
};

type OrderModalHeaderMetaProps = {
  elapsedLabel: string;
};

export function OrderModalHeaderLeading({
  orderRef,
  customerLabel,
  status
}: OrderModalHeaderLeadingProps) {
  return (
    <div className={styles["admin-order-modal-shell__workstation-title"]}>
      <p className={styles["admin-order-modal-shell__workstation-order-label"]}>
        #{orderRef}
        <span> - {customerLabel}</span>
      </p>
      <Badge status={status} />
    </div>
  );
}

export function OrderModalHeaderMeta({ elapsedLabel }: OrderModalHeaderMetaProps) {
  return (
    <span className={styles["admin-order-modal-shell__header-meta--elapsed"]}>
      {elapsedLabel}
    </span>
  );
}
