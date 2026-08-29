import Badge from "@/components/ui/Badge";
import { formatAdminDeliveryMethod } from "@/lib/orders/presenter";
import type { DeliveryMethod, OrderStatus } from "@/types/database";
import styles from "./admin-order-modal.module.css";

type OrderModalHeaderLeadingProps = {
  orderRef: string;
  customerLabel: string;
  status: OrderStatus;
  deliveryMethod?: DeliveryMethod;
};

type OrderModalHeaderMetaProps = {
  elapsedLabel: string;
};

export function OrderModalHeaderLeading({
  orderRef,
  customerLabel,
  status,
  deliveryMethod
}: OrderModalHeaderLeadingProps) {
  return (
    <div className={styles["admin-order-modal-shell__workstation-title"]}>
      <p className={styles["admin-order-modal-shell__workstation-order-label"]}>
        #{orderRef}
        <span> - {customerLabel}</span>
      </p>
      <div className={styles["admin-order-modal-shell__workstation-badges"]}>
        {deliveryMethod ? (
          <span className={styles["admin-order-modal-shell__delivery-context"]}>
            {formatAdminDeliveryMethod(deliveryMethod)}
          </span>
        ) : null}
        <Badge status={status} />
      </div>
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
