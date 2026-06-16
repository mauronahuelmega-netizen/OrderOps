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
    <div className={styles["admin-order-workspace-overview__context-grid"]}>
      <OrderOverviewField label="Cliente" value={customerName} />
      <OrderOverviewField label="Tipo de entrega" value={deliveryMethodLabel} />
      <OrderOverviewField label="Teléfono" value={phoneLabel} />
      {trimmedAddress ? (
        <OrderOverviewField label="Dirección" value={trimmedAddress} />
      ) : null}
    </div>
  );
}
