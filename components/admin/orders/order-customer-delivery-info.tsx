import OrderOverviewField from "@/components/admin/orders/order-overview-field";
import styles from "./order-workspace-overview.module.css";

type OrderCustomerDeliveryInfoProps = {
  deliveryMethodLabel: string;
  customerName: string;
  phoneLabel: string;
  address?: string | null;
};

export default function OrderCustomerDeliveryInfo({
  deliveryMethodLabel,
  customerName,
  phoneLabel,
  address
}: OrderCustomerDeliveryInfoProps) {
  const trimmedAddress = address?.trim();

  return (
    <div className={styles["admin-order-workspace-overview__customer-delivery"]}>
      <div className={styles["admin-order-workspace-overview__customer-delivery-group"]}>
        <p className={styles["admin-order-workspace-overview__customer-delivery-eyebrow"]}>
          Cliente
        </p>
        <div className={styles["admin-order-workspace-overview__context-grid"]}>
          <OrderOverviewField label="Nombre" value={customerName} hideVisibleLabel />
          <OrderOverviewField
            label="Teléfono"
            value={phoneLabel}
            hideVisibleLabel
            valueClassName={styles["admin-order-workspace-overview__context-value--phone"]}
          />
        </div>
      </div>

      <div className={styles["admin-order-workspace-overview__customer-delivery-group"]}>
        <p className={styles["admin-order-workspace-overview__customer-delivery-eyebrow"]}>
          Entrega
        </p>
        <div className={styles["admin-order-workspace-overview__context-grid"]}>
          <OrderOverviewField label="Modalidad" value={deliveryMethodLabel} hideVisibleLabel />
          {trimmedAddress ? (
            <OrderOverviewField label="Dirección" value={trimmedAddress} hideVisibleLabel />
          ) : null}
        </div>
      </div>
    </div>
  );
}
